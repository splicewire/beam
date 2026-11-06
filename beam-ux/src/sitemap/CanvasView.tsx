/**
 * The Canvas view (research 37, variant B): the page tree as a map of cards, left to right by depth, with every old
 * address in a lane on the right and drawn as a curve into the page it reaches. A chain is drawn like any other old
 * address, with its redirect count as information; only a walk that fails a guest is marked (D-37-g (b)). Cards are in
 * tree pre-order in the DOM and the tab order; Enter selects, a second Enter or a double-click opens the editor.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronRight, Home, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button, cn } from '@schemastud/ui';
import { issuesFor, isSevere, looseRows, pageTitle, publicationState, type TreeNode } from './model';
import { FileStatus, IssueIcon, PublicationStatus, SearchStatus } from './parts';
import type { SiteMapInbound } from './types';
import type { SiteMapViewProps } from './views';

const CARD_W = 208;
const CARD_H = 78;
const COL = CARD_W + 56;
const PITCH = CARD_H + 14;
const GHOST_W = 176;
const GHOST_H = 26;
const PAD = 24;

interface Placed { node: TreeNode; x: number; y: number; order: number }

function layout(roots: TreeNode[], open: (id: string) => boolean, keep: Set<string>) {
    const placed: Placed[] = [];
    const order = new Map<string, number>();
    const walk = (n: TreeNode) => { order.set(n.page.id, order.size); n.children.forEach(walk); };
    roots.forEach(walk);
    let row = 0;
    let maxDepth = 0;
    const place = (n: TreeNode): number => {
        maxDepth = Math.max(maxDepth, n.depth);
        const kids = open(n.page.id) ? n.children.filter((c) => keep.has(c.page.id)) : [];
        let y: number;
        if (kids.length === 0) { y = row * PITCH; row += 1; } else { y = kids.map(place)[0]; }
        placed.push({ node: n, x: n.depth * COL, y, order: order.get(n.page.id) ?? 0 });
        return y;
    };
    roots.filter((r) => keep.has(r.page.id)).forEach(place);
    // DOM and tab order follow the tree (pre-order), not the layout pass (post-order).
    placed.sort((a, b) => a.order - b.order);
    return { placed, height: Math.max(row * PITCH, CARD_H), laneX: (maxDepth + 1) * COL + 40 };
}

function Card({ p, selected, open, focusable, onSelect, onOpen, onToggle }: {
    p: Placed; selected: boolean; open: boolean; focusable: boolean; onSelect: () => void; onOpen: () => void; onToggle: () => void;
}) {
    const { page } = p.node;
    const issues = issuesFor(page);
    const hasKids = p.node.children.length > 0;
    const title = pageTitle(page);
    return (
        <div className="absolute" style={{ left: p.x, top: p.y, width: CARD_W, height: CARD_H }}>
            <button type="button" data-card={page.id} tabIndex={focusable ? 0 : -1} onClick={onSelect} onDoubleClick={onOpen} aria-pressed={selected}
                className={cn('flex h-full w-full flex-col justify-between gap-1 rounded-lg border bg-card px-3 py-2 text-left shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
                    selected ? 'border-primary ring-2 ring-primary/25' : issues.some((i) => isSevere(i.kind)) ? 'border-destructive/60' : 'border-border hover:border-foreground/30',
                    publicationState(page) === 'unpublished' && 'border-dashed')}>
                <span className="flex w-full min-w-0 items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium">{title}</span>
                    {issues.slice(0, 2).map((i) => <IssueIcon key={i.kind} kind={i.kind} />)}
                </span>
                <span className="truncate font-mono text-[11px] text-foreground/70">{page.url}</span>
                <span className="flex items-center gap-2.5">
                    <PublicationStatus page={page} compact />
                    <SearchStatus page={page} iconOnly />
                    <FileStatus page={page} iconOnly />
                </span>
            </button>
            {hasKids && (
                <button type="button" tabIndex={-1} onClick={onToggle} aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
                    className="absolute -right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-foreground/70 hover:text-foreground">
                    {open ? <ChevronRight aria-hidden className="size-3.5 rotate-180" /> : <span className="text-[10px] font-medium tabular-nums">{p.node.children.length}</span>}
                </button>
            )}
        </div>
    );
}

export function CanvasView({ roots, traces, filtering, keep, selected, onSelect, onOpenPage, footer }: SiteMapViewProps) {
    const [closed, setClosed] = useState<Set<string>>(new Set());
    const [scale, setScale] = useState(0.85);
    const isOpen = (id: string) => filtering || !closed.has(id);
    const { placed, height, laneX } = layout(roots, isOpen, keep);
    const at = new Map(placed.map((p) => [p.node.page.id, p]));
    const scroller = useRef<HTMLDivElement>(null);
    const toggle = (id: string) => setClosed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

    // Bring the selected card into view only when it is out of view, so a click never moves the map.
    useEffect(() => {
        const p = selected ? at.get(selected) : undefined;
        const el = scroller.current;
        if (!p || !el || typeof el.scrollTo !== 'function') return;
        const left = p.x * scale + PAD; const top = p.y * scale + PAD;
        const right = left + CARD_W * scale; const bottom = top + CARD_H * scale;
        const inView = left >= el.scrollLeft && right <= el.scrollLeft + el.clientWidth && top >= el.scrollTop && bottom <= el.scrollTop + el.clientHeight;
        if (!inView) el.scrollTo({ left: Math.max(0, left - 16), top: Math.max(0, top - 16) });
    }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

    // The lane: every old address of a placed page, ordered by its page's height.
    const ghosts = placed.flatMap((p) => p.node.page.redirects.inbound.map((r) => ({ r, target: p })))
        .sort((a, b) => a.target.y - b.target.y);
    let cursor = -Infinity;
    const lane = ghosts.map((g) => {
        const y = Math.max(g.target.y + CARD_H / 2 - GHOST_H / 2, cursor + GHOST_H + 8);
        cursor = y;
        return { ...g, y };
    });
    const loose = looseRows(traces);
    const loopTop = Math.max(height, cursor + GHOST_H + 40);
    const width = laneX + GHOST_W + 40;
    const totalH = loopTop + (loose.length ? loose.length * (GHOST_H + 10) + 40 : 0);

    const edges = placed.filter((p) => p.node.page.parentId && at.has(p.node.page.parentId)).map((p) => {
        const parent = at.get(p.node.page.parentId!)!;
        const x1 = parent.x + CARD_W + 12; const y1 = parent.y + CARD_H / 2;
        const x2 = p.x; const y2 = p.y + CARD_H / 2;
        const mx = x1 + (x2 - x1) / 2;
        const dir = Math.sign(y2 - y1);
        return { id: p.node.page.id, d: dir === 0 ? `M${x1},${y1} H${x2}` : `M${x1},${y1} H${mx - 8} Q${mx},${y1} ${mx},${y1 + dir * 8} V${y2 - dir * 8} Q${mx},${y2} ${mx + 8},${y2} H${x2}` };
    });
    // One tab stop for the map, as Outline: arrows walk the tree in pre-order, Left climbs, Right descends,
    // Enter selects and a second Enter opens the editor.
    const focusId = placed.some((p) => p.node.page.id === selected) ? selected : placed[0]?.node.page.id;
    const onKeys = (e: KeyboardEvent<HTMLDivElement>) => {
        const id = (e.target as HTMLElement).dataset.card;
        if (!id) return;
        const i = placed.findIndex((p) => p.node.page.id === id);
        const focus = (j: number) => scroller.current?.querySelector<HTMLElement>(`[data-card="${placed[j]?.node.page.id}"]`)?.focus();
        const node = placed[i].node;
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); focus(Math.min(placed.length - 1, i + 1)); break;
            case 'ArrowUp': e.preventDefault(); focus(Math.max(0, i - 1)); break;
            case 'Home': e.preventDefault(); focus(0); break;
            case 'End': e.preventDefault(); focus(placed.length - 1); break;
            case 'ArrowLeft': { e.preventDefault(); const parent = placed.findIndex((p) => p.node.page.id === node.page.parentId); if (parent >= 0) focus(parent); break; }
            case 'ArrowRight': {
                e.preventDefault();
                if (node.children.length && !isOpen(id)) { toggle(id); break; }
                const child = placed.findIndex((p) => p.node.page.parentId === id);
                if (child >= 0) focus(child);
                break;
            }
            case 'Enter': if (selected === id) { e.preventDefault(); onOpenPage(id); } break;
        }
    };
    // A narrow screen starts fitted, so the first view is the whole map rather than its top-left corner.
    useEffect(() => {
        const el = scroller.current;
        if (el && el.clientWidth > 0 && el.clientWidth < 768) {
            setScale(Math.max(0.4, Math.min(1, +((el.clientWidth - PAD * 2) / width).toFixed(2))));
            el.scrollTo?.({ left: 0, top: 0 });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const fit = () => { const el = scroller.current; if (el) setScale(Math.max(0.4, Math.min(1, +((el.clientWidth - PAD * 2) / width).toFixed(2)))); };
    const home = () => scroller.current?.scrollTo?.({ left: 0, top: 0 });
    const ghostTone = (r: SiteMapInbound) => r.attention ? 'border-destructive/60 text-destructive' : 'border-border text-foreground/75';

    return (
        <div className="relative flex min-h-0 min-w-0 flex-col" data-view="canvas">
            <div role="group" aria-label="Zoom" className="flex items-center justify-end gap-0.5 border-b border-border bg-background px-3 py-1">
                <Button variant="ghost" size="icon" className="size-11 md:size-8" aria-label="Back to the top" onClick={home}><Home /></Button>
                <Button variant="ghost" size="icon" className="size-11 md:size-8" aria-label="Zoom out" onClick={() => setScale((s) => Math.max(0.4, +(s - 0.15).toFixed(2)))}><ZoomOut /></Button>
                <span className="w-10 text-center text-xs tabular-nums text-foreground/70" aria-live="polite">{Math.round(scale * 100)}%</span>
                <Button variant="ghost" size="icon" className="size-11 md:size-8" aria-label="Zoom in" onClick={() => setScale((s) => Math.min(1.4, +(s + 0.15).toFixed(2)))}><ZoomIn /></Button>
                <Button variant="ghost" size="icon" className="size-11 md:size-8" aria-label="Fit to screen" onClick={fit}><Maximize2 /></Button>
            </div>
            <div ref={scroller} onKeyDown={onKeys} className="min-h-0 flex-1 overflow-auto bg-muted/30">
                <div style={{ width: width * scale + PAD * 2, height: totalH * scale + PAD * 2 }} className="relative">
                    <div className="absolute origin-top-left" style={{ left: PAD, top: PAD + 8, width, height: totalH, transform: `scale(${scale})` }}>
                        <svg className="pointer-events-none absolute inset-0 overflow-visible" width={width} height={totalH} aria-hidden>
                            {edges.map((e) => <path key={e.id} d={e.d} fill="none" className="stroke-border" strokeWidth={1.5} />)}
                            {lane.map(({ r, y, target }) => {
                                const hot = selected === target.node.page.id;
                                const x1 = laneX; const y1 = y + GHOST_H / 2;
                                const x2 = target.x + CARD_W; const y2 = target.y + CARD_H / 2;
                                return <path key={r.id} d={`M${x1},${y1} C${x1 - 60},${y1} ${x2 + 60},${y2} ${x2 + 2},${y2}`} fill="none" strokeWidth={hot ? 1.75 : 1.25}
                                    strokeDasharray="4 3" className={cn(r.attention ? 'stroke-destructive' : 'stroke-foreground/50', hot ? 'opacity-100' : 'opacity-35')} />;
                            })}
                        </svg>
                        {lane.length > 0 && <p className="absolute text-xs font-medium text-foreground/70" style={{ left: laneX, top: -22 }}>Old addresses</p>}
                        {lane.map(({ r, y, target }) => (
                            <button key={r.id} type="button" tabIndex={-1} onClick={() => onSelect(target.node.page.id)}
                                title={`${r.path} → ${target.node.page.url ?? pageTitle(target.node.page)}`}
                                className={cn('absolute flex items-center gap-1.5 truncate rounded-md border border-dashed bg-background px-2 font-mono text-[11px]', ghostTone(r))}
                                style={{ left: laneX, top: y, width: GHOST_W, height: GHOST_H }}>
                                <span className="truncate">{r.path}{r.match === 'prefix' ? '/…' : ''}</span>
                                {r.hops > 1 && r.end === 'answered' && <span className="ml-auto shrink-0 font-sans tabular-nums text-foreground/70">{r.hops} hops</span>}
                                {r.attention && <span className="sr-only">fails a guest</span>}
                            </button>
                        ))}
                        {loose.length > 0 && <p className="absolute text-xs font-medium text-foreground/70" style={{ left: laneX, top: loopTop - 22 }}>Redirects that reach no page</p>}
                        {loose.map((t, i) => (
                            <div key={t.id} className={cn('absolute flex items-center gap-1.5 rounded-md border border-dashed bg-background px-2 font-mono text-[11px]', t.attention ? 'border-destructive/60 text-destructive' : 'border-border text-foreground/75')}
                                style={{ left: laneX, top: loopTop + i * (GHOST_H + 10), width: GHOST_W, height: GHOST_H }}>
                                <span className="truncate">{t.path} → {(t.to ?? t.steps[1] ?? '').replace(/^https?:\/\//, '')}</span>
                                {t.end === 'loop' && <span className="ml-auto font-sans">loop</span>}
                            </div>
                        ))}
                        {placed.map((p) => (
                            <Card key={p.node.page.id} p={p} selected={selected === p.node.page.id} open={isOpen(p.node.page.id)} focusable={focusId === p.node.page.id}
                                onSelect={() => onSelect(p.node.page.id)} onOpen={() => onOpenPage(p.node.page.id)} onToggle={() => toggle(p.node.page.id)} />
                        ))}
                    </div>
                </div>
                {placed.length === 0 && <p className="px-6 py-10 text-center text-[13px] text-foreground/70">No page matches. Clear the filter to see the whole site.</p>}
                {footer}
            </div>
        </div>
    );
}
