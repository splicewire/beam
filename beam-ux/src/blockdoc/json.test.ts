import { describe, it, expect } from 'vitest';
import { parse } from './lens.js';
import { fromJson } from './index.js';
import {
    toJson,
    jsonToTsx,
    getAt,
    updateAt,
    insertInto,
    removeAt,
    moveBefore,
    moveAfter,
    duplicateAt,
    setProp,
    removeProp,
    setText,
    propValue,
    isJsonOpaque,
    isLeafText,
    type JsonBlock,
    type JsonDoc,
} from './json.js';

/** Parse .tsx → JSON, then re-print → re-parse → JSON, asserting the JSON tree is stable. */
const stable = (tsx: string): JsonDoc => {
    const a = toJson(parse(tsx));
    const b = toJson(fromJson(a));
    expect(b).toEqual(a);
    return a;
};

describe('toJson — AST-free projection', () => {
    it('strips AST node handles (JSON.stringify never throws on a circular AST)', () => {
        const doc = toJson(parse('<div className="x"><p>hi</p></div>'));
        expect(() => JSON.stringify(doc)).not.toThrow();
        expect(doc[0]).toMatchObject({ kind: 'block', name: 'div', isComponent: false });
    });

    it('projects prop kinds faithfully', () => {
        const doc = toJson(parse('<Hero count={3} flag={a + b} title="x" disabled />'));
        const b = doc[0] as JsonBlock;
        expect(b.isComponent).toBe(true);
        expect(b.props).toEqual([
            { name: 'count', kind: 'number', value: 3 },
            { name: 'flag', kind: 'expression', value: 'a + b' },
            { name: 'title', kind: 'string', value: 'x' },
            { name: 'disabled', kind: 'boolean-shorthand', value: true },
        ]);
    });
});

describe('round-trip stability (JSON ⟷ .tsx)', () => {
    it('a home-shaped tree of section islands is stable', () => {
        const doc = stable(`
            <>
                <Hero title="Make it yours" />
                <section className="section" style={{ padding: '40px' }}>
                    <h2 className="heading">Your song</h2>
                    <p className="body">Bring your material.</p>
                </section>
                <TheLoop count={6} />
            </>
        `);
        // The fragment root carries the three islands + section.
        expect(doc[0].kind).toBe('block');
        const root = doc[0] as JsonBlock;
        expect(root.name).toBeNull();
        expect(root.children.map((c) => (c as JsonBlock).name)).toEqual([
            'Hero',
            'section',
            'TheLoop',
        ]);
    });

    it('a legal-MDX-shaped tree with a <Content> ref is stable', () => {
        stable(`
            <article className="prose">
                <h1>Privacy</h1>
                <Content name="partials/privacy-intro" />
                <p>Body copy.</p>
            </article>
        `);
    });

    it('style expression props survive both ways', () => {
        const doc = stable(`<div style={{ fontFamily: 'Fraunces', fontSize: '32px' }} />`);
        const b = doc[0] as JsonBlock;
        const style = b.props.find((p) => p.name === 'style');
        expect(style?.kind).toBe('expression');
        expect(String(style?.value)).toContain('Fraunces');
    });
});

describe('opaque islands (the one seal concept)', () => {
    it('a `.map` child projects as a sealed opaque node and round-trips verbatim', () => {
        const src = `
            <ul>
                {items.map((i) => (
                    <li key={i.id}>{i.name}</li>
                ))}
            </ul>
        `;
        const doc = toJson(parse(src));
        const ul = doc[0] as JsonBlock;
        const island = ul.children.find(isJsonOpaque);
        expect(island).toBeDefined();
        expect(island?.reason).toBe('map');
        expect(island?.source).toContain('items.map');

        // Stable through the JSON⟷.tsx round-trip (the island source re-emits unchanged).
        const back = toJson(fromJson(doc));
        const backUl = back[0] as JsonBlock;
        const backIsland = backUl.children.find(isJsonOpaque);
        expect(backIsland?.source.replace(/\s+/g, ' ')).toContain('items.map');
    });

    it('a conditional child is opaque with reason conditional', () => {
        const doc = toJson(parse(`<div>{show && <Banner />}</div>`));
        const island = (doc[0] as JsonBlock).children.find(isJsonOpaque);
        expect(island?.reason).toBe('conditional');
    });
});

