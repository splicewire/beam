import type { JsonDoc, JsonNode } from '../blockdoc/json.js';
import { notice, type Notice } from '../message-descriptor.js';

/**
 * The page canvas's side of the node-action contract (node-actions-and-takes 04). The wire answer is the composition
 * spine's `NodeActionDecisionData` (splicewire/laravel-composition-spine, `src/NodeActions/`), mirrored here because
 * beam-ux has no generated copy of it. For a page node nothing is persisted by the operation: a kept decision OFFERS
 * a candidate, which the editor applies as one Local Session step and saves as an ordinary draft through the
 * existing save check.
 */

/**
 * One side of the revision. For a page node the operation (laravel-beam-ux `CanvasNodePreview`) puts the NODE ITSELF
 * in `truth` and addresses it by its stable id, or by a JSON pointer ("/0/children/1") when it has none; its own HTTP
 * test reads `data.revision.after.truth.children.0.value` (`tests/CanvasNodePreviewTest.php:148-150`).
 */
export interface NodeActionSnapshot {
    address: string;
    truth: JsonNode | Record<string, unknown>;
    standing: unknown;
}

export interface NodeActionVerdict {
    hardFail: boolean;
    softWorse: boolean;
    /** Shown to the person verbatim when a candidate is refused. */
    reasons: string[];
    before?: Record<string, number | null>;
    after?: Record<string, number | null>;
}

export interface NodeActionDecision {
    /** `kept`: a legal candidate is offered. `reverted`: refused, nothing to apply. */
    decision: string;
    revision: { reference: string; before: NodeActionSnapshot; after: NodeActionSnapshot };
    verdict?: NodeActionVerdict | null;
}

/** One step of a node path: an int is a child index; a string is a named step (`slots`, then the slot's name). */
export type NodePathSegment = string | number;

/**
 * The operation's request, matching the server's declared input (coord, 2026-11-15 02:14Z: the server's Data is the
 * contract). The path is relative to `body`; an existing `nodeId` wins, and the path also covers id-less nodes.
 */
export interface RefineNodeRequest {
    /** The node's path in `body`, as segments: e.g. `[0, 2, 1]`, or `[0, 'slots', 'aside', 0]` inside a named slot. */
    path: NodePathSegment[];
    /** The block's stable id (ADR-0228 d3), when it has one: the operation addresses by it, falling back to `path`. */
    nodeId?: string;
    mode: 'refine' | 'regenerate';
    /** Required for `refine`. */
    instruction?: string;
    /**
     * The whole body as it stands in the editor's Local Session, which may be ahead of the stored draft. The save
     * check judges a node by what its parent admits, so the operation needs the body, not just the node. The server
     * bounds its size (the canvas-bindings precedent) and its refusal is shown as it is.
     */
    body: JsonDoc;
}

/** The host's port to the entry's node-action operation. */
export type RefineNodePort = (slug: string, request: RefineNodeRequest) => Promise<NodeActionDecision>;

/** The candidate a decision offers, or null when it offers none (refused, or no node in the answer). */
export function candidateOf(decision: NodeActionDecision): JsonNode | null {
    if (decision.decision !== 'kept' || decision.verdict?.hardFail) return null;
    const node = decision.revision?.after?.truth;
    return node && typeof node === 'object' && 'kind' in node ? (node as JsonNode) : null;
}

/**
 * The canvas's dotted path as the operation's node path. The canvas writes a child index straight after its parent
 * ("0.2.1" is doc[0].children[2].children[1]) and a named slot as "slots.<name>" followed by the index inside it.
 * The operation walks node positions spelled out (laravel-beam-ux `CanvasNodePreview::locate`): `[0, 'children', 2,
 * 'children', 1]`, and `[0, 'slots', 'aside', 0]` inside a slot, the step after a slot name indexing the slot itself.
 */
export function pathSegments(path: string): NodePathSegment[] {
    if (path === '') return [];
    const parts = path.split('.');
    const segments: NodePathSegment[] = [Number(parts[0])];
    for (let i = 1; i < parts.length; i++) {
        if (parts[i] === 'slots') {
            segments.push('slots', parts[i + 1], Number(parts[i + 2]));
            i += 2;
        } else {
            segments.push('children', Number(parts[i]));
        }
    }
    return segments;
}

/** A block's stable id, when it has one. */
export function idOf(node: JsonNode | null | undefined): string | undefined {
    return node && node.kind === 'block' && typeof node.id === 'string' && node.id !== '' ? node.id : undefined;
}

/** The index path of the block whose stable id is `id`, searching children and named slots; null when absent. */
export function pathOfId(doc: JsonDoc, id: string): string | null {
    const walk = (nodes: JsonNode[], prefix: string): string | null => {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const path = prefix === '' ? String(i) : `${prefix}.${i}`;
            if (node.kind !== 'block') continue;
            if (node.id === id) return path;
            const inChildren = walk(node.children, path);
            if (inChildren) return inChildren;
            for (const [name, slot] of Object.entries(node.slots ?? {})) {
                const inSlot = walk(slot, `${path}.slots.${name}`);
                if (inSlot) return inSlot;
            }
        }
        return null;
    };
    return walk(doc, '');
}

/**
 * Why a decision offers nothing: the server's own words where it gave any (shown as they are), else the catalog's
 * refusal line, which the control renders in the reader's locale (`say`).
 */
export function refusalOf(decision: NodeActionDecision): Notice | null {
    if (candidateOf(decision)) return null;
    const reasons = decision.verdict?.reasons ?? [];
    return reasons.length > 0 ? reasons.join(' ') : notice('splicewire-beam-ux::messages.node_action_refused');
}
