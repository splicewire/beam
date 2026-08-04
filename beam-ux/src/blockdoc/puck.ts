/**
 * The **PuckData ⟷ BlockDoc bridge** (beam Model-B ticket 08) — the Node half of the reverse
 * file→DB sync leg.
 *
 * A `page` beam-ux entry's edit-truth is a Puck `Data` document (`{root, content, zones}`); on
 * Publish PHP's `PuckPageCodegen` compiles it to a composed-JSX `.tsx` (generated OUTPUT). This
 * bridge is the INVERSE direction the codegen never had: it parses that `.tsx` back into Puck Data
 * so a hand/agent edit to the file can flow into the DB particle body (`splicewire:beam:ux-sync-from-disk`).
 *
 * Two functions, mirror images:
 *  - {@link puckToTsx} — a faithful JS port of PHP `PuckPageCodegen::generate`. Same marker header,
 *    same import line, same JSX composition + attr/template-literal encoding, same inline-slot +
 *    zones nesting, same `id`-stripping. Kept byte-for-byte compatible so the two codegens can never
 *    drift (the round-trip tests are the guard).
 *  - {@link blockDocToPuck} — parses a page `.tsx` (via the shipped `@splicewire/beam-ux/blockdoc`
 *    lens) and reconstructs the Puck Data. Because codegen STRIPS Puck's structural `id`, this
 *    SYNTHESIZES a deterministic `id` per node from its tree path (`{type-lower}-{path}`) so the
 *    reconstructed Data is a valid Puck document.
 *
 * ── Puck ↔ BlockDoc mapping ──────────────────────────────────────────────────
 *   Puck node `{type, props:{id, ...}}`         ⟷  a JSX `<Type ... />` BlockNode
 *   a scalar prop (string/number/bool)          ⟷  a JSX attribute (string attr or `{expr}`)
 *   an object/array (non-node-list) prop        ⟷  a `{json}` expression attribute
 *   a node-list prop (Puck 0.20 inline slot)    ⟷  JSX children (a single default slot)
 *   the structural `id` prop                    →  DROPPED on codegen; SYNTHESIZED on parse
 *
 * ── Lossiness (documented; inherited by tickets 09/11/15/16) ─────────────────
 *  - `id` does not survive a `puckData → tsx → puckData` trip (codegen drops it, parse re-mints a
 *    deterministic one). Round-trip equality is asserted MODULO `id`. The reverse trip
 *    (`tsx → puckData → tsx`) is byte-identical because codegen output carries no ids to begin with.
 *  - `zones`-keyed slots (the older form) codegen INTO nested JSX, so a parse recovers them as
 *    INLINE slot props — the two are equivalent to Puck's normalize, but a Data authored with
 *    `zones` will round-trip as inline. v1 emits inline slots only (matches the seed shape).
 *  - A `dynamic` subtree (a `.map`, a conditional, a spread — flagged by the lens) is opaque to this
 *    static bridge: it is ticket 11 territory and is NOT reconstructed into Puck nodes here.
 */

import { parse } from './lens.js';
import type { BlockDoc, BlockNode, BlockProp } from './types.js';

/** A Puck node: a typed block with a props bag (holds the structural `id` + optional inline slots). */
export interface PuckNode {
    type: string;
    props: PuckProps;
}

export interface PuckProps {
    id: string;
    [key: string]: PuckPropValue;
}

export type PuckPropValue =
    | string
    | number
    | boolean
    | null
    | PuckNode[]
    | { [key: string]: unknown }
    | unknown[];

/** A Puck `Data` document — the page-entry body format. */
export interface PuckData {
    root: Record<string, unknown>;
    content: PuckNode[];
    zones: Record<string, PuckNode[]>;
}

/** The provenance marker every codegen `.tsx` opens with — the write-safety key PHP gates on. */
export const CODEGEN_MARKER = '@generated beam-ux puck-codegen';

/** The default block-vocabulary import module (matches `beam.ux.puck.blocks_module`). */
const DEFAULT_BLOCKS_MODULE = '@/puck/blocks';

// ===========================================================================
// puckToTsx — the JS port of PHP PuckPageCodegen::generate
// ===========================================================================

/**
 * Compile a Puck `Data` body to a composed-JSX `.tsx` — a faithful JS mirror of PHP
 * `PuckPageCodegen::generate` (same output, byte-for-byte). Kept in lockstep with the PHP so the
 * outbound (DB→disk) and this bridge's inbound parse never disagree on the file shape.
 */
