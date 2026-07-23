import { expect, it } from 'vitest';
import type { BlueprintDraft, BlueprintTransition } from './blueprint';
import { diffBlueprints, isEmptyDiff } from './workflowDelta';

// The pure structural diff behind the version-compare surface (ticket 19): places ± and per-transition
// guard/effect ~, keyed by name+route so a guard-only edit reads as "changed" and a route edit as ±.

function t(overrides: Partial<BlueprintTransition> & { name: string }): BlueprintTransition {
    return {
        from: ['draft'],
        to: ['review'],
        guard: null,
        effects: [],
        metadata: null,
        ...overrides,
    } as BlueprintTransition;
}

function blueprint(places: string[], transitions: BlueprintTransition[]): BlueprintDraft {
    return {
        name: 'wf',
        places,
        initial: [places[0]],
        transitions,
        metadata: null,
    } as BlueprintDraft;
}

it('reports identical versions as an empty diff', () => {
    const bp = blueprint(['draft', 'review'], [t({ name: 'submit' })]);
    expect(isEmptyDiff(diffBlueprints(bp, bp))).toBe(true);
});

it('reports added and removed places', () => {
    const from = blueprint(['draft', 'review'], []);
    const to = blueprint(['draft', 'live'], []);
    const diff = diffBlueprints(from, to);

    expect(diff.places.added).toEqual(['live']);
    expect(diff.places.removed).toEqual(['review']);
});

it('reports an added and a removed transition', () => {
    const from = blueprint(
        ['draft', 'review'],
        [t({ name: 'expedite', from: ['draft'], to: ['review'] })],
    );
    const to = blueprint(
        ['draft', 'review'],
        [t({ name: 'submit', from: ['draft'], to: ['review'] })],
    );
    const diff = diffBlueprints(from, to);

    const byStatus = Object.fromEntries(diff.transitions.map((d) => [d.name, d.status]));
    expect(byStatus).toEqual({ expedite: 'removed', submit: 'added' });
});

it('reports a guard change on a transition whose route is unchanged', () => {
    const from = blueprint(['draft', 'review'], [t({ name: 'submit', guard: null })]);
    const to = blueprint(['draft', 'review'], [t({ name: 'submit', guard: 'no_stale' })]);
    const diff = diffBlueprints(from, to);

    expect(diff.transitions).toHaveLength(1);
    expect(diff.transitions[0]).toMatchObject({
        name: 'submit',
        status: 'changed',
        guard: { from: null, to: 'no_stale' },
    });
});

it('reports an effect set change (added/removed refs)', () => {
    const from = blueprint(['draft', 'review'], [t({ name: 'submit', effects: ['notify_owner'] })]);
    const to = blueprint(['draft', 'review'], [t({ name: 'submit', effects: ['workflow.await'] })]);
    const diff = diffBlueprints(from, to);

    expect(diff.transitions[0]).toMatchObject({
        status: 'changed',
        effects: { added: ['workflow.await'], removed: ['notify_owner'] },
    });
});

it('treats a route change as remove + add, not a guard change', () => {
    const from = blueprint(
        ['draft', 'review', 'live'],
        [t({ name: 'publish', from: ['review'], to: ['live'] })],
    );
    const to = blueprint(
        ['draft', 'review', 'live'],
        [t({ name: 'publish', from: ['draft'], to: ['live'] })],
    );
    const diff = diffBlueprints(from, to);

    const statuses = diff.transitions.map((d) => d.status).sort();
    expect(statuses).toEqual(['added', 'removed']);
});
