// The Puck page authoring surface — beam-ux's structural front-end editor. A beam-ux `page` IS a
// Puck-composed structural template: the page-entry body IS the Puck `Data` ({root, content, zones}),
// authored by dragging TSX blocks onto a canvas, with content editors (e.g. an mdx WYSIWYG) mounting
// as custom fields INSIDE blocks. This is the DEFAULT way a beam-ux page is edited on the front-end;
// the `form`-kind RegionInspector is the fallback for non-composed regions.
//
// The BLOCK VOCABULARY is host-injected — a host passes its own Puck `config` (its Heading/Prose/…
// blocks). The machinery here (load → edit → publish → render, the Data normalization) travels with
// the package, parameterized by that config, exactly like the transport client seam.

import { Puck, Render, type Config, type Data } from '@measured/puck';
import { useEffect, useState } from 'react';
import { useEntryBody, useSaveEntryBody } from './hooks';

/** Is this loaded entry body already a Puck Data document (has a `content` array)? */
export function isPuckData(body: unknown): body is Data {
    return !!body && typeof body === 'object' && Array.isArray((body as { content?: unknown }).content);
}

/**
 * Normalize a loaded body into a Puck-shaped Data. A JSON codec may serialize empty `root`/`zones`
 * objects as `[]` (empty array), but Puck expects `root: {props?}` (an object) and `zones` as an
 * object map — so coerce any array-shaped / missing `root`/`zones` back to `{}`. Idempotent.
 */
export function normalizePuckData(body: Data): Data {
    const b = { ...(body as unknown as Record<string, unknown>) };
    if (Array.isArray(b.root) || b.root == null) b.root = {};
    if (Array.isArray(b.zones) || b.zones == null) b.zones = {};
    return b as unknown as Data;
}

export interface PuckPageProps {
    /** The page-entry slug — the canonical record the body loads from / publishes to. */
    slug: string;
    /** The host's Puck config — its block vocabulary (Heading, Prose, …). */
    config: Config;
    /** Seed Data for a page whose body isn't Puck Data yet (first author). Defaults to an empty doc. */
    seed?: (slug: string) => Data;
}

const EMPTY_SEED = (): Data => ({ root: {}, content: [], zones: {} }) as Data;

/**
 * `PuckPage` — the beam-ux structural editor mounted in a host's author (window) mode. Loads the
 * page-entry body over the injected transport (via `useEntryBody`), edits it through `<Puck>`, and
 * on publish saves the composed Data back through `useSaveEntryBody` → the host transport → beam-core's
 * versioned ParticleWriter. Seeds a default doc when the body isn't Puck Data yet (the first publish
 * persists it). The block vocabulary is the host-passed `config`.
 */
export function PuckPage({ slug, config, seed = EMPTY_SEED }: PuckPageProps) {
    const { data: entry, isLoading } = useEntryBody(slug);
    const save = useSaveEntryBody();
    const [data, setData] = useState<Data | null>(null);

    useEffect(() => {
        if (!entry) return;
        const body = entry.body as unknown;
        setData(isPuckData(body) ? normalizePuckData(body) : seed(slug));
        // seed is intentionally excluded — a stable identity per mount is the host's responsibility.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entry, slug]);

    if (isLoading || data === null) {
        return <div className="p-6 text-sm opacity-70">Loading page entry…</div>;
    }

    return (
        <div style={{ height: '100%' }} data-beam-ux-puck-editor={slug}>
            <Puck
                config={config}
                data={data}
                onPublish={(next: Data) =>
                    // Feedback (success/error toast) rides inside useSaveEntryBody via the injected notify sink.
                    save.mutate({ slug, body: next as unknown as Record<string, unknown> })
                }
            />
        </div>
    );
}

export interface PuckPageRenderProps {
    /** The loaded entry body — rendered when it's Puck Data, else `null` (host falls back). */
    body: unknown;
    /** The host's Puck config — must match the config the page was authored under. */
    config: Config;
}

/**
 * `PuckPageRender` — the read view for a composed page. Renders the Puck `Data` with the host config
 * that authored it. Returns `null` when the body isn't Puck Data yet, so the host can fall back to a
 * page's own chrome (never blank).
 */
export function PuckPageRender({ body, config }: PuckPageRenderProps) {
    if (!isPuckData(body)) return null;
    return <Render config={config} data={normalizePuckData(body)} />;
}
