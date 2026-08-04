import { describe, expect, it } from 'vitest';
import { parse } from 'recast';
import * as babelTsParser from 'recast/parsers/babel-ts.js';
import {
    generatePuckConfig,
    attributeFields,
    CONFIG_CODEGEN_MARKER,
    type BlockManifest,
} from './generator.js';

// A representative manifest: a scalar-prop block, a select block, a custom (raw) field block, and a
// slot-bearing container — the four shapes audiostud's real vocabulary exercises.
const MANIFEST: BlockManifest = {
    blocksModule: '@/puck/blocks',
    blocks: [
        {
            name: 'Heading',
            render: 'Heading',
            props: [{ name: 'text', field: { type: 'text', label: 'Heading text' }, default: 'Heading' }],
        },
        {
            name: 'ResourceList',
            render: 'ResourceList',
            props: [
                {
                    name: 'resource',
                    field: {
                        type: 'select',
                        label: 'Resource',
                        options: [
                            { label: 'Lyrics', value: 'library-lyrics' },
                            { label: 'Songs', value: 'songs' },
                        ],
                    },
                    default: 'library-lyrics',
                },
            ],
        },
        {
            name: 'Prose',
            render: 'Prose',
            props: [
                {
                    name: 'mdx',
                    field: {
                        type: 'raw',
                        source: "{ type: 'custom', label: 'Prose', render: () => null }",
                        imports: [`import { MdxThing } from '@x/mdx';`],
                    },
                    default: 'Write here.',
                },
            ],
        },
        {
            name: 'Section',
            render: 'Section',
            slotProp: 'content',
            props: [
                { name: 'heading', field: { type: 'text', label: 'Section heading' }, default: 'Section' },
                { name: 'content', field: { type: 'slot', allow: ['Heading', 'Prose'] }, default: '[]', rawDefault: true },
            ],
        },
    ],
};

function parses(src: string): boolean {
    try {
        parse(src, { parser: babelTsParser });
        return true;
    } catch {
        return false;
    }
}

describe('generatePuckConfig', () => {
    const out = generatePuckConfig(MANIFEST);

    it('opens with the @generated marker header', () => {
        expect(out.startsWith(`// ${CONFIG_CODEGEN_MARKER}`)).toBe(true);
        expect(out).toContain('DO NOT EDIT');
    });

    it('produces syntactically valid TSX', () => {
        expect(parses(out)).toBe(true);
    });

    it('imports the hand-written render components from the blocks module', () => {
        expect(out).toContain(`import { Heading, Prose, ResourceList, Section } from '@/puck/blocks';`);
    });

    it('hoists raw-field imports', () => {
        expect(out).toContain(`import { MdxThing } from '@x/mdx';`);
    });

    it('emits a typed props alias per block including the attribute editors', () => {
        expect(out).toContain('type HeadingProps = {');
        // manifest props are required; the universal attribute editors are optional
        expect(out).toContain('text: string;');
        expect(out).toContain('className?: string;');
        expect(out).toContain('dataAttrs?: Record<string, string>;');
        expect(out).toContain('style?: React.CSSProperties;');
    });

    it('marks a slot prop optional', () => {
        expect(out).toContain('content?: Slot;');
    });

    it('emits fields from the manifest', () => {
        expect(out).toContain(`text: { type: 'text', label: "Heading text" }`);
        expect(out).toContain(`type: 'select'`);
        expect(out).toContain(`{ label: "Lyrics", value: "library-lyrics" }`);
        // the raw custom field rides through verbatim
        expect(out).toContain(`{ type: 'custom', label: 'Prose', render: () => null }`);
    });

    it('gives every block the universal attribute editors', () => {
        // className field appears once per block (4 blocks)
        expect(out.match(/className: \{ type: 'text'/g)?.length).toBe(4);
    });

    it('wires an attrs bag (className/data-*/style) into every render fn', () => {
        expect(out).toContain('attrs={{ className, ...(dataAttrs ?? {}), style: style as React.CSSProperties }}');
    });

    it('calls the slot prop for a slot-bearing block', () => {
        expect(out).toContain('SlotContent?.()');
        expect(out).toContain(`allow: ["Heading","Prose"]`);
    });

    it('emits defaultProps only for props that declare a default', () => {
        expect(out).toContain('defaultProps: {');
        expect(out).toContain('text: "Heading"');
        // rawDefault emits verbatim, not JSON
        expect(out).toContain('content: [],');
    });

    it('is deterministic — regen is byte-identical (drift signal)', () => {
        expect(generatePuckConfig(MANIFEST)).toBe(out);
    });

    it('defaults the attribute editors when the manifest omits them', () => {
        expect(attributeFields.map((f) => f.name)).toEqual(['className', 'dataAttrs', 'style']);
    });
});

describe('generatePuckConfig — richtext leaf field (ticket 10)', () => {
    const RICH: BlockManifest = {
        blocksModule: '@/puck/blocks',
        blocks: [
            {
                name: 'Prose',
                render: 'Prose',
                props: [
                    {
                        name: 'text',
                        field: { type: 'richtext', engine: 'mdx', label: 'Prose text' },
                        default: 'Write your prose.',
                    },
                ],
            },
            {
                name: 'Fancy',
                render: 'Fancy',
                // Omits engine → defaults to 'mdx'. Shares the default factory module with Prose (a
                // manifest uses ONE leaf-field factory), so the factory import is emitted once.
                props: [{ name: 'body', field: { type: 'richtext' } }],
            },
        ],
    };
    const out = generatePuckConfig(RICH);

    it('produces valid TSX', () => {
        expect(parses(out)).toBe(true);
    });

    it('delegates the field to the host richtextLeafField factory, passing the named engine', () => {
        expect(out).toContain(`text: richtextLeafField({ engine: "mdx", label: "Prose text" }),`);
    });

    it("defaults the engine to 'mdx' when omitted", () => {
        expect(out).toContain(`body: richtextLeafField({ engine: "mdx" }),`);
    });

    it('imports the factory once from the default module (shared across blocks)', () => {
        expect(out).toContain(`import { richtextLeafField } from '@/puck/richtext-field';`);
        expect(out.match(/import \{ richtextLeafField \}/g)?.length).toBe(1);
    });

    it('honors a per-field factoryModule override', () => {
        const overridden = generatePuckConfig({
            blocksModule: '@/puck/blocks',
            blocks: [{ name: 'B', render: 'B', props: [{ name: 't', field: { type: 'richtext', factoryModule: '@/puck/rt' } }] }],
        });
        expect(overridden).toContain(`import { richtextLeafField } from '@/puck/rt';`);
    });

    it('types a richtext prop as string (the inline-markup run)', () => {
        expect(out).toContain('text: string;');
        expect(out).toContain('body: string;');
    });

    it('is deterministic', () => {
        expect(generatePuckConfig(RICH)).toBe(out);
    });
});
