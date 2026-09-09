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
import { useState, type ReactNode } from 'react';
import { REALM_NAV_CSS } from './css.js';
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
    /**
     * The upsell CTA rendered inside a locked row's popover. Receives the node and its OPAQUE
     * `upsell` token — a plan key, an upgrade href, a feature id; neither PHP nor this component
     * interprets it, so mapping it to an actual upgrade destination is the host's job and this is the
     * seam for it. Absent ⇒ a plain "Upgrade" button that closes the popover, which surfaces the lock
     * without pretending to know where the host sells.
     */
    upsellCta?: (node: RealmNavNode, ctx: { upsell: string | null }) => ReactNode;
};

type RailGroup = {
    label?: string;
    items: RealmNavNode[];
};

/**
 * The active item's colour, the group label's tracking and the icon size are rules in
 * {@link REALM_NAV_CSS}, a sheet the component renders inline, keyed off `data-active` — NOT
 * utilities.
 *
 * ## The defect this replaces, twice over
 *
 * First cut: the bare utility `text-sidebar-active-foreground`. `sidebar-active-foreground` is not one
 * of shadcn's eight standard sidebar tokens — splicewire-app invented it and is the only host that
 * defines it — so every other host got an active item with **no text colour at all**: the class was
 * scanned, the theme key did not exist, Tailwind emitted no rule, and the page still returned 200.
 *
 * Second cut: `text-[var(--sidebar-active-foreground,var(--sidebar-foreground))]` — the fallback was
 * right, but an arbitrary-value utility that exists only inside this package's dist is generated only
 * at a host whose Tailwind scans `node_modules/@splicewire/beam-ux/dist`, and most do not
 * (beam-docs-satellite 62). Same shape one layer down: the module resolved, every static check
 * passed, and the colour was gone. So was `tracking-[0.1em]` on the group label, which sat in the same
 * literal as `text-sidebar-foreground/55` (emitted everywhere) — the right colour at the wrong
 * letter-spacing, half a class list.
 *
 * A render-time `<style>` is the package's settled answer (`docs/css.ts`, `<Prose>`): it is not an
 * import-time side effect, so `sideEffects: false` cannot drop it, and it needs nothing from the
 * host's scan scope. The colour chain itself is unchanged and still exported for the test to assert
 * against — see {@link SIDEBAR_ACTIVE_FG} for why it names the raw `--sidebar-*` properties.
 */
export { SIDEBAR_ACTIVE_FG } from './css.js';

/** The packaged default look — the classes splicewire-app rendered host-locally (byte-for-byte). */
const DEFAULTS = {
    root: 'flex-1 space-y-4 overflow-y-auto px-2.5 text-[13px] font-medium',
    group: 'space-y-0.5',
    groupLabel: 'beam-nav-label px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase text-sidebar-foreground/55',
    // The active / hover text colour is `.beam-nav-item[data-active=…]` in REALM_NAV_CSS; the
    // utilities here are the ones every host emits for its own sidebar.
    item: (active: boolean) =>
        [
            'beam-nav-item flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-2.5 py-2 transition-colors',
            active
                ? 'border-sidebar-primary bg-sidebar-accent font-semibold'
                : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/40',
        ].join(' '),
    itemIcon: (active: boolean) =>
        ['beam-nav-icon flex-none', active ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'].join(
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
                ).filter(isRailable),
            }))
            .filter((group) => group.items.length > 0);
    }

    // flat-with-headers: nodes are items; an `href`-less node OPENS a new labeled group (§7 convention).
    //
    // A heading may also CARRY its members as children, which is the shape beam-ux's own `NavProjector`
    // emits for ADR-0213 §8's `nav_group` — a `NavLink` with no href whose children are the grouped
    // entries. Seeding the new group with them keeps one convention rather than two: a heading followed
    // by flat siblings (a host frame manifest) and a heading holding its members (the containment-tree
    // projection) both render as one labeled group. Nothing regresses, because no manifest emitting the
    // flat shape gives an href-less node children.
    const groups: RailGroup[] = [];
    let current: RailGroup = { items: [] };
    for (const node of items) {
        if (!node.href && !node.locked) {
            if (current.items.length > 0) groups.push(current);
            current = { label: node.title, items: (node.children ?? []).filter(isRailable) };
        } else {
            current.items.push(node);
        }
    }
    if (current.items.length > 0) groups.push(current);
    return groups;
}

