// The package's own presentation helpers — ported from the app's settings/api so the rehomed
// cards reach for nothing app-local (rehome-ui deny-list). Dependency-free.

export function formatUsd(value: number): string {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function formatDate(value: string | null | undefined): string {
    return value ? new Date(value).toLocaleDateString() : '—';
}

/**
 * A transport-agnostic error message extractor. The app version read axios' response body; the
 * package can't import axios (the client is injected), so this reads the conventional
 * `{ message }` an adapter surfaces, then falls back to `Error.message`, then the fallback.
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
    if (error && typeof error === 'object') {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message !== '') return message;
    }
    return fallback;
}

/**
 * A bill line's component, named for a person (X shot review, integrator 8196619a item c). The wire carries the
 * billing registry key (laravel-beam-commerce BillGenerator: SubscriptionFee, PerSeatFees, PerTokenFees); an unknown
 * key is humanized ('MeteredWidgets' -> 'Metered widgets') rather than shown raw.
 */
const COMPONENT_LABELS: Record<string, string> = {
    SubscriptionFee: 'Subscription',
    PerSeatFees: 'Seats',
    PerTokenFees: 'Token usage',
};

export function componentLabel(key: string | null | undefined): string {
    if (!key) return '';
    if (COMPONENT_LABELS[key]) return COMPONENT_LABELS[key];
    const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim().toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * A credit-ledger reason, named for a person: an engine top-up reason (`topup:<checkout ref>`) reads 'Credit top-up'
 * (the reference is already shown beneath it as purchaseRef); any other reason is shown as recorded.
 */
export function ledgerReasonLabel(reason: string | null | undefined): string {
    if (!reason) return '';
    return /^topup:/i.test(reason) ? 'Credit top-up' : reason;
}
