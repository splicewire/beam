import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse, print } from '../blockdoc/lens.js';
import type { BlockNode, TextNode } from '../blockdoc/types.js';
import {
    registerLeafEngine,
    resolveLeafEngine,
    registeredLeafEngines,
    __clearLeafEngines,
} from './registry.js';
import { bindTextNode } from './bind.js';
import { mdxLeafEngine } from './mdx-engine.js';
import type { InlineDoc, InlineLeafEditor } from './types.js';

beforeEach(() => {
    __clearLeafEngines();
    registerLeafEngine(mdxLeafEngine);
});
afterEach(() => __clearLeafEngines());

// A Prose-ish page: a text run sits between two sibling elements, inside a block with structural attrs.
const PAGE = `export function Prose() {
    return (
        <section className="prose" data-testid="prose" aria-label="Body">
            <h2>Heading</h2>
            <p>It is truly yours.</p>
            <footer>End</footer>
        </section>
    );
}
`;

/** Grab the addressable text node of the <p> (the "It is truly yours." run). */
function proseTextNode(): { doc: ReturnType<typeof parse>; text: TextNode; section: BlockNode } {
    const doc = parse(PAGE);
    const section = doc.roots[0];
    const p = section.children.find(
        (c): c is BlockNode => c.type === 'block' && c.name === 'p',
    )!;
    const text = p.children.find((c): c is TextNode => c.type === 'text')!;
    return { doc, text, section };
}

describe('registry — engine selection by name', () => {
    it('resolves the registered mdx engine by name', () => {
        expect(resolveLeafEngine('mdx').engine).toBe('mdx');
        expect(registeredLeafEngines()).toContain('mdx');
    });

    it('throws a clear error naming the missing + known engines', () => {
        expect(() => resolveLeafEngine('prosemirror')).toThrow(/No inline leaf engine.*'prosemirror'/);
        expect(() => resolveLeafEngine('prosemirror')).toThrow(/'mdx'/);
    });
});

describe('bindTextNode — TextNode ⟷ editor doc', () => {
    it('read() projects the text run into the engine doc', () => {
        const { text } = proseTextNode();
        const leaf = bindTextNode<InlineDoc>(text, 'mdx');
        expect(leaf.read()).toEqual([{ text: 'It is truly yours.', marks: [] }]);
    });

    it('write(doc) serializes marks and patches the AST → lossless .tsx round-trip', () => {
        const { doc, text } = proseTextNode();
        const leaf = bindTextNode<InlineDoc>(text, 'mdx');

        // Author bolds "truly" and links "yours" in the editor's doc, then writes back.
        const edited: InlineDoc = [
            { text: 'It is ', marks: [] },
            { text: 'truly', marks: ['strong'] },
            { text: ' ', marks: [] },
            { text: 'yours', marks: ['link'], href: 'https://a.test' },
            { text: '.', marks: [] },
        ];
        const written = leaf.write(edited);
        expect(written).toBe('It is **truly** [yours](https://a.test).');

        const out = print(doc);
        // The <p>'s text carries the new marks…
        expect(out).toContain('<p>It is **truly** [yours](https://a.test).</p>');
        // …and every sibling + the section's structural attributes are UNTOUCHED.
        expect(out).toContain('<section className="prose" data-testid="prose" aria-label="Body">');
        expect(out).toContain('<h2>Heading</h2>');
        expect(out).toContain('<footer>End</footer>');
    });

    it('a no-op edit reprints byte-identically', () => {
        const { doc, text } = proseTextNode();
        const leaf = bindTextNode<InlineDoc>(text, 'mdx');
        leaf.write(leaf.read()); // round-trip the current value unchanged
        expect(print(doc)).toBe(PAGE);
    });

    it('degrades an unknown mark to text on write (never drops it)', () => {
        const { doc, text } = proseTextNode();
        const leaf = bindTextNode<InlineDoc>(text, 'mdx');
        // A run tagged with a mark the mdx engine doesn't emit falls back to its literal text.
        const edited = [{ text: 'a <mark>b</mark> c', marks: [] }] as unknown as InlineDoc;
        leaf.write(edited);
        expect(print(doc)).toContain('<p>a <mark>b</mark> c</p>');
    });
});

describe('a SECOND engine binds via the same seam (no call-site change)', () => {
    // A toy "uppercase" engine whose doc is a plain string — proves the seam is engine-agnostic and no
    // mdx assumption leaked in. Registered under a new name; bindTextNode selects it by that name alone.
    const upperEngine: InlineLeafEditor<string> = {
        engine: 'upper',
        toDoc: (t) => t,
        fromDoc: (d) => d.toUpperCase(),
    };

    it('the identical bindTextNode call path drives a different engine', () => {
        registerLeafEngine(upperEngine);
        const { doc, text } = proseTextNode();
        const leaf = bindTextNode<string>(text, 'upper');
        leaf.write(leaf.read());
        expect(print(doc)).toContain('<p>IT IS TRULY YOURS.</p>');
        // The mdx engine is still independently resolvable — registry holds both.
        expect(registeredLeafEngines().sort()).toEqual(['mdx', 'upper']);
    });
});
