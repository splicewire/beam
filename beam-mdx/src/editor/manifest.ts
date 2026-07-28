// =============================================================================
// The beam-mdx **kit** as a blockdoc-shaped manifest — one node per authored MDX component.
//
// This is the engine-neutral "block DTO" layer (ADR-0112): each content component (Callout, Steps,
// …) is a node with a name, a child-containment rule, and an `attrsSchema` (JSON Schema over its
// props). ONE manifest feeds three consumers: the mdxeditor descriptor (via `manifestToJsxDescriptors`,
// Lexical), a future blockdoc node set (ProseMirror), and the seam/RJSF inspector form. We're not
// inventing a block format — we're reusing blockdoc's schema-grammar contract, with MDX as one
// serialization.
//
// Shape mirrors `@schemastud/blockdoc` `NodeManifestEntry` (kept local here while the docs bundle
// doesn't resolve the blockdoc package; promote to the real type + a PHP `#[NodeType]` export when
// these graduate to record-backed nodes). Node `name` is the PascalCase JSX tag so the mdxeditor
// adapter matches on it directly.
// =============================================================================

/** A JSON Schema object (kept loose — consumers read `properties` + hints). */
export type JsonSchema = Record<string, unknown>;

/** Blockdoc-shaped node manifest entry (the subset the MDX/kit layer needs). */
export interface KitNodeManifest {
    /** The JSX tag == node type name. */
    name: string;
    description?: string;
    /** 'inline' → mdxeditor `kind: 'text'`; anything else → `'flow'` (block). */
    group?: 'block' | 'inline';
    /** Blockdoc category (the PM group). Null = untargetable. */
    category: string | null;
    /** Null = unconstrained; [] = leaf (no children); list = admitted child categories. */
    admitsChildCategories: string[] | null;
    /** Node-level editability hints (blockdoc `x-editable`). */
    'x-editable'?: { reorderable?: boolean };
    /** JSON Schema over the node's props/attrs (the inspector form + mdxeditor prop list). */
    attrsSchema?: JsonSchema;
}

export interface KitManifest {
    profile: string;
    version: number;
    nodes: KitNodeManifest[];
}

// A string prop marked `x-expression` serializes as `foo={bar}` (a JSX expression) rather than
// `foo="bar"`; the inspector form omits it (v1) and it stays editable in source mode.
const expr = { type: 'string', 'x-expression': true } as const;

export const KIT_MANIFEST: KitManifest = {
    profile: 'beam-mdx-kit',
    version: 1,
    nodes: [
        {
            name: 'Callout',
            description: 'An admonition (note / tip / warning) with an optional title.',
            category: 'block',
            admitsChildCategories: null,
            attrsSchema: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['note', 'tip', 'warning', 'danger'], default: 'note', title: 'Kind' },
                    title: { type: 'string', title: 'Title' },
                },
            },
        },
        {
            name: 'Steps',
            description: 'A numbered procedure — a list of Step children.',
            category: 'block',
            admitsChildCategories: ['step'],
            'x-editable': { reorderable: true },
            attrsSchema: { type: 'object', properties: {} },
        },
        {
            name: 'Step',
            description: 'One step in a Steps procedure; the title is the step heading.',
            category: 'step',
            admitsChildCategories: null,
            attrsSchema: { type: 'object', properties: { title: { type: 'string', title: 'Title' } } },
        },
        {
            name: 'Figure',
            description: 'A captioned image or inline diagram.',
            category: 'block',
            admitsChildCategories: null,
            attrsSchema: {
                type: 'object',
                properties: {
                    src: { type: 'string', title: 'Image URL' },
                    alt: { type: 'string', title: 'Alt text' },
                    caption: { type: 'string', title: 'Caption' },
                },
            },
        },
        {
            name: 'Terminal',
            description: 'A terminal / code window with chrome and an optional title.',
            category: 'block',
            admitsChildCategories: null,
            attrsSchema: { type: 'object', properties: { title: { type: 'string', title: 'Title' } } },
        },
        {
            name: 'SectionLanding',
            description: 'A landing hero: eyebrow + heading + lede over a CardGrid.',
            category: 'block',
            admitsChildCategories: ['card-grid', 'block'],
            attrsSchema: {
                type: 'object',
                required: ['heading'],
                properties: {
                    eyebrow: { type: 'string', title: 'Eyebrow' },
                    heading: { type: 'string', title: 'Heading' },
                    lede: expr,
                },
            },
        },
        {
            name: 'CardGrid',
            description: 'A responsive grid of Cards.',
            category: 'card-grid',
            admitsChildCategories: ['card'],
            'x-editable': { reorderable: true },
            attrsSchema: { type: 'object', properties: {} },
        },
        {
            name: 'Card',
            description: 'A linked card: href + title + blurb + icon.',
            category: 'card',
            admitsChildCategories: [],
            attrsSchema: {
                type: 'object',
                properties: {
                    href: { type: 'string', title: 'Link' },
                    title: { type: 'string', title: 'Title' },
                    blurb: { type: 'string', title: 'Blurb' },
                    icon: expr,
                },
            },
        },
        {
            name: 'DoctorOutput',
            description: 'A structured doctor / diagnostic report (raw text or children).',
            category: 'block',
            admitsChildCategories: null,
            attrsSchema: { type: 'object', properties: { raw: { type: 'string', title: 'Raw output' } } },
        },
        {
            name: 'FileTree',
            description: 'A file-structure tree (a `tree` node array or children).',
            category: 'block',
            admitsChildCategories: null,
            // `tree` is a structured array — omitted from the v1 form (source-mode edit).
            attrsSchema: { type: 'object', properties: { tree: expr } },
        },
        {
            name: 'Content',
            description: 'Include an authored fragment by content name, inline and bare.',
            category: 'block',
            admitsChildCategories: [],
            attrsSchema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string', title: 'Content name' } },
            },
        },
        {
            name: 'Ref',
            description: 'An inline evidence citation: <Ref to="key">the claim</Ref>.',
            group: 'inline',
            category: 'inline',
            admitsChildCategories: null,
            attrsSchema: {
                type: 'object',
                required: ['to'],
                properties: { to: { type: 'string', title: 'Reference key' } },
            },
        },
        {
            name: 'Artifact',
            description: 'Inline a committed, build-highlighted artifact file (opaque in the editor).',
            category: 'block',
            admitsChildCategories: [],
            attrsSchema: {
                type: 'object',
                required: ['file'],
                properties: {
                    file: { type: 'string', title: 'Artifact file' },
                    title: { type: 'string', title: 'Title' },
                },
            },
        },
    ],
};