export function puckToTsx(
    data: Partial<PuckData>,
    slug: string,
    blocksModule: string = DEFAULT_BLOCKS_MODULE,
): string {
    const content = Array.isArray(data.content) ? data.content : [];
    const zones = data.zones && typeof data.zones === 'object' ? data.zones : {};

    const blocks = collectBlockTypes(content, zones);
    const importLine =
        blocks.length === 0 ? '' : `import { ${blocks.join(', ')} } from '${blocksModule}';\n\n`;

    const body = renderNodes(content, zones, 3);
    const component = componentName(slug);

    const header =
        `// ${CODEGEN_MARKER} — DO NOT EDIT.\n` +
        `// Edit via the Puck page editor; this file is regenerated on Publish.\n`;

    return (
        header +
        importLine +
        `export default function ${component}() {\n` +
        `  return (\n` +
        `    <>\n` +
        (body === '' ? '' : body + '\n') +
        `    </>\n` +
        `  );\n` +
        `}\n`
    );
}

/** The unique, sorted set of block type names referenced anywhere in the tree (for the import line). */
function collectBlockTypes(content: PuckNode[], zones: Record<string, PuckNode[]>): string[] {
    const types = new Set<string>();

    const walk = (nodes: PuckNode[]): void => {
        for (const node of nodes) {
            if (!node || typeof node !== 'object') continue;
            if (typeof node.type === 'string' && node.type !== '') types.add(node.type);
            for (const children of childSlotsFor(node, zones)) walk(children);
        }
    };

    walk(content);
    return [...types].sort();
}

function propsOf(node: PuckNode): PuckProps {
    return node.props && typeof node.props === 'object' ? node.props : ({ id: '' } as PuckProps);
}

/** Render a list of Puck nodes as indented JSX. */
function renderNodes(nodes: PuckNode[], zones: Record<string, PuckNode[]>, indent: number): string {
    return nodes
        .map((node) => renderNode(node, zones, indent))
        .filter((l) => l !== '')
        .join('\n');
}

/** Render one node — self-closing when it has no slot children, open/nested when it does. */
function renderNode(node: PuckNode, zones: Record<string, PuckNode[]>, indent: number): string {
    const type = node.type;
    if (typeof type !== 'string' || type === '') return '';

    const pad = '  '.repeat(indent);
    const props = propsOf(node);

    const attrs = renderAttrs(props);
    const attrStr = attrs === '' ? '' : ' ' + attrs;

    const childNodes: PuckNode[] = [];
    for (const children of childSlotsFor(node, zones)) {
        for (const child of children) childNodes.push(child);
    }

    if (childNodes.length === 0) {
        return `${pad}<${type}${attrStr} />`;
    }

    const inner = renderNodes(childNodes, zones, indent + 1);
    return `${pad}<${type}${attrStr}>\n${inner}\n${pad}</${type}>`;
}

/**
 * The slot children of a node — a list of node-lists (one per slot). Gathers BOTH Puck 0.20 inline
 * slots (a prop whose value is a list of nodes) AND the older `zones` form (`{id}-{slot}`).
 */
function childSlotsFor(node: PuckNode, zones: Record<string, PuckNode[]>): PuckNode[][] {
    const slots: PuckNode[][] = [];
    const props = propsOf(node);

    for (const [key, value] of Object.entries(props)) {
        if (key !== 'id' && isNodeList(value)) slots.push(value as PuckNode[]);
    }

    const id = typeof props.id === 'string' ? props.id : null;
    if (id !== null) {
        for (const [key, children] of Object.entries(zones)) {
            if (key.startsWith(id + '-') && isNodeList(children)) slots.push(children);
        }
    }

    return slots;
}

/** Is this value a slot payload — a (possibly empty) list of Puck node arrays ({type, props})? */
function isNodeList(value: unknown): value is PuckNode[] {
    if (!Array.isArray(value)) return false;
    for (const item of value) {
        if (!item || typeof item !== 'object' || !('type' in item)) return false;
    }
    return true;
}

/** Serialize a node's props into JSX attributes (dropping Puck's structural `id`; slots are children). */
function renderAttrs(props: PuckProps): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(props)) {
        if (key === 'id') continue;
        if (value === null || value === undefined) continue;
        if (isNodeList(value)) continue;
        if (typeof value === 'object') {
            parts.push(`${key}={${JSON.stringify(value)}}`);
            continue;
        }
        parts.push(`${key}=${jsxAttrValue(value)}`);
    }
    return parts.join(' ');
}

/** A single JSX attribute value — quoted for simple strings, a template literal otherwise. */
function jsxAttrValue(value: string | number | boolean): string {
    if (typeof value === 'boolean') return `{${value ? 'true' : 'false'}}`;
    if (typeof value === 'number') return `{${value}}`;

    const str = String(value);
    if (!str.includes('\n') && !str.includes('"')) return `"${str}"`;

    const escaped = str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    return '{`' + escaped + '`}';
}

