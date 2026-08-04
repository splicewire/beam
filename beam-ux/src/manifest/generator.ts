/**
 * The **block-manifest → Puck-config generator** (beam Model-B ticket 09) — the generic,
 * host-agnostic codegen that turns a declarative *block manifest* into the Puck `Config` source
 * (`config.tsx`), so the editor's field/wiring layer is DERIVED from one source of truth instead of
 * hand-maintained alongside the render components.
 *
 * ── The seam ───────────────────────────────────────────────────────────────
 *  - The host authors ONE {@link BlockManifest}: per block, its props (name + a {@link FieldSpec} that
 *    is the Puck field) + a `render` ref naming the hand-written component in `blocks.tsx`.
 *  - Every block ALSO gets the *universal attribute editors* (className / arbitrary `data-*` / inline
 *    `style`) via {@link attributeFields} — the editors ticket 09 adds to the panel for the lens's
 *    attr-preserving props. They're modeled as ordinary manifest fields on a shared list so the
 *    generator treats them uniformly and the panel shows them on every block.
 *  - {@link generatePuckConfig} emits the `config.tsx` SOURCE STRING (a `@generated` file). The
 *    RENDER layer (`blocks.tsx`) stays hand-written and is IMPORTED by the generated config, so the
 *    two can't drift and the generator never has to understand a component's internals.
 *
 * The generator is deliberately a *string emitter*, not a runtime `Config` builder: the whole point is
 * a checked-in `config.tsx` whose dirty-after-regen state is the drift signal (an `npm run` guard).
 * Runtime construction would hide drift. It mirrors the `puckToTsx` codegen's philosophy (a faithful,
 * inspectable text output), one level up.
 */

// ---------------------------------------------------------------------------
// Manifest shape (the single source of truth a host authors)
// ---------------------------------------------------------------------------

/**
 * One Puck field, declared for a block prop. The generator emits this VERBATIM into the config's
 * `fields` map, so any Puck field kind is expressible: the common ones are modeled structurally
 * (`text` / `number` / `textarea` / `select` / `radio` / `slot`), and `custom` / anything exotic
 * rides through the {@link RawField} escape hatch as a literal source expression.
 */
export type FieldSpec =
    | { type: 'text'; label?: string }
    | { type: 'textarea'; label?: string }
    | { type: 'number'; label?: string; min?: number; max?: number }
    | { type: 'select'; label?: string; options: Array<{ label: string; value: string | number | boolean }> }
    | { type: 'radio'; label?: string; options: Array<{ label: string; value: string | number | boolean }> }
    | { type: 'slot'; allow?: string[] }
    | RichTextField
    | RawField;

/**
 * The **inline rich-text leaf field** (beam Model-B ticket 10) — a block's text run edited through a
 * rich-text projection (bold / italic / link / inline-code) that round-trips losslessly into `.tsx`.
 *
 * The rich-text engine is NOT hardcoded: `engine` NAMES it (`'mdx'` default; `'prosemirror'` bindable
 * later via the SAME leaf seam + registry). The generator emits a Puck `custom` field that delegates to
 * a host-provided leaf-field FACTORY — `richtextLeafField(engine)` — so the heavy, client-only editor
 * widget stays host-side (code-split), while the engine SELECTION lives in this manifest. The factory
 * is imported from {@link RichTextField.factoryModule} (defaults to `@/puck/richtext-field`); the
 * factory internally resolves the named engine from the leaf registry and wires it to the seam's
 * `bindTextNode` (TextNode ⟷ editor ⟷ `patchText`).
 */
export interface RichTextField {
    type: 'richtext';
    /** The leaf engine's registry key — the binding this field's editor uses. Defaults to `'mdx'`. */
    engine?: string;
    label?: string;
    /** The module the `richtextLeafField` factory is imported from. Defaults to `@/puck/richtext-field`. */
    factoryModule?: string;
}

/**
 * The escape hatch: a field the generator can't (or shouldn't) model structurally — a Puck `custom`
 * field with a JSX render fn, an `array`/`object` field, etc. `source` is emitted VERBATIM as the
 * field's config value, and `imports` are hoisted to the generated file's import block. This is how
 * the Prose block's mdx WYSIWYG custom field survives codegen without the generator knowing mdx.
 */
export interface RawField {
    type: 'raw';
    /** The literal field-config source, e.g. `"{ type: 'custom', render: (...) => <X/> }"`. */
    source: string;
    /** Import lines this raw source needs, hoisted + de-duped into the generated file's header. */
    imports?: string[];
}

