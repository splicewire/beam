/**
 * The seam smoke test (ticket 03 acceptance): prove the two load-bearing properties of the
 * host→Mainframe delegation seam, plus the resolver's contract behavior.
 *
 * 1. **Delegation** — the host owns mode state; the outlet renders the Mainframe registered for that
 *    mode, handing it the resolved slots.
 * 2. **State-preserving child-swap** — switching mode swaps *only the child Mainframe*; state held
 *    above the outlet (the "host") does NOT remount. This is why AppShell delegates to a Mainframe
 *    instead of *becoming* one (ADR-0099).
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    createMainframeRegistry,
    createSlotRegistry,
    MainframeOutlet,
    MainframeProvider,
    resolveSlots,
    type Mainframe,
    type MainframeInjection,
    type SlotRegistry,
} from '../index';

// --- Delegation + child-swap -------------------------------------------------------------------

// Module-level mount counters: incremented in each component's mount effect. If a component
// remounts, its counter climbs — the tell for "the tree above the outlet was torn down".
let hostSentinelMounts = 0;
let modeAMounts = 0;
let modeBMounts = 0;

function useMountCounter(bump: () => void) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useState(() => {
        bump();
        return null;
    });
}

const ModeA: Mainframe = ({ slots }) => {
    useMountCounter(() => {
        modeAMounts++;
    });
    return (
        <div data-testid="mainframe">
            <span data-testid="mode">A</span>
            <span data-testid="brand">{slots.node('brand')}</span>
        </div>
    );
};

const ModeB: Mainframe = ({ slots, ctx }) => {
    useMountCounter(() => {
        modeBMounts++;
    });
    return (
        <div data-testid="mainframe">
            <span data-testid="mode">B</span>
            <span data-testid="main">{slots.main(ctx.payload)}</span>
        </div>
    );
};

function buildInjection(): MainframeInjection {
    const slots = createSlotRegistry();
    const mainframes = createMainframeRegistry();
    mainframes.register('a', ModeA);
    mainframes.register('b', ModeB);
    slots.contribute({ slot: 'brand', key: 'logo', node: <b>splicewire</b> });
    slots.contribute({ slot: 'main', key: 'page', render: (payload) => <em>{String(payload)}</em> });
    return { slots, mainframes };
}

/** The stable host: owns mode state + a mount sentinel that must survive a mode swap. */
function Host() {
    const [injection] = useState(buildInjection);
    const [mode, setMode] = useState('a');
    useMountCounter(() => {
        hostSentinelMounts++;
    });
    return (
        <MainframeProvider injection={injection}>
            <button onClick={() => setMode((m) => (m === 'a' ? 'b' : 'a'))}>toggle</button>
            <MainframeOutlet mode={mode} ctx={{ payload: 'hello' }} />
        </MainframeProvider>
    );
}

describe('host → Mainframe delegation seam', () => {
    beforeEach(() => {
        hostSentinelMounts = 0;
        modeAMounts = 0;
        modeBMounts = 0;
    });

    it('delegates: renders the Mainframe registered for the active mode, with resolved slots', () => {
        render(<Host />);
        expect(screen.getByTestId('mode').textContent).toBe('A');
        expect(screen.getByTestId('brand').textContent).toBe('splicewire');
    });

    it('swaps the child Mainframe on mode change without remounting the host', () => {
        render(<Host />);
        expect(modeAMounts).toBe(1);
        expect(hostSentinelMounts).toBe(1);

        act(() => {
            fireEvent.click(screen.getByText('toggle'));
        });

        // Delegation followed the mode: B is now rendered, reading a different slot.
        expect(screen.getByTestId('mode').textContent).toBe('B');
        expect(screen.getByTestId('main').textContent).toBe('hello');

        // Child-swap: B mounted, and the host sentinel did NOT remount (still 1) — state above the
        // outlet is preserved. This is the property the whole seam exists to guarantee.
        expect(modeBMounts).toBe(1);
        expect(hostSentinelMounts).toBe(1);

        // Toggling back mounts A afresh (it was unmounted), host still stable.
        act(() => {
            fireEvent.click(screen.getByText('toggle'));
        });
        expect(screen.getByTestId('mode').textContent).toBe('A');
        expect(modeAMounts).toBe(2);
        expect(hostSentinelMounts).toBe(1);
    });
});

