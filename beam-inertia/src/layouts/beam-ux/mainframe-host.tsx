import { usePage } from '@inertiajs/react';
import {
    createMainframeHost,
    useBeamUxEntry as useBeamUxEntryBase,
} from '@splicewire/beam-mainframe';
import type {
    EntryRef,
    HostEntryBody,
    RibbonRender,
} from '@splicewire/beam-mainframe';
import { canvasAcceptsFormat, canvasRefusalFor } from '@splicewire/beam-ux/canvas';
import { lazy, Suspense, type ReactNode } from 'react';
import { bodyClient } from '../../editor/transport';

/**
 * The beam-ux **Mainframe host** — the operator front-end's client, a THIN CONFIG over the promoted
 * `createMainframeHost` factory (`@splicewire/beam-mainframe`). The factory owns the generic wiring
 * (registries, mode state, the `?beam_entry` override, the kind-aware `main` fork, the author `can` gate,
 * entry-body load, `useBeamUxEntry`); this host supplies only the host-local pieces: the component→entry
 * map, the ribbon chrome, and the editor/inspector renderers (which mount the promoted visual editor).
 *
 * Two modes (child-swap-under-a-stable-host):
 *   - `domain` (read) — the page renders as the Mainframe `main` payload. `readMode: 'page'` means the
 *     real Inertia page renders unchanged (it carries its own chrome), so read mode is a no-op swap.
 *   - `window` (author WYSIWYG) — for a signed-in author (`ux.author`), `main` swaps to the in-place
 *     visual editor (@/editor).
 */

// The authoring renderers stay host-local (heavy, author-only), lazy-loaded only when authoring.
const VisualEditorMount = lazy(() =>
    import('../../editor/mount').then((m) => ({ default: m.VisualEditorMount })),
);

/**
 * The structured chrome body of a `page` entry — what drives a reshelled page's heading/intro. A page
 * that opts in reads its own chrome FROM the entry, not a hardcoded constant.
 */
export type BeamUxPageBody = {
    heading?: string;
    intent?: string;
    content?: string;
};

/** Body-typed alias over the factory's generic `useBeamUxEntry`; returns `{slug, schema, body}` or null. */
export function useBeamUxEntry() {
    return useBeamUxEntryBase<BeamUxPageBody>();
}

// NO `componentToEntry`, and NO `componentSlugFallback` — the component-name branch is off at this
// host, deliberately (beam-docs-satellite ticket 40).
//
// It is the one branch of the factory's three that cannot carry an id, so leaving it on would have kept
// the slug-addressed macro alive forever: no COMPILE-TIME frontend map can hold a per-database uuid, and
// a starter's whole point is the fresh database it is installed into.
//
// Measured before switching it off, against this starter's seeded set: of its 15 Inertia page components
// the slash-swapped name matched a real `beam_ux_entries` row for exactly TWO — `operator/dashboard` →
// `operator-dashboard` and `settings/profile` → `settings-profile`. (Two more were carried by the
// explicit map: `site/home` → `home`, `account/home` → `dashboard`.) The other eleven probed a slug with
// no row — a 401 per authenticated page view. All four are now bound SERVER-side by
// `App\Support\PageEntryRef` and addressed by id like everything else; the eleven were never bound at all.

// Components that embed `PageEditor` (`@splicewire/beam-ux/canvas`) directly and already listen to
// the SAME `beam-ux:mode`/`edit`/`exit` broadcast this factory uses, swapping their OWN internal
// canvas in place - `site/home.tsx` is the one page here that does. Overlaying the generic
// renderEditor/renderInspector on TOP of one of these double-mounts a second, competing editor
// instance for the same slug; since it loads independently and can render blank/stale before the
// real (working) PageEditor underneath, the visible symptom is "the editor works, then goes blank".
// Read via a plain module variable (not a prop threaded through renderEditor/renderInspector,
// which only ever receive `{slug}`) set during `usePageContext`'s own render, same bridge pattern
// rushing/audiostud's `os/authoring-context.ts` already uses for an equivalent cross-cutting need -
// calling `usePage()` again inside renderEditor/renderInspector themselves would violate the rules
// of hooks (they're plain functions, not components).
const SELF_MANAGED_COMPONENTS = new Set(['site/home']);
let currentComponent = '';

// No on-page ribbon by default — authoring is driven from the operator/OS chrome. `() => null` keeps the
// browsing AND editing surfaces free of beam-ux frame chrome; the editor itself is the only author surface.
const ribbon: RibbonRender = () => null;

/**
 * The entry-body transport — routes through the shared host body client (the SAME transport the editor
 * saves through), so there's one load path. `null` on any miss so the page falls back to its own copy.
 */
async function loadEntryBody(ref: EntryRef): Promise<HostEntryBody | null> {
    // ID-ADDRESSED (`beam-ux-entry.op.body`, ADR-0214 §1). `null` on any miss so the page falls back to
    // its own copy.
    //
    // **A slug-only ref is REFUSED, not resolved.** This starter has no slug→id resolver and
    // deliberately does not want one: it has no auto-provision endpoint to double as one (audiostud's
    // answer), and minting a read-only second resolver would re-introduce the "which row is this slug"
    // disambiguation ADR-0214 §2 deleted, at a new address, on the hot path of every editor open. The
    // only remaining producer of a slug-only ref here is a hand-typed `?beam_entry=<slug>`, for which
    // `?beam_entry_id=<uuid>` is the id-addressed twin (copy the uuid out of /operator/entries).
    if (ref.id === null) {
        return null;
    }

    try {
        return (await bodyClient.loadBody(ref.id)) as HostEntryBody;
    } catch {
        return null;
    }
}

