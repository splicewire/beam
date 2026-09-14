import AppSidebarLayout from './app/app-sidebar-layout';
import type { FrameRealmContext } from '../frame/realm';
import type { AppLayoutProps } from '../types';

/**
 * Where the operator realm lives at a Beam starter — the same three values each starter's
 * `routes/web.php` already passes to its operator frame console mount (`realm`, `basename`,
 * `manifestUrl`), and the manifest route that mount's group registers with `->defaults('realm',
 * 'operator')`.
 *
 * Written here because an `operator/*` page carries no such props: `/operator` renders
 * `operator/dashboard` with its own page data, and nothing on that page says which manifest its rail
 * should read. The frame console still passes them itself, and {@see useFrameRealm} reads them there.
 */
export const OperatorFrameRealm: FrameRealmContext = {
    realm: 'operator',
    basename: '/operator',
    manifestUrl: '/operator/frame/manifest',
};

/**
 * The operator realm's app chrome: the ordinary `AppLayout` sidebar, with its frame rail and its
 * Dashboard item scoped to the operator realm (otb-ui-frontier-sidebar DESIGN-01, "Want 2").
 *
 * Before this, `operator/*` resolved to `[OsLayout, MainframeHost]` — the only realm with neither its
 * own chrome nor `AppLayout` — so the landing was a bare page, while the operator realm's nav was
 * projected at `/operator/frame/manifest` and rendered nowhere.
 *
 * The realm is scoped to the SIDEBAR, not provided around `children`: the page below keeps reading its
 * own realm (its props, or the tenant default), exactly as it did with no layout at all.
 *
 * Mounted ONLY by the layout switch in `index.tsx`, never by a page — see the float invariant there.
 */
export default function OperatorLayout({ breadcrumbs = [], children }: AppLayoutProps) {
    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs} realm={OperatorFrameRealm}>
            {children}
        </AppSidebarLayout>
    );
}
