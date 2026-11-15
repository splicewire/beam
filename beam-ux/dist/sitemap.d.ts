import * as react from 'react';
import { ReactNode } from 'react';

/**
 * The Site map's wire shapes (owner-review-20261102 research 37). They mirror the PHP read projection
 * `beam-ux-site-map` (`Splicewire\Beam\Ux\Data\SiteMapRowData` and its nested Data) and `beam-ux-redirect`'s
 * `traces` read (`RedirectTraceData`). Declared here so the component stays transport-agnostic: a host reads the two
 * resources however it reads resources and hands the rows in.
 */
type SiteMapView = 'outline' | 'canvas' | 'columns';
/** `SitemapEligibility`'s verdict: `listed`/`record-page` are in the sitemap, the rest say why not. */
type SearchReason = 'listed' | 'record-page' | 'not-routable' | 'unpublished' | 'not-public' | 'unplaced' | 'not-listable' | 'hidden-ancestor' | 'no-records';
interface SiteMapSearch {
    listed: boolean;
    reason: SearchReason | (string & {});
    urlCount: number;
}
type FileState = 'clean' | 'modified' | 'untracked' | 'untracked-ignored' | 'not-written' | 'no-git-repo' | 'mirror-disabled' | 'not-yet-saved';
interface SiteMapFile {
    state: FileState | (string & {});
    path: string | null;
    exists: boolean;
    lastModifiedAt: string | null;
    /** The Release member the file repair ops address; null with `repairBlocked` saying why. */
    repairMemberId: string | null;
    repairReleaseId: string | null;
    repairBlocked: 'no-release' | 'pin-moved' | (string & {}) | null;
}
/** Why a Redirect walk stopped, as `RedirectResolver::follow()` names it, plus `shadowed` (a page answers the path). */
type TraceEnd = 'answered' | 'loop' | 'too-long' | 'dead-end' | 'gone' | 'denied' | 'shadowed' | 'none';
interface SiteMapInbound {
    id: string;
    path: string;
    match: 'exact' | 'prefix' | (string & {});
    end: TraceEnd | (string & {});
    hops: number;
    attention: boolean;
    permanent: boolean;
    origin: string;
}
interface SiteMapRedirects {
    count: number;
    maxHops: number;
    attention: TraceEnd | (string & {}) | null;
    inbound: SiteMapInbound[];
}
/** One page: a `SiteMapRowData` row. */
interface SiteMapPage {
    id: string;
    title: string | null;
    slug: string;
    parentId: string | null;
    segment: string | null;
    navOrder: number | null;
    url: string | null;
    publishedReadable: string | null;
    headReadable: string | null;
    draftPending: boolean;
    search: SiteMapSearch;
    /** Central only (D-37-d): null on a tenant's site or for a reader without the diagnostics ability. */
    file: SiteMapFile | null;
    redirects: SiteMapRedirects;
}
/** One Redirect walked as a guest: a `RedirectTraceData` row. */
interface RedirectTrace {
    id: string;
    realm: string;
    path: string;
    match: 'exact' | 'prefix' | (string & {});
    targetKind: string;
    permanent: boolean;
    origin: string;
    end: TraceEnd | (string & {});
    to: string | null;
    steps: string[];
    hops: number;
    attention: boolean;
    pageId: string | null;
}
/** A non-page entry the Site section opens (D-37-b's "Site parts"): the theme, layouts, templates, components. */
interface SitePart {
    id: string;
    title: string | null;
    slug: string;
    type: 'theme' | 'layout' | 'template' | 'component' | (string & {});
}
/** What "Open in editor" opens: a page in X8's Entry editor, or a Site part through its existing editor. */
type SiteMapDoor = {
    kind: 'page';
    page: SiteMapPage;
} | {
    kind: 'part';
    part: SitePart;
};
type FileAction = 'restore' | 'take-draft' | 'overwrite';
/** The host's doors. Only "Open in editor" is required; every other action draws only when the host supplies it. */
interface SiteMapActions {
    onOpen: (door: SiteMapDoor) => void;
    onPageSettings?: (page: SiteMapPage) => void;
    onAddRedirect?: (page: SiteMapPage) => void;
    onOpenRedirect?: (redirectId: string) => void;
    onFileAction?: (action: FileAction, page: SiteMapPage) => void;
}

