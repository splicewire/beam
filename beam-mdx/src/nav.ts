import type { RawContentModules } from './content';

// =============================================================================
// contentNavNodes — beam-mdx's frontmatter → nav-node mapping.
//
// The beam-specific half of a docs sidebar: read the nav frontmatter keys beam guides
// author (navGroup / navOrder / navGroupOrder / navParent) off the compiled content
// module map and emit flat nav nodes. The generic seam that composes and renders these
// (the nav-source registry, tree builder, <ExpandableNav>, breadcrumb trail) lives in the
// foundation package @schemastud/nav; this is the engine-tier adapter that knows beam's
// frontmatter conventions.
//
// The returned shape is structurally @schemastud/nav's `NavNode` (title/href/group/track/
// parent/order/groupOrder) — a host hands these straight to `registerNavSource` /
// `buildNavTree` — but the type is declared here so beam-mdx takes no dependency on the
// foundation package for a plain data shape.
// =============================================================================

/** A flat nav node (structurally @schemastud/nav's NavNode). */
export type ContentNavNode = {
    title: string;
    href?: string;
    group?: string;
    track?: string;
    parent?: string;
    order?: number;
    groupOrder?: number;
};

/** The nav frontmatter keys a beam guide may carry (all soft). */
type NavFrontmatter = {
    title?: string;
    navGroup?: string;
    navOrder?: number;
    navGroupOrder?: number;
    navParent?: string;
};

export type ContentNavOptions = {
    /** Derive a node's top-level track key from its content name (e.g. folder → track). */
    trackOf: (name: string) => string | undefined;
    /** Build a node's href from its content name (default: `/{name}`). */
    hrefOf?: (name: string) => string;
    /** Keep only names for which this returns true (default: all). */
    filter?: (name: string) => boolean;
    /** Group label for a guide with no `navGroup` (default: leave unset). */
    defaultGroup?: string;
};

const leaf = (name: string) => name.split('/').pop() ?? name;

/**
 * Map a compiled content module map (name → { frontmatter }) to flat nav nodes, one per
 * guide whose `trackOf` resolves (and that passes `filter`). The nav frontmatter
 * (navGroup/navOrder/navGroupOrder/navParent) is read straight off the raw frontmatter —
 * `createContent` intentionally drops those non-render keys, so this reads the map itself.
 */
export function contentNavNodes(
    modules: RawContentModules,
    opts: ContentNavOptions,
): ContentNavNode[] {
    const { trackOf, hrefOf = (n) => `/${n}`, filter, defaultGroup } = opts;

    return Object.entries(modules)
        .map(([name, mod]) => ({
            name,
            track: trackOf(name),
            fm: (mod.frontmatter ?? {}) as NavFrontmatter,
        }))
        .filter(
            (e): e is { name: string; track: string; fm: NavFrontmatter } =>
                e.track !== undefined && (filter ? filter(e.name) : true),
        )
        .map(({ name, track, fm }) => ({
            title: fm.title ?? leaf(name),
            href: hrefOf(name),
            track,
            group: fm.navGroup ?? defaultGroup,
            order: fm.navOrder,
            groupOrder: fm.navGroupOrder,
            parent: fm.navParent,
        }));
}
