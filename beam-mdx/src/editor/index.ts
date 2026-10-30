// =============================================================================
// @splicewire/beam-mdx/editor — the heavy authoring surface (mdxeditor.dev + RJSF).
//
// A rich WYSIWYG + CodeMirror source MDX editor (mdxeditor.dev), with the kit's custom components
// registered from a single blockdoc-shaped manifest and a schema-driven RJSF inspector per block.
// Kept a separate entry from `.`/`./kit` (ADR-0116) so those stay light; the host lazy-loads this.
// The host supplies the shadcn-var → its-tokens bridge CSS (design-neutral here); import
// `@splicewire/beam-mdx/editor/css` for the layout compaction.
// =============================================================================

export { MdxDocumentEditor } from './MdxDocumentEditor';
export type { MdxDocumentEditorProps } from './MdxDocumentEditor';

// The PHP-declared kit supplies the derived descriptors; hosts can extend or replace that set.
export type { KitManifest, KitNodeManifest, JsonSchema } from './manifest';
export { KIT_JSX_DESCRIPTORS, nodeToJsxDescriptor } from './descriptors';
// The `<Content>` reference rendered as the real partial inline + a picker (editor-promotion ticket 04).
export { contentJsxDescriptor, withContentDescriptor } from './content-descriptor';
export { SchemaFormPropertyEditor } from './schema-form';
export { InsertKitBlock } from './toolbar';
