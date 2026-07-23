/**
 * A human message off an unknown thrown value — transport-agnostic (no axios, no `@/lib/api-error`).
 * The injected client adapter is expected to throw an `Error` whose `message` is the server's, so
 * this reads it without knowing the transport. Twin of the helper in @splicewire/beam-accounts.
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
    if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string' && message) return message;
    }
    return fallback;
}
