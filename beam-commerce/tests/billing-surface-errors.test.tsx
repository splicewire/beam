// @vitest-environment jsdom
// C46/XR-2: BillingSurface section read-errors announce (role=alert) and offer Retry only on a 5xx/network
// failure — NEVER a 4xx — while PRESERVING the authored errorMessage copy. No beam-ux dependency.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { BillingSurface, CommerceProvider } from '../src/index';
import type { CommerceClient } from '../src/commerce-provider';

afterEach(cleanup);

// Every section read rejects with the SAME error, so each section renders its terminal.
const rejectingClient = (error: unknown): CommerceClient =>
    ({
        getBudget: vi.fn(async () => { throw error; }),
        getUsageSummary: vi.fn(async () => { throw error; }),
        getBills: vi.fn(async () => { throw error; }),
        getBillPreview: vi.fn(async () => { throw error; }),
    }) as unknown as CommerceClient;

const mount = (error: unknown) => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={qc}>
            <CommerceProvider services={{ client: rejectingClient(error), can: () => true }}>
                <BillingSurface />
            </CommerceProvider>
        </QueryClientProvider> as ReactNode,
    );
};

const err5xx = { response: { status: 503, data: { message: 'Billing backend is unavailable.' } } };
const err4xx = { response: { status: 403, data: { message: 'You cannot view billing for this workspace.' } } };

it('a 5xx read error announces each section (role=alert), preserves the authored fallback copy, and offers Try again', async () => {
    mount(err5xx);
    // On a 5xx, errorMessage deliberately returns the authored, safe FALLBACK (not the server detail) —
    // that authored copy is preserved verbatim inside the announced terminal.
    const alerts = await screen.findAllByRole('alert');
    const budget = alerts.find((a) => a.textContent?.includes('Could not load the budget.'));
    expect(budget, 'the budget section surfaces its authored fallback copy').toBeTruthy();
    // … and a 5xx offers Try again inside the alert.
    expect(within(budget!).getByRole('button', { name: 'Try again' })).toBeTruthy();
});

it('a 4xx read error announces (role=alert) with the authored copy but offers NO Try again', async () => {
    mount(err4xx);
    const alerts = await screen.findAllByRole('alert');
    const anyAlert = alerts.find((a) => a.textContent?.includes('You cannot view billing for this workspace.'));
    expect(anyAlert).toBeTruthy();
    for (const a of alerts) {
        expect(within(a).queryByRole('button', { name: 'Try again' }), 'no Retry on a 4xx').toBeNull();
    }
});