/**
 * Whether a node is a rail ITEM rather than a group header.
 *
 * An href is what normally makes it one — and a LOCKED node is one too, with or without an href,
 * because a locked row never navigates. Dropping it for want of a destination would delete the exact
 * state this projection exists to make visible: a section the principal's plan does not include is
 * likelier than not to have nothing meaningful to point at.
 */
function isRailable(node: RealmNavNode): boolean {
    return Boolean(node.href || node.locked);
}

/**
 * The upsell shown when a locked row is clicked — the rail's counterpart to the desktop chrome's
 * `UpsellPopover`, pinned there by *"a locked tile opens the upsell popover — never navigates or
 * opens a window"* (`@schemastud/mainframe` `os/__tests__/desktopChrome.test.tsx`). A locked nav ROW
 * and a locked desktop TILE are the same soft-gate affordance in two chromes, so they behave the
 * same: no navigation, a popover carrying the server's reason, a CTA, and a scrim that dismisses.
 *
 * The server's `reason` IS the copy. The desktop tile falls back to a fabricated `Unlock {title}`
 * because its `upsell` bag may carry no title; here the PHP `NavLocked` makes `reason` non-nullable,
 * so there is nothing to invent and the row says exactly what the projection said.
 */
function UpsellPopover({
    node,
    cta,
    onClose,
}: {
    node: RealmNavNode;
    cta?: (node: RealmNavNode, ctx: { upsell: string | null }) => ReactNode;
    onClose: () => void;
}) {
    const upsell = node.locked?.upsell ?? null;

    return (
        <>
            <div className="beam-nav-upsell-scrim" onClick={onClose} />
            <div className="beam-nav-upsell" role="dialog" aria-label={`Unlock ${node.title}`}>
                <div className="beam-nav-upsell-title">{node.title}</div>
                <p className="beam-nav-upsell-copy">{node.locked?.reason}</p>
                {cta ? (
                    cta(node, { upsell })
                ) : (
                    <button type="button" className="beam-nav-upsell-cta" onClick={onClose}>
                        Upgrade
                    </button>
                )}
            </div>
        </>
    );
}

function RailItem({
    node,
    linkComponent,
    icon,
    classNames,
    onUpsell,
}: {
    node: RealmNavNode;
    linkComponent?: LinkComponent;
    icon?: (node: RealmNavNode, ctx: { className: string; active: boolean }) => ReactNode;
    classNames?: RealmNavClassNames;
    onUpsell: (node: RealmNavNode) => void;
}) {
    // Server-stamped active/activeTrail is authoritative — read from the node, never recomputed.
    const serverActive = Boolean(node.active || node.activeTrail);
    const iconClass = resolveClass(classNames?.itemIcon, DEFAULTS.itemIcon, serverActive);

    // A soft-locked row: present, never navigable. It is a `<button>`, not a `<Link>`, so there is no
    // href to middle-click, copy or prefetch into a page the principal's plan does not include — the
    // interaction contract the desktop chrome's locked tile already holds. `data-locked` drives the
    // packaged styling and is what a rendered-output assertion can see.
    if (node.locked) {
        return (
            <button
                type="button"
                className={resolveClass(classNames?.item, DEFAULTS.item, false)}
                data-active={false}
                data-locked={true}
                title={node.locked.reason}
                onClick={() => onUpsell(node)}
            >
                {icon ? icon(node, { className: iconClass, active: false }) : null}
                <span className={classNames?.itemLabel ?? DEFAULTS.itemLabel}>{node.title}</span>
                <span className="beam-nav-lock" aria-label="locked">
                    🔒
                </span>
            </button>
        );
    }

    if (!node.href) return null;

    const Link: LinkComponent =
        linkComponent ?? (({ href, ...rest }) => <a href={href} {...rest} />);

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
    upsellCta,
}: RealmNavProps) {
    const groups = toGroups(items ?? [], variant);
    // One popover for the whole rail, held here rather than per-row, so two locked rows can never be
    // open at once — the same placement the desktop chrome's `Dock` uses for its upsell state.
    const [upsell, setUpsell] = useState<RealmNavNode | null>(null);

    return (
        <nav className={classNames?.root ?? DEFAULTS.root}>
            <style>{REALM_NAV_CSS}</style>
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
                            onUpsell={setUpsell}
                        />
                    ))}
                </div>
            ))}
            {upsell ? (
                <UpsellPopover node={upsell} cta={upsellCta} onClose={() => setUpsell(null)} />
            ) : null}
        </nav>
    );
}
