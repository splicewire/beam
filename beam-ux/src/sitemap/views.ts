import type { ReactNode } from 'react';
import type { MapFilter, SiteMapSummary, TreeNode } from './model';
import type { RedirectTrace, SiteMapPage } from './types';

/** What every view receives from `SiteMap`: the same rows, the same selection, the same doors. */
export interface SiteMapViewProps {
    roots: TreeNode[];
    pages: SiteMapPage[];
    byId: Map<string, SiteMapPage>;
    summary: SiteMapSummary;
    traces: RedirectTrace[];
    filter: MapFilter;
    query: string;
    filtering: boolean;
    keep: Set<string>;
    matched: Set<string>;
    selected: string | null;
    /** Select a page and show its inspector. */
    onSelect: (id: string) => void;
    /** The door: open the page in the Entry editor (a second Enter, or a double-click). */
    onOpenPage: (id: string) => void;
    /** Show the Redirects that reach no page (Columns' loop card). */
    footer: ReactNode;
}
