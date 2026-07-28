import { GenericJsxEditor, type JsxComponentDescriptor, type JsxPropertyDescriptor } from '@mdxeditor/editor';
import { KIT_MANIFEST, type KitNodeManifest } from './manifest';
import { SchemaFormPropertyEditor } from './schema-form';

// mdxeditor's GenericJsxEditor handles attribute read/write + the nested children editor; we only
// swap its `PropertyEditor` for the schema-driven RJSF form (off the component's attrsSchema).
const SchemaDrivenJsxEditor: JsxComponentDescriptor['Editor'] = (props) => (
    <GenericJsxEditor {...props} PropertyEditor={SchemaFormPropertyEditor} />
);

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
export function nodeToJsxDescriptor(node: KitNodeManifest): JsxComponentDescriptor {
    const properties = (node.attrsSchema?.properties ?? {}) as Record<string, { 'x-expression'?: boolean }>;

    const props: JsxPropertyDescriptor[] = Object.entries(properties).map(([name, schema]) => ({
        name,
        type: schema?.['x-expression'] ? 'expression' : 'string',
    }));

    // Leaf when the node admits no children ([]); otherwise it takes children (null = unconstrained).
    const hasChildren = node.admitsChildCategories === null || node.admitsChildCategories.length > 0;

    return {
        name: node.name,
        kind: node.group === 'inline' ? 'text' : 'flow',
        // Ambient MDX components (provided via the components map, not imported), so no import source.
        source: '',
        props,
        hasChildren,
        Editor: SchemaDrivenJsxEditor,
    };
}

/** Every kit node as an mdxeditor descriptor — passed to `jsxPlugin` so rich mode parses the guides. */
export const KIT_JSX_DESCRIPTORS: JsxComponentDescriptor[] = KIT_MANIFEST.nodes.map(nodeToJsxDescriptor);
