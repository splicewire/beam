import { OnThisPage } from '@schemastud/nav';
import { RealmNav } from '../nav/RealmNav.js';
import type { RealmNavNode } from '../nav/types.js';
import { DOCS_LAYOUT_CSS } from './css.js';
import type { ChromeProps } from './types.js';

/**
 * `DocsLayout` — the docs chrome, out of the box: header slot · breadcrumb slot · rail · main ·
 * on-this-page.
 *
 * ## Why the package ships this
 *
 * `splicewire-app`'s `docs-shell.tsx` is 98 lines of exactly this arrangement, and every other beam
 * host that grows a docs area re-derives it. ADR-0213 §2 withdrew the prohibition that kept it out
 * (a package may not ship a *look*; it may absolutely ship an *arrangement*), so what stays host-side
 * is the palette, the fonts, the wordmark, and the header itself — all of them slots or classes here.
 *
 * ## The rail is `RealmNav`, and that is not an accident
 *
 * `NavProjector` emits ADR-0213 §8's grouping as an **href-less `NavLink` heading with its members as
 * children**, and `RealmNav`'s `flat-with-headers` variant already reads an href-less node as opening
 * a labelled group — the convention predates this ticket by a whole other effort. Reusing it means the
 * `nav_group` column shows up in the rail with no second grouping implementation to keep in step, and
 * it is why this layout takes the projection straight from the page props rather than fetching a
 * manifest of its own.
 *
 * ## The on-this-page column is a real component, not a placeholder
 *
 * `<OnThisPage>` from `@schemastud/nav` scans the rendered DOM and scroll-spies it, so it needs no
 * cooperation from the body — which matters here more than usual, because a body is a compiled
 * artifact this layout has never seen. `routeKey` is the current URL so a client-side navigation
 * re-scans; without it the second guide a reader opens shows the first one's headings.
 *
 * ## Every dimension is a token and none of them name a colour
 *
 * The packaged rules are structural only — widths, gaps, flex — each a `--beam-*` custom property with
 * the number the host copies hardcoded as its fallback. A host redefines a token to change a
 * dimension, or passes `classNames` to add its own layer on top. That split is the same one
 * `<Prose>` and `<SiteLayout>` already make, and the rules are an INJECTED STRING for the reason
 * `css.ts` records: a host's Tailwind does not scan `node_modules`, so a utility class shipped inside a
 * package's bundle is a name with no rule behind it.
 */

const DEFAULTS = {
    root: 'beam-docs',
    body: 'beam-docs-body',
    rail: 'beam-docs-rail',
    main: 'beam-docs-main',
    aside: 'beam-docs-aside',
} as const;

export function DocsLayout({ nav, linkComponent, currentHref, slots, classNames, children }: ChromeProps) {
    // The rail renders the DOCS subtree, not the whole realm: the projection is the realm's entire
    // tree (one payload serving both the site header nav and this rail, ADR-0210 §5), so a rail fed
    // the raw root would list the marketing pages beside the guides. The docs root is the node whose
    // href is the longest prefix of the current URL — derived rather than configured, because the
    // whole point of ADR-0209 §9 is that re-rooting `/docs` is one row's edit and nothing else's.
    const items = railItemsFor(nav?.items ?? [], currentHref);

    return (
        <div className={[DEFAULTS.root, classNames?.root].filter(Boolean).join(' ')}>
            <style>{DOCS_LAYOUT_CSS}</style>
            {slots?.header}

            <div className={[DEFAULTS.body, classNames?.body].filter(Boolean).join(' ')}>
                <aside className={[DEFAULTS.rail, classNames?.rail].filter(Boolean).join(' ')} aria-label="Docs sections">
                    {slots?.railTop}
                    <RealmNav items={items} variant="flat-with-headers" linkComponent={linkComponent} />
                </aside>

                <main className={[DEFAULTS.main, classNames?.main].filter(Boolean).join(' ')}>
                    {slots?.breadcrumb}
                    {children}
                </main>

                <div className={[DEFAULTS.aside, classNames?.aside].filter(Boolean).join(' ')}>
                    <OnThisPage routeKey={currentHref} />
                </div>
            </div>

            {slots?.footer}
        </div>
    );
}

/**
 * The children of the deepest node whose `href` is a prefix of the current URL — i.e. the section the
 * reader is in. Falls back to the whole tree when nothing matches, which is the honest degrade: a rail
 * showing too much is navigable, a rail showing nothing is the empty-nav defect ticket 07 already paid
 * for once.
 */
function railItemsFor(items: RealmNavNode[], currentHref: string | undefined): RealmNavNode[] {
    if (!currentHref) {
        return items;
    }

    let best: RealmNavNode | null = null;

    const visit = (nodes: RealmNavNode[]) => {
        for (const node of nodes) {
            const href = node.href;

            if (
                href &&
                href !== '/' &&
                (currentHref === href || currentHref.startsWith(`${href}/`)) &&
                (node.children?.length ?? 0) > 0 &&
                (best === null || href.length > (best.href?.length ?? 0))
            ) {
                best = node;
            }

            if (node.children?.length) {
                visit(node.children);
            }
        }
    };

    visit(items);

    return best === null ? items : ((best as RealmNavNode).children ?? []);
}
