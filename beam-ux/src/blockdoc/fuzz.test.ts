import { describe, expect, it } from 'vitest';
import { parse, print, patchProp, patchText } from './lens.js';
import type { BlockNode, TextNode } from './types.js';

/**
 * Fuzz corpus — a deterministically generated set of varied `.tsx` page bodies covering
 * combinations of attrs (string / expr / number / bool / shorthand / data-* / aria-* /
 * style), nesting depth, sibling counts, comments, and dynamic expressions. Every sample
 * must (a) round-trip byte-identically and (b) survive an edit + reprint idempotently.
 */

// --- deterministic PRNG (mulberry32) so the corpus is reproducible ---
function rng(seed: number) {
    return () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
}

const TAGS = ['div', 'section', 'span', 'p', 'Card', 'Panel', 'Dropdown.Root'];
const ATTR_FORMS = [
    (r: () => number) => `className="c${Math.floor(r() * 100)}"`,
    (r: () => number) => `data-idx={${Math.floor(r() * 100)}}`,
    (r: () => number) => `aria-label="label ${Math.floor(r() * 10)}"`,
    () => `style={{ padding: 8, color: 'red' }}`,
    () => `flag={true}`,
    () => `disabled`,
    () => `id={props.id}`,
];
const COMMENTS = ['{/* c */}', '{/* another comment */}'];
const DYNAMICS = ['{items.map((x) => <li key={x}>{x}</li>)}', '{ok && <b>yes</b>}'];

function gen(seed: number): string {
    const r = rng(seed);
    const pick = <T,>(arr: T[]): T => arr[Math.floor(r() * arr.length)];

    function node(depth: number): string {
        const tag = pick(TAGS);
        const nAttrs = Math.floor(r() * 3);
        const attrs: string[] = [];
        for (let i = 0; i < nAttrs; i++) attrs.push(pick(ATTR_FORMS)(r));
        const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';

        const parts: string[] = [];
        if (r() < 0.4) parts.push(pick(COMMENTS));
        const nChildren = depth <= 0 ? 0 : Math.floor(r() * 3);
        for (let i = 0; i < nChildren; i++) {
            const roll = r();
            if (roll < 0.4) parts.push(node(depth - 1));
            else if (roll < 0.7) parts.push(`text-${Math.floor(r() * 100)}`);
            else if (roll < 0.85) parts.push(pick(DYNAMICS));
            else parts.push(`{"lit ${Math.floor(r() * 100)}"}`);
        }
        if (parts.length === 0) return `<${tag}${attrStr} />`;
        return `<${tag}${attrStr}>${parts.join(' ')}</${tag}>`;
    }

    const body = node(3);
    return `export function Fuzz${seed}() {\n    return (\n        ${body}\n    );\n}\n`;
}

const CORPUS_SIZE = 60;
const CORPUS = Array.from({ length: CORPUS_SIZE }, (_, i) => gen(i + 1));

// Walk to the first patchable prop / text node in a doc.
function firstStringProp(roots: BlockNode[]) {
    const stack = [...roots];
    while (stack.length) {
        const b = stack.pop()!;
        const p = b.props.find((pp) => pp.kind === 'string');
        if (p) return p;
        for (const c of b.children) if (c.type === 'block') stack.push(c);
    }
    return undefined;
}
function firstText(roots: BlockNode[]): TextNode | undefined {
    const stack = [...roots];
    while (stack.length) {
        const b = stack.pop()!;
        for (const c of b.children) {
            if (c.type === 'text' && c.value.trim()) return c;
            if (c.type === 'block') stack.push(c);
        }
    }
    return undefined;
}

describe(`fuzz corpus (${CORPUS_SIZE} samples)`, () => {
    it('every sample round-trips byte-identically', () => {
        for (const src of CORPUS) {
            const doc = parse(src);
            expect(print(doc), `identity failed for:\n${src}`).toBe(src);
        }
    });

    it('an edit on every sample is idempotent (gen1 === gen2)', () => {
        for (const src of CORPUS) {
            const doc = parse(src);
            const prop = firstStringProp(doc.roots);
            const text = firstText(doc.roots);
            if (prop) patchProp(prop, 'edited-value');
            if (text) patchText(text, 'edited text');
            const gen1 = print(doc);
            const gen2 = print(parse(gen1));
            expect(gen2, `idempotency failed for:\n${src}\n--- gen1 ---\n${gen1}`).toBe(
                gen1,
            );
        }
    });
});
