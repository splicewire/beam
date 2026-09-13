import { createContext, useContext, type ReactNode } from "react";
import type {
  AwaitingOpsReviewData,
  CatalogFilters,
  ConnectionStatus,
  ExtensionListingDetail,
  ExtensionsCatalog,
  InstalledExtension,
  MarketConnection,
  MarketConnectionInput,
  MarketPurchase,
} from "./types";

// ── The injected transport adapter — the ONE thing a host must implement (kind 1) ──
//
// It wraps whatever transport the host already has (axios, fetch, a server action) and points it
// at the correct endpoints; the surfaces are host- and URL-blind. Endpoints stay relative
// (ADR-0116 §2 kind 1).
//
// splicewire-marketplace-build ticket 08 (REVISION): `getCatalog`/`getListing` now point at the
// declarative `market-extensions` particle resource (a host mounts it via
// `Route::particleResource('extensions', 'market-extensions', …)`, e.g. `/extensions` /
// `/extensions/{id}`) instead of the retired bespoke `/api/beam-market/extensions` controller —
// filter with the data-filters query-param convention (`?filter[kind]=…&filter[category]=…`), not
// the old `?kind=&category=` pair. `getConnectionStatus` is NEW: the site-wide connection fact,
// called once (not per listing) — see `laravel-beam-market`'s own `ConnectionStatusController`.
//
// The package-side endpoints answer on their host's standard envelope — the adapter is the unwrap
// seam: each method resolves with the envelope's `data` payload (the DTO shapes below), never the
// envelope itself. `getCatalog`'s particle-resource endpoint is PAGINATED
// (`{ data, limit, offset, total }`) — the adapter is also the pagination-unwrap seam for now (this
// package renders one page, no pager UI yet); only `data` need be resolved.
export interface ExtensionsClient {
  getCatalog(filters?: CatalogFilters): Promise<ExtensionsCatalog>;
  getListing(id: number): Promise<ExtensionListingDetail>;
  getConnectionStatus(): Promise<ConnectionStatus>;
  getInstalled(): Promise<InstalledExtension[]>;
  /**
   * ux-demo-convergence G5 — buy a PAID listing. The host's `market-extensions.purchase` op takes
   * no payload: the tier and the price are the server's, so a buyer cannot name their own. Rejects
   * on a declined payment (402) exactly as it rejects on any other refusal — a decline is not a
   * successful purchase with a sad field, and the surfaces branch on the rejection.
   */
  purchase(id: number): Promise<MarketPurchase>;
  install(id: number): Promise<InstalledExtension | AwaitingOpsReviewData>;
  /**
   * ux-demo-convergence G5 (G5-CATALOG-FEDERATION) — connect this site to a market host.
   *
   * The server VERIFIES the credential against that market before it writes anything, so this
   * rejects with the market's own refusal on a bad URL or a revoked key. That is what lets the
   * form put the message on the field that caused it instead of leaving a row claiming
   * "connected" beside a catalog that never arrived.
   * Omit unsupported market mutations: a publisher can expose its own catalog without
   * supporting connections to other markets. UI actions follow method presence.
   */
  connectMarket?(input: MarketConnectionInput): Promise<MarketConnection>;
  /** Re-sync one connection now. Resolves with its NEW state, including a failed one — see the hook. */
  syncMarket?(connectionId: string): Promise<MarketConnection>;
  /** Disconnect: the market's listings leave this catalog, installs and their rows survive. */
  disconnectMarket?(connectionId: string): Promise<void>;
  update(installId: string): Promise<InstalledExtension>;
  remove(installId: string): Promise<void | AwaitingOpsReviewData>;
}

export interface NotifyEvent {
  type: "success" | "error";
  message: string;
}

/**
 * Everything host-specific, injected through one Provider. Only `client` is required (kind 1);
 * the rest have dependency-free defaults. The Extensions area deliberately uses THREE of
 * ADR-0116's four injection kinds — no real-time subscription (kind 4) exists in this surface, so
 * it is not forced in; the vocabulary is used only where a genuine host-coupling need shows up.
 */
export interface ExtensionsServices {
  /** kind 1 — the transport adapter (required). */
  client: ExtensionsClient;
  /** kind 2 — feedback sink; a dependency-free console default applies when omitted. */
  notify?: (event: NotifyEvent) => void;
  /** kind 2 — mutation-error hook; the host may toast/log/observe. The rejection still propagates. */
  onError?: (err: unknown) => void;
  /**
   * kind 3 — the host-chrome render slot for the `requires_splicewire` "Connect Splicewire to
   * install" CTA — a rendered host affordance the package can't own (the actual connect flow is
   * host-specific: a beam site's own account settings page, an OAuth-device-flow command, etc.).
   * A dependency-free default renders a plain link to `connectUrl` when supplied, or a static
   * hint when the host injects neither a renderer nor a URL.
   */
  renderConnectCta?: (props: { connectUrl?: string }) => ReactNode;
  /** The URL the default `renderConnectCta` links to, when the host supplies no custom renderer. */
  connectUrl?: string;
}

const ExtensionsServicesContext = createContext<ExtensionsServices | null>(
  null,
);

function consoleNotify(event: NotifyEvent): void {
  if (event.type === "error") console.error(`[beam-market] ${event.message}`);
  else console.info(`[beam-market] ${event.message}`);
}

export function ExtensionsProvider({
  services,
  children,
}: {
  services: ExtensionsServices;
  children: ReactNode;
}) {
  return (
    <ExtensionsServicesContext.Provider value={services}>
      {children}
    </ExtensionsServicesContext.Provider>
  );
}

export function useExtensionsServices(): ExtensionsServices {
  const services = useContext(ExtensionsServicesContext);
  if (!services) {
    throw new Error(
      "beam-market surfaces must be rendered inside an <ExtensionsProvider>.",
    );
  }
  return services;
}

/**
 * The server's own refusal text, when there is one (ux-demo-convergence G5). The paid-listing
 * chain's two refusals are both worth reading verbatim — `403 entitlement_required` names the price
 * the buyer has to pay, `402 checkout_declined` names the decline code the payment rail returned —
 * and a generic "Install failed." would throw both away. Mirrors `creatorErrorMessage`, which this
 * package's creator half already uses for the same reason.
 */
export function extensionsErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined;

  const fieldErrors = Object.values(data?.errors ?? {}).flat();
  if (fieldErrors.length > 0) return fieldErrors.join(" ");

  return data?.message ?? (err as Error)?.message ?? fallback;
}

/** The injected `notify`, or the console default when the host supplied none. */
export function useExtensionsNotify(): (event: NotifyEvent) => void {
  return useExtensionsServices().notify ?? consoleNotify;
}
