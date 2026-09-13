// Deterministic fixtures for the @splicewire/beam-ux catalog (Storybook + isolation-mount test).
// Adapted from the throwaway prototype fixture (beamux ticket 04). NOT shipped — never imported by
// src/index.ts. Models one live tenant page ("Programs") as a tree of REGIONS + the schema/body each
// region loads.
import type { BeamUxEntryBodyData } from '@splicewire/beam-resources/types/beam-ux';
import type { PaletteItem, Region, TreeNode } from './types';

/**
 * Deterministic fixture entry ids. Real ones are uuids off `beam_ux_entries`; these are stable,
 * readable stand-ins so a story diff never churns and a failure names the region it came from.
 * `Region.recordId` addresses by id since ADR-0214 §2 — `recordLabel` carries the slug the editor
 * header used to show.
 */
export const entryIds = {
    hero: '0193b1e0-hero-0000-0000-000000000001',
    card: '0193b1e0-card-0000-0000-000000000002',
    roster: '0193b1e0-rost-0000-0000-000000000003',
    list: '0193b1e0-list-0000-0000-000000000004',
    theme: '0193b1e0-thme-0000-0000-000000000005',
} as const;

/** The live page's editable regions, top-to-bottom as they render on the canvas. */
export const regions: Region[] = [
    {
        id: 'hero',
        label: 'Hero › heading + intro',
        kind: 'richtext',
        recordId: entryIds.hero,
        recordLabel: 'page.programs.hero',
        note: 'blockdoc rich content · value+onChange (≈ FileEditSurface).',
    },
    {
        id: 'card',
        label: 'Program card › config + SEO',
        kind: 'form',
        recordId: entryIds.card,
        recordLabel: 'program-card',
        note: 'REAL @schemastud/seam SchemaForm off the loaded schema → EditShell on ship.',
    },
    {
        id: 'roster',
        label: 'Enrollment roster › table',
        kind: 'frame',
        recordId: entryIds.roster,
        recordLabel: 'frame:enrollment',
        note: 'Frame EditShell — opaque, self-loading/saving island. Host buffer/save unused.',
    },
    {
        id: 'list',
        label: 'Program list › bound to /programs/{slug}',
        kind: 'list',
        recordId: entryIds.list,
        recordLabel: 'query:programs',
        note: 'List component reads {slug} from the route and resolves its collection.',
    },
];

/** The `form` region's loaded entry-body (program.card.v2) — driven into the real SchemaForm. */
export const cardEntryBody: BeamUxEntryBodyData = {
    slug: 'program-card',
    id: entryIds.card,
    type: 'form',
    format: 'tsx',
    schema: {
        type: 'object',
        properties: {
            title: { type: 'string', title: 'Card title' },
            eyebrow: { type: 'string', title: 'Eyebrow' },
            format: { type: 'string', title: 'Format', enum: ['cohort', 'self-paced', 'live'] },
            seatsShown: {
                type: 'boolean',
                title: 'Show remaining seats',
                description: 'Renders a live seat count on the public card.',
            },
            ctaLabel: { type: 'string', title: 'CTA label' },
        },
        required: ['title', 'format'],
    },
    body: {
        title: 'Frontend Foundations',
        eyebrow: 'New cohort',
        format: 'cohort',
        seatsShown: true,
        ctaLabel: 'Enroll',
    },
    // TsxBodyCodec decodes an object body without a source key to an empty string.
    source: '',
    compileError: null,
};

/**
 * The THEME entry's loaded body — trimmed from a real `GET /beam-ux-entries/{id}/op/body` answer on
 * beam.test (2026-09-12), so the fixture's SHAPE is the server's, not an invention.
 *
 * Two facts about that shape are what {@link ThemeEditor} exists to handle and are therefore kept
 * exactly as measured, rather than tidied into symmetry:
 *
 *  - the `schema` describes `canvas` + `site` ONLY — `EntryBodyEnvelope::schemaFor()` omits `shell`
 *    on purpose;
 *  - the `body` carries `shell` anyway, because `ThemeResolver` resolves all three namespaces.
 *
 * A form driven by that schema therefore cannot be committed verbatim without dropping `shell`, which
 * is the round-trip `ThemeEditor.test.tsx` pins. Colors are a 3-token slice of each namespace, not the
 * full token set: the point of the fixture is the namespace structure, not the palette.
 */
