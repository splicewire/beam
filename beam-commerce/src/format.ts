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
