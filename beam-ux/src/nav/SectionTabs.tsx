// @splicewire/beam-ux/nav — the top-bar section tab strips (app-walkthrough APP-17, M7′).
//
// The SECOND consumer of a realm's `nav` tree, beside {@link RealmNav}. Where RealmNav draws the
// whole rail, `<SectionTabs>` draws the ONE active section's sub-tabs in the top bar: the active
// level-1 node's projected `children` as the primary strip, and — when the active child is a GROUP
// (a child that itself carries `children`, e.g. Knowledge → Graph) — that group's children as a
// divider-separated second strip (APP-4 "one strip per level").
//
// The tab structure and its visibility come from the SAME server-projected, entitlement-filtered
// `nav` the rail reads (K1: "the server is the one source of tab structure and tab visibility") — a
// tab the projection omits is simply not drawn, never rendered-then-403. The host no longer keeps a
// client `SECTION_META` roster for tabs.
//
// Which section is active is read from the CURRENT pathname, not the server `active`/`activeTrail`
// stamps: a realm's manifest is fetched once per realm, so its stamps are stale for the top bar,
// which changes on every intra-realm navigation. The injected link component owns per-tab active
// styling (its router's active match), exactly as the rail's rows do.
//
// Framework-neutral (the caller injects its router's tab `<Link>`, which speaks `to`/`end`) and
// theme-neutral (the packaged strip classes are the default, overridable via `classNames`).
import type { ComponentType, ReactNode } from 'react';
import type { RealmNavNode } from './types.js';

/**
 * A tab link, injected by the host. It speaks the intersection react-router's `NavLink` and the
 * host's existing `SectionTabLink` already share: a `to` path, an `end` exact-match flag, and the
 * label as children. The component passes no className — the link owns its own active styling.
 */
export type SectionTabLinkComponent = ComponentType<{
    to: string;
    end?: boolean;
    children?: ReactNode;
}>;

/** Class overrides for the rendered strips — each optional, defaulting to the packaged look. */
export type SectionTabsClassNames = {
    /** The wrapper around both strips. */
    root?: string;
    /** The primary (section) strip `<nav>`. */
    primary?: string;
    /** The secondary (group) strip `<nav>`, drawn with a leading divider. */
    group?: string;
};

export type SectionTabsProps = {
    /**
     * The top-level nodes of the realm's resolved `nav` tree (the same `RealmNavNode[]` the host
     * feeds {@link RealmNav}, read off its frame manifest). The active section's `children` are the
     * primary tabs; a child's own `children` are its group strip.
     */
    items?: RealmNavNode[] | null;
    /** The current route pathname (e.g. react-router's `useLocation().pathname`). Drives the active section + group. */
    pathname: string;
    /** The host's tab link component (react-router `NavLink` wrapper / Inertia `Link`). */
    linkComponent: SectionTabLinkComponent;
    /** Class overrides; each defaults to the packaged strip look. */
    classNames?: SectionTabsClassNames;
    /**
     * What to render when a section is matched but has no real sub-tab strip (a leaf section, or one whose
     * only child is its own index — e.g. Studio). The host passes its section-name chrome here; absent ⇒
     * nothing. Not rendered when NO section matches the pathname (that is always nothing).
     */
    fallback?: ReactNode;
};

/** The default strip look — byte-for-byte the classes splicewire-app's SectionBar rendered. */
const DEFAULTS = {
    root: 'flex min-w-0 items-center gap-3',
    primary: 'flex min-w-0 items-center gap-1 overflow-x-auto',
    group: 'flex min-w-0 items-center gap-1 overflow-x-auto border-l border-border/60 pl-3',
} as const;

/**
 * A node's match PREFIX, as a pathname. The server stamps `match` as a trailing-`*` glob of the
 * minted href (`trim(href,'/').'*'`, e.g. `knowledge*`, `workspace*`), which is NOT a pathname; a
 * leaf with a wider match (Workspace's `workspace*` over a `/workspace/team` href) depends on it.
 * Normalise the glob to a leading-slash prefix; fall back to the href for a node with no match.
 */
