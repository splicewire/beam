/** The Site map's header: its summary, the view toggle, the filters and the finder. Shared by every view. */
import * as React from 'react';
import { Columns3, ListTree, Network, Search } from 'lucide-react';
import { cn } from '@schemastud/ui';
import type { MapFilter, SiteMapSummary } from './model';
import type { SiteMapView } from './types';

export const VIEWS: { key: SiteMapView; label: string; Icon: typeof ListTree }[] = [
    { key: 'outline', label: 'Outline', Icon: ListTree },
    { key: 'canvas', label: 'Canvas', Icon: Network },
    { key: 'columns', label: 'Columns', Icon: Columns3 },
];

/** Radio-group keyboard: arrows move and choose, as the WAI-ARIA radio pattern does. */
function useRadioKeys<T extends string>(keys: T[], value: T, onChange: (v: T) => void) {
    return (e: React.KeyboardEvent<HTMLElement>) => {
        const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = keys[(keys.indexOf(value) + step + keys.length) % keys.length];
        onChange(next);
        (e.currentTarget.querySelector(`[data-key="${next}"]`) as HTMLElement | null)?.focus();
    };
}

export function ViewToggle({ view, onView }: { view: SiteMapView; onView: (v: SiteMapView) => void }) {
    const onKey = useRadioKeys(VIEWS.map((v) => v.key), view, onView);
    return (
        <div role="radiogroup" aria-label="View" onKeyDown={onKey} className="inline-flex shrink-0 rounded-md border border-border p-0.5">
            {VIEWS.map(({ key, label, Icon }) => (
                <button key={key} type="button" role="radio" data-key={key} aria-checked={view === key} tabIndex={view === key ? 0 : -1}
                    onClick={() => onView(key)}
                    className={cn('inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        view === key ? 'bg-foreground text-background' : 'text-foreground/75 hover:bg-muted hover:text-foreground')}>
                    <Icon aria-hidden className="size-3.5" />{label}
                </button>
            ))}
        </div>
    );
}

export function SiteMapHeader({ siteName, summary, filter, onFilter, query, onQuery, view, onView, actions }: {
    siteName?: string;
    summary: SiteMapSummary;
    filter: MapFilter;
    onFilter: (f: MapFilter) => void;
    query: string;
    onQuery: (q: string) => void;
    view: SiteMapView;
    onView: (v: SiteMapView) => void;
    actions?: React.ReactNode;
}) {
    const filters: { key: MapFilter; label: string; count: number }[] = [
        { key: 'all', label: 'All pages', count: summary.pages },
        { key: 'attention', label: 'Needs attention', count: summary.attentionPages },
        { key: 'drafts', label: 'Drafts', count: summary.drafts },
        { key: 'hidden', label: 'Not in search', count: summary.pages - summary.inSearch },
    ];
    const onFilterKey = useRadioKeys(filters.map((f) => f.key), filter, onFilter);
    return (
        <header className="border-b border-border bg-background px-4 pb-3 pt-4 md:px-6">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold tracking-[-0.02em]">Site map</h1>
                    <p className="text-[13px] text-foreground/70">
                        {siteName && <>{siteName} · </>}{summary.pages} pages · {summary.inSearch} in search · {summary.redirects} redirects
                    </p>
                </div>
                <div className="flex items-center gap-2">{actions}<ViewToggle view={view} onView={onView} /></div>
            </div>
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div role="radiogroup" aria-label="Show" onKeyDown={onFilterKey} className="-mx-1 flex gap-1 overflow-x-auto px-1">
                    {filters.map((f) => (
                        <button key={f.key} type="button" role="radio" data-key={f.key} aria-checked={filter === f.key} tabIndex={filter === f.key ? 0 : -1}
                            onClick={() => onFilter(f.key)}
                            className={cn('inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-8',
                                filter === f.key ? 'bg-foreground text-background' : 'text-foreground/75 hover:bg-muted hover:text-foreground')}>
                            {f.label}
                            <span className={cn('text-xs tabular-nums', filter === f.key ? 'text-background/80' : f.key === 'attention' && f.count > 0 ? 'text-destructive' : 'text-foreground/70')}>{f.count}</span>
                        </button>
                    ))}
                </div>
                <label className="relative block md:w-64">
                    <span className="sr-only">Find a page or address</span>
                    <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-foreground/60" />
                    <input type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Find a page or address"
                        className="h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-2 text-[13px] placeholder:text-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-8" />
                </label>
            </div>
        </header>
    );
}

/** True below the inspector-docking breakpoint (lg); follows resizes. */
export function useSheetLayout(): boolean {
    const query = '(max-width: 1023px)';
    const supported = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
    const [sheet, setSheet] = React.useState(() => supported && window.matchMedia(query).matches);
    React.useEffect(() => {
        if (!supported) return;
        const mq = window.matchMedia(query);
        const on = () => setSheet(mq.matches);
        mq.addEventListener?.('change', on);
        return () => mq.removeEventListener?.('change', on);
    }, [supported]);
    return sheet;
}

/** Where the chosen view is remembered, per viewer. A host may hand its own (a user preference); the default is this browser. */
export interface SiteMapViewStore {
    get(): SiteMapView | null;
    set(view: SiteMapView): void;
}

export const SITE_MAP_VIEW_KEY = 'beam-ux:site-map:view';

export function browserViewStore(key: string = SITE_MAP_VIEW_KEY): SiteMapViewStore {
    const valid = (v: string | null): v is SiteMapView => v === 'outline' || v === 'canvas' || v === 'columns';
    return {
        get: () => {
            try {
                const v = window.localStorage.getItem(key);
                return valid(v) ? v : null;
            } catch {
                return null;
            }
        },
        set: (view) => {
            try {
                window.localStorage.setItem(key, view);
            } catch {
                // A private window or blocked storage: the view still switches, it is just not remembered.
            }
        },
    };
}
