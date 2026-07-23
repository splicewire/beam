import type { BlueprintDraft, BlueprintTransition } from './blueprint';

/**
 * Pure structural diff of two workflow DEFINITION versions (beam-workflows-ux ticket 19, Surface 2 of
 * the confidence surfaces). Diffs definition shape only — places, transitions, per-transition guards
 * and effects — NEVER record content (that's the separate `record-versioning` effort) and never the
 * `$ref` graph (ref-blind, ticket 06).
 *
 * The `places` delta it computes is the reusable input to the marking-migration wizard's old→new
 * mapping (ticket 20): a removed place is one whose records must be re-mapped; an added place is a
 * candidate target.
 */

export type PlaceDelta = { added: string[]; removed: string[] };

export type TransitionDelta = {
    /** Stable identity: name + route, so a guard/effect-only edit matches (a route edit reads as ±). */
    key: string;
    name: string;
    from: string[];
    to: string[];
    status: 'added' | 'removed' | 'changed';
    /** Present on `changed` when the guard ref moved. */
    guard?: { from: string | null; to: string | null };
    /** Present on `changed` when the attached effect set moved. */
    effects?: { added: string[]; removed: string[] };
};

export type BlueprintDiff = {
    places: PlaceDelta;
    transitions: TransitionDelta[];
};

function transitionKey(t: BlueprintTransition): string {
    return `${t.name}|${[...t.from].sort().join(',')}→${[...t.to].sort().join(',')}`;
}

function arrayDelta(
    from: readonly string[],
    to: readonly string[],
): { added: string[]; removed: string[] } {
    const fromSet = new Set(from);
    const toSet = new Set(to);

    return {
        added: to.filter((x) => !fromSet.has(x)),
        removed: from.filter((x) => !toSet.has(x)),
    };
}

export function diffBlueprints(from: BlueprintDraft, to: BlueprintDraft): BlueprintDiff {
    const places = arrayDelta(from.places, to.places);

    const fromByKey = new Map(from.transitions.map((t) => [transitionKey(t), t]));
    const toByKey = new Map(to.transitions.map((t) => [transitionKey(t), t]));

    const transitions: TransitionDelta[] = [];

    // Removed: present in `from`, gone in `to`.
    for (const [key, t] of fromByKey) {
        if (!toByKey.has(key)) {
            transitions.push({ key, name: t.name, from: t.from, to: t.to, status: 'removed' });
        }
    }

    // Added + changed: walk `to`.
    for (const [key, t] of toByKey) {
        const prior = fromByKey.get(key);
        if (!prior) {
            transitions.push({ key, name: t.name, from: t.from, to: t.to, status: 'added' });
            continue;
        }

        const guardMoved = (prior.guard ?? null) !== (t.guard ?? null);
        const effectDelta = arrayDelta(prior.effects ?? [], t.effects ?? []);
        const effectsMoved = effectDelta.added.length > 0 || effectDelta.removed.length > 0;

        if (guardMoved || effectsMoved) {
            transitions.push({
                key,
                name: t.name,
                from: t.from,
                to: t.to,
                status: 'changed',
                ...(guardMoved
                    ? { guard: { from: prior.guard ?? null, to: t.guard ?? null } }
                    : {}),
                ...(effectsMoved ? { effects: effectDelta } : {}),
            });
        }
    }

    return { places, transitions };
}

/** Whether a diff has anything to show (else the two versions are structurally identical). */
export function isEmptyDiff(diff: BlueprintDiff): boolean {
    return (
        diff.places.added.length === 0 &&
        diff.places.removed.length === 0 &&
        diff.transitions.length === 0
    );
}