function prefixOf(node: RealmNavNode): string | null {
    if (node.match) return '/' + node.match.replace(/\*+$/, '').replace(/^\/+/, '').replace(/\/+$/, '');
    if (node.href) return node.href.replace(/\/+$/, '') || '/';
    return null;
}

/** Whether a pathname falls under a prefix, at a segment boundary (so `/workspace` never catches `/workspace-x`). */
function underPrefix(pathname: string, prefix: string): boolean {
    if (prefix === '/') return pathname === '/' || pathname.startsWith('/');
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** The node whose prefix matches the pathname and is the LONGEST such (the most specific section/group wins). */
function activeNode(nodes: RealmNavNode[], pathname: string): RealmNavNode | undefined {
    return nodes
        .map((node) => ({ node, prefix: prefixOf(node) }))
        .filter((candidate): candidate is { node: RealmNavNode; prefix: string } =>
            candidate.prefix !== null && underPrefix(pathname, candidate.prefix),
        )
        .sort((a, b) => b.prefix.length - a.prefix.length)[0]?.node;
}

/** A node that can be drawn as a tab: it navigates somewhere. A group HEADER (no href) is not itself a tab. */
function isTab(node: RealmNavNode): boolean {
    return Boolean(node.href);
}

/** A tab's `end` exact-match flag: an index/Overview tab landing on the section's own href end-matches; others prefix-match. */
function tabsOf(children: RealmNavNode[], parentHref: string | null | undefined) {
    return children.filter(isTab).map((child) => ({
        key: child.routeName ?? child.href ?? child.title,
        to: child.href as string,
        label: child.title,
        end: Boolean(parentHref && child.href === parentHref),
    }));
}

function Strip({
    tabs,
    linkComponent: Link,
    ariaLabel,
    className,
}: {
    tabs: ReturnType<typeof tabsOf>;
    linkComponent: SectionTabLinkComponent;
    ariaLabel: string;
    className: string;
}) {
    if (tabs.length === 0) return null;
    return (
        <nav className={className} aria-label={ariaLabel}>
            {tabs.map((tab) => (
                <Link key={tab.key} to={tab.to} end={tab.end}>
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}

/**
 * The top-bar sub-tab strips for the active section. Renders nothing when the active section is a
 * leaf (no children) or no section matches — the host then draws its own chrome (the section name).
 */
export function SectionTabs({ items, pathname, linkComponent, classNames, fallback }: SectionTabsProps) {
    const sections = (items ?? []).filter((node) => node.zone !== 'meta');
    const section = activeNode(sections, pathname);
    // No section matches the pathname at all → nothing (never the fallback: there is no section to name).
    if (!section) return null;

    const children = section.children ?? [];
    const primary = tabsOf(children, section.href);
    // A section whose only tab is its own index (e.g. Studio → /studio), or a leaf section with no children,
    // has no real sub-tab set: render the host's `fallback` (its section-name chrome) instead of a redundant
    // one-tab strip (APP-4; RW-04 — an index tab beside the section name read the name twice).
    if (primary.filter((tab) => tab.to !== section.href).length === 0) return <>{fallback}</>;

    // The active second-level group (e.g. Knowledge → Graph): a child that itself carries children,
    // on the active trail. Its children render as the divided group strip (APP-4, one strip per level).
    const groups = children.filter((child) => (child.children?.length ?? 0) > 0);
    const activeGroup = activeNode(groups, pathname);
    const groupTabs = activeGroup ? tabsOf(activeGroup.children ?? [], activeGroup.href) : [];

    return (
        <div className={classNames?.root ?? DEFAULTS.root}>
            <Strip
                tabs={primary}
                linkComponent={linkComponent}
                ariaLabel={`${section.title} sub-sections`}
                className={classNames?.primary ?? DEFAULTS.primary}
            />
            {groupTabs.length > 0 && activeGroup ? (
                <Strip
                    tabs={groupTabs}
                    linkComponent={linkComponent}
                    ariaLabel={`${activeGroup.title} group sections`}
                    className={classNames?.group ?? DEFAULTS.group}
                />
            ) : null}
        </div>
    );
}
