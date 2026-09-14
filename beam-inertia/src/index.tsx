import "./types/global";
import { Link } from "@inertiajs/react";
import { configureEntryPage } from "@splicewire/beam-ux/docs";
import { resolveBeamPage } from "./pages";
import { configureBeamInertia, type BeamInertiaConfig } from "./config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { initializeTheme } from "./hooks/use-appearance";
import AppLayout from "./layouts/app-layout";
import AuthLayout from "./layouts/auth-layout";
import BeamAccountLayout from "./layouts/beam-account-layout";
import MainframeHost from "./layouts/beam-ux/mainframe-host";
import OperatorLayout from "./layouts/operator-layout";
import OsLayout from "./layouts/os-layout";
import SettingsLayout from "./layouts/settings/layout";
import SiteLayout from "./layouts/site-layout";

/**
 * One client for the whole app. Any `@splicewire/beam-ux` surface that owns its own data logic uses
 * react-query per the package's rule — `<ManifestTable>`, which the seeded `/docs/mcp` page renders,
 * is the first one a fresh install hits. `useQuery` throws outside a provider and offers no supported
 * way to detect one, so this has to be mounted by the host; the package ships `<ManifestTableView>`
 * as the pure escape hatch for SSR and provider-less embeds, not as a substitute for this.
 */
const queryClient = new QueryClient();

/**
 * The host half of the PACKAGED entry page (ADR-0213 §3). `pages/site/entry.tsx` used to live here —
 * 84 lines, byte-identical in all three starters and independently grown to 262 and 285 on two real
 * hosts. The page now comes from `@splicewire/beam-ux/pages`, and everything only a host has arrives
 * through this one call, because an Inertia page's props come from the server and there is no other
 * channel from here into it.
 *
 * `wrap` is this site's chrome. Every public entry — the docs pages, a marketing page, a legal page —
 * renders inside `<SiteLayout>`, which is a fact about this HOST rather than about any one entry, so
 * it belongs here and not in an entry's `layout` column. An entry that wants the docs rail declares
 * `layout: DocsLayout` and gets it NESTED inside this.
 *
 * Putting a file back at `resources/js/pages/site/entry.tsx` overrides the packaged page outright —
 * the resolver below checks this host's own glob first. That is the whole override mechanism.
 */
