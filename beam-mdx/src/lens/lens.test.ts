import { describe, expect, it } from 'vitest';
import { jsonToTsx, type JsonBlock, type JsonDoc } from '@splicewire/beam-ux/jsondoc';
import { MdxLensError, printMdx, readMdx } from './index.js';

const block = (name: string, children: JsonDoc = [], props: JsonBlock['props'] = [], extra: Partial<JsonBlock> = {}): JsonBlock =>
    ({ kind: 'block', name, isComponent: /^[A-Z]/.test(name), props, children, dynamic: false, ...extra });
const text = (value: string) => ({ kind: 'text' as const, value });
const read = (mdx: string) => readMdx(mdx).doc;

/** Bodies shaped like the measured corpus (ux-0233 Context): prose, kit components, tables, code and islands. */
const CORPUS: Record<string, string> = {
    essay: `# Why the engine sells nothing

The engine is a **boundary**, not a store. It holds the _ledger_ and
nothing that knows what a purchase is for.

## What it keeps

- A Payment, captured once
- A Receipt, with \`orderId\`
- A [Purchase](https://example.test/purchase "The purchase") the host maps

1. Place the order
2. Fulfil it

> The host decides what a purchase grants.
>
> Nothing else does.

---

![A diagram](/img/engine.png "Engine")
`,
    kit: `<Callout type="info" title="Heads up">

Payments run on the **fake rail** until live keys land.

</Callout>

<Steps>

1. Install the starter
2. Sign in

</Steps>

A sentence with an inline <Badge tone="new">beta</Badge> tag and a citation <Ref id="adr-0233" />.

<Hero title="Readings" count={3} featured />

<LegalEngine />
`,
    code: `Run it:

\`\`\`php title=app.php
DB::transaction(fn () => $order->charge());
\`\`\`

Inline \`code with a backtick\` and a hard
break.\\
Next line.
`,
    table: `| Tier | Price | Renews |
| :--- | ---: | :---: |
| Person | $19 | never |
| Tier 3 | $9 | monthly |
`,
    islands: `{/* drafted by the owner, kept verbatim */}

<Section bdStyle={{"layers":[{"declarations":{"padding":"1rem"}},{"breakpoint":"md","declarations":{"padding":"2rem"}}]}}>

Styled section prose.

</Section>

{items.map((item) => <Card key={item.id} title={item.title} />)}

<Panel {...rest} />
`,
    nested: `- Readings
  - Person
  - Tier 3
- Gifts

<Button href="/gifts">Send a gift</Button>

<p><Badge>only a tag</Badge></p>
`,
    escapes: `Braces \\{like this\\}, angle \\< brackets, a literal \\* star, \\_underscores\\_ and a \\# hash.

Reference [links][engine] resolve to inline links.

[engine]: https://example.test/engine
`,
};

describe('readMdx: Markdown reads as the HTML profile', () => {
    it('reads headings, paragraphs and marks as their HTML nodes, with a soft break as a space', () => {
        const doc = read('# Title\n\nSome **bold** and _em_ and `code`\ncontinued.\n');
        expect(doc).toEqual([
            block('h1', [text('Title')]),
            block('p', [text('Some '), block('strong', [text('bold')]), text(' and '), block('em', [text('em')]),
                text(' and '), block('code', [text('code')]), text(' continued.')]),
        ]);
    });

    it('reads lists, quotes, rules, images, links, fences and tables', () => {
        const doc = read(CORPUS.essay);
        expect(doc.map((node) => node.kind === 'block' ? node.name : node.kind)).toEqual(['h1', 'p', 'h2', 'ul', 'ol', 'blockquote', 'hr', 'p']);
        const list = doc[3] as JsonBlock;
        expect(list.children.every((item) => item.kind === 'block' && item.name === 'li')).toBe(true);
        const link = ((list.children[2] as JsonBlock).children[1]) as JsonBlock;
        expect(link).toEqual(block('a', [text('Purchase')], [{ name: 'href', kind: 'string', value: 'https://example.test/purchase' }, { name: 'title', kind: 'string', value: 'The purchase' }]));
        expect((doc[7] as JsonBlock).children[0]).toEqual(block('img', [], [
            { name: 'src', kind: 'string', value: '/img/engine.png' }, { name: 'alt', kind: 'string', value: 'A diagram' }, { name: 'title', kind: 'string', value: 'Engine' },
        ]));
        const [fence] = read(CORPUS.code).slice(1);
        expect(fence).toEqual(block('pre', [block('code', [text('DB::transaction(fn () => $order->charge());')], [
            { name: 'className', kind: 'string', value: 'language-php' }, { name: 'data-meta', kind: 'string', value: 'title=app.php' },
        ])]));
        const table = read(CORPUS.table)[0] as JsonBlock;
        expect(table.name).toBe('table');
        expect(((table.children[0] as JsonBlock).children[0] as JsonBlock).children.map((cell) => (cell as JsonBlock).props))
            .toEqual([[{ name: 'align', kind: 'string', value: 'left' }], [{ name: 'align', kind: 'string', value: 'right' }], [{ name: 'align', kind: 'string', value: 'center' }]]);
    });
});

