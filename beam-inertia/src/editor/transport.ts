import { getBeamInertiaConfig } from '../config';
// The host-supplied entry-body transport — the ONE injection seam the promoted editor + Mainframe host
// load/save an entry body through. Mirrors `splicewire/www`'s and `rushing/audiostud`'s: a same-origin,
// cookie-authed load/save over beam-ux's versioned ParticleWriter. Retry off — a failed authoring
// load/save should surface.
//
// ## Addressed by ID, as of beam-docs-satellite ticket 40
//
// It loads/saves over the id-addressed particle operations `beam-ux-entry.body` /
// `beam-ux-entry.save-body` (ADR-0214 §1). It used to fetch the LITERAL
// `/beam/ux/entries/${slug}/body` — the `Route::beamUxEntries()` macro — and that was wrong twice over:
//
//  - **Slug-addressed.** `UxBuilderClient.loadBody` has taken an ID since ADR-0214 §2, and this file
//    declared `bodyClient: UxBuilderClient` while feeding it a slug. A slug and an id are both `string`,
//    so `tsc` never once complained — the annotation asserted something untrue for months (ticket 37
//    dropped the annotation rather than fake it; this is the real fix).
//  - **A literal URL.** A literal silently stops matching the moment the mount moves. `splicewire/www`
//    was bitten by exactly that (ticket 07: the route moved under `api/` and the editor 404'd on every
//    page).
//
// ⚠️ **That protection is GONE as of ADR-0004 (2026-08-27), and this is the literal again.** Wayfinder
// is retired fleet-wide, so the URL below is a template literal keyed by URI, not a helper keyed by
// route name. The hazard the bullet above describes is therefore live once more, and it is not
// theoretical: retiring Wayfinder across the fleet found `splicewire/www` mounting these ops under
// `api/` and `rushing/audiostud` under `/resources/`, so three roots legitimately need three different
// literals here. ADR-0004 accepts that cost explicitly — a mistyped or moved route is now a 404 found
// by a click or a test, not a build error.
//
// So: **if the editor 404s on load or save, check this URL against `php artisan route:list` for
// `beam-ux-entry.body` / `.save-body` before looking anywhere else.** That is the whole failure
// mode, and it is the first thing to rule out.
import type { EntryPublicationState, UxBuilderClient } from '@splicewire/beam-ux';
/** Read the Laravel `XSRF-TOKEN` cookie for the stateful mutating POST. */
function csrfToken(): string {
    const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return m ? decodeURIComponent(m[1]) : '';
}

async function readData(res: Response, what: string): Promise<unknown> {
    if (!res.ok) {
        throw new Error(`${what} ${res.status}`);
    }

    return (await res.json()).data;
}

const defaultBodyClient: UxBuilderClient = {
    /**
     * The read is a GET with NO query string, deliberately: `EntryBodyShowOp` declares `input: false`,
     * and beam's operation controller rejects a GET carrying any query key with a 422. The retired
     * `?namespace=` disambiguator is therefore not merely ignored — appending one fails loudly.
     */
    loadBody: async (id) => {
        const res = await fetch(`/beam-ux-entries/${id}/body`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        });

        return (await readData(res, 'load')) as Awaited<ReturnType<UxBuilderClient['loadBody']>>;
    },
    saveBody: async (id, body) => {
        const res = await fetch(`/beam-ux-entries/${id}/save-body`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': csrfToken(),
                Accept: 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify({ body }),
        });

        return (await readData(res, 'save')) as Awaited<ReturnType<UxBuilderClient['saveBody']>>;
    },
};

// ── the PUBLICATION seam (G2-BEAM-DRAFT-PUBLISH) ─────────────────────────────────────────────────
//
// Four more id-addressed operations on the same resource, mounted by the host beside `save-body`
// (`save-draft` / `publish` / `versions` / `restore`, all `ability: 'ux.author'`). They are OPTIONAL on
// `UxBuilderClient` because a host mounts them deliberately; this default implements them because the
// starters do. An injected client supplies only the operations its host mounts; the dock renders the
// affordance only when the whole seam is present.
//
// The same literal-URL hazard the block above describes applies verbatim: if a draft or publish 404s,
// check these four against `php artisan route:list` before looking anywhere else.
const publicationClient = {
    listVersions: async (id: string) => {
        const res = await fetch(`/beam-ux-entries/${id}/versions`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        });

        return (await readData(res, 'versions')) as EntryPublicationState;
    },
    saveDraft: async (id: string, body: Record<string, unknown>, label?: string) =>
        (await publicationPost(id, 'save-draft', { body, label })) as EntryPublicationState,
    publish: async (id: string, label?: string) =>
        (await publicationPost(id, 'publish', { label })) as EntryPublicationState,
    restoreVersion: async (id: string, ref: string, label?: string) =>
        (await publicationPost(id, 'restore', { ref, label })) as EntryPublicationState,
    // `clear-body` — remove the page's content and return the entry to unauthored. Not the same act as
    // `save-body` with `[]`, which stores an authored empty document. Same ability (`ux.author`).
    clearBody: async (id: string, label?: string) =>
        (await publicationPost(id, 'clear-body', { label })) as EntryPublicationState,
};

/** The shared write leg: a stateful, cookie-authed POST carrying the XSRF header axios would add. */
async function publicationPost(
    id: string,
    op: string,
    payload: Record<string, unknown>,
): Promise<unknown> {
    const res = await fetch(`/beam-ux-entries/${id}/${op}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': csrfToken(),
            Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
    });

    return readData(res, op);
}

export const bodyClient: UxBuilderClient = {
    loadBody: (id) => (getBeamInertiaConfig().entryClient ?? defaultBodyClient).loadBody(id),
    saveBody: (id, body) =>
        (getBeamInertiaConfig().entryClient ?? defaultBodyClient).saveBody(id, body),
    // Configuration is read at use time, as for load/save. An injected client's missing methods
    // stay absent; only the default starter client supplies the default publication routes.
    get listVersions() {
        const client = getBeamInertiaConfig().entryClient ?? publicationClient;
        return client.listVersions?.bind(client);
    },
    get saveDraft() {
        const client = getBeamInertiaConfig().entryClient ?? publicationClient;
        return client.saveDraft?.bind(client);
    },
    get publish() {
        const client = getBeamInertiaConfig().entryClient ?? publicationClient;
        return client.publish?.bind(client);
    },
    get restoreVersion() {
        const client = getBeamInertiaConfig().entryClient ?? publicationClient;
        return client.restoreVersion?.bind(client);
    },
    get clearBody() {
        const client = getBeamInertiaConfig().entryClient ?? publicationClient;
        return client.clearBody?.bind(client);
    },
};