/**
 * The Site map's pure model (owner-review-20261102 research 37): the page tree, what needs attention, the
 * filters and the summary — computed from the two server reads, never re-deciding what the server decided. Search
 * verdicts are the sitemap's own (`SitemapEligibility`); redirect ends are the renderer's own walk. A chain that still
 * answers is information, never an issue (D-37-g (b)).
 */

interface TreeNode {
    page: SiteMapPage;
    depth: number;
    children: TreeNode[];
}
/** Pages under their parents. A page whose parent is not a row (the realm root, or one the reader can't see) is a root. */
declare function buildTree(pages: SiteMapPage[]): TreeNode[];
type IssueKind = 'file-missing' | 'file-changed' | 'redirect-broken' | 'redirect-loop';
interface Issue {
    kind: IssueKind;
    pageId?: string;
    redirectId?: string;
    count?: number;
    end?: TraceEnd | string;
}
declare function issuesFor(page: SiteMapPage): Issue[];
/**
 * Redirects whose walk reaches no page on the map: loops, exits off the site, paths nothing answers, and a walk whose
 * page has no row here (gone, or not the reader's), so no failing walk is ever dropped between a page and this list.
 */
declare function looseTraces(traces: RedirectTrace[], pageIds?: Set<string>): RedirectTrace[];
type MapFilter = 'all' | 'attention' | 'drafts' | 'hidden';
interface SiteMapSummary {
    pages: number;
    inSearch: number;
    drafts: number;
    redirects: number;
    issues: Issue[];
    attentionPages: number;
    loops: number;
    hasFiles: boolean;
}
declare function summarize(pages: SiteMapPage[], traces: RedirectTrace[]): SiteMapSummary;

/** The Site map's header: its summary, the view toggle, the filters and the finder. Shared by every view. */

declare function ViewToggle({ view, onView }: {
    view: SiteMapView;
    onView: (v: SiteMapView) => void;
}): react.JSX.Element;
/** Where the chosen view is remembered, per viewer. A host may hand its own (a user preference); the default is this browser. */
interface SiteMapViewStore {
    get(): SiteMapView | null;
    set(view: SiteMapView): void;
}
declare const SITE_MAP_VIEW_KEY = "beam-ux:site-map:view";
declare function browserViewStore(key?: string): SiteMapViewStore;

interface SiteMapProps extends SiteMapActions {
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
declare function SiteMap({ pages, traces, parts, siteName, view: controlledView, onViewChange, viewStore, defaultView, selectedId, onSelectedChange, defaultSelectedId, defaultFilter, actions, className, onOpen, onPageSettings, onAddRedirect, onOpenRedirect, onFileAction, }: SiteMapProps): react.JSX.Element;

/** The non-page entries the Site section opens with the same doors: the theme in its editor, the rest in the Entry editor. */
declare function SiteParts({ parts, onOpen }: {
    parts: SitePart[];
    onOpen: SiteMapActions['onOpen'];
}): react.JSX.Element | null;
interface PageInspectorProps extends Omit<SiteMapActions, 'onOpen'> {
    page: SiteMapPage;
    parent?: SiteMapPage;
    onOpen: SiteMapActions['onOpen'];
    onSelect?: (id: string) => void;
    onClose?: () => void;
    sheet?: boolean;
}
/** One page's facts and doors. The same component in every view; its primary action is X8's Entry editor. */
declare function PageInspector({ page, parent, onOpen, onSelect, onClose, sheet, onPageSettings, onAddRedirect, onOpenRedirect, onFileAction }: PageInspectorProps): react.JSX.Element;

export { type FileAction, type FileState, type Issue, type MapFilter, PageInspector, type PageInspectorProps, type RedirectTrace, SITE_MAP_VIEW_KEY, type SearchReason, SiteMap, type SiteMapActions, type SiteMapDoor, type SiteMapFile, type SiteMapInbound, type SiteMapPage, type SiteMapProps, type SiteMapRedirects, type SiteMapSearch, type SiteMapSummary, type SiteMapView, type SiteMapViewStore, type SitePart, SiteParts, type TraceEnd, type TreeNode, ViewToggle, browserViewStore, buildTree, issuesFor, looseTraces, summarize };