/** `library-lyrics` → `LibraryLyricsPage`. */
function componentName(slug: string): string {
    const pascal = slug
        .replace(/[-_.]+/g, ' ')
        .split(' ')
        .filter((w) => w !== '')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');
    return (pascal === '' ? 'Page' : pascal) + 'Page';
}

// ===========================================================================
// blockDocToPuck — parse a page .tsx back into Puck Data
// ===========================================================================

/**
 * Parse a page `.tsx` (or an already-parsed BlockDoc) into a Puck `Data` document. The single
 * top-level fragment/component the codegen emits (its `<>…</>` return) becomes the `content` list;
 * nested JSX children become inline slot props; each node gets a deterministic synthesized `id`.
 *
 * Returns `null` when the file has no page-shaped root (e.g. an empty file) so a caller can fall back
 * to raw-source handling rather than fabricate an empty page.
 */
export function blockDocToPuck(input: string | BlockDoc): PuckData | null {
    const doc: BlockDoc = typeof input === 'string' ? parse(input) : input;

    // The codegen wraps content in a single `<>…</>` fragment (a root BlockNode with name === null).
    // Prefer that; otherwise take all top-level element roots as the content list.
    const fragment = doc.roots.find((r) => r.name === null);
    const topLevel: BlockNode[] = fragment
        ? fragment.children.filter((c): c is BlockNode => c.type === 'block')
        : doc.roots.filter((r) => r.name !== null);

    if (topLevel.length === 0 && !fragment) return null;

    const content = topLevel.map((block, i) => blockToPuckNode(block, `${i}`));

    return { root: {}, content, zones: {} };
}

/** One BlockNode → one Puck node. `path` seeds the deterministic synthesized `id`. */
function blockToPuckNode(block: BlockNode, path: string): PuckNode {
    const type = block.name ?? 'Fragment';
    const props: PuckProps = { id: synthesizeId(type, path) };

    for (const prop of block.props) {
        props[prop.name] = puckPropValue(prop);
    }

    // Element children (a node-list) become the block's inline default slot. The codegen composes a
    // single default slot; recover it as one slot prop named `content` (the vocabulary's Section slot).
    const childBlocks = block.children.filter((c): c is BlockNode => c.type === 'block');
    if (childBlocks.length > 0) {
        props.content = childBlocks.map((child, i) => blockToPuckNode(child, `${path}-${i}`));
    }

    return { type, props };
}

/** Decode a BlockProp back to a Puck prop value, inverting the codegen's attr encoding. */
function puckPropValue(prop: BlockProp): PuckPropValue {
    switch (prop.kind) {
        case 'string':
            return prop.value as string;
        case 'number':
            return prop.value as number;
        case 'boolean':
        case 'boolean-shorthand':
            return prop.value as boolean;
        case 'expression':
            // The codegen emits object/array props as a `{json}` expression, and multiline/quote-bearing
            // strings as a `{`template`}`. Recover the original value from the expression source.
            return decodeExpression(String(prop.value));
    }
}

/**
 * Recover a Puck prop value from a JSX `{expression}` the codegen emitted:
 *  - a `{json}` object/array literal → parsed JSON;
 *  - a `` {`template`} `` (a multiline / double-quote-bearing string) → the unescaped string;
 *  - anything else → the raw source text (opaque; carried verbatim).
 */
function decodeExpression(src: string): PuckPropValue {
    const trimmed = src.trim();

    // A template literal the codegen used for a multiline / double-quote string.
    if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
        const inner = trimmed.slice(1, -1);
        return inner.replace(/\\\$\{/g, '${').replace(/\\`/g, '`').replace(/\\\\/g, '\\');
    }

    // An object/array JSON expression (`{...}` or `[...]`).
    if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
        try {
            return JSON.parse(trimmed);
        } catch {
            /* not JSON — fall through to opaque */
        }
    }

    return trimmed;
}

/** A deterministic synthesized `id` for a node the codegen stripped — stable across reparse. */
function synthesizeId(type: string, path: string): string {
    return `${type.toLowerCase()}-${path}`;
}

/**
 * Strip every structural `id` from a Puck Data tree (recursively, into inline slot props). Used by
 * round-trip tests to assert equality MODULO the synthesized ids codegen does not preserve, and by a
 * caller that wants to compare two Datas by structure/content alone.
 */
export function stripIds(data: PuckData): PuckData {
    const strip = (node: PuckNode): PuckNode => {
        const props: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(node.props)) {
            if (key === 'id') continue;
            props[key] = isNodeList(value) ? (value as PuckNode[]).map(strip) : value;
        }
        return { type: node.type, props: props as PuckProps };
    };

    return {
        root: data.root,
        content: data.content.map(strip),
        zones: Object.fromEntries(
            Object.entries(data.zones).map(([k, v]) => [k, v.map(strip)]),
        ),
    };
}
