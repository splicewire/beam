// The `<Content name="…">` reference, rendered inline in the editor as the REAL partial (with a picker
// to swap which partial) — instead of the bare "CONTENT NAME" RJSF form the generic descriptor draws.
// It is generic: it only needs the app's content resolver, which `<Content>` already reads from the
// surrounding <BeamMdxProvider>, plus the list of pickable names (injected — the host owns its content map).
// Promoted out of the host (editor-promotion ticket 04); the `.beam-content-ref*` styling ships in editor.css.
import { useMdastNodeUpdater, type JsxComponentDescriptor } from '@mdxeditor/editor';
import { Content } from '../components/content';
import { KIT_JSX_DESCRIPTORS } from './descriptors';

type MdxJsxAttr = { type: string; name?: string | null; value?: unknown };
type MdastJsxNode = { attributes?: MdxJsxAttr[] };

const attrValue = (node: MdastJsxNode, key: string): string => {
    const a = node.attributes?.find((x) => x.type === 'mdxJsxAttribute' && x.name === key);
    return typeof a?.value === 'string' ? a.value : '';
};

/**
 * Build the `Content` mdxeditor descriptor bound to a specific set of pickable content names. The
 * `options` list is the host's content map (e.g. `contentNames().filter(n => n.includes('/'))`); the
 * returned `Editor` closes over it, renders the resolved `<Content>` inline, and rewrites the `name`
 * attribute when the picker changes.
 */
export function contentJsxDescriptor(options: string[] = []): JsxComponentDescriptor {
    const ContentRefEditor: JsxComponentDescriptor['Editor'] = ({ mdastNode }) => {
        const update = useMdastNodeUpdater();
        const name = attrValue(mdastNode as MdastJsxNode, 'name');

        return (
            <div className="beam-content-ref" contentEditable={false}>
                <div className="beam-content-ref-bar">
                    <span className="beam-content-ref-tag">▤ shared content</span>
                    <select
                        className="beam-content-ref-pick"
                        value={name}
                        onChange={(e) =>
                            update({
                                attributes: [{ type: 'mdxJsxAttribute', name: 'name', value: e.target.value }],
                            } as never)
                        }
                    >
                        {name && !options.includes(name) && <option value={name}>{name}</option>}
                        {options.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="beam-content-ref-body">
                    <Content name={name} />
                </div>
            </div>
        );
    };

    return {
        name: 'Content',
        kind: 'flow',
        source: '',
        props: [{ name: 'name', type: 'string' }],
        hasChildren: false,
        Editor: ContentRefEditor,
    };
}

/**
 * The kit descriptors with the generic `Content` form swapped for the real-partial renderer above, in one
 * call — so a host stops hand-assembling `[...KIT_JSX_DESCRIPTORS.filter(d => d.name !== 'Content'), …]`.
 * Pass the pickable content-name `options` (the host's content map). Any descriptor set can be given as
 * `descriptors` (defaults to the kit).
 */
export function withContentDescriptor(
    descriptors: JsxComponentDescriptor[] = KIT_JSX_DESCRIPTORS,
    { options = [] }: { options?: string[] } = {},
): JsxComponentDescriptor[] {
    return [...descriptors.filter((d) => d.name !== 'Content'), contentJsxDescriptor(options)];
}