/** One declared prop of a block: its name, TS type, the Puck field UI, and an optional default. */
export interface PropSpec {
    name: string;
    /** The TS type emitted for this prop in the generated `type XProps = {...}`. Defaults to `string`. */
    tsType?: string;
    field: FieldSpec;
    /** The default value, emitted into `defaultProps`. A raw source string when `rawDefault` is set. */
    default?: unknown;
    /** When true, `default` is emitted verbatim (an expression, e.g. `[]`), not JSON-encoded. */
    rawDefault?: boolean;
}

/** One block in the manifest: its name, the props/fields, and the render ref into `blocks.tsx`. */
export interface BlockSpec {
    /** The Puck block type name (PascalCase), e.g. `Heading`. */
    name: string;
    /** The exported component symbol in the blocks module (usually === `name`). */
    render: string;
    props: PropSpec[];
    /**
     * A slot prop is rendered by CALLING it in the render fn (`{content?.()}`) and passing the result
     * as the component's `children`. Naming the slot prop here tells the generator to emit that call
     * shape instead of a plain prop pass-through. (One default slot; matches the vocabulary's Section.)
     */
    slotProp?: string;
}

/** The whole manifest a host authors — the block vocabulary + where the render layer lives. */
export interface BlockManifest {
    /** The module the generated config imports its hand-written render components FROM. */
    blocksModule: string;
    blocks: BlockSpec[];
    /**
     * The universal attribute editors every block gets (className / data-* / style). Defaults to
     * {@link attributeFields}; a host can extend or override. These are ordinary {@link PropSpec}s
     * appended to every block's fields, so the panel edits them through the same lens attr ops.
     */
    attributes?: PropSpec[];
    /** Extra import lines to hoist into the generated file (beyond the blocks + raw-field imports). */
    imports?: string[];
    /** An optional trailing source block appended verbatim after the exported config (e.g. a seed fn). */
    trailer?: string;
}

// ---------------------------------------------------------------------------
// The universal attribute editors (className / data-* / style)
// ---------------------------------------------------------------------------

/**
 * The attribute editors EVERY block gets, modeled as manifest props so the generator + panel treat
 * them uniformly. They map straight onto the lens's attr-preserving props (ticket 02) + the new
 * add/remove ops (this ticket):
 *  - `className`  → a plain string attr (`className="…"`).
 *  - `data-attrs` → a Puck `object` field the panel expands into arbitrary `data-*` string attrs; the
 *    render fn spreads it, and on serialization each key becomes its own `data-*` JSX attribute the
 *    lens preserves individually.
 *  - `style`      → an `object` field the panel edits and the render fn spreads as an inline `style`
 *    object; serializes to `style={{…}}`, the expression prop the lens round-trips verbatim.
 * They carry `tsType`s so the generated `XProps` stay typed, and no `default` (absent ⇒ the lens's
 * `removeProp` clears them back to absent, not to `""`/`{}`).
 */
export const attributeFields: PropSpec[] = [
    {
        name: 'className',
        tsType: 'string',
        field: { type: 'text', label: 'CSS classes (className)' },
    },
    {
        name: 'dataAttrs',
        tsType: 'Record<string, string>',
        field: {
            type: 'raw',
            source: "{ type: 'object', label: 'Custom data-* attributes', objectFields: {} }",
        },
    },
    {
        name: 'style',
        tsType: 'React.CSSProperties',
        field: {
            type: 'raw',
            source: "{ type: 'object', label: 'Inline style', objectFields: {} }",
        },
    },
];

/** The default blocks module a manifest imports from when it doesn't override. */
const DEFAULT_BLOCKS_MODULE = '@/puck/blocks';

// ---------------------------------------------------------------------------
// The generator
// ---------------------------------------------------------------------------

/** The provenance header every generated `config.tsx` opens with — the drift/write-safety marker. */
export const CONFIG_CODEGEN_MARKER = '@generated beam-ux manifest→puck-config';

/**
 * Emit the Puck `config.tsx` SOURCE STRING from a block manifest. The output:
 *  - opens with the {@link CONFIG_CODEGEN_MARKER} header (DO-NOT-EDIT);
 *  - imports the hand-written render components from `blocksModule` + any raw-field/manifest imports;
 *  - declares a typed `type XProps` per block (props + the universal attribute editors);
 *  - exports `puckConfig: Config<…>` whose `fields` come from the manifest and whose `render` fns
 *    delegate to the imported components (spreading className / data-attrs / style, calling any slot).
 *
 * Deterministic: same manifest ⇒ byte-identical output, so a dirty tree after regen is pure drift.
 */
