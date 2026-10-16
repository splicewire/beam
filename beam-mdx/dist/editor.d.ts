import * as react from 'react';
import { JsxComponentDescriptor, ViewMode } from '@mdxeditor/editor';

/**
 * The rich MDX document editor (mdxeditor.dev). Edits an entire `.mdx` string — frontmatter + body —
 * and emits the same string via `onChange`, so it's a drop-in for the host edit buffer. A CodeMirror
 * **source** mode + a rich WYSIWYG mode live in one component (diff/source toggle); the native
 * `frontmatterPlugin` owns the `---` block. Client-only (Lexical) — the app lazy-loads it on edit.
 *
 * v1 ships source-first: the standard markdown plugins are on, custom JSX components render as opaque
 * blocks (schema-driven per-component descriptors land in a later phase via `jsxPlugin`).
 */
interface MdxDocumentEditorProps {
    /** The full raw MDX buffer (frontmatter + body). */
    value: string;
    /** Called with the next full MDX string on every edit. */
    onChange: (next: string) => void;
    /** The custom-JSX descriptors mdxeditor needs to parse the guides' components into rich mode. */
    jsxDescriptors?: JsxComponentDescriptor[];
    /**
     * Which view the editor opens in — `'rich-text'` (WYSIWYG), `'source'` (raw MDX), or `'diff'`.
     * Defaults to `'source'` (the reliable-for-every-guide v1 default); an in-place editing host that
     * wants true WYSIWYG passes `'rich-text'`. The diff/source toolbar toggle switches at runtime regardless.
     */
    defaultViewMode?: ViewMode;
    className?: string;
}
declare function MdxDocumentEditor({ value, onChange, jsxDescriptors, defaultViewMode, className, }: MdxDocumentEditorProps): react.JSX.Element;

/** A JSON Schema object (kept loose — consumers read `properties` + hints). */
type JsonSchema = Record<string, unknown>;
/** Blockdoc-shaped node manifest entry (the subset the MDX/kit layer needs). */
interface KitNodeManifest {
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
    'x-editable'?: {
        reorderable?: boolean;
    };
    /** JSON Schema over the node's props/attrs (the inspector form + mdxeditor prop list). */
    attrsSchema?: JsonSchema;
}
interface KitManifest {
    profile: string;
    version: number;
    nodes: KitNodeManifest[];
}
declare const KIT_MANIFEST: KitManifest;

/**
 * The single generic adapter: a blockdoc-shaped kit node → an mdxeditor `JsxComponentDescriptor`.
 * mdxeditor (Lexical) needs a descriptor per JSX tag to parse it into rich mode — this DERIVES that
 * descriptor from the manifest node, so there is no hand-authored per-component descriptor and no new
 * source of truth. Props come from the node's `attrsSchema`; children-ness from its child rule.
 *
 * The `Editor` is mdxeditor's `GenericJsxEditor` for now (renders the props + a nested editor for
 * children); the schema-driven RJSF/seam inspector (enum selects, validation, the "frame form") swaps
 * in next, reading the same `attrsSchema`.
 */
declare function nodeToJsxDescriptor(node: KitNodeManifest): JsxComponentDescriptor;
/** Every kit node as an mdxeditor descriptor — passed to `jsxPlugin` so rich mode parses the guides. */
declare const KIT_JSX_DESCRIPTORS: JsxComponentDescriptor[];

/**
 * Build the `Content` mdxeditor descriptor bound to a specific set of pickable content names. The
 * `options` list is the host's content map (e.g. `contentNames().filter(n => n.includes('/'))`); the
 * returned `Editor` closes over it, renders the resolved `<Content>` inline, and rewrites the `name`
 * attribute when the picker changes.
 */
declare function contentJsxDescriptor(options?: string[]): JsxComponentDescriptor;
/**
 * The kit descriptors with the generic `Content` form swapped for the real-partial renderer above, in one
 * call — so a host stops hand-assembling `[...KIT_JSX_DESCRIPTORS.filter(d => d.name !== 'Content'), …]`.
 * Pass the pickable content-name `options` (the host's content map). Any descriptor set can be given as
 * `descriptors` (defaults to the kit).
 */
declare function withContentDescriptor(descriptors?: JsxComponentDescriptor[], { options }?: {
    options?: string[];
}): JsxComponentDescriptor[];

/**
 * The schema-driven per-block inspector — the "frame form" for a JSX block. Plugged into mdxeditor's
 * `GenericJsxEditor` as its `PropertyEditor`, it renders an RJSF `SchemaForm` (the same engine Frame
 * `EditShell` / `@schemastud/seam` use) off the component's `attrsSchema` from the kit manifest. So
 * `Callout.type` is a select, required fields validate, and there's one form engine for every block.
 *
 * Contract from mdxeditor's `PropertyPopover`: `{ properties: {name: string}, title, onChange }`.
 * Expression/ReactNode props (`x-expression`: `icon`, `lede`, `tree`) are hidden from the form but
 * kept in `formData`, so editing a shown field never drops them (they stay source-editable).
 */
interface PropertyEditorProps {
    properties: Record<string, string>;
    title: string;
    onChange: (values: Record<string, string>) => void;
}
declare function SchemaFormPropertyEditor({ properties, title, onChange }: PropertyEditorProps): react.JSX.Element;

/**
 * A toolbar dropdown that inserts a kit component at the cursor — driven by the same manifest that
 * registers them, so the insert list and the parse descriptors can't drift. Flow (block) components
 * get an empty children slot; inline components (Ref) insert as text. mdxeditor serializes the JSX
 * without an import (the components are ambient — verified).
 */
declare function InsertKitBlock(): react.JSX.Element;

export { InsertKitBlock, type JsonSchema, KIT_JSX_DESCRIPTORS, KIT_MANIFEST, type KitManifest, type KitNodeManifest, MdxDocumentEditor, type MdxDocumentEditorProps, SchemaFormPropertyEditor, contentJsxDescriptor, nodeToJsxDescriptor, withContentDescriptor };
