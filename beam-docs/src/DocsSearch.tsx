import { reportEvent } from '@splicewire/beam-ux/site';
import { useEffect, useRef, useState } from 'react';
import { docsConfiguration } from './config.js';
import type { DocsSearchResultsData } from './generated/types.js';
import { fetchDocs } from './publications.js';

/**
 * The packaged docs search box (docs-walkthrough DM6, DOC-9; DOCS-14): the header's default `search` slot. It asks
 * `docs.search` (`GET {searchEndpoint}?q=&root=`) for the docs root the page is in, and lists the reader's hits, the API
 * reference surface labelled as such. A miss offers the related product's docs carrying the same query, and arriving with
 * `?q=` (that link) searches it at once. Every row is gated on the server for this reader; the box only draws them.
 *
 * It reports GA4 `search` (an-0237 d8, EP-29) when the reader COMMITS to a term: Enter, following a result, or arriving
 * with `?q=`, once per distinct term. It searches as you type, so a settled query is not a search the reader made.
 */
export function DocsSearch({ root }: { root: string }) {
    const endpoint = docsConfiguration().searchEndpoint;
    const [q, setQ] = useState(() => (typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('q') ?? ''));
    const [found, setFound] = useState<DocsSearchResultsData | null>(null);
    const latest = useRef(0);
    const reported = useRef(new Set<string>());
    const commit = (term: string) => {
        const searchTerm = term.trim();
        if (searchTerm === '' || reported.current.has(searchTerm)) return;
        reported.current.add(searchTerm);
        reportEvent('search', { search_term: searchTerm });
    };

    useEffect(() => {
        // Arriving with `?q=` (a fallback link, a shared URL) is a search the reader asked for.
        if (endpoint) commit(q);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- once, for the term the page arrived with
    }, []);

    useEffect(() => {
        const query = q.trim();
        if (!endpoint || query === '') {
            setFound(null);
            return;
        }
        const ticket = ++latest.current;
        const timer = setTimeout(async () => {
            const transport = docsConfiguration().transport ?? fetchDocs;
            try {
                const raw = (await transport(`${endpoint}?${new URLSearchParams({ q: query, root })}`)) as { data?: DocsSearchResultsData } & DocsSearchResultsData;
                if (ticket === latest.current) setFound(raw.data ?? raw);
            } catch {
                if (ticket === latest.current) setFound({ results: [], fallback: null });
            }
        }, 250);
        return () => clearTimeout(timer);
    }, [q, root, endpoint]);

    if (!endpoint) {
        return null;
    }

    return (
        <div className="beam-docs-search" role="search">
            <input
                type="search"
                aria-label="Search docs"
                placeholder="Search docs"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commit(q);
                }}
            />
            {found && q.trim() !== '' && (
                <div className="beam-docs-search-results" role="listbox" aria-label="Search results">
                    {found.results.map((hit) => (
                        <a key={hit.href} href={hit.href} role="option" aria-selected={false} data-docs-search-hit="" data-kind={hit.kind} onClick={() => commit(q)}>
                            <strong>{hit.title}</strong>
                            {hit.kind === 'reference' && <span> · API reference</span>}
                            {hit.trail.length > 0 && <small>{hit.trail.join(' › ')}</small>}
                            {hit.excerpt && <p>{hit.excerpt}</p>}
                        </a>
                    ))}
                    {found.results.every((hit) => hit.kind !== 'page') && <p>No pages match “{q.trim()}”.</p>}
                    {found.fallback && <a href={found.fallback.href}>{found.fallback.label}</a>}
                </div>
            )}
        </div>
    );
}
