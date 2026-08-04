import { describe, expect, it } from 'vitest';
import {
    parse,
    print,
    patchProp,
    patchPropExpression,
    patchText,
} from './lens.js';
import type { BlockNode, BlockProp, TextNode } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const HERO = `export function Hero() {
    return (
        <section className="hero" data-testid="hero" aria-label="Intro">
            <h1>Welcome</h1>
            <p>It is <strong>truly yours</strong>.</p>
        </section>
    );
}
`;

const EXPRESSIONS = `export function Card(props) {
    return (
        <div
            className={props.klass}
            style={{ color: 'red', padding: 8 }}
            data-n={42}
            data-flag={true}
            data-neg={-3}
            disabled
        >
            {"literal child"}
            {\`template child\`}
            Plain text here.
        </div>
    );
}
`;

const COMMENTED = `function View() {
    return (
        // a leading line comment
        <ul>
            {/* an inner jsx comment */}
            <li>One</li>
            {/* another */}
            <li>Two</li>
        </ul>
    );
}
`;

const DYNAMIC = `function List({ items }) {
    return (
        <ul>
            {items.map((i) => (
                <li key={i.id}>{i.label}</li>
            ))}
            {items.length === 0 && <li>empty</li>}
        </ul>
    );
}
`;

const MEMBER = `function Menu() {
    return (
        <Dropdown.Root>
            <Dropdown.Trigger className="btn">Open</Dropdown.Trigger>
        </Dropdown.Root>
    );
}
`;

const NO_JSX = `export const answer = 42;
export function add(a, b) {
    return a + b;
}
`;

const FIXTURES = {
    HERO,
    EXPRESSIONS,
    COMMENTED,
    DYNAMIC,
    MEMBER,
    NO_JSX,
};

// A helper to find the first block matching a name in the root tree.
function findBlock(roots: BlockNode[], name: string): BlockNode | undefined {
    for (const r of roots) {
        if (r.name === name) return r;
        const found = findBlock(r.children.filter((c): c is BlockNode => c.type === 'block'), name);
        if (found) return found;
    }
    return undefined;
}

function findProp(block: BlockNode, name: string): BlockProp | undefined {
    return block.props.find((p) => p.name === name);
}

// ---------------------------------------------------------------------------
// Identity round-trip (byte-identical)
// ---------------------------------------------------------------------------

describe('identity round-trip is byte-identical', () => {
    for (const [name, src] of Object.entries(FIXTURES)) {
        it(name, () => {
            const doc = parse(src);
            expect(print(doc)).toBe(src);
        });
    }

    it('print accepts a raw AST as well as a BlockDoc', () => {
        const doc = parse(HERO);
        expect(print(doc.ast)).toBe(HERO);
    });
});

// ---------------------------------------------------------------------------
// parse() exposes structure
// ---------------------------------------------------------------------------

describe('parse exposes block structure', () => {
    it('exposes block name, host vs component, and node ref', () => {
        const doc = parse(HERO);
        const section = doc.roots[0];
        expect(section.name).toBe('section');
        expect(section.isComponent).toBe(false);
        expect(section.node).toBeTruthy();
        const strong = findBlock(doc.roots, 'strong');
        expect(strong?.name).toBe('strong');
    });

    it('flags a component (uppercase / member-expression) name', () => {
        const doc = parse(MEMBER);
        const root = doc.roots[0];
        expect(root.name).toBe('Dropdown.Root');
        expect(root.isComponent).toBe(true);
    });

    it('classifies prop kinds: string, number, boolean, expression, shorthand', () => {
        const doc = parse(EXPRESSIONS);
        const div = doc.roots[0];
        expect(findProp(div, 'className')?.kind).toBe('expression');
        expect(findProp(div, 'style')?.kind).toBe('expression');
        expect(findProp(div, 'data-n')?.kind).toBe('number');
        expect(findProp(div, 'data-n')?.value).toBe(42);
        expect(findProp(div, 'data-flag')?.kind).toBe('boolean');
        expect(findProp(div, 'data-flag')?.value).toBe(true);
        expect(findProp(div, 'data-neg')?.value).toBe(-3);
        expect(findProp(div, 'disabled')?.kind).toBe('boolean-shorthand');
        expect(findProp(div, 'disabled')?.value).toBe(true);
    });

    it('classifies a plain string literal attr', () => {
        const doc = parse(HERO);
        const section = doc.roots[0];
        expect(findProp(section, 'className')?.kind).toBe('string');
        expect(findProp(section, 'className')?.value).toBe('hero');
        expect(findProp(section, 'data-testid')?.value).toBe('hero');
        expect(findProp(section, 'aria-label')?.value).toBe('Intro');
    });

    it('exposes text nodes with an addressable node ref', () => {
        const doc = parse(HERO);
        const h1 = findBlock(doc.roots, 'h1')!;
        const text = h1.children[0] as TextNode;
        expect(text.type).toBe('text');
        expect(text.value.trim()).toBe('Welcome');
        expect(text.node).toBeTruthy();
    });

    it('exposes string/template literal children as text nodes', () => {
        const doc = parse(EXPRESSIONS);
        const div = doc.roots[0];
        const texts = div.children.filter((c): c is TextNode => c.type === 'text');
        const values = texts.map((t) => t.value.trim()).filter(Boolean);
        expect(values).toContain('literal child');
        expect(values).toContain('template child');
        expect(values.some((v) => v.includes('Plain text here'))).toBe(true);
    });

    it('flags dynamic subtrees (map / conditional) as opaque islands', () => {
        const doc = parse(DYNAMIC);
        expect(doc.roots[0].dynamic).toBe(true);
    });

    it('flags a spread attribute as dynamic', () => {
        const doc = parse(`function X(p) { return <div {...p} className="a" />; }`);
        expect(doc.roots[0].dynamic).toBe(true);
    });

    it('yields empty roots but still round-trips a file with no JSX', () => {
        const doc = parse(NO_JSX);
        expect(doc.roots).toHaveLength(0);
        expect(print(doc)).toBe(NO_JSX);
    });
});

