import { OnThisPage } from '@schemastud/nav';
import { RealmNav } from '../nav/RealmNav.js';
import type { RealmNavNode } from '../nav/types.js';
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
 * ## Every className is overridable and none of them name a colour
 *
 * The defaults are structural only — widths, gaps, flex. A host passes `classNames` to paint them.
 * That split is the same one `<Prose>` and `<SiteLayout>` already make.
 */

const DEFAULTS = {
    root: 'flex min-h-screen flex-col',
    body: 'mx-auto flex w-full max-w-7xl flex-1 gap-10 px-6 py-10',
    rail: 'w-56 shrink-0',
    main: 'min-w-0 flex-1',
    aside: 'hidden w-56 shrink-0 xl:block',
} as const;

export function DocsLayout({ nav, linkComponent, currentHref, slots, classNames, children }: ChromeProps) {
    // The rail renders the DOCS subtree, not the whole realm: the projection is the realm's entire
    // tree (one payload serving both the site header nav and this rail, ADR-0210 §5), so a rail fed
    // the raw root would list the marketing pages beside the guides. The docs root is the node whose
    // href is the longest prefix of the current URL — derived rather than configured, because the
    // whole point of ADR-0209 §9 is that re-rooting `/docs` is one row's edit and nothing else's.
    const items = railItemsFor(nav?.items ?? [], currentHref);

    return (
        <div className={classNames?.root ?? DEFAULTS.root}>
            {slots?.header}

            <div className={classNames?.body ?? DEFAULTS.body}>
                <aside className={classNames?.rail ?? DEFAULTS.rail} aria-label="Docs sections">
                    {slots?.railTop}
                    <RealmNav items={items} variant="flat-with-headers" linkComponent={linkComponent} />
                </aside>

                <main className={classNames?.main ?? DEFAULTS.main}>
                    {slots?.breadcrumb}
                    {children}
                </main>

                <div className={classNames?.aside ?? DEFAULTS.aside}>
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
