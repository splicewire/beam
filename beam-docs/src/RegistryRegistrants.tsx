import { useEffect, useState } from 'react';
import { docsConfiguration } from './config.js';
import { fetchDocs, type DocsTransport } from './publications.js';
import type { RegistryRegistrantData, RegistryRegistrantsData } from './generated/types.js';

export type { RegistryRegistrantData, RegistryRegistrantsData } from './generated/types.js';

export type RegistryRegistrantsProps = {
    /** The registry root, dotted, verbatim (`beam.particle.resources`). */
    root: string;
    /** Base of the registry routes. Defaults to `configureDocs({ registriesEndpoint })`; null renders nothing. */
    endpoint?: string | null;
    transport?: DocsTransport;
    className?: string;
};

export const REGISTRANTS_CSS = `
.beam-docs-registrants { margin-block: 1.5rem; padding: 1rem 1.25rem; border: 1px solid var(--border, currentColor); border-radius: var(--radius, 0.5rem); font-size: 0.9375rem; line-height: 1.5; }
.beam-docs-registrants h2 { margin: 0 0 0.75rem; font-size: 1rem; font-weight: 650; }
.beam-docs-registrants dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 0.25rem 1rem; margin: 0; }
.beam-docs-registrants dt { color: var(--muted-foreground, GrayText); }
.beam-docs-registrants dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.beam-docs-registrants ul { margin: 0.75rem 0 0; padding: 0; list-style: none; }
.beam-docs-registrants li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.25rem 1rem; padding-block: 0.375rem; border-top: 1px solid var(--border, currentColor); }
.beam-docs-registrants li > code:last-child { color: var(--muted-foreground, GrayText); }
.beam-docs-registrants-note { margin: 0.75rem 0 0; color: var(--muted-foreground, GrayText); }
`;

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const optionalString = (value: unknown) => value === null || typeof value === 'string';

/** The server's answer, or null when it is not the declared shape: an unreadable answer renders nothing. */
export function readRegistrants(value: unknown): RegistryRegistrantsData | null {
    if (!record(value) || typeof value.root !== 'string' || typeof value.recordsRegistrants !== 'boolean') return null;
    if (!(value.describedHere === null || typeof value.describedHere === 'boolean')) return null;
    if (!optionalString(value.owner) || !optionalString(value.describedBy) || !optionalString(value.note)) return null;
    if (!(value.unattributed === null || typeof value.unattributed === 'number')) return null;
    let entries: RegistryRegistrantData[] | null = null;
    if (value.entries !== null) {
        if (!Array.isArray(value.entries)) return null;
        entries = [];
        for (const entry of value.entries) {
            if (!record(entry) || typeof entry.key !== 'string' || typeof entry.registrant !== 'string') return null;
            entries.push({ key: entry.key, registrant: entry.registrant });
        }
    }
    return {
        root: value.root,
        describedHere: value.describedHere,
        owner: value.owner as string | null,
        describedBy: value.describedBy as string | null,
        recordsRegistrants: value.recordsRegistrants,
        entries,
        unattributed: value.unattributed,
        note: value.note as string | null,
    };
}

export function registrantsUrl(endpoint: string, root: string): string {
    return `${endpoint.replace(/\/$/, '')}/${encodeURIComponent(root)}/registrants`;
}

/**
 * The registrant panel of a registry page. Who registers into a registry depends on what the serving site installs,
 * so the page carries only the root and this asks the site (`GET beam/docs/registries/{root}/registrants`).
 *
 * It always shows the registry's owner and who described it to this site. The per-entry list appears only where the
 * server says the registry records registrants; otherwise the server's one-line note stands in for it. The server
 * filters every read, so an entry the reader may not see is never in the answer and never shown here. A failed or
 * unreadable request renders nothing: the page is what the reader came for.
 */
export function RegistryRegistrants({ root, endpoint, transport, className }: RegistryRegistrantsProps) {
    const docs = docsConfiguration();
    const base = endpoint === undefined ? docs.registriesEndpoint ?? null : endpoint;
    const fetcher = transport ?? docs.transport ?? fetchDocs;
    const url = base && root ? registrantsUrl(base, root) : null;
    const [loaded, setLoaded] = useState<{ url: string; data: RegistryRegistrantsData | null } | null>(null);

    useEffect(() => {
        if (!url) return;
        const controller = new AbortController();
        fetcher(url, { signal: controller.signal })
            .then((value) => {
                if (!controller.signal.aborted) setLoaded({ url, data: readRegistrants(value) });
            })
            .catch(() => {
                if (!controller.signal.aborted) setLoaded({ url, data: null });
            });
        return () => controller.abort();
    }, [url, fetcher]);

    const data = loaded?.url === url ? loaded.data : null;
    if (!data || data.root !== root || data.describedHere === null) return null;

    const classes = ['beam-docs-registrants', className].filter(Boolean).join(' ');

    if (data.describedHere === false) {
        return (
            <aside className={classes} aria-label="Registrants on this site" data-registry-root={root}>
                <style>{REGISTRANTS_CSS}</style>
                <p className="beam-docs-registrants-note">{data.note ?? 'not available on this host'}</p>
            </aside>
        );
    }

    const entries = data.recordsRegistrants ? data.entries : null;

    return (
        <aside className={classes} aria-label="Registrants on this site" data-registry-root={root}>
            <style>{REGISTRANTS_CSS}</style>
            <h2>On this site</h2>
            <dl>
                {data.owner && (
                    <>
                        <dt>Owner</dt>
                        <dd><code>{data.owner}</code></dd>
                    </>
                )}
                {data.describedBy && (
                    <>
                        <dt>Described by</dt>
                        <dd><code>{data.describedBy}</code></dd>
                    </>
                )}
            </dl>
            {entries ? (
                <>
                    {entries.length > 0 && (
                        <ul aria-label="Entries and who registered them">
                            {entries.map((entry) => (
                                <li key={entry.key}>
                                    <code>{entry.key}</code>
                                    <code>{entry.registrant}</code>
                                </li>
                            ))}
                        </ul>
                    )}
                    {entries.length === 0 && !data.unattributed && (
                        <p className="beam-docs-registrants-note">Nothing is registered here on this site.</p>
                    )}
                    {data.unattributed ? (
                        <p className="beam-docs-registrants-note">
                            {data.unattributed === 1
                                ? '1 entry does not name who registered it.'
                                : `${data.unattributed} entries do not name who registered them.`}
                        </p>
                    ) : null}
                </>
            ) : (
                data.note && <p className="beam-docs-registrants-note">{data.note}</p>
            )}
        </aside>
    );
}
