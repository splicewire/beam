// Deterministic fixtures for the @splicewire/beam-ux catalog (Storybook + isolation-mount test).
// Adapted from the throwaway prototype fixture (beamux ticket 04). NOT shipped — never imported by
// src/index.ts. Models one live tenant page ("Programs") as a tree of REGIONS + the schema/body each
// region loads.
import type { BeamUxEntryBodyData } from '@splicewire/_resources/types/beam-ux';
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
    compileError: null,
};

/**
 * A schemaless entry body for the non-form kinds (richtext/frame/list load a plain body). Addressed
 * by id; `slug` is echoed back the way the real read does, and defaults to the id when the caller
 * has no slug for it.
 */
export function plainEntryBody(id: string, slug: string = id): BeamUxEntryBodyData {
    return { slug, id, type: 'richtext', schema: null, body: {}, compileError: null };
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
