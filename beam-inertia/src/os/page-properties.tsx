// The "Page properties" window — ported from rushing/audiostud's own os/page-properties.tsx (owner
// call 2026-08-07: "Edit this page" opens a `page:{slug}` float carrying the entry's properties, and
// its "Edit content" hands off to the in-place editor for the body).
//
// Until 2026-09-24 this port was trimmed to slug + "Edit content", because audiostud's version wrote a
// bespoke `/beam/ux/meta` surface this starter had no equivalent of. It has one now: the
// `beam-ux-entry` ParticleResource, whose Frame edit form the tenant console already serves. So the
// window's body is THAT form for this page's entry (./entry-properties-form.tsx) — the owner's
// "the window when you edit a page should be the form for the page/entry" — and the body itself stays
// the in-place canvas's job ("Edit content").
//
// One float per page slug (keyed `page:{slug}` by the desk), so several pages' properties can be open
// at once — the SAME reason audiostud's version does this. "Edit content" hands off to the desk (it
// minimizes this window, then dispatches `beam-ux:edit`), matching the audiostud handoff exactly.
import { lazy, Suspense } from 'react';

// Frame's edit shell is author-only weight: loaded when a properties window first opens.
const EntryPropertiesForm = lazy(() => import('./entry-properties-form'));

export function PageProperties({
    slug,
    entryId = null,
    editable,
    editing,
    onEditContent,
    onExitContent,
}: {
    slug: string;
    /**
     * The id of the entry this window's slug names, when the page under it renders that entry. Null
     * when it does not (a window left docked while the author browsed elsewhere, or a page with no row):
     * the form cannot address a slug, by design (ADR-0214 §2), so it says so rather than guessing.
     */
    entryId?: string | null;
    editable: boolean;
    editing: boolean;
    onEditContent: () => void;
    onExitContent: () => void;
}) {
    return (
        <div className="pp">
            <style dangerouslySetInnerHTML={{ __html: PP_CSS }} />
            <div className="pp-head">
                <div className="pp-row pp-meta">
                    <span>
                        slug <b>{slug}</b>
                    </span>
                    <span className={editable ? 'pp-pub on' : 'pp-pub'}>
                        {editable ? '● editable' : '○ read-only'}
                    </span>
                </div>

                <div className="pp-actions">
                    {editing ? (
                        <button
                            type="button"
                            className="pp-btn"
                            onClick={onExitContent}
                        >
                            ✕ Exit editing
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="pp-btn primary"
                            disabled={!editable}
                            onClick={onEditContent}
                        >
                            ✎ Edit content
                        </button>
                    )}
                </div>
            </div>

            <div className="pp-form" data-beam-entry-properties={slug}>
                {entryId ? (
                    <Suspense
                        fallback={
                            <p className="p-4 text-sm text-muted-foreground">
                                Loading the entry form…
                            </p>
                        }
                    >
                        <EntryPropertiesForm entryId={entryId} />
                    </Suspense>
                ) : (
                    <p role="note" className="p-4 text-sm text-muted-foreground">
                        Open the {slug} page to edit its entry here.
                    </p>
                )}
            </div>
        </div>
    );
}

// The window BODY chrome (`.op-win-body`) defaults to a light admin-table surface (the Dashboard
// tool's own look). The HEAD strip (slug, editability, the Edit content handoff) keeps the dark beam
// palette of the desk chrome; the entry form below it sits on the app's own light surface, because it
// is the console's form and renders with the console's shadcn slots. No brand-tokens.css here, so
// every `--beam-*` reference carries the same literal fallback the rest of this desk's chrome does.
const PP_CSS = `
.pp{min-height:100%;display:flex;flex-direction:column;font-size:13px}
.pp-head{padding:14px 20px;display:flex;flex-direction:column;gap:10px;color:var(--beam-ink, #dcede8);background:var(--beam-paper, #08120f)}
.pp-form{flex:1;padding:4px 8px 12px;background:var(--background, #fff);color:var(--foreground, #0f172a)}
.pp-row{display:flex;flex-direction:column;gap:5px}
.pp-meta{flex-direction:row;gap:16px;font-family:ui-monospace,monospace;font-size:11px;color:var(--beam-ink-muted, rgba(220, 237, 232, .5));flex-wrap:wrap;align-items:center}
.pp-meta b{color:var(--beam-ink, #dcede8);font-weight:600}
.pp-pub.on{color:var(--beam-accent, #00b3c8)}
.pp-actions{display:flex;gap:8px;flex-wrap:wrap}
.pp-btn{padding:8px 14px;border-radius:8px;border:1px solid var(--beam-line, #1b2e2a);background:none;color:var(--beam-ink, #dcede8);cursor:pointer;font:inherit;font-size:12px}
.pp-btn:hover:not(:disabled){border-color:var(--beam-accent, #00b3c8)}
.pp-btn:disabled{opacity:.5;cursor:default}
.pp-btn.primary{background:var(--beam-accent, #00b3c8);border-color:var(--beam-accent, #00b3c8);color:#08120f}
.pp-btn.primary:hover:not(:disabled){opacity:.9}
`;
