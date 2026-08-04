import { describe, expect, it } from 'vitest';
import { blockDocToPuck, puckToTsx, stripIds, CODEGEN_MARKER, OPAQUE_ISLAND_TYPE } from './puck.js';
import type { PuckData, PuckNode } from './puck.js';

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

// ---------------------------------------------------------------------------
// Ticket 11 — opaque islands. Dynamic subtrees the structural lens can't decompose
// (`.map`, `{cond && <X/>}`, ternary, imported-expression, spread) are PRESERVED as
// sealed `OpaqueIsland` Puck nodes carrying their verbatim source — NOT dropped — and
// re-emitted verbatim so `tsx → PuckData → tsx` is byte-lossless. This closes ticket 08's
// known drop-gap.
// ---------------------------------------------------------------------------

// A codegen-shaped page MIXING editable blocks (Heading/Prose/ResourceList) with a top-level `.map`
// island AND a `{cond && <X/>}` island. Authored at the exact indentation `puckToTsx` emits (indent 3 =
// 6 spaces for top-level content) so the byte-lossless assertion is meaningful.
const MIXED_PAGE = `// ${CODEGEN_MARKER} — DO NOT EDIT.
// Edit via the Puck page editor; this file is regenerated on Publish.
import { Heading, Prose, ResourceList } from '@/puck/blocks';

export default function MixedPage() {
  return (
    <>
      <Heading text="Lyrics" />
      {items.map((i) => (
        <ResourceList key={i.id} resource={i.slug} />
      ))}
      <Prose mdx="between" />
      {showList && <ResourceList resource="songs" />}
    </>
  );
}
`;

// A `.map` island nested INSIDE an editable `<Section>` slot (indent 4 = 8 spaces) — proves nesting
// seals + round-trips, not just top-level islands.
const NESTED_ISLAND_PAGE = `// ${CODEGEN_MARKER} — DO NOT EDIT.
// Edit via the Puck page editor; this file is regenerated on Publish.
import { Heading, ResourceList, Section } from '@/puck/blocks';

export default function NestedPage() {
  return (
    <>
      <Section heading="Lyrics">
        <Heading text="Words" />
        {items.map((i) => (
          <ResourceList key={i.id} resource={i.slug} />
        ))}
      </Section>
    </>
  );
}
`;

describe('ticket 11 — opaque islands preserve dynamic subtrees (closes ticket 08 drop-gap)', () => {
    it('does NOT drop dynamic subtrees — they become OpaqueIsland nodes carrying verbatim source', () => {
        const data = blockDocToPuck(MIXED_PAGE)!;

        // Editable blocks survive as normal nodes.
        const types = data.content.map((n) => n.type);
        expect(types).toEqual(['Heading', OPAQUE_ISLAND_TYPE, 'Prose', OPAQUE_ISLAND_TYPE]);

        const [, mapIsland, , condIsland] = data.content;
        expect(mapIsland.type).toBe(OPAQUE_ISLAND_TYPE);
        expect(String(mapIsland.props.source)).toContain('items.map');
        expect(String(mapIsland.props.reason)).toBe('map');
        expect(String(condIsland.props.source)).toContain('showList && <ResourceList resource="songs" />');
        expect(String(condIsland.props.reason)).toBe('conditional');
    });

    it('tsx → PuckData → tsx is BYTE-LOSSLESS for a mixed page (editable + .map + conditional)', () => {
        const back = blockDocToPuck(MIXED_PAGE)!;
        const roundTripped = puckToTsx(back, 'mixed');
        expect(roundTripped).toBe(MIXED_PAGE);
    });

    it('seals + round-trips an island NESTED inside an editable Section (not just top-level)', () => {
        const back = blockDocToPuck(NESTED_ISLAND_PAGE)!;

        // The Section survived as an editable block; its slot holds the Heading + the island, in order.
        const section = back.content.find((n) => n.type === 'Section')!;
        const slot = section.props.content as PuckNode[];
        expect(slot.map((n) => n.type)).toEqual(['Heading', OPAQUE_ISLAND_TYPE]);
        expect(String(slot[1].props.source)).toContain('items.map');

        // And it round-trips byte-for-byte.
        expect(puckToTsx(back, 'nested')).toBe(NESTED_ISLAND_PAGE);
    });

    it('OpaqueIsland is NOT added to the blocks import line (it re-emits raw source)', () => {
        const back = blockDocToPuck(MIXED_PAGE)!;
        const tsx = puckToTsx(back, 'mixed');
        expect(tsx).not.toContain(`${OPAQUE_ISLAND_TYPE},`);
        expect(tsx).not.toContain(`${OPAQUE_ISLAND_TYPE} }`);
    });
});
