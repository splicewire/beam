/**
 * The Outline view (research 37 D-37-c, the default): the page tree as an indented outline with one status column per
 * concern — publication, search, file (central only), old addresses. At phone width the columns fold into icons under
 * the title. One tab stop for the tree; arrows move, Left/Right collapse, expand and climb, Home/End jump, Enter selects
 * and a second Enter opens the editor.
 */
import { useRef, useState, type KeyboardEvent } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@schemastud/ui';
import { countDescendants, flatten, issuesFor, pageTitle, type TreeNode } from './model';
import { FILE_COPY, FileStatus, IssueIcon, PublicationStatus, RedirectCount, SearchStatus } from './parts';
import type { SiteMapViewProps } from './views';

const cols = (files: boolean) => files
    ? 'md:grid-cols-[minmax(0,1fr)_9.5rem_8.5rem_9rem_3.5rem]'
    : 'md:grid-cols-[minmax(0,1fr)_9.5rem_9.5rem_3.5rem]';

function Row({ node, open, toggle, selected, onSelect, onOpen, context, focusable, files }: {
    node: TreeNode; open: boolean; toggle: () => void; selected: boolean; onSelect: () => void; onOpen: () => void;
    context: boolean; focusable: boolean; files: boolean;
}) {
    const { page, depth } = node;
    const issues = issuesFor(page);
    const hasKids = node.children.length > 0;
    const title = pageTitle(page);
    return (
        <div role="treeitem" aria-level={depth + 1} aria-selected={selected} aria-expanded={hasKids ? open : undefined}
            className={cn('group grid grid-cols-[minmax(0,1fr)] items-center border-b border-border/60', cols(files), context ? 'md:h-8' : 'md:h-10',
                selected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50')}>
            <div className="flex min-w-0 items-center py-2 pr-2 md:py-0" style={{ paddingLeft: 8 + depth * 18 }}>
                {hasKids ? (
                    <button type="button" tabIndex={-1} onClick={toggle} aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
                        className="grid size-8 shrink-0 place-items-center rounded text-foreground/70 hover:bg-muted hover:text-foreground md:size-6">
                        <ChevronRight aria-hidden className={cn('size-3.5 transition-transform duration-150 motion-reduce:transition-none', open && 'rotate-90')} />
                    </button>
                ) : <span className="size-8 shrink-0 md:size-6" />}
                <button type="button" data-row={page.id} tabIndex={focusable ? 0 : -1}
                    onClick={onSelect} onDoubleClick={onOpen}
                    className="flex min-w-0 flex-1 flex-col items-start rounded px-1.5 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-row md:items-center md:gap-2">
                    <span className="flex min-w-0 max-w-full items-center gap-1.5">
                        <span className={cn('truncate text-[13px]', context ? 'text-foreground/60' : depth === 0 ? 'font-semibold' : 'font-medium')}>{title}</span>
                        {!context && issues.slice(0, 2).map((i) => <IssueIcon key={i.kind} kind={i.kind} />)}
                        {!open && hasKids && <span className="text-xs tabular-nums text-foreground/70">+{countDescendants(node)}</span>}
                    </span>
                    <span className={cn('truncate font-mono text-[11px]', context ? 'text-foreground/50' : 'text-foreground/70')}>{page.url}</span>
                    {!context && (
                        <span className="mt-1 flex items-center gap-3 md:hidden">
                            <PublicationStatus page={page} compact />
                            <SearchStatus page={page} iconOnly />
                            <FileStatus page={page} iconOnly />
                            <RedirectCount page={page} />
                        </span>
                    )}
                </button>
            </div>
            {context ? <div className={cn('hidden md:block', files ? 'md:col-span-4' : 'md:col-span-3')} /> : <>
                <div className="hidden md:block"><PublicationStatus page={page} compact /></div>
                {/* Healthy states draw as a quiet icon; only exceptions spell themselves out. */}
                <div className="hidden md:block"><SearchStatus page={page} iconOnly={page.search.listed} /></div>
                {files && <div className="hidden md:block">{page.file && <FileStatus page={page} iconOnly={FILE_COPY[page.file.state]?.label === 'In sync'} />}</div>}
                <div className="hidden pr-3 text-right md:block"><RedirectCount page={page} /></div>
            </>}
        </div>
    );
}

export function OutlineView({ roots, summary, filtering, keep, matched, selected, onSelect, onOpenPage, footer }: SiteMapViewProps) {
    const [closed, setClosed] = useState<Set<string>>(new Set());
    const treeRef = useRef<HTMLDivElement>(null);
    const rows = flatten(roots, (id) => filtering || !closed.has(id)).filter((n) => keep.has(n.page.id));
    const toggle = (id: string) => setClosed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    const focusId = rows.some((r) => r.page.id === selected) ? selected : rows[0]?.page.id;
    const files = summary.hasFiles;

    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        const id = (e.target as HTMLElement).dataset.row;
        if (!id) return;
        const i = rows.findIndex((r) => r.page.id === id);
        const focus = (j: number) => treeRef.current?.querySelector<HTMLElement>(`[data-row="${rows[j]?.page.id}"]`)?.focus();
        const node = rows[i];
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); focus(Math.min(rows.length - 1, i + 1)); break;
            case 'ArrowUp': e.preventDefault(); focus(Math.max(0, i - 1)); break;
            case 'Home': e.preventDefault(); focus(0); break;
            case 'End': e.preventDefault(); focus(rows.length - 1); break;
            case 'ArrowRight':
                if (node.children.length && closed.has(id) && !filtering) { e.preventDefault(); toggle(id); }
                else if (node.children.length) { e.preventDefault(); focus(i + 1); }
                break;
            case 'ArrowLeft': {
                e.preventDefault();
                if (node.children.length && !closed.has(id) && !filtering) { toggle(id); break; }
                const parent = rows.findIndex((r) => r.page.id === node.page.parentId);
                if (parent >= 0) focus(parent);
                break;
            }
            case 'Enter':
                // The first Enter selects (the button's click); a second, on the selected row, is the door.
                if (selected === id) { e.preventDefault(); onOpenPage(id); }
                break;
        }
    };

    return (
        <div className="min-h-0 overflow-y-auto" data-view="outline">
            <div className={cn('sticky top-0 z-10 hidden h-8 items-center border-b border-border bg-background text-xs text-foreground/70 md:grid', cols(files))}>
                <span className="pl-10">Page</span><span>Publication</span><span>Search</span>{files && <span>File</span>}
                <span className="pr-3 text-right" title="Old addresses that lead here">Redirects</span>
            </div>
            <div role="tree" aria-label="Pages" ref={treeRef} onKeyDown={onKey}>
                {rows.map((n) => (
                    <Row key={n.page.id} node={n} open={filtering || !closed.has(n.page.id)} toggle={() => toggle(n.page.id)}
                        selected={selected === n.page.id} onSelect={() => onSelect(n.page.id)} onOpen={() => onOpenPage(n.page.id)}
                        context={filtering && !matched.has(n.page.id)} focusable={focusId === n.page.id} files={files} />
                ))}
                {rows.length === 0 && <p className="px-6 py-10 text-center text-[13px] text-foreground/70">No page matches. Clear the filter to see the whole site.</p>}
            </div>
            {footer}
        </div>
    );
}
