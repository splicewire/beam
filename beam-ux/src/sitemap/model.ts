/**
 * The Site map's pure model (owner-review-20261102 research 37): the page tree, what needs attention, the
 * filters and the summary — computed from the two server reads, never re-deciding what the server decided. Search
 * verdicts are the sitemap's own (`SitemapEligibility`); redirect ends are the renderer's own walk. A chain that still
 * answers is information, never an issue (D-37-g (b)).
 */
import type { RedirectTrace, SiteMapPage, TraceEnd } from './types';

export type PublicationState = 'live' | 'draft' | 'unpublished';

export function publicationState(page: SiteMapPage): PublicationState {
    if (page.publishedReadable === null) return 'unpublished';
    return page.draftPending ? 'draft' : 'live';
}

export const pageTitle = (page: Pick<SiteMapPage, 'title' | 'slug'>) => page.title || page.slug;

/* ── Tree ───────────────────────────────────────────────────────────────────────────────────── */

export interface TreeNode { page: SiteMapPage; depth: number; children: TreeNode[] }

const byOrder = (a: SiteMapPage, b: SiteMapPage) =>
    (a.navOrder ?? Number.MAX_SAFE_INTEGER) - (b.navOrder ?? Number.MAX_SAFE_INTEGER)
    || (a.url ?? '').localeCompare(b.url ?? '')
    || pageTitle(a).localeCompare(pageTitle(b));

/** Pages under their parents. A page whose parent is not a row (the realm root, or one the reader can't see) is a root. */
export function buildTree(pages: SiteMapPage[]): TreeNode[] {
    const ids = new Set(pages.map((p) => p.id));
    const kids = new Map<string | null, SiteMapPage[]>();
    for (const p of pages) {
        const parent = p.parentId !== null && ids.has(p.parentId) ? p.parentId : null;
        kids.set(parent, [...(kids.get(parent) ?? []), p]);
    }
    const build = (parent: string | null, depth: number, seen: Set<string>): TreeNode[] =>
        [...(kids.get(parent) ?? [])].sort(byOrder).filter((p) => !seen.has(p.id))
            .map((p) => ({ page: p, depth, children: build(p.id, depth + 1, new Set([...seen, p.id])) }));
    return build(null, 0, new Set());
}

export function flatten(nodes: TreeNode[], open: (id: string) => boolean = () => true): TreeNode[] {
    return nodes.flatMap((n) => [n, ...(open(n.page.id) ? flatten(n.children, open) : [])]);
}