export const themeEntryBody: BeamUxEntryBodyData = {
    slug: 'default',
    id: entryIds.theme,
    type: 'theme',
    format: 'css',
    schema: {
        type: 'object',
        title: 'Theme',
        properties: {
            canvas: {
                $id: 'theme.canvas',
                type: 'object',
                title: 'Canvas theme',
                additionalProperties: false,
                properties: {
                    accent: { type: 'string', format: 'color', title: 'Accent', default: '#4F7CFF' },
                    ink: { type: 'string', format: 'color', title: 'Ink', default: '#1A1A1A' },
                },
            },
            site: {
                $id: 'theme.site',
                type: 'object',
                title: 'Site theme',
                additionalProperties: false,
                properties: {
                    background: { type: 'string', format: 'color', title: 'Background', default: '#FFFFFF' },
                    accent: { type: 'string', format: 'color', title: 'Accent', default: '#4F7CFF' },
                    accentHover: { type: 'string', format: 'color', title: 'Accent hover', default: '#3A63E0' },
                },
            },
        },
    },
    body: {
        canvas: { accent: '#0f172a', ink: '#0f172a' },
        // NOT in the schema above — the namespace whose survival across a save is the whole test.
        shell: { surface: '#0f172a', accent: '#3b82f6' },
        site: { background: '#f8fafc', accent: '#0f172a', accentHover: '#1e293b' },
    },
    // A theme body is a token object, not a canvas document, so the read op decodes no source text
    // for it (`EntryBodyEnvelope::sourceFor()` answers null for every non-JsonDoc body).
    source: null,
    compileError: null,
};

/**
 * A schemaless entry body for the non-form kinds (richtext/frame/list load a plain body). Addressed
 * by id; `slug` is echoed back the way the real read does, and defaults to the id when the caller
 * has no slug for it.
 */
export function plainEntryBody(id: string, slug: string = id): BeamUxEntryBodyData {
    return {
        slug,
        id,
        type: 'richtext',
        format: 'tsx',
        schema: null,
        body: {},
        source: null,
        compileError: null,
    };
}

/** Structure-mode tree: layout → template → page → the region placements above. */
export const pageTree: TreeNode = {
    id: 'layout',
    label: 'AppLayout',
    kind: 'layout',
    children: [
        {
            id: 'template',
            label: 'ProgramTemplate',
            kind: 'template',
            children: [
                {
                    id: 'page',
                    label: 'Programs  ·  route /programs/{slug}',
                    kind: 'page',
                    children: [
                        { id: 'n-hero', label: 'Hero', kind: 'region', regionId: 'hero' },
                        { id: 'n-card', label: 'Program card', kind: 'region', regionId: 'card' },
                        { id: 'n-roster', label: 'Enrollment roster', kind: 'region', regionId: 'roster' },
                        { id: 'n-list', label: 'Program list', kind: 'region', regionId: 'list' },
                    ],
                },
            ],
        },
    ],
};

/** Component palette (Structure mode) — dropped into a placement, the page-composition layer. */
export const palette: PaletteItem[] = [
    { key: 'richtext', label: 'Rich content', kind: 'richtext', hint: 'blockdoc block editor' },
    { key: 'form', label: 'Config form', kind: 'form', hint: 'schema-driven SchemaForm' },
    { key: 'frame', label: 'Frame resource', kind: 'frame', hint: 'opaque EditShell island' },
    { key: 'list', label: 'List / collection', kind: 'list', hint: 'binds a {slug}/{id} from the route' },
];