// --- Resolver contract behavior ----------------------------------------------------------------

function resolveWith(
    populate: (r: SlotRegistry) => void,
    can?: (cap: string) => boolean,
) {
    const slots = createSlotRegistry();
    const mainframes = createMainframeRegistry();
    mainframes.register('x', (() => null) as Mainframe, {
        slots: [{ name: 'custom.panel', fillType: 'single-node' }],
    });
    populate(slots);
    return resolveSlots({ contributions: slots.contributions(), registrations: mainframes.all(), can });
}

describe('resolver (frozen contract behavior)', () => {
    afterEach(() => vi.restoreAllMocks());

    it('sorts ordered-multi-source by (zone, order, registration index)', () => {
        const resolved = resolveWith((r) => {
            // Deliberately out of final order; keys encode expected final position.
            r.contribute({ slot: 'topBar.actions', key: 'end-50', node: null, zone: 'end' });
            r.contribute({ slot: 'topBar.actions', key: 'start-10', node: null, zone: 'start', order: 10 });
            r.contribute({ slot: 'topBar.actions', key: 'start-90', node: null, zone: 'start', order: 90 });
            r.contribute({ slot: 'topBar.actions', key: 'end-20', node: null, zone: 'end', order: 20 });
        });
        // start zone before end zone; within a zone, by order; registration index breaks final ties.
        expect(resolved.keys('topBar.actions')).toEqual(['start-10', 'start-90', 'end-20', 'end-50']);
        expect(resolved.items('topBar.actions', 'start')).toHaveLength(2);
    });

    it('gates contributions by `can` — the entitlement axis, orthogonal to placement', () => {
        const resolved = resolveWith(
            (r) => {
                r.contribute({ slot: 'topBar.actions', key: 'public', node: null, zone: 'start' });
                r.contribute({ slot: 'topBar.actions', key: 'edit', node: null, zone: 'start', can: 'compose.edit' });
            },
            (cap) => cap !== 'compose.edit', // visitor: lacks the edit entitlement
        );
        // The edit contribution gates to empty; the slot is still placeable, just thinner.
        expect(resolved.keys('topBar.actions')).toEqual(['public']);
    });

    it('drops a `can`-gated contribution when no predicate is wired (closed by default)', () => {
        const resolved = resolveWith((r) => {
            r.contribute({ slot: 'brand', key: 'gated', node: <span>x</span>, can: 'anything' });
        });
        expect(resolved.node('brand')).toBeUndefined();
    });

    it('single-node filled twice → dev-warns and last writer wins', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const resolved = resolveWith((r) => {
            r.contribute({ slot: 'brand', key: 'first', node: <span>first</span> });
            r.contribute({ slot: 'brand', key: 'second', node: <span>second</span> });
        });
        const { container } = render(<>{resolved.node('brand')}</>);
        expect(container.textContent).toBe('second');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('filled 2 times'));
    });

    it('unknown slot name → dev-warns and is ignored (never throws)', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const resolved = resolveWith((r) => {
            r.contribute({ slot: 'topBra.actions', key: 'typo', node: null });
        });
        expect(resolved.has('topBra.actions')).toBe(false);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown slot'));
    });

    it('a custom slot declared by a mainframe is known (no unknown-slot warning)', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const resolved = resolveWith((r) => {
            r.contribute({ slot: 'custom.panel', key: 'p', node: <span>panel</span> });
        });
        expect(warn).not.toHaveBeenCalled();
        const { container } = render(<>{resolved.node('custom.panel')}</>);
        expect(container.textContent).toBe('panel');
    });
});
