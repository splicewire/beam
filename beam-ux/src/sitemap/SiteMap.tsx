/**
 * The Site map (owner-review-20261102 research 37): the Site section's index, one surface over a site's pages, their
 * publication, search, files and old addresses. Three views behind one toggle — Outline (the default), Canvas and
 * Columns — share one selection and one page inspector (the owner's 2026-11-06 ruling); the chosen view is remembered
 * per viewer. A "Site parts" group lists the non-page entries with the same doors.
 *
 * Transport-agnostic: the host reads `beam-ux-site-map` (pages), `beam-ux-redirect`'s `traces` read and its entries
 * (parts) however it reads resources, and supplies the doors. The map never edits a body; "Open in editor" is X8's one
 * Entry editor.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@schemastud/ui';
import { browserViewStore, SiteMapHeader, useSheetLayout, type SiteMapViewStore } from './chrome';
import { buildTree, looseRows, summarize, visibleIds, type MapFilter } from './model';
import { LooseRedirects, PageInspector, SiteParts } from './parts';
import { OutlineView } from './OutlineView';
import { CanvasView } from './CanvasView';
import { ColumnsView } from './ColumnsView';
import type { RedirectTrace, SiteMapActions, SiteMapPage, SiteMapView, SitePart } from './types';
import type { SiteMapViewProps } from './views';

export interface SiteMapProps extends SiteMapActions {
    pages: SiteMapPage[];
    traces?: RedirectTrace[];
    parts?: SitePart[];
    siteName?: string;
    /** Controlled view. Omit it and the map keeps its own, remembered in `viewStore`. */
    view?: SiteMapView;
    onViewChange?: (view: SiteMapView) => void;
    /** Where an uncontrolled view is remembered for this viewer (default: this browser's localStorage). */
    viewStore?: SiteMapViewStore | null;
    defaultView?: SiteMapView;
    selectedId?: string | null;
    onSelectedChange?: (id: string | null) => void;
    defaultSelectedId?: string | null;
    defaultFilter?: MapFilter;
    /** Extra header actions (a host's "New page", say). */
    actions?: ReactNode;
    className?: string;
}

export function SiteMap({
    pages, traces = [], parts = [], siteName, view: controlledView, onViewChange, viewStore, defaultView = 'outline',
    selectedId, onSelectedChange, defaultSelectedId = null, defaultFilter = 'all', actions, className,
    onOpen, onPageSettings, onAddRedirect, onOpenRedirect, onFileAction,
}: SiteMapProps) {
    const store = useMemo(() => (viewStore === undefined ? browserViewStore() : viewStore), [viewStore]);
    const [ownView, setOwnView] = useState<SiteMapView>(() => store?.get() ?? defaultView);
    // A different viewer (a different store) brings that viewer's remembered view.
    useEffect(() => { setOwnView(store?.get() ?? defaultView); }, [store]); // eslint-disable-line react-hooks/exhaustive-deps
    const view = controlledView ?? ownView;
    const setView = (next: SiteMapView) => {
        if (controlledView === undefined) setOwnView(next);
        store?.set(next);
        onViewChange?.(next);
    };

    const sheet = useSheetLayout();
    const [ownSelected, setOwnSelected] = useState<string | null>(defaultSelectedId);
    const selected = selectedId !== undefined ? selectedId : ownSelected;
    // At phone width the map paints first; the inspector rises as a sheet only once a page is chosen.
    const [inspecting, setInspecting] = useState<boolean>(() => !!defaultSelectedId && !sheet);
    const select = (id: string | null) => {
        if (selectedId === undefined) setOwnSelected(id);
        onSelectedChange?.(id);
        setInspecting(id !== null);
    };

    const [filter, setFilter] = useState<MapFilter>(defaultFilter);
    const [query, setQuery] = useState('');
    const byId = useMemo(() => new Map(pages.map((p) => [p.id, p])), [pages]);
    const roots = useMemo(() => buildTree(pages), [pages]);
    const summary = useMemo(() => summarize(pages, traces), [pages, traces]);
    const { keep, matched } = useMemo(() => visibleIds(pages, filter, query), [pages, filter, query]);
    const filtering = filter !== 'all' || query.trim() !== '';
    const loose = useMemo(() => looseRows(traces, new Set(pages.map((p) => p.id))), [traces, pages]);
    const page = selected ? byId.get(selected) : undefined;
    const showInspector = !!page && (!sheet || inspecting);

    useEffect(() => {
        if (!sheet || !showInspector) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setInspecting(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [sheet, showInspector]);

    const footer = (
        <>
            {(filter === 'all' || filter === 'attention') && !query && loose.length > 0 && (
                <section aria-labelledby="site-map-loose" data-loose className="mt-6 border-t border-border">
                    <h2 id="site-map-loose" className="px-4 pb-1 pt-4 text-[13px] font-semibold md:px-6">Redirects that reach no page</h2>
                    <p className="px-4 pb-2 text-xs text-foreground/70 md:px-6">Loops and addresses that leave the site. Every other redirect sits on the page it reaches.</p>
                    <LooseRedirects traces={loose} onOpen={onOpenRedirect} />
                </section>
            )}
            {filter === 'all' && !query && <SiteParts parts={parts} onOpen={onOpen} />}
            {sheet && showInspector && <div aria-hidden className="h-[60dvh]" />}
        </>
    );
    const viewProps: SiteMapViewProps = {
        roots, pages, byId, summary, traces, filter, query, filtering, keep, matched, selected,
        onSelect: (id) => select(id),
        onOpenPage: (id) => { const p = byId.get(id); if (p) onOpen({ kind: 'page', page: p }); },
        footer,
    };

    return (
        <div className={cn('flex h-full min-h-0 flex-col bg-background text-foreground', className)} data-site-map-view={view}>
            <SiteMapHeader siteName={siteName} summary={summary} filter={filter} onFilter={setFilter} query={query} onQuery={setQuery}
                view={view} onView={setView} actions={actions} />
            <div className={cn('grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)]', showInspector && !sheet && 'lg:grid-cols-[minmax(0,1fr)_23rem]')}>
                {view === 'outline' && <OutlineView {...viewProps} />}
                {view === 'canvas' && <CanvasView {...viewProps} />}
                {view === 'columns' && <ColumnsView {...viewProps} />}
                {showInspector && page && (
                    <div className={cn(sheet ? 'fixed inset-x-0 bottom-0 z-20' : 'min-h-0 border-l border-border')}>
                        <PageInspector page={page} parent={page.parentId ? byId.get(page.parentId) : undefined}
                            onSelect={(id) => select(id)} onClose={() => (sheet ? setInspecting(false) : select(null))} sheet={sheet}
                            onOpen={onOpen} onPageSettings={onPageSettings} onAddRedirect={onAddRedirect} onOpenRedirect={onOpenRedirect} onFileAction={onFileAction} />
                    </div>
                )}
            </div>
        </div>
    );
}