/**
 * The FORMAT gate in front of both authoring renderers: the visual editor mounts only for an entry
 * whose codec can carry a block document; every other format gets a stated refusal, never the canvas.
 *
 * Why a refusal panel and not a missing control: the author DID ask to edit this page, and the dock's
 * affordance is generic. Rendering nothing would read as "the editor is broken"; rendering the canvas
 * is what destroyed the mdx `/docs` entry on 2026-09-11. A sentence naming the format is the only one
 * of the three that is true.
 *
 * Why not mount `@splicewire/beam-mdx`'s `MdxDocumentEditor` here instead — measured, not assumed: it
 * edits a raw MDX STRING, while `beam-ux-entry.save-body` accepts a structured `body` and there is no
 * source-accepting write on that resource. Wiring it needs a client-side frontmatter split (the exact
 * mirroring `MdxBody` exists to prevent) or a new declared input on the op. That is a transport change,
 * not a small one, and it is not this defect's fix — the defect is that the wrong editor opened at all.
 */
export function CanvasOrRefusal({ entry, children }: { entry: EntryRef; children: ReactNode }) {
    if (canvasAcceptsFormat(entry.format)) {
        return <>{children}</>;
    }

    return (
        <div
            data-beam-ux-editor-refused={entry.format ?? 'unknown'}
            role="note"
            className="m-4 rounded-md border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900"
        >
            <p className="font-medium">This page cannot be edited here.</p>
            <p className="mt-2">{canvasRefusalFor(entry.format)}</p>
        </div>
    );
}

export default createMainframeHost({
    // Every starter route page renders its OWN body (its layout chrome + scoped CSS). So read mode must
    // NOT swap the page for the bare entry body. Author (window) mode still opens the in-place editor.
    readMode: 'page',
    usePageContext: () => {
        const page = usePage<{
            auth: { canAuthorUx?: boolean };
            slug?: string;
            entry?: { id?: string; slug?: string; format?: string };
        }>();
        currentComponent = page.component;

        // A RENDERED ENTRY carries its identity at `props.entry.slug` (ADR-0209 §6), not at
        // `props.slug`. Without this line the factory falls back to slash-swapping the Inertia
        // component name — and every rendered entry is the component `site/entry`, so every one of
        // them probed a nonexistent `site-entry` row: a harmless 401 per anonymous page view, and the
        // WRONG row for an author. The renderer already had the id in props; the host just never read
        // it (beam-docs-satellite ticket 26's fog item).
        const entry = page.props.entry;
        const explicit =
            typeof page.props.slug === 'string' && page.props.slug !== ''
                ? page.props.slug
                : null;

        return {
            component: page.component,
            canAuthor: page.props.auth?.canAuthorUx === true,
            slug:
                explicit ??
                (typeof entry?.slug === 'string' && entry.slug !== ''
                    ? entry.slug
                    : null),
            // The ID half of the same prop — the branch that replaced `componentToEntry`. Shared by
            // `App\Support\PageEntryRef` for a hand-written page, and by the package's
            // `PublicEntryController` (ADR-0209 §6) for a RENDERED entry, which has carried it all along.
            entryId:
                typeof entry?.id === 'string' && entry.id !== ''
                    ? entry.id
                    : null,
            // The BODY LANGUAGE half. `PublicEntryController` has always put it in `props.entry.format`
            // and `App\\Support\\PageEntryRef` now does too; the host simply never read it, which is
            // how the JsonDoc canvas came to be offered on the mdx `/docs` entry and blanked it on Save
            // (G2-BEAM-AUTHOR-ENTRY, 2026-09-11). Null means the page did not say.
            entryFormat:
                typeof entry?.format === 'string' && entry.format !== ''
                    ? entry.format
                    : null,
        };
    },
    loadEntryBody,
    ribbon,
    renderEditor: ({ ref }: { ref: EntryRef }) =>
        SELF_MANAGED_COMPONENTS.has(currentComponent) || ref.id === null ? null : (
            <CanvasOrRefusal entry={ref}>
                <Suspense
                    fallback={
                        <div className="p-6 text-sm text-slate-500">
                            Loading editor…
                        </div>
                    }
                >
                    <VisualEditorMount entryRef={ref} />
                </Suspense>
            </CanvasOrRefusal>
        ),
    // readMode: 'page' means the read fork renders the real page, never this — so it's a no-op. Kept only
    // to satisfy the factory's renderer contract.
    renderRead: () => null,
    renderInspector: ({ ref }: { ref: EntryRef }) =>
        SELF_MANAGED_COMPONENTS.has(currentComponent) || ref.id === null ? null : (
            <CanvasOrRefusal entry={ref}>
                <Suspense fallback={null}>
                    <VisualEditorMount entryRef={ref} />
                </Suspense>
            </CanvasOrRefusal>
        ),
});