export function beamInertiaOptions(config: BeamInertiaConfig = {}) {
  configureBeamInertia(config);
  const appName = config.name ?? "Beam";
  if (typeof window !== "undefined") initializeTheme();
  configureEntryPage({
    linkComponent: Link,
    wrap: (node) => <SiteLayout>{node}</SiteLayout>,
  });

  return {
    title: (title: string) => (title ? `${title} - ${appName}` : appName),
    /**
     * Own glob first, the package's page map second (ADR-0213 §3). Written out rather than left to
     * `@inertiajs/vite`'s injected resolver, because the injected one throws on a name it cannot find
     * in `./pages` and a package-contributed page is by definition not there.
     */
    resolve: resolveBeamPage,
    layout: (name: string) => {
      if (name === "_prototype") {
        return null;
      }

      switch (true) {
        // The OS-shell desktop is fully self-chromed (menu bar + dock + windows) — no wrapping layout,
        // never (re-)wrapped by the persistent OsLayout overlay either (it mounts its OWN operator
        // chrome — see os/shell-config.tsx).
        case name === "os":
          return null;
        // Site-realm pages carry their own <SiteLayout> internally (the OOTB site chrome). Wrapped in
        // MainframeHost so an author (`ux.author`) can edit the page in place; a reader falls through
        // to the self-chromed page (readMode: 'page' is a no-op swap). OsLayout OUTERMOST: an
        // `os.enter` principal gets the persistent operator dock overlay on top of the real page.
        case name.startsWith("site/"):
          return [OsLayout, MainframeHost];
        // The OPERATOR front-end realm — the ordinary app sidebar with its rail read from the
        // operator realm's manifest (<OperatorLayout>, `/operator/frame/manifest`), framed by the
        // promoted <MainframeHost> (beam-mainframe). Until otb-ui-frontier-sidebar DESIGN-01 "Want 2"
        // this was `[OsLayout, MainframeHost]`: the only realm with no chrome of any kind.
        //
        // ⚠️ INVARIANT: operator chrome belongs in THIS switch and never inside a page component.
        //
        // It is what makes "a surface opened from the operator dock as a floating window carries
        // no page chrome" true, and it is true BY CONSTRUCTION rather than by any check — which is
        // why it is written down. Chrome is applied here, at the Inertia `layout:` boundary; a
        // float never crosses that boundary, because `os/operator-desk.tsx` opens its tools via
        // `lazy(async () => ({ default: await resolveBeamPage('operator/dashboard') }))` — resolving
        // the page MODULE, never this `layout` callback — and `os/shell-config.tsx`'s SURFACE_MAP
        // does the same. So <OperatorLayout> here cannot leak into a float, and a layout moved INTO
        // the page silently would.
        //
        // `site/` deliberately breaks the shape (its pages carry <SiteLayout> internally), which is
        // correct for site and would be a bug copied here: a self-chroming operator page renders its
        // nav INSIDE the float. `/os` is the third case and is already right — `return null`,
        // self-chromed, never double-wrapped.
        //
        // Not overstating it: the rule is not uniform today. `shell-config.tsx`'s
        // `SURFACE_MAP.operator.render` mounts <OperatorDashboard/> BARE while `user` wraps in
        // <BeamAccountLayout> — a per-surface choice already made twice, differently. Decide those
        // two together if either moves.
        case name.startsWith("operator/"):
          return [OsLayout, OperatorLayout, MainframeHost];
        // Account-realm pages mount the OOTB <AccountShell> via BeamAccountLayout, MainframeHost
        // INNERMOST (wraps just the page content, inside the AccountShell chrome) so every account
        // page is editable too — matches rushing/audiostud's own layout switch, which includes
        // MainframeHost in every case but the null `/os` one.
        case name.startsWith("account/"):
          return [OsLayout, BeamAccountLayout, MainframeHost];
        case name.startsWith("auth/"):
          return AuthLayout;
        case name.startsWith("settings/"):
          return [OsLayout, AppLayout, SettingsLayout, MainframeHost];
        default:
          return [OsLayout, AppLayout, MainframeHost];
      }
    },
    strictMode: true,
    withApp(app: React.ReactNode) {
      return (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={0}>
            {app}
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      );
    },
    progress: {
      color: "#4B5563",
    },
  };
}

export { resolveBeamPage } from "./pages";
export {
  configureBeamInertia,
  featureEnabled,
  authFeaturesFrom,
} from "./config";
export type {
  BeamInertiaConfig,
  AuthFeature,
  PageModule,
  PageLoader,
} from "./config";

export { Button } from "./components/ui/button";

/**
 * The host's ONE entry-body transport — the same `UxBuilderClient` the promoted in-place editor and
 * the Mainframe host already load and save through (`./editor/transport`), exported so a host can hand
 * it to any OTHER `@splicewire/beam-ux` surface it mounts on a page of its own.
 *
 * Exported for the theme editor's seat (G2-BEAM-THEME-NAV): `<ThemeEditor>` is a connected component
 * and needs a client, and a host writing its own `fetch` wrapper for that page would be a SECOND
 * transport — a second place for the load-bearing URL literals this file's docblock warns about to
 * drift, and a second thing to fix when `config.entryClient` is overridden. There is one transport;
 * this makes it reachable.
 */
export { bodyClient } from "./editor/transport";

/**
 * The platform-connection surface, exported so a host can compose the panel somewhere other than the
 * `operator/platform-connection` route the page map ships (an OS float, an account-realm page), and
 * so a host with its own client runtime can substitute the transport.
 */
export { PlatformConnectionPanel } from "./platform/platform-connection-panel";
export { createPlatformConnectionClient } from "./platform/client";
export type { PlatformConnectionClient } from "./platform/client";
export type {
  PlatformConnection,
  PlatformConnectionEndpoints,
  PlatformConnectionState,
  PlatformCapability,
  PlatformCapabilityRead,
  PlatformIdentity,
} from "./platform/types";

export { DefaultOsDesktop, type DefaultOsDesktopProps } from './os/default-desktop';
