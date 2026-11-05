import { Combobox, type ComboboxOption, type ComboboxPrimitives } from '@schemastud/combobox';
import { ExpandableNav, type NavNode as TreeNode } from '@schemastud/nav';
import type { LinkComponent, RealmNavKindProps, RealmNavNode } from '@splicewire/beam-ux/nav';
import {
    cloneElement, createContext, forwardRef, isValidElement, useCallback, useContext, useEffect, useMemo, useRef, useState,
    type ReactElement, type ReactNode,
} from 'react';
import { docsConfiguration } from './config.js';
import type { RegistryIndexData, RegistryIndexGroupData, RegistryIndexRootData } from './generated/types.js';
import { REGISTRY_INDEX_CSS } from './registry-index-css.js';

/** The `kind` laravel-beam-docs' `RegistryIndexNavNode` ships under (`beam.docs.registries.nav.widget` = `index`). */
export const REGISTRY_INDEX_KIND = 'beam-docs/registry-index';

/**
 * The node as it arrives: a nav node whose `index` is laravel-beam-docs' `RegistryIndexData` (generated, never
 * re-typed here). `index` is optional because a node is read off the wire, and a node without one draws nothing.
 */
export type RegistryIndexNavNode = RealmNavNode & { index?: RegistryIndexData | null };

/** One root, flattened for the search, with the group titles it sits under. */
type IndexedRoot = RegistryIndexRootData & { trail: string[] };

/**
 * `RegistryIndexNav` — the registry reference as one widget (docs-feedback ticket 07), the component beam-docs maps
 * `beam-docs/registry-index` to in `<RealmNav kinds>`.
 *
 * Two parts, both over the server's {@link RegistryIndexData}:
 *
 *  - a search (`@schemastud/combobox`) that jumps to any root by name: a root this host serves navigates; one it does
 *    not (not available, unpublished, exempt) opens its place in the tree instead, because its only link is the deep-link
 *    route, which answers JSON rather than a page;
 *  - a tree (`@schemastud/nav` `ExpandableNav`): configured headings are tracks, clusters are disclosures that start
 *    collapsed except the one holding the current page, and a cluster inside a cluster nests one level under its page.
 *
 * Availability is the server's value, drawn, never re-derived: an unserved root is a plain row carrying the server's
 * note ("not available on this host") and is skipped by Tab, since it goes nowhere.
 *
 * Like the rest of the docs chrome, its rules are an injected sheet ({@link REGISTRY_INDEX_CSS}) and its classes are
 * the package's own, because a host's Tailwind does not scan this bundle.
 */