// ---------------------------------------------------------------------------
// Surgical + idempotent edits
// ---------------------------------------------------------------------------

describe('prop edit is surgical + idempotent', () => {
    it('patches a string prop; only that token changes', () => {
        const doc = parse(HERO);
        const section = doc.roots[0];
        patchProp(findProp(section, 'className')!, 'hero-large');
        const gen1 = print(doc);
        expect(gen1).toContain('className="hero-large"');
        // sibling props + text intact
        expect(gen1).toContain('data-testid="hero"');
        expect(gen1).toContain('aria-label="Intro"');
        expect(gen1).toContain('<strong>truly yours</strong>');
        // idempotent
        const doc2 = parse(gen1);
        expect(print(doc2)).toBe(gen1);
    });

    it('patches a number prop', () => {
        const doc = parse(EXPRESSIONS);
        patchProp(findProp(doc.roots[0], 'data-n')!, 99);
        const gen1 = print(doc);
        expect(gen1).toContain('data-n={99}');
        expect(print(parse(gen1))).toBe(gen1);
    });

    it('patches a boolean prop', () => {
        const doc = parse(EXPRESSIONS);
        patchProp(findProp(doc.roots[0], 'data-flag')!, false);
        expect(print(doc)).toContain('data-flag={false}');
    });

    it('patches a prop to an arbitrary expression', () => {
        const doc = parse(HERO);
        patchPropExpression(findProp(doc.roots[0], 'className')!, 'cx("hero", active)');
        const gen1 = print(doc);
        expect(gen1).toContain('className={cx("hero", active)}');
        expect(print(parse(gen1))).toBe(gen1);
    });

    it('leaves comments intact through a prop edit', () => {
        const doc = parse(COMMENTED);
        const li = findBlock(doc.roots, 'li')!;
        // add-then-print by patching an existing string in the tree via text instead:
        const ul = doc.roots[0];
        expect(ul.name).toBe('ul');
        // patch nothing structural, just confirm comments survive a reprint after a text edit
        const first = li.children[0] as TextNode;
        patchText(first, 'Uno');
        const gen1 = print(doc);
        expect(gen1).toContain('// a leading line comment');
        expect(gen1).toContain('{/* an inner jsx comment */}');
        expect(gen1).toContain('{/* another */}');
        expect(gen1).toContain('<li>Uno</li>');
        expect(gen1).toContain('<li>Two</li>');
    });
});

describe('text edit is surgical + idempotent', () => {
    it('patches JSXText; siblings + markdown intact', () => {
        const doc = parse(HERO);
        const p = findBlock(doc.roots, 'p')!;
        // the <p> has children: "It is ", <strong>, "."
        const firstText = p.children.find((c) => c.type === 'text') as TextNode;
        patchText(firstText, 'It was ');
        const gen1 = print(doc);
        expect(gen1).toContain('It was ');
        expect(gen1).toContain('<strong>truly yours</strong>');
        expect(print(parse(gen1))).toBe(gen1);
    });

    it('patches a markdown-bearing text body preserving the markdown syntax', () => {
        const src = `function M() { return <p>Hello **world** and _more_</p>; }`;
        const doc = parse(src);
        const p = doc.roots[0];
        const text = p.children[0] as TextNode;
        expect(text.value).toContain('**world**');
        patchText(text, 'Hi **there** and _less_');
        const gen1 = print(doc);
        expect(gen1).toContain('Hi **there** and _less_');
        expect(print(parse(gen1))).toBe(gen1);
    });

    it('patches a string-literal child', () => {
        const doc = parse(EXPRESSIONS);
        const div = doc.roots[0];
        const litChild = div.children.find(
            (c) => c.type === 'text' && c.value === 'literal child',
        ) as TextNode;
        patchText(litChild, 'edited literal');
        const gen1 = print(doc);
        expect(gen1).toContain('edited literal');
        expect(print(parse(gen1))).toBe(gen1);
    });
});
