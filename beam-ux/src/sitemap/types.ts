/**
 * The Site map's wire shapes (owner-review-20261102 research 37). They mirror the PHP read projection
 * `beam-ux-site-map` (`Splicewire\Beam\Ux\Data\SiteMapRowData` and its nested Data) and `beam-ux-redirect`'s
 * `traces` read (`RedirectTraceData`). Declared here so the component stays transport-agnostic: a host reads the two
 * resources however it reads resources and hands the rows in.
 */

export type SiteMapView = 'outline' | 'canvas' | 'columns';

/** `SitemapEligibility`'s verdict: `listed`/`record-page` are in the sitemap, the rest say why not. */
export type SearchReason =
    | 'listed'
    | 'record-page'
    | 'not-routable'
    | 'unpublished'
    | 'not-public'
    | 'unplaced'
    | 'not-listable'
    | 'hidden-ancestor'
    | 'no-records';

export interface SiteMapSearch {
    listed: boolean;
    reason: SearchReason | (string & {});
    urlCount: number;
}

export type FileState =
    | 'clean'
    | 'modified'
    | 'untracked'
    | 'untracked-ignored'
    | 'not-written'
    | 'no-git-repo'
    | 'mirror-disabled'
    | 'not-yet-saved';

export interface SiteMapFile {
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
export type TraceEnd = 'answered' | 'loop' | 'too-long' | 'dead-end' | 'gone' | 'denied' | 'shadowed' | 'none';

export interface SiteMapInbound {
    id: string;
    path: string;
    match: 'exact' | 'prefix' | (string & {});
    end: TraceEnd | (string & {});
    hops: number;
    attention: boolean;
    permanent: boolean;
    origin: string;
}

export interface SiteMapRedirects {
    count: number;
    maxHops: number;
    attention: TraceEnd | (string & {}) | null;
    inbound: SiteMapInbound[];
}

/** One page: a `SiteMapRowData` row. */
export interface SiteMapPage {
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
export interface RedirectTrace {
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
export interface SitePart {
    id: string;
    title: string | null;
    slug: string;
    type: 'theme' | 'layout' | 'template' | 'component' | (string & {});
}

/** What "Open in editor" opens: a page in X8's Entry editor, or a Site part through its existing editor. */
export type SiteMapDoor = { kind: 'page'; page: SiteMapPage } | { kind: 'part'; part: SitePart };

export type FileAction = 'restore' | 'take-draft' | 'overwrite';

/** The host's doors. Only "Open in editor" is required; every other action draws only when the host supplies it. */
export interface SiteMapActions {
    onOpen: (door: SiteMapDoor) => void;
    onPageSettings?: (page: SiteMapPage) => void;
    onAddRedirect?: (page: SiteMapPage) => void;
    onOpenRedirect?: (redirectId: string) => void;
    onFileAction?: (action: FileAction, page: SiteMapPage) => void;
}
