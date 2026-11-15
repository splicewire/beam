import type { JsonDoc, JsonNode } from '../blockdoc/json.js';

/**
 * The page canvas's side of the node-action contract (node-actions-and-takes 04). The wire answer is the composition
 * spine's `NodeActionDecisionData` (splicewire/laravel-composition-spine, `src/NodeActions/`), mirrored here because
 * beam-ux has no generated copy of it. For a page node nothing is persisted by the operation: a kept decision OFFERS
 * a candidate, which the editor applies as one Local Session step and saves as an ordinary draft through the
 * existing save check.
 */

export interface NodeActionSnapshot {
    /** The node's index path in the entry body, e.g. "0.2.1". */
    address: string;
    truth: { node?: JsonNode } & Record<string, unknown>;
    standing: Record<string, unknown>;
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
    const node = decision.revision?.after?.truth?.node;
    return node && typeof node === 'object' && 'kind' in node ? (node as JsonNode) : null;
}

/** The canvas's dotted path ("0.2.1", "0.slots.aside.0") as the operation's segments: ints for indexes, else strings. */
export function pathSegments(path: string): NodePathSegment[] {
    return path === '' ? [] : path.split('.').map((part) => (/^\d+$/.test(part) ? Number(part) : part));
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

/** Why a decision offers nothing, in the server's own words where it gave any. */
export function refusalOf(decision: NodeActionDecision): string | null {
    if (candidateOf(decision)) return null;
    const reasons = decision.verdict?.reasons ?? [];
    return reasons.length > 0 ? reasons.join(' ') : 'The candidate was refused.';
}