describe('readMdx: JSX reads as components, through the TSX Lens', () => {
    it('reads a flow component holding Markdown, and inline content on the tag’s own line', () => {
        const [callout, steps, sentence, hero, legal] = read(CORPUS.kit) as JsonBlock[];
        expect(callout).toEqual(block('Callout', [block('p', [text('Payments run on the '), block('strong', [text('fake rail')]), text(' until live keys land.')])],
            [{ name: 'type', kind: 'string', value: 'info' }, { name: 'title', kind: 'string', value: 'Heads up' }]));
        expect((steps.children[0] as JsonBlock).name).toBe('ol');
        expect(sentence.children[1]).toEqual(block('Badge', [text('beta')], [{ name: 'tone', kind: 'string', value: 'new' }]));
        expect(sentence.children[3]).toEqual(block('Ref', [], [{ name: 'id', kind: 'string', value: 'adr-0233' }]));
        expect(hero.props).toEqual([
            { name: 'title', kind: 'string', value: 'Readings' }, { name: 'count', kind: 'number', value: 3 }, { name: 'featured', kind: 'boolean-shorthand', value: true },
        ]);
        expect(legal).toEqual(block('LegalEngine'));
    });

    it('reads JSX passed as a prop as the named slot the profile declares, as the TSX Lens does', () => {
        const mdx = '<Card media={<img src="a.png" alt="" />}>\n\nBody.\n\n</Card>\n';
        const context = { profile: { nodes: [{ name: 'Card', admitsChildCategories: null, slots: [{ name: 'media', admitsChildCategories: null }] }] } };
        const card = readMdx(mdx, context).doc[0] as JsonBlock;
        expect(card.slots?.media).toEqual([block('img', [], [{ name: 'src', kind: 'string', value: 'a.png' }, { name: 'alt', kind: 'string', value: '' }])]);
        expect(card.props).toEqual([]);
        expect((read(mdx)[0] as JsonBlock).props[0]).toMatchObject({ name: 'media', kind: 'expression' });
    });

    it('reads the lens-owned fields as the TSX Lens does', () => {
        const section = read(CORPUS.islands)[1] as JsonBlock;
        expect(section.style).toEqual({ layers: [{ declarations: { padding: '1rem' } }, { breakpoint: 'md', declarations: { padding: '2rem' } }] });
        expect(section.props).toEqual([]);
    });
});

