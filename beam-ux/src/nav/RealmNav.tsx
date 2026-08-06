// @splicewire/beam-ux/nav — the realm-aware grouped rail nav (Frame OS ticket 12 — the marquee
// promotion). The single rail that serves ANY realm from the SAME server-resolved,
// entitlement-filtered, active-STAMPED manifest — the top-level nodes of a realm's `nav` tree.
//
// Grouping is driven by the manifest, NOT fabricated here (no `group`/`entries[]`/`order` field):
//  - grouping IS the hrefless-parent-is-a-group-header convention (see {@link RealmNavVariant}),
//  - ordering IS the authored `nav_order`, already reflected in the tree's child order (never
//    recomputed here),
//  - a realm with multiple launch entries renders its node's `children`.
// The active trail is READ from the PHP-stamped `active`/`activeTrail` fields, never recomputed.
//
// Roster-agnostic: the component hardcodes NO SITE/ACCOUNT/operator roster — a host resolves WHICH
// realm's manifest to feed it and passes the tree + a `variant`. Framework-neutral: the caller injects
// its router's `<Link>` (`linkComponent`) — the package imports no router. Theme-neutral: the packaged
// classes are the default look, every one overridable via `classNames`; a host wanting client-side
// active styling forwards `data-active` (the server-stamped flag) or matches in its own `<Link>`.
import type { ReactNode } from 'react';
import type {
    LinkComponent,
    RealmNavClassNames,
    RealmNavNode,
    RealmNavVariant,
} from './types.js';

export type RealmNavProps = {
    /**
     * The top-level nodes of the realm's resolved `nav` tree (a `laravel-data-nav` `NavNode[]`,
     * entitlement-filtered + active-stamped server-side). The host reads this off its frame manifest.
     */
    items?: RealmNavNode[] | null;
    /** How the flat tree folds into groups (see {@link RealmNavVariant}). Defaults to `flat-with-headers`. */
    variant?: RealmNavVariant;
    /** Router link component (e.g. react-router `NavLink` wrapper / Inertia `Link`). Defaults to `<a>`. */
    linkComponent?: LinkComponent;
    /**
     * Leading-icon renderer — maps a node to its rendered icon. Receives the resolved icon class and
     * the server-stamped active flag so the host applies them DIRECTLY to its icon component (no
     * wrapper element), preserving the host's exact DOM. Absent ⇒ no icon.
     */
    icon?: (node: RealmNavNode, ctx: { className: string; active: boolean }) => ReactNode;
    /** Class overrides; each defaults to the packaged look. */
    classNames?: RealmNavClassNames;
};

type RailGroup = {
    label?: string;
    items: RealmNavNode[];
};

/** The packaged default look — the classes splicewire-app rendered host-locally (byte-for-byte). */
const DEFAULTS = {
    root: 'flex-1 space-y-4 overflow-y-auto px-2.5 text-[13px] font-medium',
    group: 'space-y-0.5',
    groupLabel:
        'px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-sidebar-foreground/55',
    item: (active: boolean) =>
        [
            'flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-2.5 py-2 transition-colors',
            active
                ? 'border-sidebar-primary bg-sidebar-accent font-semibold text-sidebar-active-foreground'
                : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/40 hover:text-sidebar-active-foreground',
        ].join(' '),
    itemIcon: (active: boolean) =>
        ['size-[17px] flex-none', active ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'].join(
            ' ',
        ),
    itemLabel: 'min-w-0 flex-1 truncate',
} as const;

function resolveClass(
    override: string | ((active: boolean) => string) | undefined,
    fallback: (active: boolean) => string,
    active: boolean,
): string {
    if (override === undefined) return fallback(active);
    return typeof override === 'function' ? override(active) : override;
}

/**
 * Fold the flat, server-resolved tree into the grouped shape — grouping from the manifest, never
 * fabricated. Child order is PRESERVED as authored (`nav_order`); nothing is re-sorted here.
 */
function toGroups(items: RealmNavNode[], variant: RealmNavVariant): RailGroup[] {
    if (variant === 'section-groups') {
        // Each top-level node owns a labeled group of its children (a multi-launch realm renders its
        // `children`); a childless node falls back to itself as a lone item.
        return items
            .map((section) => ({
                label: section.title,
                items: (section.children && section.children.length > 0
                    ? section.children
                    : [section]
                ).filter((node) => node.href),
            }))
            .filter((group) => group.items.length > 0);
    }

    // flat-with-headers: nodes are items; an `href`-less node OPENS a new labeled group (§7 convention).
    const groups: RailGroup[] = [];
    let current: RailGroup = { items: [] };
    for (const node of items) {
        if (!node.href) {
            if (current.items.length > 0) groups.push(current);
            current = { label: node.title, items: [] };
        } else {
            current.items.push(node);
        }
    }
    if (current.items.length > 0) groups.push(current);
    return groups;
}

function RailItem({
    node,
    linkComponent,
    icon,
    classNames,
}: {
    node: RealmNavNode;
    linkComponent?: LinkComponent;
    icon?: (node: RealmNavNode, ctx: { className: string; active: boolean }) => ReactNode;
    classNames?: RealmNavClassNames;
}) {
    if (!node.href) return null;

    // Server-stamped active/activeTrail is authoritative — read from the node, never recomputed.
    const serverActive = Boolean(node.active || node.activeTrail);
    const Link: LinkComponent =
        linkComponent ?? (({ href, ...rest }) => <a href={href} {...rest} />);
    const iconClass = resolveClass(classNames?.itemIcon, DEFAULTS.itemIcon, serverActive);

    return (
        <Link
            href={node.href}
            className={resolveClass(classNames?.item, DEFAULTS.item, serverActive)}
            data-active={serverActive}
            aria-current={serverActive ? 'page' : undefined}
        >
            {icon ? icon(node, { className: iconClass, active: serverActive }) : null}
            <span className={classNames?.itemLabel ?? DEFAULTS.itemLabel}>{node.title}</span>
        </Link>
    );
}

export function RealmNav({
    items,
    variant = 'flat-with-headers',
    linkComponent,
    icon,
    classNames,
}: RealmNavProps) {
    const groups = toGroups(items ?? [], variant);

    return (
        <nav className={classNames?.root ?? DEFAULTS.root}>
            {groups.map((group, i) => (
                <div key={group.label ?? `group-${i}`} className={classNames?.group ?? DEFAULTS.group}>
                    {group.label ? (
                        <div className={classNames?.groupLabel ?? DEFAULTS.groupLabel}>
                            {group.label}
                        </div>
                    ) : null}
                    {group.items.map((node) => (
                        <RailItem
                            key={node.routeName ?? node.href ?? node.title}
                            node={node}
                            linkComponent={linkComponent}
                            icon={icon}
                            classNames={classNames}
                        />
                    ))}
                </div>
            ))}
        </nav>
    );
}