export function RegistryIndexNav({ node, linkComponent, currentHref }: RealmNavKindProps) {
    const index = (node as RegistryIndexNavNode).index ?? null;
    const roots = useMemo(() => (index ? flatten(index.groups) : []), [index]);
    const byHref = useMemo(() => new Map(roots.filter((r) => r.href).map((r) => [r.href as string, r])), [roots]);
    const tree = useMemo(() => (index ? toTree(index.groups) : []), [index]);
    // The root a search chose that has no page: the tree opens on it as if it were current.
    const [revealed, setRevealed] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => setRevealed(null), [currentHref]);
    useEffect(() => {
        if (!revealed) return;
        const row = rootRef.current?.querySelector<HTMLElement>(`[data-registry-root="${cssEscape(revealed)}"]`);
        row?.scrollIntoView?.({ block: 'nearest' });
        row?.focus();
    }, [revealed]);

    const search = useCallback(async (query: string): Promise<ComboboxOption[]> => {
        const q = query.trim().toLowerCase();
        return roots
            .filter((r) => q === '' || r.root.toLowerCase().includes(q) || r.trail.some((t) => t.toLowerCase().includes(q)))
            .map((r) => ({
                value: r.root,
                label: r.root,
                hint: [r.trail.join(' › '), r.note].filter(Boolean).join(' · '),
            }));
    }, [roots]);

    if (!index) return null;

    const Link: LinkComponent = linkComponent ?? (({ href, ...rest }) => <a href={href} {...rest} />);
    const current = currentHref ? byHref.get(currentHref)?.root : undefined;

    const choose = (option: ComboboxOption) => {
        const root = roots.find((r) => r.root === option.value);
        if (!root) return;
        if (navigable(root) && root.href) {
            (docsConfiguration().navigate ?? defaultNavigate)(root.href);
        } else {
            setRevealed(root.href ?? root.root);
        }
    };

    return (
        <div ref={rootRef} className="beam-registry-index" data-registry-index="">
            <style>{REGISTRY_INDEX_CSS}</style>
            <Combobox
                primitives={PRIMITIVES}
                trigger={
                    <button type="button" className="beam-registry-index-trigger" aria-haspopup="listbox">
                        <span aria-hidden="true">⌕</span>
                        <span>Find a registry</span>
                        <span className="beam-registry-index-count">{index.total}</span>
                    </button>
                }
                search={search}
                onSelect={choose}
                currentValue={current}
                placeholder="Jump to a registry root"
                emptyText="No registry matches"
                debounceMs={0}
                contentClassName="beam-registry-index-popover"
                inputClassName="beam-registry-index-input"
                listClassName="beam-registry-index-results"
            />
            <ExpandableNav
                items={tree}
                currentHref={revealed ?? currentHref}
                initialGroupState="collapsed"
                storagePrefix="beam-docs:registry-index"
                trackLabel={(track) => (track === OTHER ? (tree.some((n) => n.track !== OTHER) ? 'Other registries' : '') : track)}
                aria-label="Registry index"
                classes={{
                    nav: 'beam-registry-index-tree',
                    track: 'beam-registry-index-track',
                    trackLabel: 'beam-registry-index-track-label',
                    group: 'beam-registry-index-group',
                    header: 'beam-registry-index-header',
                    chevron: 'beam-registry-index-chevron',
                    panelInner: 'beam-registry-index-panel',
                    item: 'beam-registry-index-item',
                    children: 'beam-registry-index-children',
                }}
                renderLink={(item, { active }) => {
                    const root = item.href ? byHref.get(item.href) : undefined;
                    if (root && !navigable(root)) {
                        return (
                            <span
                                className="beam-registry-index-root"
                                data-availability={root.availability}
                                data-registry-root={root.href ?? root.root}
                                data-revealed={active || undefined}
                                tabIndex={-1}
                                title={root.note ?? undefined}
                            >
                                <span className="beam-registry-index-name">{breakable(root.root)}</span>
                                {root.note ? <span className="beam-registry-index-note">{root.note}</span> : null}
                            </span>
                        );
                    }
                    if (!item.href) {
                        return <span className="beam-registry-index-root">{item.title}</span>;
                    }
                    return (
                        <Link
                            href={item.href}
                            className="beam-registry-index-link"
                            data-active={active}
                            aria-current={active ? 'page' : undefined}
                        >
                            <span
                                className="beam-registry-index-name"
                                data-availability={root?.availability ?? 'served'}
                                data-registry-root={item.href}
                            >
                                {breakable(item.title)}
                            </span>
                        </Link>
                    );
                }}
            />
        </div>
    );
}

/** The track for groups no configured heading gathers. */
const OTHER = '';

/** A dotted root with a break opportunity after each dot, so a long name wraps at a segment, never mid-word. */
function breakable(name: string): ReactNode {
    const parts = name.split('.');
    // Text and <wbr> siblings only: no wrapper elements, so the accessible name stays the root as spelled.
    return parts.flatMap((part, i) => (i < parts.length - 1 ? [`${part}.`, <wbr key={i} />] : [part]));
}

function navigable(root: RegistryIndexRootData): boolean {
    return root.availability === 'served' || root.availability === 'external';
}

function defaultNavigate(href: string): void {
    window.location.assign(href);
}

function cssEscape(value: string): string {
    return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, '\\$&');
}

/** Every root, depth first, in the server's order, with the titles of the groups above it. */
function flatten(groups: RegistryIndexGroupData[], trail: string[] = []): IndexedRoot[] {
    return groups.flatMap((group) => {
        const here = [...trail, group.title];
        return [...group.roots.map((root) => ({ ...root, trail: here })), ...flatten(group.groups, here)];
    });
}

/**
 * The index as `ExpandableNav`'s flat input: a configured heading (no roots, no page, only groups) is a track and its
 * groups are its disclosures; any other top-level group is a disclosure in the {@link OTHER} track. A disclosure lists
 * its cluster page ("Overview"), its roots, then each nested cluster as an item whose roots nest under it (the
 * builder's one level, keyed by the page's last path segment). Deeper clusters and page-less nested clusters fold
 * their roots into the nearest level that can hold them. `order` keeps the server's order through the builder's sort.
 */
