import { expect, it } from 'vitest';
import {
    classifyToken,
    type PrincipalKind,
    principalRows,
    toChips,
    toggleToken,
} from './principals';

// The pure flatten + classify seam behind the recipient picker (ticket 17). Pins the catalog→rows
// flattening and the known-vs-raw chip rule without a DOM.

const kinds: PrincipalKind[] = [
    { kind: 'owner', label: 'Record owner' },
    { kind: 'watcher', label: 'Watchers' },
    {
        kind: 'role',
        label: 'By role',
        options: [
            { value: 'Admin', label: 'Admin' },
            { value: 'Owner', label: 'Owner' },
        ],
    },
];

it('flattens catalog kinds into one flat checklist (role → one row per option)', () => {
    const rows = principalRows(kinds);
    expect(rows.map((r) => r.token)).toEqual(['owner:', 'watcher:', 'role:Admin', 'role:Owner']);
    // The `owner` KIND row is distinct from the `Owner` ROLE row (ticket 17 naming).
    expect(rows.find((r) => r.token === 'owner:')?.label).toBe('Record owner');
    expect(rows.find((r) => r.token === 'role:Owner')?.label).toBe('Owner');
    expect(rows.find((r) => r.token === 'role:Admin')?.group).toBe('role');
});

it('classifies a declared token as known, an undeclared one as raw', () => {
    const rows = principalRows(kinds);
    expect(classifyToken('role:Admin', rows)).toMatchObject({
        label: 'Admin',
        kind: 'role',
        known: true,
    });
    expect(classifyToken('owner:', rows)).toMatchObject({
        label: 'Record owner',
        kind: 'owner',
        known: true,
    });
    // A raw / host-undeclared token: fails silently at runtime, but the picker flags it visibly.
    expect(classifyToken('team:eng', rows)).toMatchObject({
        label: 'team:eng',
        kind: 'team',
        known: false,
    });
});

it('renders the selection as chips in order', () => {
    const rows = principalRows(kinds);
    const chips = toChips(['owner:', 'team:eng'], rows);
    expect(chips.map((c) => c.known)).toEqual([true, false]);
});

it('toggles a token in the selection', () => {
    expect(toggleToken([], 'owner:')).toEqual(['owner:']);
    expect(toggleToken(['owner:', 'role:Admin'], 'owner:')).toEqual(['role:Admin']);
});