export function generatePuckConfig(manifest: BlockManifest): string {
    const blocksModule = manifest.blocksModule || DEFAULT_BLOCKS_MODULE;
    const attributes = manifest.attributes ?? attributeFields;
    const blocks = manifest.blocks;

    // Every block gets its own declared props + the universal attribute editors, in that order.
    const propsFor = (b: BlockSpec): PropSpec[] => [...b.props, ...attributes];

    // ── Imports ──────────────────────────────────────────────────────────────
    const renderSymbols = [...new Set(blocks.map((b) => b.render))].sort();
    const rawImports = new Set<string>();
    for (const b of blocks)
        for (const p of propsFor(b)) {
            if (p.field.type === 'raw')
                for (const line of p.field.imports ?? []) rawImports.add(line);
            // A richtext leaf field pulls its host-provided factory in from the factory module.
            if (p.field.type === 'richtext')
                rawImports.add(`import { richtextLeafField } from '${richtextModule(p.field)}';`);
        }
    for (const line of manifest.imports ?? []) rawImports.add(line);

    // Merge any `import type {…} from '@measured/puck'` a raw field / manifest contributed into the
    // single base puck-types line (so a manifest that also imports `Data` doesn't duplicate the module),
    // and drop the ordered remainder after. Keeps the generated block eslint-`import/order`-clean.
    const puckTypeNames = new Set(['Config', 'Slot']);
    const otherRawImports: string[] = [];
    for (const line of rawImports) {
        const m = line.match(/^import type \{([^}]*)\} from '@measured\/puck';\s*$/);
        if (m) {
            for (const n of m[1].split(',').map((s) => s.trim()).filter(Boolean)) puckTypeNames.add(n);
        } else {
            otherRawImports.push(line);
        }
    }

    const importLines = [
        `import type { ${[...puckTypeNames].sort().join(', ')} } from '@measured/puck';`,
        `import type React from 'react';`,
        `import { ${renderSymbols.join(', ')} } from '${blocksModule}';`,
        ...otherRawImports.sort(),
    ];

    // ── Per-block prop types ──────────────────────────────────────────────────
    // Manifest props are REQUIRED (Puck's defaultProps + WithId guarantee them at the render fn); the
    // universal attribute editors are OPTIONAL (absent ⇒ the lens's removeProp cleared them). A slot
    // prop is optional too (an empty slot is valid).
    const attrNames = new Set(attributes.map((a) => a.name));
    const typeDecls = blocks
        .map((b) => {
            const fields = propsFor(b)
                .map((p) => {
                    const optional = attrNames.has(p.name) || p.name === b.slotProp ? '?' : '';
                    return `    ${p.name}${optional}: ${tsTypeFor(p, b)};`;
                })
                .join('\n');
            return `type ${b.name}Props = {\n${fields}\n};`;
        })
        .join('\n\n');

    const componentsUnion = `type PuckComponents = {\n${blocks
        .map((b) => `    ${b.name}: ${b.name}Props;`)
        .join('\n')}\n};`;

    // ── The config body ───────────────────────────────────────────────────────
    const componentEntries = blocks.map((b) => renderComponentEntry(b, propsFor(b))).join('\n');

    const header =
        `// ${CONFIG_CODEGEN_MARKER} — DO NOT EDIT.\n` +
        `// Generated from the block manifest (\`manifest.ts\`) by \`npm run generate:puck-config\`.\n` +
        `// The RENDER layer (\`blocks.tsx\`) is hand-written; edit props/fields in the manifest, then regen.\n`;

    const out =
        header +
        '\n' +
        importLines.join('\n') +
        '\n\n' +
        typeDecls +
        '\n\n' +
        componentsUnion +
        '\n\n' +
        `export const puckConfig: Config<PuckComponents> = {\n` +
        `    components: {\n` +
        componentEntries +
        '\n' +
        `    },\n` +
        `};\n` +
        (manifest.trailer ? '\n' + manifest.trailer.replace(/\n*$/, '\n') : '');

    return out;
}

// ---------------------------------------------------------------------------
// Emitters
// ---------------------------------------------------------------------------

function tsTypeFor(p: PropSpec, _b: BlockSpec): string {
    if (p.tsType) return p.tsType;
    if (p.field.type === 'slot') return 'Slot';
    if (p.field.type === 'number') return 'number';
    return 'string';
}

/** Emit one `Block: { fields, defaultProps, render }` entry. */
function renderComponentEntry(b: BlockSpec, props: PropSpec[]): string {
    const fieldEntries = props
        .map((p) => `                ${p.name}: ${fieldSource(p.field)},`)
        .join('\n');

    const defaults = props
        .filter((p) => p.default !== undefined)
        .map((p) => `                ${p.name}: ${p.rawDefault ? String(p.default) : JSON.stringify(p.default)},`)
        .join('\n');
    const defaultProps = defaults === '' ? '' : `            defaultProps: {\n${defaults}\n            },\n`;

    return (
        `        ${b.name}: {\n` +
        `            fields: {\n${fieldEntries}\n            },\n` +
        defaultProps +
        `            render: ${renderFn(b)},\n` +
        `        },`
    );
}