function toTree(groups: RegistryIndexGroupData[]): TreeNode[] {
    const nodes: TreeNode[] = [];
    let order = 0;
    let groupOrder = 0;

    const disclosure = (track: string, group: RegistryIndexGroupData) => {
        const label = group.title;
        const go = groupOrder++;
        const push = (n: Omit<TreeNode, 'track' | 'group' | 'groupOrder' | 'order'>) =>
            nodes.push({ ...n, track, group: label, groupOrder: go, order: order++ });
        const hrefs = new Set(group.roots.map((r) => r.href));
        if (group.href && !hrefs.has(group.href)) push({ title: 'Overview', href: group.href });
        group.roots.forEach((r) => push({ title: r.root, href: r.href ?? undefined }));
        for (const nested of group.groups) {
            // The nested cluster's page is the item its roots hang under; without a page they sit in the disclosure.
            const slug = nested.href ? nested.href.split('/').filter(Boolean).pop() : undefined;
            const roots = flatten([nested]);
            const pageIsARoot = roots.some((r) => r.href === nested.href);
            if (nested.href && !pageIsARoot) push({ title: nested.title, href: nested.href });
            for (const r of roots) {
                const anchor = r.href === nested.href;
                push({ title: r.root, href: r.href ?? undefined, parent: slug && !anchor ? slug : undefined });
            }
        }
    };

    for (const group of groups) {
        if (group.roots.length === 0 && group.href === null && group.groups.length > 0) {
            group.groups.forEach((member) => disclosure(group.title, member));
        } else {
            disclosure(OTHER, group);
        }
    }

    return nodes;
}

/* ---------------------------------------------------------------------------------------------------------------
 * The combobox's injected atoms. `@schemastud/combobox` carries no design system; these are the smallest ones that
 * keep its contract (a controlled popover, an `asChild` trigger, an input that takes a ref) with no dependency.
 * ------------------------------------------------------------------------------------------------------------- */

type PopoverState = { open: boolean; setOpen: (open: boolean) => void; trigger: React.RefObject<HTMLElement | null> };
const PopoverContext = createContext<PopoverState | null>(null);

function Popover({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
    const trigger = useRef<HTMLElement | null>(null);
    const box = useRef<HTMLDivElement>(null);
    const wasOpen = useRef(open);
    const outside = useRef(false);

    useEffect(() => {
        if (!open) return;
        outside.current = false;
        const onDown = (e: PointerEvent) => {
            if (box.current && !box.current.contains(e.target as Node)) {
                outside.current = true;
                onOpenChange(false);
            }
        };
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, [open, onOpenChange]);

    // Closing from inside (Escape, a choice) hands focus back to the trigger: the focused input has just unmounted, so
    // the reader would otherwise be left on <body>. A click elsewhere keeps the focus it moved to.
    useEffect(() => {
        const lost = !document.activeElement || document.activeElement === document.body || box.current?.contains(document.activeElement);
        if (wasOpen.current && !open && !outside.current && lost) trigger.current?.focus();
        wasOpen.current = open;
    }, [open]);

    return (
        <PopoverContext.Provider value={{ open, setOpen: onOpenChange, trigger }}>
            {/* Escape closes from anywhere inside, not only the input: the trigger still holds focus for the frame before
                the combobox moves it, and a reader who presses Escape then expects the list to go. */}
            <div
                ref={box}
                className="beam-registry-index-search"
                data-open={open || undefined}
                onKeyDown={(e) => {
                    if (open && e.key === 'Escape') {
                        e.stopPropagation();
                        onOpenChange(false);
                        trigger.current?.focus();
                    }
                }}
            >
                {children}
            </div>
        </PopoverContext.Provider>
    );
}

function PopoverTrigger({ children }: { asChild?: boolean; children: ReactNode }) {
    const state = useContext(PopoverContext)!;
    if (!isValidElement(children)) return <>{children}</>;
    const child = children as ReactElement<Record<string, unknown>>;
    return cloneElement(child, {
        ref: (el: HTMLElement | null) => {
            state.trigger.current = el;
        },
        'aria-expanded': state.open,
        onClick: () => state.setOpen(!state.open),
    });
}

function PopoverContent({ className, children }: { className?: string; children: ReactNode; onOpenAutoFocus?: unknown }) {
    const state = useContext(PopoverContext)!;
    return state.open ? <div className={className}>{children}</div> : null;
}

const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
    <input ref={ref} type="search" autoComplete="off" spellCheck={false} {...props} />
));
Input.displayName = 'RegistryIndexInput';

const PRIMITIVES: ComboboxPrimitives = { Popover, PopoverTrigger, PopoverContent, Input };
