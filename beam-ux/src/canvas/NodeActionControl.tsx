import { useEffect, useState } from 'react';
import { useEditShellMount } from '@schemastud/frame/editor';
import { getAt, updateAt, isJsonBlock, isJsonText, type JsonDoc, type JsonNode } from '../blockdoc/json.js';
import { candidateOf, idOf, pathOfId, pathSegments, refusalOf, type RefineNodePort } from './node-action.js';

/**
 * One control for the selected node: refine it with an instruction, or regenerate it (node-actions-and-takes 04).
 * The answer is a candidate the person sees before anything changes. Accept applies it as ONE Local Session step
 * (`onApply` is the editor's ordinary canvas change, so undo takes it back like any edit), and the draft is saved
 * the ordinary way, through the existing save check. A refused candidate leaves the session untouched and says why,
 * in the server's words. No chat panel and no provider picker.
 */
export interface NodeActionControlProps {
    slug: string;
    doc: JsonDoc;
    /** The selected node's index path. */
    path: string;
    refine: RefineNodePort;
    /** Applies the next document as one Local Session step. */
    onApply: (next: JsonDoc) => void;
}

/** The words a node shows, for the candidate preview. */
function textOf(node: JsonNode): string {
    if (isJsonText(node)) return node.value;
    if (isJsonBlock(node)) return node.children.map(textOf).join('');
    return '';
}

type Offer = { path: string; id?: string; node: JsonNode; reference: string; sent: JsonNode };

export function NodeActionControl({ slug, doc, path, refine, onApply }: NodeActionControlProps) {
    const [instruction, setInstruction] = useState('');
    const [busy, setBusy] = useState(false);
    const [offer, setOffer] = useState<Offer | null>(null);
    const [refusal, setRefusal] = useState<string | null>(null);

    // A new selection drops what was offered for the previous one.
    useEffect(() => {
        setOffer(null);
        setRefusal(null);
    }, [path]);

    const node = getAt(doc, path);
    if (!node) return null;

    const ask = async (mode: 'refine' | 'regenerate') => {
        const current = getAt(doc, path);
        if (!current) return;
        setBusy(true);
        setOffer(null);
        setRefusal(null);
        try {
            const id = idOf(current);
            const decision = await refine(slug, {
                path: pathSegments(path),
                ...(id ? { nodeId: id } : {}),
                mode,
                ...(mode === 'refine' ? { instruction: instruction.trim() } : {}),
                body: doc,
            });
            const candidate = candidateOf(decision);
            if (!candidate) setRefusal(refusalOf(decision));
            // A block keeps its stable id through a refine; a candidate that drops or changes it would orphan
            // whatever addresses the block, so it is not offered.
            else if (id && idOf(candidate) !== id) setRefusal('The candidate did not keep this block’s id, so it was not offered.');
            else setOffer({ path, id, node: candidate, reference: decision.revision.reference, sent: current });
        } catch (failure) {
            setRefusal(failure instanceof Error ? failure.message : String(failure));
        } finally {
            setBusy(false);
        }
    };

    const accept = () => {
        if (!offer) return;
        // The node the candidate was made for, found by its stable id where it has one (it may have moved) and by
        // path otherwise, must still be unchanged; otherwise the candidate answers a question nobody is asking now.
        const target = offer.id ? pathOfId(doc, offer.id) : offer.path;
        const now = target ? getAt(doc, target) : null;
        if (!target || !now || JSON.stringify(now) !== JSON.stringify(offer.sent)) {
            setOffer(null);
            setRefusal('The node changed while the candidate was being made. Ask again.');
            return;
        }
        onApply(updateAt(doc, target, () => offer.node));
        setOffer(null);
        setInstruction('');
    };

    return (
        <section aria-label="Refine this block" data-node-action="">
            <label>
                Instruction
                <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={2} disabled={busy} />
            </label>
            <div>
                <button type="button" disabled={busy || instruction.trim() === ''} onClick={() => void ask('refine')}>
                    Refine
                </button>
                <button type="button" disabled={busy} onClick={() => void ask('regenerate')}>
                    Regenerate
                </button>
            </div>
            {busy ? <p role="status">Making a candidate…</p> : null}
            {refusal ? (
                <p role="alert" data-node-action-refusal="">
                    {refusal}
                </p>
            ) : null}
            {offer ? (
                <div role="group" aria-label="Candidate" data-node-action-candidate={offer.reference}>
                    <p data-node-action-preview="">{textOf(offer.node)}</p>
                    <button type="button" onClick={accept}>
                        Accept
                    </button>
                    <button type="button" onClick={() => setOffer(null)}>
                        Discard
                    </button>
                </div>
            ) : null}
        </section>
    );
}

/**
 * The control for whatever the edit shell has selected, shared by both canvas editors (PageEditor's inspector and
 * VisualEditor's, which the editor kit's Site section mounts). Renders nothing without a `refine` port or a selection,
 * so a host whose entry client has no `refineNode` sees no change. `onApply` is the editor's own canvas change.
 */
export function SelectedNodeAction({ refine, ...rest }: Omit<NodeActionControlProps, 'path' | 'refine'> & { refine?: RefineNodePort }) {
    const selected = useEditShellMount().selectedNodeId;
    if (!refine || !selected) return null;
    return <NodeActionControl {...rest} path={selected} refine={refine} />;
}
