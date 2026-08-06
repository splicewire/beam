import { act, render, screen } from '@testing-library/react';
import { useFrameSidePanelStore } from '@schemastud/frame';
import { afterEach, describe, expect, it } from 'vitest';
import { FrameSidePanelOverlay } from './FrameSidePanelOverlay.js';

afterEach(() => {
    // Drain the shared store between cases (it's a module singleton).
    act(() => {
        useFrameSidePanelStore.getState().panels.forEach((p) => useFrameSidePanelStore.getState().remove(p.id));
    });
});

describe('FrameSidePanelOverlay', () => {
    it('renders nothing until a panel publishes', () => {
        const { container } = render(<FrameSidePanelOverlay />);
        expect(container.textContent).toBe('');
    });

    it('renders a published open panel through the foundation Sheet with its title + body', () => {
        render(<FrameSidePanelOverlay />);
        act(() => {
            useFrameSidePanelStore.getState().publish({
                id: 'a',
                open: true,
                title: 'Details',
                children: <p>panel body</p>,
                onOpenChange: () => {},
            });
        });
        expect(screen.getByText('Details')).toBeTruthy();
        expect(screen.getByText('panel body')).toBeTruthy();
    });

    it('routes the close through the publisher onOpenChange (one portal, many panels)', () => {
        let closed = false;
        render(<FrameSidePanelOverlay />);
        act(() => {
            useFrameSidePanelStore.getState().publish({
                id: 'b',
                open: true,
                children: <p>body b</p>,
                onOpenChange: (o) => {
                    closed = !o;
                },
            });
        });
        // Radix renders a Close button labelled "Close" inside the sheet content.
        const closeBtn = screen.getByRole('button', { name: /close/i });
        act(() => closeBtn.click());
        expect(closed).toBe(true);
    });
});
