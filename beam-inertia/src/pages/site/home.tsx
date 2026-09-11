import { Head } from '@inertiajs/react';
import { useEditMode } from '@splicewire/beam-ux/canvas';
import { EntryBody } from '@splicewire/beam-ux/site';
import PageEditor from '../../editor/page-editor';
import SiteLayout from '../../layouts/site-layout';

/**
 * A public SITE-realm page rendering through the OOTB `<SiteLayout>` (`@splicewire/beam-ux/site`), with
 * the in-place VISUAL EDITOR (`@splicewire/beam-ux/canvas`) mounted where the page content goes. For an
 * author, the MainframeHost's `beam-ux:mode` broadcast flips that mount into the editing canvas. So this
 * one file proves BOTH promoted surfaces: the site chrome AND the in-place editor, from config only.
 *
 * ## The read fork, and why it is not the editor's read mode
 *
 * Measured on beam.test 2026-09-11 (G2-BEAM-AUTHOR-ENTRY): an owner authored `/` through the in-place
 * editor and Save reported "Saved" — truthfully. The body reached the particle (`resources/beam-ux/…/
 * home.tsx` was written) and the artifact compiled with the new heading in it. And no reader ever saw
 * the change, as owner or guest, reload after reload.
 *
 * The cause was here. `<PageEditor body={null}>` seeds from `fallbackDoc(slug)` and its READ mode is
 * `TreeRender` over that seed, so the surface that renders `/` for a reader was a packaged DEFAULT TREE
 * that no save could ever reach. The saved body was not lost; it was unreachable. Every `{path}` entry
 * on this host already read the right way — `PublicEntryController` shares `{url, version}` and the page
 * imports the compiled artifact through `<EntryBody>`. A hand-written page simply had no way to say it,
 * until `PageEntryData` grew an `artifact`.
 *
 * So: **read mode with an artifact reads the artifact**, exactly like a rendered entry. Only when there
 * is none (a database that was never seeded, or a page that has never been authored) does the packaged
 * default tree render — which is the honest answer there, and the one that made this page a useful
 * out-of-the-box front door in the first place.
 *
 * Author (window) mode always mounts `<PageEditor>`: the editor edits the SOURCE body, never the
 * compiled artifact, and an author who has just saved must see their own document rather than a module
 * compiled from it.
 */
export default function SiteHome({
    entry = null,
}: {
    entry?: {
        id: string;
        slug: string;
        format?: string | null;
        artifact?: { url: string; version?: string | null } | null;
    } | null;
}) {
    const editing = useEditMode();
    const artifact = entry?.artifact ?? null;

    return (
        <SiteLayout>
            <Head title="Home" />
            <div
                style={{
                    maxWidth: 900,
                    margin: '0 auto',
                    padding: 'clamp(24px,5vw,48px) clamp(18px,5vw,40px)',
                }}
            >
                {!editing && artifact ? (
                    // The reader's path: the compiled body at its version-pinned address, the same one
                    // every rendered entry takes. No client-side compile fallback (ADR-0209 §7).
                    <EntryBody artifact={artifact} />
                ) : (
                    /* The editable page body, and the no-artifact default. slug `home` → its default
                       JsonDoc (editor/defaults.ts) until a save persists a real body. `entryId` is the
                       ADDRESS the save goes to (ADR-0214 §2), shared server-side by
                       `App\Support\PageEntryRef`; the slug is only the seed key and the editor label. */
                    <PageEditor
                        slug="home"
                        body={null}
                        entryId={entry?.id ?? null}
                    />
                )}
            </div>
        </SiteLayout>
    );
}
