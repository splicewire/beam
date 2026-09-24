// The in-place editor for a RENDERED entry (`site/entry`), mounted through the packaged page's
// `EntryPageConfig.editableBody` slot so it replaces the compiled body INSIDE the entry's own layout and
// template — the same placement `pages/site/home.tsx` gives the editor on `/`.
//
// Before this, a rendered entry had no in-place editor of its own: the MainframeHost's generic
// `renderInspector` mounted `VisualEditorMount` BESIDE the page, so "Edit content" on beam.test's
// `/about` (2026-09-24) left the read page untouched and stacked an unframed five-region editor under
// the footer, with no draft/publish/versions. `site/entry` is now self-managed (mainframe-host.tsx), and
// this is the one editor it gets: `PageEditor`, the same one `/` uses, addressed by the entry's id.
import { useEditMode } from '@splicewire/beam-ux/canvas';
import type { EntryPayload } from '@splicewire/beam-ux/docs';
import { lazy, Suspense, type ReactNode } from 'react';
import { CanvasOrRefusal } from '../layouts/beam-ux/mainframe-host';

// Author-only and heavy (canvas + frame inspector): loaded on the first edit, never for a reader.
const PageEditor = lazy(() => import('./page-editor'));

export function EditableEntryBody({ entry, children }: { entry: EntryPayload; children: ReactNode }) {
    // True only after the MainframeHost entered window mode, which it does only for an author.
    const editing = useEditMode();

    if (!editing) {
        return <>{children}</>;
    }

    const ref = { id: entry.id, slug: entry.slug, format: entry.format };

    return (
        <div data-beam-entry-editor={entry.slug}>
            {/* The format gate stays in front of the canvas: an mdx entry gets the stated refusal, in
                the body region where the author was looking, never a JsonDoc canvas. */}
            <CanvasOrRefusal entry={ref}>
                <Suspense
                    fallback={
                        <div style={{ padding: 24, color: '#64748b', fontSize: 13 }}>Loading editor…</div>
                    }
                >
                    <PageEditor slug={entry.slug} body={null} entryId={entry.id} />
                </Suspense>
            </CanvasOrRefusal>
        </div>
    );
}

export default EditableEntryBody;
