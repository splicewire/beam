import { AppContent } from '../../components/app-content';
import { AppShell } from '../../components/app-shell';
import { AppSidebar } from '../../components/app-sidebar';
import { AppSidebarHeader } from '../../components/app-sidebar-header';
import type { FrameRealmContext } from '../../frame/realm';
import type { AppLayoutProps } from '../../types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    realm,
}: AppLayoutProps & {
    /** Scope the sidebar's frame rail to this realm. Omitted: the page's own realm, as before. */
    realm?: FrameRealmContext;
}) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar realm={realm} />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
