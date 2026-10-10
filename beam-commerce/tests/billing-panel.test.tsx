import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommerceBillingPanel } from '../src/index';

vi.mock('../src/BillingSurface', () => ({
    BillingSurface: ({ embedded, subscribeHref }: { embedded?: boolean; subscribeHref?: string }) => (
        <p data-testid="budget-usage-bills" data-subscribe-href={subscribeHref ?? ''}>
            {embedded ? 'embedded' : 'page'}
        </p>
    ),
}));
vi.mock('../src/SubscriptionSurface', () => ({
    SubscriptionSurface: ({ embedded }: { embedded?: boolean }) => (
        <p data-testid="subscription">{embedded ? 'embedded' : 'page'}</p>
    ),
}));
vi.mock('../src/CreditsSurface', () => ({
    CreditsSurface: ({ embedded }: { embedded?: boolean }) => (
        <p data-testid="credits">{embedded ? 'embedded' : 'page'}</p>
    ),
}));

afterEach(cleanup);

describe('CommerceBillingPanel', () => {
    it('renders one page heading and every paid surface as an embedded panel', () => {
        const { container } = render(<CommerceBillingPanel custody="hosted" autoReload={<p data-testid="auto-reload">Auto-reload</p>} />);

        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        expect(screen.getByRole('heading', { level: 1, name: 'Billing' })).toBeTruthy();
        expect(screen.getByTestId('budget-usage-bills').textContent).toBe('embedded');
        expect(screen.getByTestId('subscription').textContent).toBe('embedded');
        expect(screen.getByTestId('credits').textContent).toBe('embedded');
        expect(screen.getByTestId('auto-reload')).toBeTruthy();
        expect(container.querySelector('#subscription')?.getAttribute('data-commerce-panel')).toBe('subscription');
        // The bill preview's 'Choose a plan' targets exactly the section this panel renders.
        expect(screen.getByTestId('budget-usage-bills').getAttribute('data-subscribe-href')).toBe('#subscription');
    });

    it('keeps honest usage and budget but omits every paid surface under no custody', () => {
        render(<CommerceBillingPanel custody="none" autoReload={<p data-testid="auto-reload">Auto-reload</p>} />);

        expect(screen.getByTestId('budget-usage-bills')).toBeTruthy();
        expect(screen.queryByTestId('subscription')).toBeNull();
        expect(screen.queryByTestId('credits')).toBeNull();
        expect(screen.queryByTestId('auto-reload')).toBeNull();
        // No subscription section under no custody, so no subscribe target for the bill preview.
        expect(screen.getByTestId('budget-usage-bills').getAttribute('data-subscribe-href')).toBe('');
    });

    it('focuses and scrolls the panel selected by a payment return', async () => {
        const scrollIntoView = vi.fn();
        HTMLElement.prototype.scrollIntoView = scrollIntoView;

        const { container } = render(<CommerceBillingPanel custody="hosted" selectedPanel="credits" />);
        const credits = container.querySelector<HTMLElement>('[data-commerce-panel="credits"]');

        await waitFor(() => expect(document.activeElement).toBe(credits));
        expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    });
});