describe('browser edit ops (pure, immutable)', () => {
    const doc: JsonDoc = toJson(
        parse(`<section><h2>Title</h2><p>Body</p></section>`),
    );

    it('getAt addresses into the doc with dotted paths', () => {
        expect((getAt(doc, '0') as JsonBlock).name).toBe('section');
        expect((getAt(doc, '0.0') as JsonBlock).name).toBe('h2');
        expect((getAt(doc, '0.1') as JsonBlock).name).toBe('p');
        expect(getAt(doc, '0.9')).toBeNull();
    });

    it('updateAt replaces immutably', () => {
        const next = updateAt(doc, '0.0', (n) => setText(n as JsonBlock, 'New'));
        expect((getAt(next, '0.0') as JsonBlock).children).toEqual([{ kind: 'text', value: 'New' }]);
        // Original untouched.
        expect(isLeafText(getAt(doc, '0.0') as JsonBlock)).toBe(true);
        expect((getAt(doc, '0.0') as JsonBlock).children).toEqual([{ kind: 'text', value: 'Title' }]);
    });

    it('insertInto + removeAt', () => {
        const added = insertInto(doc, '0', 1, {
            kind: 'block', name: 'hr', isComponent: false, props: [], children: [], dynamic: false,
        });
        expect((getAt(added, '0') as JsonBlock).children.map((c) => (c as JsonBlock).name)).toEqual([
            'h2', 'hr', 'p',
        ]);
        const removed = removeAt(added, '0.1');
        expect((getAt(removed, '0') as JsonBlock).children.map((c) => (c as JsonBlock).name)).toEqual([
            'h2', 'p',
        ]);
    });

    it('moveBefore reorders siblings and no-ops into self', () => {
        const moved = moveBefore(doc, '0.1', '0.0'); // p before h2
        expect((getAt(moved, '0') as JsonBlock).children.map((c) => (c as JsonBlock).name)).toEqual([
            'p', 'h2',
        ]);
        expect(moveBefore(doc, '0', '0.0')).toBe(doc); // dropping into self is a no-op
    });

    it('moveAfter reorders siblings (the mirror of moveBefore) and no-ops into self', () => {
        const moved = moveAfter(doc, '0.0', '0.1'); // h2 after p
        expect((getAt(moved, '0') as JsonBlock).children.map((c) => (c as JsonBlock).name)).toEqual([
            'p', 'h2',
        ]);
        expect(moveAfter(doc, '0', '0.0')).toBe(doc); // dropping into self is a no-op
    });

    it('moveAfter can place a node at the very end (moveBefore alone never could)', () => {
        const withThree: JsonDoc = toJson(parse(`<section><h2>Title</h2><p>Body</p><hr/></section>`));
        const moved = moveAfter(withThree, '0.0', '0.2'); // h2 after the last child (hr)
        expect((getAt(moved, '0') as JsonBlock).children.map((c) => (c as JsonBlock).name)).toEqual([
            'p', 'hr', 'h2',
        ]);
    });

    it('duplicateAt deep-clones the node as the very next sibling, independent of the original', () => {
        const dup = duplicateAt(doc, '0.0');
        const siblings = (getAt(dup, '0') as JsonBlock).children.map((c) => (c as JsonBlock).name);
        expect(siblings).toEqual(['h2', 'h2', 'p']);
        // it's a real independent copy, not the same reference — editing one doesn't affect the other
        const edited = updateAt(dup, '0.0', (n) => setText(n as JsonBlock, 'Changed'));
        expect(((getAt(edited, '0.0') as JsonBlock).children[0] as { value: string }).value).toBe('Changed');
        expect(((getAt(edited, '0.1') as JsonBlock).children[0] as { value: string }).value).toBe('Title');
    });

    it('duplicateAt is a no-op for a path that does not resolve', () => {
        expect(duplicateAt(doc, '0.9')).toBe(doc);
    });

    it('setProp / removeProp / propValue', () => {
        const b = getAt(doc, '0') as JsonBlock;
        const withClass = setProp(b, 'className', 'section');
        expect(propValue(withClass, 'className')).toBe('section');
        expect(propValue(removeProp(withClass, 'className'), 'className')).toBeUndefined();
    });
});

describe('jsonToTsx printer (Babel-free)', () => {
    it('prints scalar prop kinds correctly', () => {
        const out = jsonToTsx([
            {
                kind: 'block', name: 'X', isComponent: true, dynamic: false, children: [],
                props: [
                    { name: 'title', kind: 'string', value: 'hi' },
                    { name: 'count', kind: 'number', value: 3 },
                    { name: 'live', kind: 'boolean', value: true },
                    { name: 'open', kind: 'boolean-shorthand', value: true },
                ],
            },
        ]);
        expect(out).toContain('title="hi"');
        expect(out).toContain('count={3}');
        expect(out).toContain('live={true}');
        expect(out).toMatch(/ open\b/);
    });

    it('escapes JSX-special characters in text leaves', () => {
        const out = jsonToTsx([
            { kind: 'block', name: 'p', isComponent: false, dynamic: false, props: [],
              children: [{ kind: 'text', value: 'a < b > c' }] },
        ]);
        // Re-parsing the printed source keeps the braces from breaking the tree.
        expect(() => parse(out)).not.toThrow();
    });

    it('separates multiple top-level roots so the printed source stays re-parseable', () => {
        // A real page is never single-root (several top-level sections) — bare adjacent JSX with no
        // separator is a syntax error ("Adjacent JSX elements must be wrapped..."), so this is the
        // NORMAL case, not an edge case. Regression coverage for a real bug: fromJson() (this
        // module's own round-trip closer) threw on any multi-root doc before jsonToTsx started
        // terminating each root as its own statement.
        const doc: JsonDoc = [
            { kind: 'block', name: 'section', isComponent: false, dynamic: false, props: [],
              children: [{ kind: 'text', value: 'first' }] },
            { kind: 'block', name: 'section', isComponent: false, dynamic: false, props: [],
              children: [{ kind: 'text', value: 'second' }] },
        ];
        const out = jsonToTsx(doc);
        expect(() => parse(out)).not.toThrow();
        expect(fromJson(doc).roots).toHaveLength(2);
    });

    it('prints a null string-kind value as an empty string, not the text "null"', () => {
        // A cleared string attr (e.g. an entitlement gate select) round-trips through Laravel's
        // default `ConvertEmptyStringsToNull` middleware as a real `null`, not `''`. `String(null)`
        // is the JS footgun `"null"` — regression coverage for a real bug: this used to print the
        // 4-character text `data-view-gate="null"` into live JSX instead of an empty attribute.
        const out = jsonToTsx([
            { kind: 'block', name: 'p', isComponent: false, dynamic: false, children: [],
              props: [{ name: 'data-view-gate', kind: 'string', value: null }] },
        ]);
        expect(out).toContain('data-view-gate=""');
        expect(out).not.toContain('null');
    });
});