describe('readMdx: islands and refusals', () => {
    it('keeps a comment, any other expression and a spread tag as Opaque Islands, verbatim', () => {
        const [comment, , map, spread] = read(CORPUS.islands);
        expect(comment).toEqual({ kind: 'opaque', reason: 'expression', source: '{/* drafted by the owner, kept verbatim */}' });
        expect(map).toEqual({ kind: 'opaque', reason: 'map', source: '{items.map((item) => <Card key={item.id} title={item.title} />)}' });
        expect(spread).toEqual({ kind: 'opaque', reason: 'spread', source: '<Panel {...rest} />' });
    });

    it('refuses code outside the JSX, and returns schemastud’s `export const meta` beside the body', () => {
        expect(() => readMdx("import Chart from './chart'\n\n# Hi\n")).toThrow(MdxLensError);
        expect(() => readMdx('export const answer = 42\n\n# Hi\n')).toThrow(MdxLensError);
        const withMeta = readMdx("export const meta = {title: 'Hi'}\n\n# Hi\n");
        expect(withMeta.meta).toBe("export const meta = {title: 'Hi'}");
        expect(withMeta.doc).toEqual([block('h1', [text('Hi')])]);
    });

    it('gives `export const meta`\'s value when it is static, so conversion can make it frontmatter (ux-0233 d9)', () => {
        const meta = "export const meta = { title: 'Start', order: 0, draft: false, offset: -2, tags: ['a', `b`], nav: { group: \"Docs\", 'sort-key': 1 }, none: null };";
        expect(readMdx(`${meta}\n\n# Hi\n`).metaData).toEqual({
            title: 'Start', order: 0, draft: false, offset: -2, tags: ['a', 'b'], nav: { group: 'Docs', 'sort-key': 1 }, none: null,
        });
        // A value only running code could give has no frontmatter form: the source is kept, the value is null.
        for (const dynamic of ['{ title: name }', '{ title: `Hi ${name}` }', '{ ...base }', '{ [key]: 1 }', '{ list: [...more] }', '{ at: new Date() }', '{ fn() {} }']) {
            const read = readMdx(`export const meta = ${dynamic}\n\n# Hi\n`);
            expect(read.meta, dynamic).not.toBeNull();
            expect(read.metaData, dynamic).toBeNull();
        }
        expect(readMdx('# Hi\n').metaData).toBeNull();
        // Review of 10dc0683: in an object literal, `__proto__:` (quoted or not) sets the prototype, it holds no data,
        // so such a meta has no frontmatter form either; and nothing here ever writes through the prototype setter.
        for (const proto of ['{ __proto__: { polluted: true } }', "{ '__proto__': { polluted: true } }", '{ title: \'x\', nav: { __proto__: null } }']) {
            expect(readMdx(`export const meta = ${proto}\n\n# Hi\n`).metaData, proto).toBeNull();
        }
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
});

describe('printMdx: canonical MDX', () => {
    it('keeps a nested list tight, and tells a lone tag from a paragraph that holds one', () => {
        const [list, button, paragraph] = read(CORPUS.nested) as JsonBlock[];
        expect(list).toEqual(block('ul', [
            block('li', [text('Readings'), block('ul', [block('li', [text('Person')]), block('li', [text('Tier 3')])])]),
            block('li', [text('Gifts')]),
        ]));
        expect(button).toEqual(block('Button', [text('Send a gift')], [{ name: 'href', kind: 'string', value: '/gifts' }]));
        expect(paragraph).toEqual(block('p', [block('Badge', [text('only a tag')])]));
        expect(printMdx([list])).toBe('- Readings\n  - Person\n  - Tier 3\n- Gifts\n');
    });

    it('never takes an inherited name for a heading', () => {
        expect(printMdx([block('constructor', [text('x')]), block('toString', [text('y')])])).toBe('<constructor>x</constructor>\n\n<toString>y</toString>\n');
    });

    it('prints a paragraph on one line', () => {
        expect(printMdx(read('One line\nand the next\nand a third.\n'))).toBe('One line and the next and a third.\n');
    });

    it('prints a component’s attributes exactly as the TSX printer does', () => {
        const section = block('Section', [block('p', [text('Hi')])], [{ name: 'tone', kind: 'string', value: 'warm' }, { name: 'span', kind: 'number', value: 2 }],
            { style: { layers: [{ declarations: { padding: '1rem' } }] } });
        const tsx = jsonToTsx([section]);
        const opening = tsx.slice(0, tsx.indexOf('>') + 1);
        expect(printMdx([section]).startsWith(`${opening}\n\nHi\n\n</Section>`)).toBe(true);
    });

    it('reads back what it prints for a document the canvas made', () => {
        const doc: JsonDoc = [
            block('h2', [text('Plans')]),
            block('p', [text('Pick one: '), block('Button', [text('Choose')], [{ name: 'href', kind: 'string', value: '/plans' }])]),
            block('Callout', [block('p', [text('Inline '), block('em', [text('emphasis')]), text('.')])], [{ name: 'type', kind: 'string', value: 'warn' }]),
            block('p', [text('Styled')], [], { style: { layers: [{ declarations: { margin: '0' } }] } }),
            { kind: 'opaque', reason: 'expression', source: '{/* keep */}' },
        ];
        expect(read(printMdx(doc))).toEqual(doc);
    });

    it.each(Object.keys(CORPUS))('reaches a fixed point on the %s corpus body', (name) => {
        const once = printMdx(read(CORPUS[name]));
        const twice = printMdx(read(once));
        expect(twice).toBe(once);
        expect(read(once)).toEqual(read(CORPUS[name]));
    });
});
