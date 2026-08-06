// @splicewire/beam-ux/appshell — section-meta path resolution (Frame OS ticket 19).
//
// The GENERIC, ROUTER-FREE resolvers behind the section-layout / SectionBar nesting: given a
// pathname and a host-authored roster, which section / group / meta-area is active? Pure functions —
// no react, no router — so a host feeds them its own `SECTION_META` / `META_AREAS` and gets the same
// longest-match resolution splicewire-app hand-wrote. The rosters stay host domain; the mechanism
// (longest-prefix match, group activation, meta-area folding) is universal.
import type { MetaArea, MetaCrumb, SectionGroup, SectionMeta } from './types.js';

/** The active second-level group for a pathname within a section, if any (longest match wins). */
export function navGroupForPath(
    section: SectionMeta | undefined,
    pathname: string,
): SectionGroup | undefined {
    return (section?.groups ?? [])
        .filter((g) => pathname === g.match || pathname.startsWith(`${g.match}/`))
        .sort((a, b) => b.match.length - a.match.length)[0];
}

/** The section a pathname currently belongs to, if any (longest match wins). */
export function sectionMetaForPath(
    sections: SectionMeta[],
    pathname: string,
): SectionMeta | undefined {
    return [...sections]
        .filter((s) => pathname === s.match || pathname.startsWith(`${s.match}/`))
        .sort((a, b) => b.match.length - a.match.length)[0];
}

/** The meta area (e.g. Settings) a pathname belongs to, if any — its tabs drive the folded strip. */
export function metaAreaForPath(areas: MetaArea[], pathname: string): MetaArea | undefined {
    return areas.find((a) => pathname === a.match || pathname.startsWith(`${a.match}/`));
}

/**
 * The breadcrumb chain for a meta-area path: `[{ root }, { current tab }]`, or `undefined` when the
 * path is not in a meta area. The current tab is resolved by the longest matching tab prefix, so
 * record sub-routes still root at their tab.
 */
export function metaAreaCrumbs(areas: MetaArea[], pathname: string): MetaCrumb[] | undefined {
    const area = metaAreaForPath(areas, pathname);
    if (!area) return undefined;

    const tab = [...area.tabs]
        .sort((a, b) => b.path.length - a.path.length)
        .find((t) => pathname === t.path || pathname.startsWith(`${t.path}/`));

    const crumbs: MetaCrumb[] = [{ label: area.root.label, path: area.root.path }];
    if (tab) crumbs.push({ label: tab.label });
    return crumbs;
}
