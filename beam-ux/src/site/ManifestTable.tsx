// @splicewire/beam-ux/site — the generic contributed-manifest table (ADR-0210 §5).
//
// A contributing beam package (beam-mcp is the first) mounts a read-only JSON endpoint and seeds a
// docs page whose body names THIS component. That is the whole contribution: a seed row, an endpoint,
// and this generic component — so the contributor ships ZERO frontend and gains no dependency on
// beam-ux. Nothing here knows what a "tool" is; it renders the declared `{name, title, description}`
// shape from a URL.
//
// Data logic lives INSIDE the component (react-query: namespaced keys, caching, the loading/error/
// empty states) while the WIRE is injected — the `fetcher` seam, defaulting to global `fetch`. This
// is the same split the `/` shelf's hooks make (rehome-ui, ADR-0116); it just takes its transport as
// a prop rather than from a provider, because `/site` is prop-driven chrome with no context of its own.
//
// Absence degrades LOUDLY and in the right direction (ADR-0210 §6): a 404 — the contributor was
// uninstalled while the site-owned page survived — renders an inline "not installed" empty state and
// the page still 200s. Any other failure is an error state. Uninstalled and broken never look alike.
//
// Theme-neutral like the rest of the shelf: no palette, no fonts, every element class-hooked.
//
// NOTE: `<ManifestTable>` calls `useQuery`, so it must mount under the host's `QueryClientProvider`
// (react-query is already a beam-ux peer dependency). A host rendering server-side, or one with the
// payload already in hand, uses {@link ManifestTableView} — the pure renderer this wraps.
import { useQuery } from '@tanstack/react-query';
import type { CSSProperties, ReactNode } from 'react';
import type {
    ManifestAvailability,
    ManifestEntry,
    ManifestFetchResult,
    ManifestFetcher,
    ManifestPayload,
} from './types.js';

/** Normalize the tolerated payload shapes (`{ items }` or a bare array) to entries. */
function readPayload(payload: unknown): ManifestEntry[] {
    const raw: unknown = Array.isArray(payload) ? payload : (payload as { items?: unknown })?.items;
    if (!Array.isArray(raw)) {
        throw new Error('beam-ux ManifestTable: endpoint did not return `{ items: [] }` or an array.');
    }
    return raw as ManifestEntry[];
}

/**
 * The default transport: global `fetch`, JSON, with 404 mapped to `absent` rather than an error.
 * Exported so a host wrapping it (auth headers, a base URL) keeps the absence contract for free.
 */
export const fetchManifest: ManifestFetcher = async (url) => {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (response.status === 404) return { status: 'absent' };
    if (!response.ok) {
        throw new Error(`beam-ux ManifestTable: ${url} responded ${response.status}.`);
    }
    return { status: 'ok', items: readPayload((await response.json()) as ManifestPayload) };
};

/** Class hooks for every element the table emits — each optional, none defaulted to a palette. */
export type ManifestTableClassNames = {
    root?: string;
    row?: string;
    name?: string;
    title?: string;
    description?: string;
    /** The per-caller availability mark, when an overlay is supplied. */
    mark?: string;
    /** The "not installed" / empty / error message wrapper. */
    message?: string;
};

export type ManifestTableViewProps = {
    /** The advertised entries. */
    items: ManifestEntry[];
    /** Optional per-caller overlay keyed by entry `name` (ADR-0210 §4). Absent ⇒ no marks rendered. */
    availability?: Record<string, ManifestAvailability> | null;
    /** Rendered instead of the rows when the contributor's endpoint 404s. */
    notInstalled?: ReactNode;
    /** Rendered when the endpoint is present but advertises nothing. */
    empty?: ReactNode;
    /** Which absence this is — drives which message shows when `items` is empty. */
    absent?: boolean;
    classNames?: ManifestTableClassNames;
    style?: CSSProperties;
};

/**
 * The pure renderer — data in, markup out, no fetching. Use directly for SSR, for a host that already
 * has the payload, or in a page that must not depend on a `QueryClientProvider`.
 */
export function ManifestTableView({
    items,
    availability,
    notInstalled,
    empty,
    absent = false,
    classNames,
    style,
}: ManifestTableViewProps) {
    if (absent) {
        return (
            <div className={classNames?.message} style={style} data-beam-ux-manifest="not-installed">
                {notInstalled ?? 'This surface is not installed on this site.'}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className={classNames?.message} style={style} data-beam-ux-manifest="empty">
                {empty ?? 'Nothing is advertised here yet.'}
            </div>
        );
    }

    return (
        <table className={classNames?.root} style={style} data-beam-ux-manifest="ok">
            <tbody>
                {items.map((item) => {
                    const mark = availability?.[item.name];
                    return (
                        <tr key={item.name} className={classNames?.row}>
                            <td>
                                <code className={classNames?.name}>{item.name}</code>
                                {mark && (
                                    <span
                                        className={classNames?.mark}
                                        data-available={mark.available}
                                        title={mark.available ? 'Available to you' : 'Not available to you'}
                                    >
                                        {mark.label ?? (mark.available ? 'available' : 'unavailable')}
                                    </span>
                                )}
                            </td>
                            <td>
                                {item.title && <span className={classNames?.title}>{item.title}</span>}
                                {item.description && (
                                    <p className={classNames?.description}>{item.description}</p>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

export type ManifestTableProps = Omit<ManifestTableViewProps, 'items' | 'absent'> & {
    /** The contributor-mounted JSON endpoint (e.g. `/beam/mcp/manifest.json`). */
    endpoint: string;
    /** Injected transport. Defaults to {@link fetchManifest} over global `fetch`. */
    fetcher?: ManifestFetcher;
    /** Rendered while the first read is in flight. */
    loading?: ReactNode;
    /** Rendered when the read fails for any reason OTHER than a 404. */
    error?: ReactNode | ((err: unknown) => ReactNode);
};

export function ManifestTable({
    endpoint,
    fetcher = fetchManifest,
    loading,
    error,
    ...view
}: ManifestTableProps) {
    // Namespaced `['beam-ux', …]` like the `/` shelf's keys, so a host's cache never collides.
    const query = useQuery<ManifestFetchResult>({
        queryKey: ['beam-ux', 'site', 'manifest', endpoint],
        queryFn: () => fetcher(endpoint),
    });

    if (query.isPending) {
        return (
            <div className={view.classNames?.message} data-beam-ux-manifest="loading">
                {loading ?? 'Loading…'}
            </div>
        );
    }

    if (query.isError) {
        return (
            <div className={view.classNames?.message} data-beam-ux-manifest="error">
                {typeof error === 'function' ? error(query.error) : (error ?? 'Could not load this list.')}
            </div>
        );
    }

    const result = query.data;
    return (
        <ManifestTableView
            {...view}
            absent={result.status === 'absent'}
            items={result.status === 'ok' ? result.items : []}
        />
    );
}
