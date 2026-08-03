// Deterministic fixtures for the @splicewire/beam-ux catalog (Storybook + isolation-mount test).
// Adapted from the throwaway prototype fixture (beamux ticket 04). NOT shipped — never imported by
// src/index.ts. Models one live tenant page ("Programs") as a tree of REGIONS + the schema/body each
// region loads.
import type { BeamUxEntryBodyData } from '@splicewire/_resources/types/beam-ux';
import type { PaletteItem, Region, TreeNode } from './types';

/** The live page's editable regions, top-to-bottom as they render on the canvas. */
export const regions: Region[] = [
    {
        id: 'hero',
        label: 'Hero › heading + intro',
        kind: 'richtext',
        record: 'page.programs.hero',
        note: 'blockdoc rich content · value+onChange (≈ FileEditSurface).',
    },
    {
        id: 'card',
        label: 'Program card › config + SEO',
        kind: 'form',
        record: 'program-card',
        note: 'REAL @schemastud/seam SchemaForm off the loaded schema → EditShell on ship.',
    },
    {
        id: 'roster',
        label: 'Enrollment roster › table',
        kind: 'frame',
        record: 'frame:enrollment',
        note: 'Frame EditShell — opaque, self-loading/saving island. Host buffer/save unused.',
    },
    {
        id: 'list',
        label: 'Program list › bound to /programs/{slug}',
        kind: 'list',
        record: 'query:programs',
        note: 'List component reads {slug} from the route and resolves its collection.',
    },
];

/** The `form` region's loaded entry-body (program.card.v2) — driven into the real SchemaForm. */
export const cardEntryBody: BeamUxEntryBodyData = {
    slug: 'program-card',
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
};

/** A schemaless entry body for the non-form kinds (richtext/frame/list load a plain body). */
export function plainEntryBody(slug: string): BeamUxEntryBodyData {
    return { slug, type: 'richtext', schema: null, body: {} };
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
