/**
 * agreements 15: how the widgets read one Agreement from its `readUrl` (the `beam.agreements.agreements.show` resource).
 *
 * The 428 body and the sign-up schema name the Agreement by a root-relative `readUrl` and carry no content, so a widget
 * must read it. With no reader the widget reads it itself with a same-origin `fetch` that carries cookies only, which is
 * enough for a host whose SPA and API share an origin and a session. A host whose API is on another origin, or
 * authenticates with a bearer token, gives a reader built on its own transport. The reader resolves the resource's
 * `data` and rejects when the read is refused (401, 403, 404) or fails. The widget then refuses to collect a member.
 */

/** The show resource's `data`: one Agreement and its current version. Every field is checked before use. */
export interface AgreementRead {
    key?: unknown;
    kind?: unknown;
    title?: unknown;
    version?: { digest?: unknown; content?: unknown; label?: unknown; effectiveAt?: unknown; summary?: unknown } | null;
}

/** A host's read of `readUrl` through its own transport: resolves the resource's `data`, rejects on any refusal. */
export type AgreementReader = (readUrl: string) => Promise<AgreementRead | null | undefined>;

/** The default reader: a same-origin `fetch` with the session cookie, as every widget read before the reader existed. */
export async function fetchAgreement(readUrl: string): Promise<AgreementRead | undefined> {
    const response = await fetch(readUrl, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
    });
    // In particular, never turn an authorization or missing-row response into usable form state.
    if (response.status === 401 || response.status === 403 || response.status === 404 || !response.ok) {
        throw new Error('Agreement read failed.');
    }
    return ((await response.json()) as { data?: AgreementRead }).data;
}
