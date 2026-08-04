import { describe, expect, it } from 'vitest';
import { blockDocToPuck, puckToTsx, stripIds, CODEGEN_MARKER } from './puck.js';
import type { PuckData } from './puck.js';

// ---------------------------------------------------------------------------
// Fixtures — the REAL seeded `library-lyrics` page (BeamUxPuckSeedCommand::pageData)
// and the `section-template` slot page (templateData): Heading + Prose + ResourceList,
// plus a slot-bearing Section with nested inline content.
// ---------------------------------------------------------------------------

const LIBRARY_LYRICS: PuckData = {
    root: {},
    content: [
        { type: 'Heading', props: { id: 'heading-seed', text: 'Lyrics' } },
        {
            type: 'Prose',
            props: {
                id: 'prose-seed',
                mdx:
                    '## Your words\n\nThe lyrics you\'ve written and saved — **your corpus** to draw from. ' +
                    'Each draft is yours to revisit, edit into a song, or hand to the builder as the words a render sings.',
            },
        },
        { type: 'ResourceList', props: { id: 'resourcelist-seed', resource: 'library-lyrics' } },
    ],
    zones: {},
};

const SECTION_TEMPLATE: PuckData = {
    root: {},
    content: [
        { type: 'Heading', props: { id: 'template-heading', text: 'A section with a working slot' } },
        {
            type: 'Section',
            props: {
                id: 'section-seed',
                heading: 'Drop content here',
                content: [
                    {
                        type: 'Prose',
                        props: {
                            id: 'section-prose-seed',
                            mdx: "This paragraph lives **inside the Section's slot** — dropped into the slot.",
                        },
                    },
                ],
            },
        },
    ],
    zones: {},
};

describe('puckToTsx — the JS mirror of PHP PuckPageCodegen', () => {
    it('emits a marked default export named from the slug, importing the used blocks', () => {
        const tsx = puckToTsx(LIBRARY_LYRICS, 'library-lyrics');

        expect(tsx).toContain(CODEGEN_MARKER);
        expect(tsx).toContain('export default function LibraryLyricsPage()');
        expect(tsx).toContain("import { Heading, Prose, ResourceList } from '@/puck/blocks';");
    });

    it('composes content as JSX, drops the structural id, and template-literals the mdx', () => {
        const tsx = puckToTsx(LIBRARY_LYRICS, 'library-lyrics');

        expect(tsx).toContain('<Heading text="Lyrics" />');
        expect(tsx).toContain('<ResourceList resource="library-lyrics" />');
        expect(tsx).not.toContain('id="heading-seed"');
        expect(tsx).toContain('mdx={`');
        expect(tsx).toContain('## Your words');
    });

    it('nests an inline slot prop as JSX children (not an attribute)', () => {
        const tsx = puckToTsx(SECTION_TEMPLATE, 'section-template');

        expect(tsx).toContain('<Section heading="Drop content here">');
        expect(tsx).toContain('</Section>');
        expect(tsx).not.toContain('content=');
        expect(tsx).toContain("import { Heading, Prose, Section } from '@/puck/blocks';");
    });
});

describe('blockDocToPuck — parse a page .tsx back into Puck Data', () => {
    it('reconstructs the content list with synthesized ids', () => {
        const tsx = puckToTsx(LIBRARY_LYRICS, 'library-lyrics');
        const data = blockDocToPuck(tsx)!;

        expect(data.content.map((n) => n.type)).toEqual(['Heading', 'Prose', 'ResourceList']);
        expect(data.content[0].props.text).toBe('Lyrics');
        expect(data.content[2].props.resource).toBe('library-lyrics');
        // A synthesized, deterministic id (codegen dropped the original).
        expect(data.content[0].props.id).toBe('heading-0');
    });

    it('recovers a nested slot as an inline content prop', () => {
        const tsx = puckToTsx(SECTION_TEMPLATE, 'section-template');
        const data = blockDocToPuck(tsx)!;

        const section = data.content.find((n) => n.type === 'Section')!;
        expect(Array.isArray(section.props.content)).toBe(true);
        const slot = section.props.content as PuckData['content'];
        expect(slot[0].type).toBe('Prose');
        expect(String(slot[0].props.mdx)).toContain("inside the Section's slot");
    });

    it('returns null for a file with no page-shaped root', () => {
        expect(blockDocToPuck('const x = 1;')).toBeNull();
    });
});

describe('round-trip (the load-bearing AC)', () => {
    // puckData → .tsx → puckData is drift-free MODULO the structural `id` (codegen strips it, so the
    // reverse re-synthesizes a deterministic one — documented lossiness, ticket 08 notes).
    it.each([
        ['library-lyrics', LIBRARY_LYRICS] as const,
        ['section-template', SECTION_TEMPLATE] as const,
    ])('puckData → tsx → puckData is drift-free modulo id (%s)', (slug, data) => {
        const tsx = puckToTsx(data, slug);
        const back = blockDocToPuck(tsx)!;

        expect(stripIds(back)).toEqual(stripIds(data));
    });

    // .tsx → puckData → .tsx is BYTE-IDENTICAL — codegen output carries no ids, so nothing is lost.
    it.each([
        ['library-lyrics', LIBRARY_LYRICS] as const,
        ['section-template', SECTION_TEMPLATE] as const,
    ])('tsx → puckData → tsx is byte-identical (%s)', (slug, data) => {
        const tsx = puckToTsx(data, slug);
        const roundTripped = puckToTsx(blockDocToPuck(tsx)!, slug);

        expect(roundTripped).toBe(tsx);
    });
});