/**
 * The render fn source — destructures the block's props + the universal attribute editors, hands the
 * hand-written component its scalar props plus ONE `attrs` bag (`{ className, ...dataAttrs, style }`)
 * it spreads on its root, and — for a slot block — CALLS the slot prop and passes the result through
 * the component's normal `children`.
 *
 * The `attrs` bag is the contract between the generated wiring and the hand-written render layer: the
 * component owns HOW it applies className / data-attrs / style (spread onto its outermost element),
 * the generator owns THAT they reach it. On serialization (codegen `.tsx`) className is a string attr,
 * each `data-*` its own attr, and `style` a `style={{…}}` expression — exactly the props the lens
 * preserves individually (ticket 02).
 */
function renderFn(b: BlockSpec): string {
    const scalarProps = b.props.filter((p) => p.name !== b.slotProp).map((p) => p.name);
    const slot = b.slotProp;

    // The param type is INFERRED by Puck (`WithId<WithPuckProps<…>>`) — annotating it fights Puck's
    // `Slot`→`SlotComponent` render-time widening and the defaultProps required/optional split, so the
    // destructure is left un-annotated (matching a hand-written Puck config's slot render fn).
    const destructured = [
        ...scalarProps,
        'className',
        'dataAttrs',
        'style',
        ...(slot ? [`${slot}: SlotContent`] : []),
    ];

    // Puck's `object` style field is untyped (an open record); cast at this codegen boundary to the
    // component's `React.CSSProperties`. className/data-* are plain strings and need no cast.
    const attrsArg = `attrs={{ className, ...(dataAttrs ?? {}), style: style as React.CSSProperties }}`;
    const scalarArgs = scalarProps.map((p) => `${p}={${p}}`).join(' ');
    const attrs = [scalarArgs, attrsArg].filter(Boolean).join(' ');

    if (slot) {
        return (
            `({ ${destructured.join(', ')} }) => (\n` +
            `                <${b.render} ${attrs}>{SlotContent?.()}</${b.render}>\n` +
            `            )`
        );
    }
    return `({ ${destructured.join(', ')} }) => <${b.render} ${attrs} />`;
}

/** Emit a field's config source from its {@link FieldSpec}. */
function fieldSource(f: FieldSpec): string {
    switch (f.type) {
        case 'raw':
            return f.source;
        case 'text':
            return `{ type: 'text'${label(f.label)} }`;
        case 'textarea':
            return `{ type: 'textarea'${label(f.label)} }`;
        case 'number':
            return `{ type: 'number'${label(f.label)}${f.min !== undefined ? `, min: ${f.min}` : ''}${
                f.max !== undefined ? `, max: ${f.max}` : ''
            } }`;
        case 'select':
            return `{ type: 'select'${label(f.label)}, options: ${optionsSource(f.options)} }`;
        case 'radio':
            return `{ type: 'radio'${label(f.label)}, options: ${optionsSource(f.options)} }`;
        case 'slot':
            return `{ type: 'slot'${f.allow ? `, allow: ${JSON.stringify(f.allow)}` : ''} }`;
        case 'richtext':
            // Delegate to the host's leaf-field factory, passing the manifest-named engine. The factory
            // returns a Puck `custom` field whose editor is bound to that engine via the leaf seam.
            return `richtextLeafField({ engine: ${JSON.stringify(f.engine ?? DEFAULT_LEAF_ENGINE)}${
                f.label ? `, label: ${JSON.stringify(f.label)}` : ''
            } })`;
    }
}

/** The default leaf engine when a `richtext` field omits `engine` — the shipped `mdx` binding. */
const DEFAULT_LEAF_ENGINE = 'mdx';

/** The module a `richtext` field imports its `richtextLeafField` factory from. */
function richtextModule(f: RichTextField): string {
    return f.factoryModule || '@/puck/richtext-field';
}

function label(l: string | undefined): string {
    return l ? `, label: ${JSON.stringify(l)}` : '';
}

function optionsSource(opts: Array<{ label: string; value: string | number | boolean }>): string {
    const items = opts
        .map((o) => `{ label: ${JSON.stringify(o.label)}, value: ${JSON.stringify(o.value)} }`)
        .join(', ');
    return `[${items}]`;
}
