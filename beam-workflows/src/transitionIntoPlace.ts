import type { WorkflowProjectionData } from '@splicewire/beam-resources/types/workflows';

/**
 * The move rule of the workflow board (owner-review-20261112 ticket 47): what dropping a subject's card on a place's
 * lane means, read from the subject's own projection. Pure, so the board and a test read the same rule.
 *
 * - Exactly one available transition out of the current place leads into the target place: apply it.
 * - More than one does: nothing is guessed. The move is refused, and the card's own transition buttons pick one.
 * - None does: the move is refused. A transition that leads there but is not available carries the backend's reason
 *   (the server sets `reason` only for a refused move), and that reason is the refusal; otherwise there is no reason.
 */
export type PlaceMove =
    | { kind: 'apply'; transition: string }
    | { kind: 'ambiguous'; transitions: string[] }
    | { kind: 'blocked'; transition: string; reason: string }
    | { kind: 'none' };

export function transitionIntoPlace(
    projection: Pick<WorkflowProjectionData, 'transitions' | 'current' | 'available'>,
    toPlace: string,
): PlaceMove {
    const into = projection.transitions.filter((t) => t.to.includes(toPlace) && t.from.includes(projection.current));
    // A transition name can repeat across `from` lists; the move a person makes is the name.
    const names = [...new Set(into.filter((t) => projection.available.includes(t.name)).map((t) => t.name))];
    if (names.length === 1) return { kind: 'apply', transition: names[0]! };
    if (names.length > 1) return { kind: 'ambiguous', transitions: names };
    const blocked = into.find((t) => t.reason !== null && t.reason !== '');
    return blocked ? { kind: 'blocked', transition: blocked.name, reason: blocked.reason as string } : { kind: 'none' };
}
