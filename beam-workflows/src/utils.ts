/**
 * A human message off an unknown thrown value — transport-agnostic (no axios, no `@/lib/api-error`).
 * The injected client adapter is expected to throw an `Error` whose `message` is the server's, so
 * this reads it without knowing the transport. Twin of the helper in @splicewire/beam-accounts.
 */
// The fallback is required: callers pass a catalog line (no English default here; localization 30, REVIEW-30W3).
export function errorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message) return message;
    }
    return fallback;
}