export function countDescendants(n: TreeNode): number {
    return n.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

export function findNode(nodes: TreeNode[], id: string): TreeNode | undefined {
    for (const n of nodes) {
        if (n.page.id === id) return n;
        const hit = findNode(n.children, id);
        if (hit) return hit;
    }
    return undefined;
}

/** Root-first ids from a root to the page. */
export function ancestry(pages: Map<string, SiteMapPage>, id: string): string[] {
    const out: string[] = [];
    let cur = pages.get(id);
    while (cur && !out.includes(cur.id)) { out.unshift(cur.id); cur = cur.parentId ? pages.get(cur.parentId) : undefined; }
    return out;
}

/* ── Attention ──────────────────────────────────────────────────────────────────────────────── */

export type IssueKind = 'file-missing' | 'file-changed' | 'redirect-broken' | 'redirect-loop';
export interface Issue { kind: IssueKind; pageId?: string; redirectId?: string; count?: number; end?: TraceEnd | string }

/** Severe issues fail a reader (a missing file, a redirect that ends nowhere); a changed file only needs a decision. */
export const isSevere = (kind: IssueKind) => kind !== 'file-changed';

export function issuesFor(page: SiteMapPage): Issue[] {
    const out: Issue[] = [];
    if (page.file?.state === 'not-written') out.push({ kind: 'file-missing', pageId: page.id });
    if (page.file?.state === 'modified') out.push({ kind: 'file-changed', pageId: page.id });
    const broken = page.redirects.inbound.filter((r) => r.attention);
    if (broken.length) out.push({ kind: 'redirect-broken', pageId: page.id, count: broken.length, end: page.redirects.attention ?? broken[0].end });
    return out;
}

/**
 * Redirects whose walk reaches no page on the map: loops, exits off the site, paths nothing answers, and a walk whose
 * page has no row here (gone, or not the reader's), so no failing walk is ever dropped between a page and this list.
 */
export function looseTraces(traces: RedirectTrace[], pageIds?: Set<string>): RedirectTrace[] {
    return traces.filter((t) => t.end !== 'shadowed' && (t.pageId === null || (pageIds !== undefined && !pageIds.has(t.pageId))));
}

/** The loose walks with each loop's ends folded into one row (`/a ↔ /b` is one loop), the unit every count uses. */
export function looseRows(traces: RedirectTrace[], pageIds?: Set<string>): RedirectTrace[] {
    const seen = new Set<string>();
    return looseTraces(traces, pageIds).filter((t) => {
        const key = t.end === 'loop' ? [...t.steps].sort().join(' ') : t.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/** One issue per loop (the two ends of `/a ↔ /b` are one loop), one per other walk that fails a guest. */
export function looseIssues(traces: RedirectTrace[], pageIds?: Set<string>): Issue[] {
    const seen = new Set<string>();
    return looseTraces(traces, pageIds).filter((t) => t.attention).flatMap((t) => {
        const key = t.end === 'loop' ? [...t.steps].sort().join(' ') : t.id;
        if (seen.has(key)) return [];
        seen.add(key);
        return [{ kind: t.end === 'loop' ? 'redirect-loop' as const : 'redirect-broken' as const, redirectId: t.id, end: t.end }];
    });
}

export function allIssues(pages: SiteMapPage[], traces: RedirectTrace[]): Issue[] {
    return [...pages.flatMap(issuesFor), ...looseIssues(traces, new Set(pages.map((p) => p.id)))];
}

/* ── Filters and summary ────────────────────────────────────────────────────────────────────── */

export type MapFilter = 'all' | 'attention' | 'drafts' | 'hidden';

export function matches(page: SiteMapPage, filter: MapFilter, query: string): boolean {
    const q = query.trim().toLowerCase();
    if (q && !pageTitle(page).toLowerCase().includes(q) && !(page.url ?? '').toLowerCase().includes(q)
        && !page.redirects.inbound.some((r) => r.path.toLowerCase().includes(q))) return false;
    if (filter === 'attention') return issuesFor(page).length > 0;
    if (filter === 'drafts') return page.draftPending;
    if (filter === 'hidden') return !page.search.listed;
    return true;
}

/** The pages a filter keeps, plus their ancestors so the tree stays a tree (ancestors draw as context). */
export function visibleIds(pages: SiteMapPage[], filter: MapFilter, query: string): { keep: Set<string>; matched: Set<string> } {
    const byId = new Map(pages.map((p) => [p.id, p]));
    const keep = new Set<string>();
    const matched = new Set<string>();
    for (const p of pages) {
        if (!matches(p, filter, query)) continue;
        matched.add(p.id);
        let cur: SiteMapPage | undefined = p;
        while (cur && !keep.has(cur.id)) { keep.add(cur.id); cur = cur.parentId ? byId.get(cur.parentId) : undefined; }
    }
    return { keep, matched };
}

export interface SiteMapSummary {
    pages: number;
    inSearch: number;
    drafts: number;
    redirects: number;
    issues: Issue[];
    attentionPages: number;
    loops: number;
    hasFiles: boolean;
}

export function summarize(pages: SiteMapPage[], traces: RedirectTrace[]): SiteMapSummary {
    const issues = allIssues(pages, traces);
    return {
        pages: pages.length,
        inSearch: pages.filter((p) => p.search.listed).length,
        drafts: pages.filter((p) => p.draftPending).length,
        redirects: traces.length,
        issues,
        // What "Needs attention" shows: the pages with an issue and the redirects that reach no page and fail a guest.
        attentionPages: new Set(issues.map((i) => i.pageId).filter(Boolean)).size + issues.filter((i) => !i.pageId).length,
        loops: issues.filter((i) => !i.pageId).length,
        // D-37-d: the server sends `file` only on a central site to a diagnostics reader; draw the column only then.
        hasFiles: pages.some((p) => p.file !== null),
    };
}
