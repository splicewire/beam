import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { useBeamUxMode } from '../useBeamUxMode';

/**
 * The `beam-ux:mode` contract, asserted from the READ side.
 *
 * host.tsx dispatches this event; these cases pin the detail shape the hook decodes, so a rename on
 * the emitter that forgets the listener fails here rather than at whichever host mounts an operator
 * dock. The edge-triggered initial state is asserted deliberately — a control that mounts after the
 * Mainframe has settled must read "not editable" until told otherwise.
 */
function Probe({ onState }: { onState: (s: ReturnType<typeof useBeamUxMode>) => void }) {
    onState(useBeamUxMode());

    return null;
}

function mount() {
    const seen: ReturnType<typeof useBeamUxMode>[] = [];
    render(<Probe onState={(s) => seen.push(s)} />);

    return {
        latest: () => seen[seen.length - 1],
        broadcast: (detail: unknown) =>
            act(() => {
                window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail }));
            }),
    };
}

describe('useBeamUxMode', () => {
    it('starts unknown — the broadcast is edge-triggered, not queryable', () => {
        expect(mount().latest()).toEqual({
            mode: null,
            editing: false,
            editable: false,
            slug: null,
            entryId: null,
        });
    });

    it('decodes a domain-mode broadcast', () => {
        const p = mount();
        p.broadcast({ mode: 'domain', editable: true, slug: 'about', entryId: 41 });

        expect(p.latest()).toEqual({
            mode: 'domain',
            editing: false,
            editable: true,
            slug: 'about',
            entryId: 41,
        });
    });

    it('reports editing only for window mode', () => {
        const p = mount();
        p.broadcast({ mode: 'window', editable: true, slug: 'about', entryId: 41 });

        expect(p.latest().editing).toBe(true);
        expect(p.latest().mode).toBe('window');
    });

    it('tolerates an empty or unknown detail rather than trusting the wire', () => {
        const p = mount();
        p.broadcast(undefined);
        expect(p.latest().mode).toBeNull();

        p.broadcast({ mode: 'nonsense', editable: 1, slug: undefined });
        expect(p.latest()).toEqual({
            mode: null,
            editing: false,
            editable: true,
            slug: null,
            entryId: null,
        });
    });

    it('unsubscribes on unmount', () => {
        const seen: number[] = [];
        const view = render(<Probe onState={() => seen.push(1)} />);
        const before = seen.length;
        view.unmount();
        act(() => {
            window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        });

        expect(seen.length).toBe(before);
    });
});
