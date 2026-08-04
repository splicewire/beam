import { describe, expect, it } from 'vitest';
import { parseInline, serializeInline, mdxLeafEngine } from './mdx-engine.js';
import type { InlineDoc } from './types.js';

/** Round-trip law: serialize(parse(s)) === s up to mark-syntax normalization. */
const roundTrip = (s: string) => serializeInline(parseInline(s));

describe('mdx inline engine — parse', () => {
    it('parses a bare text run with no marks', () => {
        expect(parseInline('hello world')).toEqual([{ text: 'hello world', marks: [] }]);
    });

    it('parses strong / em / inlineCode', () => {
        expect(parseInline('**bold**')).toEqual([{ text: 'bold', marks: ['strong'] }]);
        expect(parseInline('*italic*')).toEqual([{ text: 'italic', marks: ['em'] }]);
        expect(parseInline('`code`')).toEqual([{ text: 'code', marks: ['inlineCode'] }]);
    });

    it('parses a link with label + href', () => {
        expect(parseInline('[click](https://x.test)')).toEqual([
            { text: 'click', marks: ['link'], href: 'https://x.test' },
        ]);
    });

    it('parses mixed runs, keeping literal text between marks', () => {
        expect(parseInline('It is **truly** yours.')).toEqual([
            { text: 'It is ', marks: [] },
            { text: 'truly', marks: ['strong'] },
            { text: ' yours.', marks: [] },
        ]);
    });

    it('parses nested marks (strong inside a link, em inside strong)', () => {
        expect(parseInline('[**hi**](u)')).toEqual([
            { text: 'hi', marks: ['link', 'strong'], href: 'u' },
        ]);
        expect(parseInline('**a *b* c**')).toEqual([
            { text: 'a ', marks: ['strong'] },
            { text: 'b', marks: ['strong', 'em'] },
            { text: ' c', marks: ['strong'] },
        ]);
    });
});

describe('mdx inline engine — round-trip losslessness (each mark)', () => {
    const cases: Array<[string, string]> = [
        ['plain', 'just words'],
        ['strong', '**bold**'],
        ['em', '*italic*'],
        ['inlineCode', '`x = 1`'],
        ['link', '[text](https://a.test/b?c=1)'],
        ['mixed', 'a **b** c *d* e `f` g [h](i)'],
        ['nested', '[**bold link**](u)'],
        ['strong+em', '**a *b* c**'],
        ['adjacent marks', '**a**`b`*c*'],
    ];
    it.each(cases)('%s round-trips losslessly', (_name, input) => {
        expect(roundTrip(input)).toBe(input);
    });
});

describe('mdx inline engine — syntax normalization', () => {
    it('normalizes __strong__ → **strong** and _em_ → *em* (both parse to the same mark)', () => {
        expect(roundTrip('__bold__')).toBe('**bold**');
        expect(roundTrip('_italic_')).toBe('*italic*');
    });
});

describe('mdx inline engine — degrade-not-lose (unknown/unbalanced marks)', () => {
    it('keeps an unbalanced delimiter as literal text (not dropped)', () => {
        // A lone `*` has no close — it must survive as a literal character, not vanish.
        expect(roundTrip('2 * 3 = 6')).toBe('2 * 3 = 6');
        expect(parseInline('a * b')).toEqual([{ text: 'a * b', marks: [] }]);
    });

    it('keeps an unterminated code span as literal', () => {
        expect(roundTrip('use `code here')).toBe('use `code here');
    });

    it('keeps a malformed link ([x] with no (href)) as literal text', () => {
        expect(roundTrip('see [ref] later')).toBe('see [ref] later');
    });

    it('preserves an escaped delimiter verbatim', () => {
        expect(roundTrip('literal \\* star')).toBe('literal \\* star');
    });

    it('never drops author characters on an exotic construct', () => {
        // An HTML-ish inline tag the engine doesn't model rides through as literal text.
        const s = 'a <span>b</span> c';
        expect(roundTrip(s)).toBe(s);
    });
});

describe('mdxLeafEngine binding surface', () => {
    it('exposes engine name + toDoc/fromDoc as the InlineLeafEditor contract', () => {
        expect(mdxLeafEngine.engine).toBe('mdx');
        const doc: InlineDoc = mdxLeafEngine.toDoc('**hi**') as InlineDoc;
        expect(doc).toEqual([{ text: 'hi', marks: ['strong'] }]);
        expect(mdxLeafEngine.fromDoc(doc)).toBe('**hi**');
    });
});
