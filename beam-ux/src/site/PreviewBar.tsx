import type { CSSProperties, ReactNode } from 'react';

/** A page a Release changes (ADR-0232 d10). A Record Page's path keeps its `{field}` piece. */
export type PreviewReachPage = { entryId: string; title: string | null; path: string | null; recordPage: boolean };

/** What one component, layout, template or theme member of the Release reaches. */
export type PreviewMemberReach = {
    entryId: string;
    name: string;
    kind: string;
    everyPage: boolean;
    count: number;
    pages: PreviewReachPage[];
};

/** One reason Publish would refuse the Release, or one note that doesn't stop it (ADR-0232 d11). */
export type PreviewReadinessItem = {
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
export type PreviewBarData = {
    label: string;
    exitUrl: string;
    viewAsMeUrl?: string | null;
    /** `live` while the bar shows the live site at this URL (ADR-0232 d13). */
    mode?: 'preview' | 'live';
    /** This URL in the other mode; null for a page the Release adds, which has no live page. */
    switchUrl?: string | null;
    /** Append `&path=` to open a path in the Preview from the live site. */
    previewUrl?: string | null;
    changes?: { pages: PreviewReachPage[]; reach: PreviewMemberReach[] } | null;
    /** A few Records the Preview's viewer may read, by Record Page id, to open that page on. */
    recordChoices?: Record<string, { label: string; path: string }[]>;
    readiness?: { ready: boolean; blockers: PreviewReadinessItem[]; notes: PreviewReadinessItem[] } | null;
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
export type PreviewRedirect = { from: string; match?: 'exact' | 'prefix'; to: string | null; reason: 'moved' | 'takedown' };

const bar: CSSProperties = { background: '#171717', color: 'white', fontSize: 14, padding: '10px 16px' };
const row: CSSProperties = { alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' };
const link: CSSProperties = { color: 'white' };
const panel: CSSProperties = { margin: '8px auto 0', maxWidth: 960 };
const list: CSSProperties = { margin: '4px 0 8px', paddingLeft: 20 };

/**
 * **The Preview bar** (ADR-0232 d9–d13): what is previewed, the switch between the Preview and the live site at the
 * same URL, View as me, Exit, and for a Release what it changes and what would stop Publish. Every page inside a
 * Preview renders it: the packaged entry page and a host's own pages (a starter's home).
 */
export function PreviewBar({ preview }: { preview: PreviewBarData }) {
    const live = preview.mode === 'live';
    // From the live site, a changed page opens back in the Preview; in the Preview, it is just its path.
    const open = (path: string) =>
        live && preview.previewUrl ? `${preview.previewUrl}&path=${encodeURIComponent(path)}` : path;

    return (
        <aside aria-label="Preview mode" data-beam-preview-bar style={bar}>
            <div style={row}>
                <span>
                    {live ? `You are seeing the live site, outside the Preview of ${preview.label}.` : `Previewing ${preview.label}`}
                </span>
                {preview.switchUrl ? (
                    <a href={preview.switchUrl} style={link}>
                        {live ? 'Back to the Preview' : 'Live site'}
                    </a>
                ) : preview.switchUrl === null ? (
                    <span>New in this Release</span>
                ) : null}
                {live ? null : <span>Forms validate but do not submit in Preview.</span>}
                {preview.viewAsMeUrl ? <a href={preview.viewAsMeUrl} style={link}>View as me</a> : null}
                <a href={preview.exitUrl} style={link}>Exit preview</a>
            </div>
            {preview.changes ? <ChangedPages preview={preview} open={open} /> : null}
            {preview.redirects && preview.redirects.length > 0 ? <Redirects redirects={preview.redirects} /> : null}
            {preview.readiness ? <Readiness preview={preview} open={open} /> : null}
        </aside>
    );
}

function ChangedPages({ preview, open }: { preview: PreviewBarData; open: (path: string) => string }) {
    const changes = preview.changes!;
    const total = changes.pages.length + changes.reach.reduce((sum, reach) => sum + (reach.everyPage ? 0 : reach.count), 0);
    const page = (p: PreviewReachPage) => <PageLink key={p.entryId} page={p} open={open} choices={preview.recordChoices?.[p.entryId]} />;

    return (
        <details style={panel}>
            <summary>Changed pages ({total})</summary>
            <section aria-label="Changed pages">
                {changes.pages.length > 0 ? <ul style={list}>{changes.pages.map(page)}</ul> : null}
                {changes.reach.map((reach) => (
                    <div key={reach.entryId}>
                        <span>{reach.name} — {reach.everyPage ? 'every page' : `${reach.count} ${reach.count === 1 ? 'page' : 'pages'}`}</span>
                        {reach.pages.length > 0 ? <ul style={list}>{reach.pages.map(page)}</ul> : null}
                    </div>
                ))}
            </section>
        </details>
    );
}

/** A page to open in the Preview. A Record Page opens on a Record the viewer may read, so each one is its own link. */
/** ux-0236 d12: what a reviewer's old links will do once the Release publishes. */
function Redirects({ redirects }: { redirects: PreviewRedirect[] }) {
    return (
        <details style={panel}>
            <summary>Redirects this Release leaves ({redirects.length})</summary>
            <section aria-label="Redirects this Release leaves">
                <ul style={list}>
                    {redirects.map((redirect) => (
                        <li key={`${redirect.from} ${redirect.match ?? 'exact'}`}>
                            {redirect.from}
                            {redirect.match === 'prefix' ? ' and below' : ''} → {redirect.to ?? 'not found'} ({redirect.reason === 'moved' ? 'moved' : 'taken down'})
                        </li>
                    ))}
                </ul>
            </section>
        </details>
    );
}

function PageLink({ page, open, choices }: { page: PreviewReachPage; open: (path: string) => string; choices?: { label: string; path: string }[] }) {
    const title = page.title ?? page.path ?? page.entryId;
    if (page.path === null) {
        return <li>{title}</li>;
    }
    if (page.recordPage) {
        return (
            <li>
                {choices && choices.length > 0
                    ? choices.map((choice, index): ReactNode => (
                        <span key={choice.path}>
                            {index > 0 ? ', ' : null}
                            <a href={open(choice.path)} style={link}>{`${title}: ${choice.label}`}</a>
                        </span>
                    ))
                    : `${title}: no record you can read`}
            </li>
        );
    }

    return (
        <li>
            <a href={open(page.path)} style={link}>{title}</a>
        </li>
    );
}

/** Every reason Publish would refuse (ADR-0232 d11), each linked to where its fix is pressed. */
function Readiness({ preview, open }: { preview: PreviewBarData; open: (path: string) => string }) {
    const readiness = preview.readiness!;
    const count = readiness.blockers.length;
    // A page the Release changes opens in the Preview, where its author edits it; a Record Page has no one path.
    const paths = new Map((preview.changes?.pages ?? []).filter((p) => p.path && !p.recordPage).map((p) => [p.entryId, p.path!]));

    return (
        <section aria-label="Publish" style={panel}>
            <strong>{readiness.ready ? 'Nothing stops Publish' : `${count} ${count === 1 ? 'thing stops' : 'things stop'} Publish`}</strong>
            {count > 0 ? (
                <ul style={list}>
                    {readiness.blockers.map((item, index) => (
                        <li key={`${item.code}-${item.entryId ?? ''}-${index}`}>
                            {item.message}
                            {item.fixes.length > 0 ? <span> {`Fix: ${item.fixes.join(' or ')}`}</span> : null}
                            {item.fixes.includes('open') && item.entryId && paths.has(item.entryId) ? (
                                <> <a href={open(paths.get(item.entryId)!)} style={link}>Open the page</a></>
                            ) : null}
                            {item.fixes.some((fix) => fix !== 'open') ? (
                                preview.releaseHref ? (
                                    <> <a href={preview.releaseHref} style={link}>Fix in the Release</a></>
                                ) : item.entryId && paths.has(item.entryId) ? (
                                    // No Release page on this host (a starter): the member's page, where the editor's
                                    // Release panel offers rebase and drop (orch-lead ruling A, EP-18).
                                    <> <a href={open(paths.get(item.entryId)!)} style={link}>Fix on the page</a></>
                                ) : null
                            ) : null}
                        </li>
                    ))}
                </ul>
            ) : null}
            {readiness.notes.length > 0 ? (
                <ul style={list}>
                    {readiness.notes.map((item, index) => (
                        <li key={`${item.code}-${item.entryId ?? ''}-${index}`}>
                            {item.message}
                            {item.releaseDueAt ? ` Publishes ${new Date(item.releaseDueAt).toLocaleString()}.` : null}
                        </li>
                    ))}
                </ul>
            ) : null}
        </section>
    );
}

/**
 * Keep authored forms usable for native validation without sending real submissions from a Preview (ADR-0232 d12).
 * The live site at the same URL (d13) is the live site, so its forms submit.
 */
export function PreviewBoundary({ preview, children }: { preview: PreviewBarData; children: ReactNode }) {
    return (
        <div
            data-beam-preview-root
            onSubmitCapture={
                preview.mode === 'live'
                    ? undefined
                    : (event) => {
                          event.preventDefault();
                          event.stopPropagation();
                      }
            }
        >
            <PreviewBar preview={preview} />
            {children}
        </div>
    );
}
