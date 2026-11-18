import { useEffect, useRef, useState } from 'react';
import { useEditShellMount } from '@schemastud/frame/editor';
import { getAt, updateAt, isJsonBlock, isJsonText, type JsonDoc, type JsonNode } from '../blockdoc/json.js';
import { candidateOf, idOf, pathOfId, pathSegments, refusalOf, type RefineNodePort } from './node-action.js';
import { useBeamUxMessages } from '../messages.js';
import { notice, say, type Notice } from '../message-descriptor.js';

/**
 * One control for the selected node: refine it with an instruction, or regenerate it (node-actions-and-takes 04).
 * The answer is a candidate the person sees before anything changes. Accept applies it as ONE Local Session step
 * (`onApply` is the editor's ordinary canvas change, so undo takes it back like any edit), and the draft is saved
 * the ordinary way, through the existing save check. A refused candidate leaves the session untouched and says why,
 * in the server's words. No chat panel and no provider picker.
 */
export interface NodeActionControlProps {
    slug: string;
    /**
     * The entry the `refine` port addresses (its row id). Offers and pending answers belong to it: a slug is the
     * page's label and need not be unique per entry, so the late-answer guard keys on this. Defaults to `slug`.
     */
    entry?: string;
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

/** An offer belongs to the entry and the selection it was asked for. */
type Offer = { entry: string; path: string; id?: string; node: JsonNode; reference: string; sent: JsonNode };

export function NodeActionControl({ slug, entry: entryId, doc, path, refine, onApply }: NodeActionControlProps) {
    const m = useBeamUxMessages();
    const entry = entryId ?? slug;
    const [instruction, setInstruction] = useState('');
    const [busy, setBusy] = useState(false);
    const [offer, setOffer] = useState<Offer | null>(null);
    const [refusal, setRefusal] = useState<Notice | null>(null);
    // The selection generation: bumped whenever the entry (`entry`, else `slug`) or the selected path changes (and on unmount). A response
    // that comes back under an older generation answers a node the inspector no longer shows, so it changes nothing:
    // no offer, no refusal and no busy state for the newer selection. Credit: review-r1 (advisory review of 9908b70e).
    const generation = useRef(0);

    // A new entry or selection drops what was offered or pending for the previous one, and the instruction typed for it.
    useEffect(() => {
        generation.current += 1;
        setInstruction('');
        setOffer(null);
        setRefusal(null);
        setBusy(false);
        return () => {
            generation.current += 1;
        };
    }, [entry, path]);

    const node = getAt(doc, path);
    if (!node) return null;

    // The effect above runs after the render that changes entry or selection, so the render itself also ignores an
    // offer made for another entry or path; an entry change with the same numeric path never shows the old offer.
    const shown = offer && offer.entry === entry && offer.path === path ? offer : null;

    const ask = async (mode: 'refine' | 'regenerate') => {
        const current = getAt(doc, path);
        if (!current) return;
        const asked = generation.current;
        const live = () => generation.current === asked;
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
            if (!live()) return;
            const candidate = candidateOf(decision);
            if (!candidate) setRefusal(refusalOf(decision));
            // A block keeps its stable id through a refine; a candidate that drops or changes it would orphan
            // whatever addresses the block, so it is not offered.
            else if (id && idOf(candidate) !== id) setRefusal(notice('splicewire-beam-ux::messages.node_action_id_dropped'));
            else setOffer({ entry, path, id, node: candidate, reference: decision.revision.reference, sent: current });
        } catch (failure) {
            if (live()) setRefusal(failure instanceof Error ? failure.message : String(failure));
        } finally {
            if (live()) setBusy(false);
        }
    };

    const accept = () => {
        const offer = shown;
        if (!offer) return;
        // The node the candidate was made for, found by its stable id where it has one (it may have moved) and by
        // path otherwise, must still be unchanged; otherwise the candidate answers a question nobody is asking now.
        const target = offer.id ? pathOfId(doc, offer.id) : offer.path;
        const now = target ? getAt(doc, target) : null;
        if (!target || !now || JSON.stringify(now) !== JSON.stringify(offer.sent)) {
            setOffer(null);
            setRefusal(notice('splicewire-beam-ux::messages.node_action_changed'));
            return;
        }
        onApply(updateAt(doc, target, () => offer.node));
        setOffer(null);
        setInstruction('');
    };

    return (
        <section aria-label={m.t('splicewire-beam-ux::messages.node_action_region')} data-node-action="">
            <label>
                {m.t('splicewire-beam-ux::messages.node_action_instruction')}
                <textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} rows={2} disabled={busy} />
            </label>
            <div>
                <button type="button" disabled={busy || instruction.trim() === ''} onClick={() => void ask('refine')}>
                    {m.t('splicewire-beam-ux::messages.node_action_refine')}
                </button>
                <button type="button" disabled={busy} onClick={() => void ask('regenerate')}>
                    {m.t('splicewire-beam-ux::messages.node_action_regenerate')}
                </button>
            </div>
            {busy ? <p role="status">{m.t('splicewire-beam-ux::messages.node_action_making')}</p> : null}
            {refusal ? (
                <p role="alert" data-node-action-refusal="">
                    {say(m, refusal)}
                </p>
            ) : null}
            {shown ? (
                <div role="group" aria-label={m.t('splicewire-beam-ux::messages.node_action_candidate')} data-node-action-candidate={shown.reference}>
                    <p data-node-action-preview="">{textOf(shown.node)}</p>
                    <button type="button" onClick={accept}>
                        {m.t('splicewire-beam-ux::messages.node_action_accept')}
                    </button>
                    <button type="button" onClick={() => setOffer(null)}>
                        {m.t('splicewire-beam-ux::messages.node_action_discard')}
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
