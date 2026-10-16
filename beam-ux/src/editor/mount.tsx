// Window-mode ("Edit content") mount — a THIN host wrapper over @splicewire/beam-ux/canvas's promoted
// VisualEditor. Loads the entry's body (JsonDoc) through the host transport, edits it, and saves back. A
// body that isn't a JsonDoc yet (or none) starts from the slug default (or an empty root). Mounted by the
// Mainframe host's window (author) mode.
//
// ID-ADDRESSED as of beam-docs-satellite ticket 40. It is mounted by the Mainframe host, which hands it
// an `EntryRef` — `{id, slug}` — instead of the bare slug it used to resolve off the Inertia component
// name. The slug survives only as the `defaultTreeFor()` SEED key: it names the page, not the row.
type EntryRef = { id: string | null; slug: string | null; format?: string | null };
import type { JsonDoc } from '../blockdoc/json';
import { CanvasProvider, VisualEditor } from '../canvas';
import { useEffect, useState } from 'react';
import { asDoc } from './page-editor';
import { useEditorKit } from './context';

const EMPTY: JsonDoc = [
    {
        kind: 'block',
        name: 'div',
        isComponent: false,
        dynamic: false,
        props: [{ name: 'className', kind: 'string', value: 'page' }],
        children: [],
    },
];

/**
 * The per-slug SEED tree for a page with no persisted body yet. Keyed by slug because it is a FRONTEND
 * default, not an address — a ref carrying no slug simply gets the empty root.
 */
function seedFor(slug: string | null, defaultTreeFor: (slug: string) => JsonDoc | null): JsonDoc {
    return slug === null ? EMPTY : defaultTreeFor(slug) ?? EMPTY;
}

export function VisualEditorMount({ entryRef }: { entryRef: EntryRef }) {
    const { transport: bodyClient, theme, canvasConfig, defaultTreeFor, notify: toast } = useEditorKit();
    const entryId = entryRef.id;
    const slug = entryRef.slug;
    // With no id there is nothing to load, so the seed IS the initial state — no effect, no loading
    // flash. Reachable only for a ref that genuinely has no id (a hand-typed `?beam_entry=<slug>`,
    // which this starter deliberately does not resolve — see mainframe-host.tsx).
    const [loaded, setLoaded] = useState<{
        entryId: string | null;
        slug: string | null;
        doc: JsonDoc | null;
        failed?: boolean;
    } | null>(null);
    const current = loaded?.entryId === entryId && loaded.slug === slug ? loaded : null;
    const doc = current?.doc ?? (entryId === null ? seedFor(slug, defaultTreeFor) : null);
    // theme-entries-and-authoring ticket `str-01`: the server-resolved theme (ThemeResolver cascade)
    // replaces the static NEUTRAL_THEME import — NEUTRAL_THEME stays as the degrade-safe fallback for
    // when the prop is absent (a stale build, or a request that never reached HandleInertiaRequests).


    useEffect(() => {
        if (entryId === null) {
            return;
        }

        let live = true;
        const fallback = () => seedFor(slug, defaultTreeFor);
        bodyClient
            .loadBody(entryId)
            .then((env) => {
                const body = (env as { body?: unknown })?.body;

                if (live) {
                    setLoaded({ entryId, slug, doc: asDoc(body) ?? fallback() });
                }
            })
            .catch(() => live && setLoaded({ entryId, slug, doc: null, failed: true }));

        return () => {
            live = false;
        };
    }, [entryId, slug]);

    if (current?.failed) {
        return <div role="alert">Could not load this page’s saved content.</div>;
    }

    if (!doc) {
        return <div style={{ padding: 24, color: '#64748b', fontSize: 13 }}>Loading editor…</div>;
    }

    const save = async () => {
        // Unconditional now: without an id there is no address to save to. This used to be reachable
        // with a slug and no id at all, which is exactly the shape ADR-0214 §2 made unrepresentable.
        if (entryId === null) {
            toast.error('This page is not bound to an entry');

            return;
        }

        try {
            await bodyClient.saveBody(entryId, doc as unknown as Record<string, unknown>);
            toast.success('Saved');
        } catch {
            toast.error('Save failed');
        }
    };

    return (
        <CanvasProvider config={canvasConfig}>
            <VisualEditor
                key={entryId ?? slug}
                value={doc}
                onChange={(doc) => setLoaded({ entryId, slug, doc })}
                onSave={save}
                theme={theme}
                brand="beam-starter · visual editor"
            />
        </CanvasProvider>
    );
}

export default VisualEditorMount;
