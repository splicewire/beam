/**
 * The Columns view (research 37, variant C): triage first — a strip of what needs attention, each item one click from
 * its page (a loop opens the Redirects that reach no page) — over the tree as Finder-style columns, one level per
 * column. Filtering flattens to one column that shows each page's ancestry. At phone width only the deepest column
 * shows, with a back step. Enter selects, a second Enter or a double-click opens the editor.
 */
import { useEffect, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from '@schemastud/ui';
import { ancestry, findNode, issuesFor, pageTitle, type Issue, type TreeNode } from './model';
import { FileStatus, IssueIcon, issueLabel, PublicationStatus, SearchStatus } from './parts';
import type { SiteMapViewProps } from './views';

function Column({ nodes, selected, onSelect, onOpen, label, crumbs }: {
    nodes: TreeNode[]; selected?: string; onSelect: (id: string) => void; onOpen: (id: string) => void; label: string;
    crumbs?: (id: string) => string | null;
}) {
    return (
        <ul aria-label={label} className="h-full w-full shrink-0 overflow-y-auto border-r border-border md:w-72">
            {nodes.map(({ page, children }) => {
                const issues = issuesFor(page);
                const on = selected === page.id;
                const onKey = (e: KeyboardEvent<HTMLButtonElement>) => { if (e.key === 'Enter' && on) { e.preventDefault(); onOpen(page.id); } };
                return (
                    <li key={page.id}>
                        <button type="button" onClick={() => onSelect(page.id)} onDoubleClick={() => onOpen(page.id)} onKeyDown={onKey}
                            aria-current={on ? 'true' : undefined}
                            className={cn('flex w-full items-center gap-2 border-b border-border/60 px-4 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                                on ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50')}>
                            <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5">
                                    <span className="truncate text-[13px] font-medium">{pageTitle(page)}</span>
                                    {issues.slice(0, 2).map((i) => <IssueIcon key={i.kind} kind={i.kind} />)}
                                </span>
                                <span className="block truncate font-mono text-[11px] text-foreground/70">{crumbs?.(page.id) || page.url}</span>
                                <span className="mt-1 flex items-center gap-3">
                                    <PublicationStatus page={page} compact />
                                    <SearchStatus page={page} iconOnly />
                                    <FileStatus page={page} iconOnly />
                                </span>
                            </span>
                            {children.length > 0 && (
                                <span className="flex shrink-0 items-center gap-0.5 text-xs tabular-nums text-foreground/70">
                                    {children.length}<ChevronRight aria-hidden className="size-3.5" />
                                </span>
                            )}
                        </button>
                    </li>
                );
            })}
            {nodes.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-foreground/70">No page matches.</li>}
        </ul>
    );
}

function AttentionStrip({ issues, byId, traceTitle, onPick }: {
    issues: Issue[]; byId: SiteMapViewProps['byId']; traceTitle: (id: string) => string; onPick: (issue: Issue) => void;
}) {
    if (issues.length === 0) return null;
    const pagesHit = new Set(issues.map((i) => i.pageId).filter(Boolean)).size;
    const loose = issues.filter((i) => !i.pageId).length;
    return (
        <section aria-label="Needs attention" className="border-b border-border bg-background px-4 py-3 md:px-6">
            <h2 className="mb-2 text-[13px] font-semibold">Needs attention <span className="font-normal text-foreground/70">
                · {pagesHit} page{pagesHit === 1 ? '' : 's'}{loose ? `, ${loose} redirect${loose === 1 ? '' : 's'} reaching no page` : ''}</span></h2>
            <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {issues.map((issue, i) => (
                    <li key={`${issue.kind}-${issue.pageId ?? issue.redirectId}-${i}`} className="shrink-0">
                        <button type="button" onClick={() => onPick(issue)}
                            className="flex h-full w-56 items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <IssueIcon kind={issue.kind} className="mt-0.5" announce={false} />
                            <span className="min-w-0">
                                <span className="block text-[13px] font-medium">{issueLabel(issue)}</span>
                                <span className={cn('block truncate text-xs text-foreground/70', !issue.pageId && 'font-mono')}>
                                    {issue.pageId ? pageTitle(byId.get(issue.pageId)!) : traceTitle(issue.redirectId!)}
                                </span>
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export function ColumnsView({ roots, pages, byId, summary, traces, filtering, matched, selected, onSelect, onOpenPage, footer }: SiteMapViewProps) {
    const [path, setPath] = useState<string[]>(() => (selected ? ancestry(byId, selected) : roots[0] ? [roots[0].page.id] : []));
    const [showLoose, setShowLoose] = useState(false);
    // The shared selection drives the columns: a page chosen in another view opens its path here.
    useEffect(() => {
        if (selected && path[path.length - 1] !== selected) setPath(ancestry(byId, selected));
    }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

    // A loop card opens the Redirects that reach no page.
    useEffect(() => {
        if (showLoose) document.querySelector<HTMLElement>('[data-view="columns"] [data-loose]')?.scrollIntoView?.({ block: 'nearest' });
    }, [showLoose]);

    const crumbs = (id: string) => ancestry(byId, id).slice(0, -1).map((a) => pageTitle(byId.get(a)!)).join(' › ') || null;
    const traceTitle = (id: string) => { const t = traces.find((x) => x.id === id); return t ? [...t.steps, t.steps[0]].join(' → ') : id; };
    const hits = pages.filter((p) => matched.has(p.id)).map((p) => findNode(roots, p.id)).filter((n): n is TreeNode => !!n);
    const columns: { label: string; nodes: TreeNode[]; selected?: string }[] = filtering
        ? [{ label: 'Matching pages', nodes: hits, selected: selected ?? undefined }]
        : [{ label: 'Site', nodes: roots, selected: path[0] },
            ...path.map((id, i) => ({ label: pageTitle(byId.get(id)!), nodes: findNode(roots, id)?.children ?? [], selected: path[i + 1] }))
                .filter((c) => c.nodes.length > 0)];
    const pick = (depth: number, id: string) => {
        setShowLoose(false);
        setPath(filtering ? ancestry(byId, id) : [...path.slice(0, depth), id]);
        onSelect(id);
    };
    const parentTitle = path.length > 1 ? pageTitle(byId.get(path[path.length - 2])!) : null;

    return (
        <div className="flex min-h-0 min-w-0 flex-col" data-view="columns">
            <AttentionStrip issues={summary.issues} byId={byId} traceTitle={traceTitle}
                onPick={(issue) => { if (issue.pageId) { setShowLoose(false); setPath(ancestry(byId, issue.pageId)); onSelect(issue.pageId); } else setShowLoose(true); }} />
            {parentTitle && !filtering && (
                <button type="button" onClick={() => setPath(path.slice(0, -1))}
                    className="flex min-h-11 items-center gap-1.5 border-b border-border px-4 text-[13px] text-foreground/70 hover:text-foreground md:hidden">
                    <ArrowLeft aria-hidden className="size-3.5" />{parentTitle}
                </button>
            )}
            <div className="flex min-h-[18rem] flex-1 overflow-x-auto">
                {columns.map((c, i) => (
                    <div key={`${c.label}-${i}`} className={cn('h-full min-w-0 md:block', i === columns.length - 1 || filtering ? 'block w-full md:w-auto' : 'hidden')}>
                        <Column label={c.label} nodes={c.nodes} selected={c.selected} onSelect={(id) => pick(i, id)} onOpen={onOpenPage}
                            crumbs={filtering ? crumbs : undefined} />
                    </div>
                ))}
            </div>
            <div className={cn('min-h-0 overflow-y-auto', showLoose && 'ring-2 ring-inset ring-destructive/30')} data-loose-open={showLoose || undefined}>{footer}</div>
        </div>
    );
}
