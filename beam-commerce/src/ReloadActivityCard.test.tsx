// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ReloadActivityCard } from './ReloadActivityCard';
import type { AutoReloadActivity } from './types';

afterEach(cleanup);

const activity = (): AutoReloadActivity =>
    ({
        lastReloadAmountUsd: 2000,
        lastReloadAt: '2026-10-01T00:00:00Z',
        attempts: [
            {
                createdAt: '2026-10-02T00:00:00Z',
                outcome: 'declined',
                amountUsd: 2000,
                stripeErrorCode: 'card_declined',
            },
            {
                createdAt: '2026-10-01T00:00:00Z',
                outcome: 'succeeded',
                amountUsd: 2000,
                stripeErrorCode: null,
            },
        ],
    }) as unknown as AutoReloadActivity;

it('OD-B3-01: a failed reload leads with actionable copy; the provider code sits behind a disclosure, never inline', () => {
    render(<ReloadActivityCard activity={activity()} />);

    // Actionable customer copy is the PRIMARY — visible, and NOT hidden inside the diagnostic disclosure.
    const copy = screen.getByText(/update your payment method/i);
    expect(copy.closest('details')).toBeNull();

    // The exact provider code appears ONLY inside a <details> disclosure — never as a bare inline cell.
    const code = screen.getByText(/card_declined/);
    expect(code.closest('details')).not.toBeNull();
});

it('OD-B3-01: a succeeded reload carries no failure copy and no provider code', () => {
    render(<ReloadActivityCard activity={activity()} />);

    // Only the one declined attempt produces actionable copy + a provider code; the succeeded row does not.
    expect(screen.queryAllByText(/update your payment method/i)).toHaveLength(1);
    expect(screen.queryAllByText(/card_declined/)).toHaveLength(1);
});
