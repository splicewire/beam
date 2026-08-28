/**
 * `@splicewire/beam-ux/nav` — the realm-aware grouped rail nav (Frame OS ticket 12, the marquee
 * promotion of the server-resolved / entitlement-filtered / grouped realm navigation).
 *
 * `<RealmNav>` renders the top-level nodes of a realm's resolved `nav` tree (a `laravel-data-nav`
 * `NavNode[]`) as a grouped rail — grouping from the hrefless-parent-is-a-group-header convention,
 * ordering from the authored `nav_order` already reflected in the tree, the active trail read from
 * the PHP-stamped `active`/`activeTrail` fields. NO `group`/`entries[]`/`order` field is introduced.
 *
 * Roster-agnostic (a host resolves WHICH realm's manifest to feed it), framework-neutral (injects the
 * host's `<Link>`, imports no router), theme-neutral (the packaged classes are the default, all
 * overridable via `classNames`; icons via an injected renderer).
 */

export { RealmNav, SIDEBAR_ACTIVE_FG, type RealmNavProps } from './RealmNav.js';
export type {
    RealmNavNode,
    RealmNavVariant,
    RealmNavClassNames,
    LinkComponent,
} from './types.js';
