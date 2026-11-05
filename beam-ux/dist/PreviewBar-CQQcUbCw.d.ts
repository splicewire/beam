import * as react from 'react';
import { ReactNode } from 'react';

/** A page a Release changes (ADR-0232 d10). A Record Page's path keeps its `{field}` piece. */
type PreviewReachPage = {
    entryId: string;
    title: string | null;
    path: string | null;
    recordPage: boolean;
};
/** What one component, layout, template or theme member of the Release reaches. */
type PreviewMemberReach = {
    entryId: string;
    name: string;
    kind: string;
    everyPage: boolean;
    count: number;
    pages: PreviewReachPage[];
};
/** One reason Publish would refuse the Release, or one note that doesn't stop it (ADR-0232 d11). */
type PreviewReadinessItem = {
    code: string;
    entryId: string | null;
    message: string;
    fixes: string[];
    componentId?: string | null;
    releaseId?: string | null;
    releaseTitle?: string | null;
    releaseStatus?: string | null;
    releaseDueAt?: string | null;
    releaseTimezone?: string | null;
};
/**
 * The bar's data, as the server's `PreviewBar` composes it. Everything past `viewAsMeUrl` is absent from servers that
 * predate EP-18, and a version preview (not a Release) has no `changes` or `readiness`.
 */
type PreviewBarData = {
    label: string;
    exitUrl: string;
    viewAsMeUrl?: string | null;
    /** `live` while the bar shows the live site at this URL (ADR-0232 d13). */
    mode?: 'preview' | 'live';
    /** This URL in the other mode; null for a page the Release adds, which has no live page. */
    switchUrl?: string | null;
    /** Append `&path=` to open a path in the Preview from the live site. */
    previewUrl?: string | null;
    changes?: {
        pages: PreviewReachPage[];
        reach: PreviewMemberReach[];
    } | null;
    /** A few Records the Preview's viewer may read, by Record Page id, to open that page on. */
    recordChoices?: Record<string, {
        label: string;
        path: string;
    }[]>;
    readiness?: {
        ready: boolean;
        blockers: PreviewReadinessItem[];
        notes: PreviewReadinessItem[];
    } | null;
    /** The Release's own page, where its fixes are pressed; null where this host mounts none. */
    releaseHref?: string | null;
    /**
     * Each URL the Release moves or takes down and where it goes once it publishes (ux-0236 d12); `to` is null for a
     * Take-down that names no page, whose URLs are then not found.
     */
    redirects?: PreviewRedirect[];
};
/**
 * A URL a Release moves or takes down, and where it will go. `match` is `prefix` for a Redirect that covers the path
 * and everything under it (a Record Page's move), `exact` for that path only.
 */
type PreviewRedirect = {
    from: string;
    match?: 'exact' | 'prefix';
    to: string | null;
    reason: 'moved' | 'takedown';
};
/**
 * **The Preview bar** (ADR-0232 d9–d13): what is previewed, the switch between the Preview and the live site at the
 * same URL, View as me, Exit, and for a Release what it changes and what would stop Publish. Every page inside a
 * Preview renders it: the packaged entry page and a host's own pages (a starter's home).
 */
declare function PreviewBar({ preview }: {
    preview: PreviewBarData;
}): react.JSX.Element;
/**
 * Keep authored forms usable for native validation without sending real submissions from a Preview (ADR-0232 d12).
 * The live site at the same URL (d13) is the live site, so its forms submit.
 */
declare function PreviewBoundary({ preview, children }: {
    preview: PreviewBarData;
    children: ReactNode;
}): react.JSX.Element;

export { type PreviewBarData as P, PreviewBar as a, PreviewBoundary as b, type PreviewMemberReach as c, type PreviewReachPage as d, type PreviewReadinessItem as e };
