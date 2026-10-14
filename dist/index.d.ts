import * as react from 'react';
import { ReactNode } from 'react';
import * as _splicewire_beam_resources_types_market from '@splicewire/beam-resources/types/market';
import { ConnectionStatusData, InstalledExtensionData, MarketEntitlementData, ExtensionChangelogEntryData, MarketExtensionData, MarketPurchaseData, MarketConnectionInputData, MarketConnectionData, AwaitingOpsReviewData, MarketListingData, MarketSellerData, SellerRepoAuthorizationData, ExtensionArtifactData, MarketListingInputData } from '@splicewire/beam-resources/types/market';
export { ExtensionArtifactData, MarketListingData, MarketListingInputData, MarketSellerData, SellerRepoAuthorizationData } from '@splicewire/beam-resources/types/market';
import * as _tanstack_react_query from '@tanstack/react-query';

/**
 * The beam-core Extensions area (ticket 08) — the whole `/extensions` surface a beam host mounts
 * at whatever route it likes: `Browse` (the unified catalog + its own Platform Tier section) and
 * `Installed` (the package-manager-style list). This is the ONE exported top-level component a
 * host wires up; everything else in this package is composed underneath it.
 */
declare function ExtensionsArea({ className, plays, title, }: {
    className?: string;
    /** Host-supplied page heading (UX03/C39); the area renders exactly one h1 from it. */
    title?: string;
    /** The sides the host plays (APP-11); forwarded to the catalog's host-true banner gate. */
    plays?: readonly string[];
}): react.JSX.Element;

/**
 * The unified `/extensions` catalog (ticket 08, REVISED): ONE surface for both listing kinds, an
 * install-mechanism (`kind`) facet, a category facet, and its own "Platform Tier" Browse section for
 * Satellite/Tower — pulled out of the generic grid purely by `isPlatformTier`, never a second
 * endpoint or listing kind. The area-wide disconnected promo banner renders here, once, off the
 * site-wide `useConnectionStatus()` fact (no longer bundled into the catalog response — see that
 * hook's own docblock). The category filter is a free-text Silo-slug box, not a dropdown: the
 * catalog no longer computes a `facets.categories` vocabulary server-side (the declarative
 * `market-extensions` particle resource has no facet-computation step) — a host wanting a dropdown
 * can build one off its own Silo list (e.g. the `/silos` resource) and pass the chosen slug through
 * `filters.category` unchanged.
 */
declare function ExtensionsCatalog$1({ onSelect, plays, onManageMarkets, }: {
    onSelect: (id: number) => void;
    /** A real, admitted host action; omitted for read-only and connect-less catalogs. */
    onManageMarkets?: () => void;
    /**
     * The cross-instance sides the host plays (APP-11/APP-24, IA-6). The "not connected to Splicewire"
     * banner is a CLIENT concern — a hub has no upstream to be disconnected from — so it renders only
     * where `plays` includes `client`. Undefined (a host that does not pass it) keeps prior behavior.
     */
    plays?: readonly string[];
}): react.JSX.Element;

/**
 * The Installed tab (ticket 08): a package-manager-style list over the real installed-listing
 * data source, with REAL inline Update/Remove mutations — never a read-only mirror of the catalog
 * cards. A purchased/installed listing only ever appears here through the catalog's own Install
 * action; this tab never writes anything of its own beyond Update/Remove.
 */
declare function InstalledTab(): react.JSX.Element;

/**
 * The Extensions area's detail sheet (ticket 08, REVISED): the trust badge, the full
 * `requires_splicewire` notice + "Connect Splicewire to install" CTA when gated and disconnected,
 * the changelog, and the Install action — the ONE place (alongside the Installed tab's own actions)
 * a Listing's install state actually changes. `data` is now the FLAT `MarketExtension` shape (no
 * more `.summary` wrapper — the particle resource projects list/show through the same shape);
 * `connected` no longer rides the listing response at all — it's `useConnectionStatus()`, the
 * site-wide fact fetched once.
 */
declare function ExtensionDetailSheet({ listingId, onOpenChange, }: {
    listingId: number | null;
    onOpenChange: (open: boolean) => void;
}): react.JSX.Element;

/** The install-mechanism facet the catalog is filterable by. */
type ListingKind = "scaffold_pack" | "beam_extension" | string;
/** The Official/Verified/Standard trust badge (ticket 07). */
type TrustTier = "Official" | "Verified" | "Standard" | string;
/**
 * A catalog row/detail row — the SAME shape (`MarketExtensionData`) serves both the grid card and
 * the detail sheet now, so `ExtensionListingSummary`/`ExtensionListingDetail` are aliases of one
 * another, kept as distinct names only so call sites documenting "this is a summary" vs "this is a
 * detail" don't need to rename.
 */
type MarketExtension = Omit<MarketExtensionData, "kind" | "trustTier"> & {
    kind: ListingKind;
    trustTier: TrustTier;
};
type ExtensionListingSummary = MarketExtension;
type ExtensionListingDetail = MarketExtension;
type ExtensionChangelogEntry = ExtensionChangelogEntryData;
/** The catalog list — a thin wrapper (not just a bare array) so a future page/cursor fact has somewhere to land. */
type ExtensionsCatalog = {
    listings: MarketExtension[];
};
type InstalledExtension = Omit<InstalledExtensionData, "kind" | "trustTier"> & {
    kind: ListingKind;
    trustTier: TrustTier;
};
/**
 * The Extensions area's SITE-WIDE connection fact (ticket 08 revision) — whether this beam site has
 * a paired Splicewire connection, fetched ONCE (`useConnectionStatus`), never per-listing. A
 * listing's own `pairingGuidance` visibility is a pure client-side combination of THIS `connected`
 * flag and that listing's own `requiresSplicewire`.
 */
type ConnectionStatus = ConnectionStatusData;
/** The `/extensions` catalog's facet filter state — both optional (no filter applied). `category`
 * is a Silo slug, `kind` the install-mechanism token; a host's `ExtensionsClient.getCatalog`
 * implementation maps these onto the data-filters query-param convention
 * (`?filter[category]=…&filter[kind]=…`), not the retired bespoke `?category=&kind=` pair. */
interface CatalogFilters {
    category?: string;
    kind?: ListingKind;
}
/**
 * ux-demo-convergence G5 — what THIS buyer got for their money on a paid listing: the amount, the
 * payment reference, and the registry credential the deployment step needs. Projected for its owner
 * only (the PHP `MarketEntitlementData` docblock states the rule); a surface that has one is looking
 * at the reader's own purchase, never somebody else's.
 */
type MarketEntitlement = MarketEntitlementData;
/** The answer to a completed purchase — the entitlement, plus whether it was already held. */
type MarketPurchase = MarketPurchaseData;

/**
 * The four states a connection can be in, narrowed from the DTO's bare `string` the same way
 * `ListingKind`/`TrustTier` are.
 *
 * ⚠️ Four, not a boolean, and the surface renders four different things. A site that has never
 * synced, one that is current, one whose credential the market REFUSED, and one that could not
 * REACH its market need different next steps — reconnect with a new credential vs. retry. JOURNEYS
 * §G5 names collapsing the last two as the thing to avoid ("disconnected and sync failed states
 * are honest").
 */
type MarketConnectionStatus = "pending" | "connected" | "refused" | "error" | string;
type MarketConnection = Omit<MarketConnectionData, "status"> & {
    status: MarketConnectionStatus;
};
/** What the connect form submits: a market URL and the credential its operator issued. */
type MarketConnectionInput = MarketConnectionInputData;

/**
 * The Official/Verified/Standard trust badge (ticket 07/08) — the ONE place a `trustTier` string
 * becomes a visual affordance, used identically in the catalog grid and the detail sheet.
 */
declare function TrustBadge({ tier, className }: {
    tier: TrustTier;
    className?: string;
}): react.JSX.Element;
/** The `requires_splicewire` lock badge — a Beam Extension facet, never a third listing kind. */
declare function RequiresSplicewireBadge({ className }: {
    className?: string;
}): react.JSX.Element;

/**
 * The area-wide promo banner shown whenever the site is disconnected from Splicewire (ticket 08
 * acceptance item) — read off `ExtensionsCatalog.connected`/`ExtensionListingDetail.connected`,
 * which the backend resolves from `laravel-connector`'s existing connection state (no new
 * concept). Rendered once at the top of the Extensions area, not per-listing — the per-listing
 * affordance is the lock badge + detail-sheet notice ({@see RequiresSplicewireBadge}).
 */
declare function DisconnectedBanner({ marketConnected }: {
    marketConnected?: boolean;
}): react.JSX.Element;

/**
 * The Market tab's body: every connection this site holds, and the form to add one.
 */
declare function MarketConnectionPanel(): react.JSX.Element;

/**
 * What this site is ACTUALLY running for one installed listing, and what the operator still owes
 * (ux-demo-convergence G5).
 *
 * JOURNEYS.md §G5: "Deployment instructions are a valid product step. Composer extensions can
 * require a CLI deploy; the UI must say pending/instructions/detected accurately. It cannot label
 * code installed or updated because only a database row changed."
 *
 * Everything below is rendered from the server's own runtime probe (`deployment.state`,
 * `deployment.detectedVersion`) — this component computes no status of its own, so it cannot
 * disagree with the host. `lastVerifiedVersion` is the retained deployment receipt: a failed deploy
 * leaves it standing, which is the difference between "we do not know" and "we went backwards".
 */
declare const DEPLOYMENT_LABELS: Record<string, string>;
declare function DeploymentBadge({ installed, }: {
    installed: InstalledExtension;
}): react.JSX.Element | null;
declare function DeploymentPanel({ installed, onRecheck, rechecking, }: {
    installed: InstalledExtension;
    onRecheck?: () => void;
    rechecking?: boolean;
}): react.JSX.Element | null;

/**
 * The buyer's own registry credential (ux-demo-convergence G5) — delivered through the product,
 * beside the deployment step that needs it.
 *
 * JOURNEYS.md §G5 allows a CLI deploy as a real product step, and for a PAID listing that step is
 * not runnable without a credential: the Composer registry authenticates every request over HTTP
 * Basic against the licence key a purchase mints. Printing `composer require …` without it would be
 * printing an instruction that cannot succeed.
 *
 * The key is hidden until asked for. It is the reader's own — the server projects an entitlement
 * only for its owner — but "the buyer is looking at their screen" and "the buyer is sharing their
 * screen" are the same moment from here, so revealing it is a deliberate act rather than a page
 * load. Nothing is stored in the browser.
 */
declare function EntitlementPanel({ entitlement, packageName, }: {
    entitlement: MarketEntitlement;
    packageName?: string | null;
}): react.JSX.Element;

interface ExtensionsClient {
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
interface NotifyEvent {
    type: "success" | "error";
    message: string;
}
/**
 * Everything host-specific, injected through one Provider. Only `client` is required (kind 1);
 * the rest have dependency-free defaults. The Extensions area deliberately uses THREE of
 * ADR-0116's four injection kinds — no real-time subscription (kind 4) exists in this surface, so
 * it is not forced in; the vocabulary is used only where a genuine host-coupling need shows up.
 */
interface ExtensionsServices {
    /** kind 1 — the transport adapter (required). */
    client: ExtensionsClient;
    /** kind 2 — feedback sink; a dependency-free console default applies when omitted. */
    notify?: (event: NotifyEvent) => void;
    /** kind 2 — mutation-error hook; the host may toast/log/observe. The rejection still propagates. */
    onError?: (err: unknown) => void;
    /**
     * kind 2 — what the viewer may do, by the same ability name the server checks (for example
     * `market-extensions.install`, InstallExtension's declared ability). The package cannot know the
     * host's permission model, so the host answers. When omitted everything is offered and the server
     * remains the gate; when given, an action the viewer may not take is shown disabled with the reason,
     * rather than enabled and refused with a 403.
     */
    can?: (ability: string) => boolean;
    /**
     * kind 3 — the host-chrome render slot for the `requires_splicewire` "Connect Splicewire to
     * install" CTA — a rendered host affordance the package can't own (the actual connect flow is
     * host-specific: a beam site's own account settings page, an OAuth-device-flow command, etc.).
     * A dependency-free default renders a plain link to `connectUrl` when supplied, or a static
     * hint when the host injects neither a renderer nor a URL.
     */
    renderConnectCta?: (props: {
        connectUrl?: string;
    }) => ReactNode;
    /** The URL the default `renderConnectCta` links to, when the host supplies no custom renderer. */
    connectUrl?: string;
}
declare function ExtensionsProvider({ services, children, }: {
    services: ExtensionsServices;
    children: ReactNode;
}): react.JSX.Element;
declare function useExtensionsServices(): ExtensionsServices;
/**
 * The server's own refusal text, when there is one (ux-demo-convergence G5). The paid-listing
 * chain's two refusals are both worth reading verbatim — `403 entitlement_required` names the price
 * the buyer has to pay, `402 checkout_declined` names the decline code the payment rail returned —
 * and a generic "Install failed." would throw both away. Mirrors `creatorErrorMessage`, which this
 * package's creator half already uses for the same reason.
 */
declare function extensionsErrorMessage(err: unknown, fallback: string): string;
/** The injected `notify`, or the console default when the host supplied none. */
declare function useExtensionsNotify(): (event: NotifyEvent) => void;

/** The unified `/extensions` catalog — one query for both listing kinds, filterable by category/kind. */
declare function useExtensionsCatalog(filters?: CatalogFilters): _tanstack_react_query.UseQueryResult<NoInfer<ExtensionsCatalog>, Error>;
declare function useExtensionListing(id: number | null): _tanstack_react_query.UseQueryResult<NoInfer<MarketExtension>, Error>;
/**
 * The site-wide connection fact (ticket 08 revision) — fetched ONCE, shared by every surface that
 * needs it (the disconnected promo banner, the detail sheet's gated-and-disconnected notice) rather
 * than each catalog/detail response carrying its own copy. Long `staleTime`: this fact changes only
 * when a human actually runs the connect flow, never on a normal catalog browse.
 */
declare function useConnectionStatus(): _tanstack_react_query.UseQueryResult<NoInfer<_splicewire_beam_resources_types_market.ConnectionStatusData>, Error>;
/**
 * ux-demo-convergence G5 (G5-CATALOG-FEDERATION) — the markets this site reads its catalog from.
 *
 * Served off the SAME site-wide endpoint as the Splicewire-antenna fact (they arrive together;
 * see `ConnectionStatusData`), so the connection screen costs no extra request — but kept under
 * its own query key, because a re-sync invalidates the market list and has nothing to say about
 * the antenna.
 */
declare function useMarketConnections(): _tanstack_react_query.UseQueryResult<NoInfer<_splicewire_beam_resources_types_market.MarketConnectionData[]>, Error>;
/**
 * Connect this site to a market.
 *
 * The server verifies the credential against that market BEFORE writing, so a refusal rejects
 * here with the market's own words — a revoked key, a URL that is not a Splicewire market — and
 * the operator is told which of the two it was rather than being handed a row that claims to be
 * connected.
 */
declare function useConnectMarket(): _tanstack_react_query.UseMutationResult<MarketConnection, Error, _splicewire_beam_resources_types_market.MarketConnectionInputData, unknown>;
/**
 * Re-sync one connection.
 *
 * ⚠️ A FAILED sync resolves here, it does not reject — the server answers 200 carrying the
 * connection's new state, because the operator asked "try again", the host tried, and the answer
 * is the row. Rejecting would render a generic transport error in place of the one field that
 * explains the failure. So this branches on the resolved status instead of on a rejection.
 */
declare function useSyncMarket(): _tanstack_react_query.UseMutationResult<MarketConnection, Error, string, unknown>;
/** Disconnect a market: its listings leave this catalog; installs and their rows survive. */
declare function useDisconnectMarket(): _tanstack_react_query.UseMutationResult<void, Error, string, unknown>;
/** The Installed tab's real data source. */
declare function useInstalledExtensions(): _tanstack_react_query.UseQueryResult<NoInfer<InstalledExtension[]>, Error>;
/**
 * Buys a PAID listing (ux-demo-convergence G5) — the mutation behind the catalog's Buy control, and
 * the only path an entitlement is ever created on.
 *
 * A DECLINED payment rejects (402), so it lands in `onError` next to every other refusal rather
 * than in `onSuccess` with a status field — which is what makes "purchase failed, try again" a real
 * state the surface can render, and makes it impossible for a failed checkout to read as a
 * purchase. The error message is the SERVER's: it names the decline code the rail returned.
 */
declare function usePurchaseExtension(): _tanstack_react_query.UseMutationResult<_splicewire_beam_resources_types_market.MarketPurchaseData, Error, number, unknown>;
/** Materializes an install — the ONLY path a Listing (any kind, including Platform Tier) ever becomes "installed". */
declare function useInstallExtension(): _tanstack_react_query.UseMutationResult<InstalledExtension | _splicewire_beam_resources_types_market.AwaitingOpsReviewData, Error, number, unknown>;
/** The Installed tab's real (inline) Update action — a mutation, never a read-only mirror. */
declare function useUpdateInstalledExtension(): _tanstack_react_query.UseMutationResult<InstalledExtension, Error, string, unknown>;
/** The Installed tab's real (inline) Remove action — a mutation, never a read-only mirror. */
declare function useRemoveInstalledExtension(): _tanstack_react_query.UseMutationResult<void | _splicewire_beam_resources_types_market.AwaitingOpsReviewData, Error, string, unknown>;

/** HTTP is injected; this helper owns the Beam envelope and pagination protocol. */
interface ExtensionsRequest {
    <T>(method: "GET" | "POST" | "DELETE", url: string, params?: Record<string, string | number>, body?: Record<string, unknown>): Promise<{
        status: number;
        data: {
            data: T;
            limit?: number;
            offset?: number;
            total?: number;
        };
    }>;
}
interface ExtensionsEndpoints {
    catalog: string;
    listing(id: number): string;
    connection: string;
    installed: string;
    install(id: number): string;
    /** ux-demo-convergence G5 — the `market-extensions.purchase` op, keyed by the LISTING's id. */
    purchase(id: number): string;
    update(id: string): string;
    remove(id: string): string;
    /**
     * ux-demo-convergence G5 — the `market-connections` resource, one row of it, and its `sync` op.
     *
     * ⚠️ `connectionRow`, not `connection`: `connection` above is a DIFFERENT surface — the
     * site-wide Splicewire-antenna fact from `laravel-beam-market`'s own self-registered mount. Two
     * fields spelled the same in one endpoint map is a name collision TypeScript catches and a
     * reader would not.
     * Omit endpoints the host does not mount; the client omits the corresponding mutation.
     */
    connections?: string;
    connectionRow?(id: string): string;
    syncConnection?(id: string): string;
}
declare function createExtensionsClient(request: ExtensionsRequest, endpoints: ExtensionsEndpoints): ExtensionsClient;

/**
 * The creator workspace — the ONE exported top-level component a host mounts, the twin of
 * {@link ../ExtensionsArea.ExtensionsArea} for the other side of the marketplace.
 *
 * A buyer browses `/extensions`; a creator prepares what appears there. Those were the same
 * marketplace with only one of its two halves reachable through product UI: the backend had
 * Sellers, repo authorizations, a review workflow and a takedown policy, and no screen led to any
 * of it (`BASELINE.md`: "creator UX is not evidenced by the existing seller backend").
 *
 * Package-tier because it is generic: nothing here knows about tenancy, routing, or which host it
 * is. The host supplies the transport adapter and the mount; the flagship's tenant→Seller
 * resolution happens entirely server-side, which is why this component never asks who the creator
 * is beyond rendering the answer.
 */
declare function CreatorWorkspaceArea({ className }: {
    className?: string;
}): react.JSX.Element;

/**
 * Repository authorization and artifact inspection — the first half of the creator workspace.
 *
 * Two things are deliberately visible here that a tidier screen would hide:
 *
 *  * a SIMULATED authorization says so, on the row, permanently. The DTO carries `simulated`
 *    because the row does, and it is carried all the way to a badge because a simulated
 *    authorization is otherwise indistinguishable from a real one — same status, same repositories,
 *    same gate passed. That is the point of the simulation and exactly why it must be labelled.
 *  * an artifact that could not be READ is reported differently from one that is INVALID.
 *    `available: false` means this host has no artifact source for the repository — nothing was
 *    inspected — and telling a creator their package is broken because the host was not configured
 *    is the failure mode this whole three-state shape exists to prevent.
 */
declare function RepositorySection(): react.JSX.Element;

/**
 * The creator's own Listings — create, edit, release, submit, withdraw.
 *
 * ## Why the blocked reason is rendered instead of the button being hidden
 *
 * `submitBlocker()` names why a submission would be refused, and the button stays visible and
 * disabled beside it. A hidden button teaches a creator nothing; and the server refusal is the real
 * gate either way (`SubmitListingForReview::ensureRepoAuthorized()` 422s regardless of what this
 * screen rendered), so this is a hint about a gate, never the gate itself.
 *
 * ## The rejection reason is the first thing on a rejected row
 *
 * Because it is the only thing a creator can act on. `review_note` exists precisely because the
 * review queue used to answer "rejected" and nothing else.
 */
declare function ListingsSection(): react.JSX.Element;

/**
 * The `listing-review` workflow's places, as the creator surface renders them. TS-only (the DTO
 * ships `reviewStatus` as a bare `string | null`), so it narrows without claiming to be generated.
 *
 * `null` is a real member of this vocabulary and the most common one: a Listing that has never been
 * submitted has no marking at all — `LifecycleService::currentPlace()` reads the absent column as
 * `not_submitted` without ever writing it.
 */
type ReviewStatus = "pending_automated" | "pending_human" | "approved_automated" | "approved_human" | "rejected" | "taken_down" | (string & {});
/** What the creator surface calls the state a Listing is actually in, for one badge. */
interface ListingStatusPresentation {
    label: string;
    tone: "draft" | "pending" | "approved" | "rejected" | "withdrawn";
    /** One sentence a creator can act on — never only the state's own name. */
    hint: string;
}
/**
 * The whole state vocabulary in one place, so the badge, the empty states and the action
 * availability cannot disagree about what a Listing is.
 *
 * ⚠️ Two FIELDS decide this, not one, and collapsing them is the trap. `reviewStatus` is the
 * workflow marking and `status` is Lunar's own catalog state — a Listing sits at
 * `approved_human` + `draft` for the moment between approval and publish, and at `taken_down` +
 * `draft` forever after a withdrawal. The review marking is the one a creator is asking about, so
 * it wins wherever both have something to say.
 */
declare function presentListingStatus(listing: Pick<MarketListingData, "reviewStatus" | "status" | "reviewNote">): ListingStatusPresentation;
/** Whether `submit` is a thing the creator can usefully press, and why not when it is not. */
declare function submitBlocker(listing: MarketListingData): string | null;

/**
 * The creator workspace's transport adapter — the one thing a host must implement, exactly the
 * shape `ExtensionsClient` already has for the buyer's half (ADR-0116 §2 kind 1). Every method
 * resolves with the standard envelope's `data` payload; unwrapping is the adapter's job, so these
 * surfaces stay host- and URL-blind.
 *
 * ⚠️ `simulateProviderCallback` is OPTIONAL, and its absence is the normal case. It stands in for
 * GitHub's install handshake and the backing op is config-gated off by default; a host that has not
 * turned it on omits the method, and the workspace renders the real install URL and nothing else.
 * Never make it required "for symmetry" — an always-present simulate button is a marketplace whose
 * repository authorization means nothing.
 */
interface CreatorClient {
    getSeller(): Promise<MarketSellerData | null>;
    getAuthorizations(): Promise<SellerRepoAuthorizationData[]>;
    beginAuthorization(): Promise<SellerRepoAuthorizationData>;
    inspectArtifact(authorizationId: string, repoFullName: string, ref?: string): Promise<ExtensionArtifactData>;
    getListings(): Promise<MarketListingData[]>;
    createListing(input: MarketListingInputData): Promise<MarketListingData>;
    updateListing(id: number, input: MarketListingInputData): Promise<MarketListingData>;
    release(id: number, ref: string, notes?: string | null): Promise<MarketListingData>;
    submit(id: number): Promise<MarketListingData>;
    withdraw(id: number): Promise<MarketListingData>;
    /** Present only where the host has enabled the simulated provider callback. */
    simulateProviderCallback?(authorizationId: string, repos: string[]): Promise<SellerRepoAuthorizationData>;
}
interface CreatorNotifyEvent {
    type: "success" | "error";
    message: string;
}
interface CreatorServices {
    /** kind 1 — the transport adapter (required). */
    client: CreatorClient;
    /** kind 2 — feedback sink; a dependency-free console default applies when omitted. */
    notify?: (event: CreatorNotifyEvent) => void;
    /** kind 2 — mutation-error hook. The rejection still propagates. */
    onError?: (err: unknown) => void;
}
declare function CreatorProvider({ services, children, }: {
    services: CreatorServices;
    children: ReactNode;
}): react.JSX.Element;
declare function useCreatorServices(): CreatorServices;
declare function useCreatorNotify(): (event: CreatorNotifyEvent) => void;
/**
 * The message a failed mutation should show a creator.
 *
 * ⚠️ It reads `errors` before `message`, and that order is the point. Every refusal on this surface
 * is a declared 422 whose `errors` bag names the FIELD and the reason — an unauthorized repository,
 * a tag the repository does not carry, a manifest that broke four rules at once. The envelope's
 * top-level `message` is the first sentence only; showing it alone throws away the list of rules a
 * creator has to fix and sends them round the loop once per rule.
 */
declare function creatorErrorMessage(err: unknown, fallback: string): string;

declare function useCreatorSeller(): _tanstack_react_query.UseQueryResult<NoInfer<_splicewire_beam_resources_types_market.MarketSellerData | null>, Error>;
declare function useRepoAuthorizations(): _tanstack_react_query.UseQueryResult<NoInfer<_splicewire_beam_resources_types_market.SellerRepoAuthorizationData[]>, Error>;
declare function useCreatorListings(): _tanstack_react_query.UseQueryResult<NoInfer<_splicewire_beam_resources_types_market.MarketListingData[]>, Error>;
declare function useBeginAuthorization(): _tanstack_react_query.UseMutationResult<_splicewire_beam_resources_types_market.SellerRepoAuthorizationData, Error, void, unknown>;
declare function useSimulateProviderCallback(): _tanstack_react_query.UseMutationResult<_splicewire_beam_resources_types_market.SellerRepoAuthorizationData, Error, {
    id: string;
    repos: string[];
}, unknown>;
declare function useInspectArtifact(): _tanstack_react_query.UseMutationResult<_splicewire_beam_resources_types_market.ExtensionArtifactData, Error, {
    id: string;
    repoFullName: string;
    ref?: string;
}, unknown>;
declare function useSaveListing(): _tanstack_react_query.UseMutationResult<_splicewire_beam_resources_types_market.MarketListingData, Error, {
    id: number | null;
    input: MarketListingInputData;
}, unknown>;
declare function usePublishRelease(): _tanstack_react_query.UseMutationResult<_splicewire_beam_resources_types_market.MarketListingData, Error, {
    id: number;
    ref: string;
    notes?: string | null;
}, unknown>;
declare function useSubmitListing(): _tanstack_react_query.UseMutationResult<_splicewire_beam_resources_types_market.MarketListingData, Error, number, unknown>;
declare function useWithdrawListing(): _tanstack_react_query.UseMutationResult<_splicewire_beam_resources_types_market.MarketListingData, Error, number, unknown>;

/**
 * The creator surface's transport shape. Wider than `ExtensionsRequest` in one way only — it takes
 * a BODY — because every creator action writes something, where the buyer's half only ever POSTs a
 * verb at an id.
 */
interface CreatorRequest {
    <T>(method: "GET" | "POST" | "PUT", url: string, options?: {
        params?: Record<string, string | number>;
        body?: unknown;
    }): Promise<{
        status: number;
        data: {
            data: T;
            limit?: number;
            offset?: number;
            total?: number;
        };
    }>;
}
/**
 * Every URL the workspace touches, supplied by the host — which resolves them BY ROUTE NAME off its
 * own generated route map, never as literals. That is not a style preference here: this package's
 * own sibling surface had exactly this endpoint set go stale and 404 when `laravel-beam-market`
 * re-expressed four operator transitions as `Route::particleOps()`, and a hand-written path cannot
 * notice a move (`features/operator/review-queue/api.ts` carries that scar).
 */
interface CreatorEndpoints {
    seller: string;
    authorizations: string;
    inspect(authorizationId: string): string;
    simulateProviderCallback?(authorizationId: string): string;
    listings: string;
    listing(id: number): string;
    submit(id: number): string;
    release(id: number): string;
    withdraw(id: number): string;
}
declare function createCreatorClient(request: CreatorRequest, endpoints: CreatorEndpoints): CreatorClient;

export { type CatalogFilters, type ConnectionStatus, type CreatorClient, type CreatorEndpoints, type CreatorNotifyEvent, CreatorProvider, type CreatorRequest, type CreatorServices, CreatorWorkspaceArea, DEPLOYMENT_LABELS, DeploymentBadge, DeploymentPanel, DisconnectedBanner, EntitlementPanel, type ExtensionChangelogEntry, ExtensionDetailSheet, type ExtensionListingDetail, type ExtensionListingSummary, ExtensionsArea, ExtensionsCatalog$1 as ExtensionsCatalog, type ExtensionsCatalog as ExtensionsCatalogRead, type ExtensionsClient, type ExtensionsEndpoints, ExtensionsProvider, type ExtensionsRequest, type ExtensionsServices, type InstalledExtension, InstalledTab, type ListingKind, type ListingStatusPresentation, ListingsSection, type MarketConnection, type MarketConnectionInput, MarketConnectionPanel, type MarketConnectionStatus, type MarketEntitlement, type MarketExtension, type MarketPurchase, type NotifyEvent, RepositorySection, RequiresSplicewireBadge, type ReviewStatus, TrustBadge, type TrustTier, createCreatorClient, createExtensionsClient, creatorErrorMessage, extensionsErrorMessage, presentListingStatus, submitBlocker, useBeginAuthorization, useConnectMarket, useConnectionStatus, useCreatorListings, useCreatorNotify, useCreatorSeller, useCreatorServices, useDisconnectMarket, useExtensionListing, useExtensionsCatalog, useExtensionsNotify, useExtensionsServices, useInspectArtifact, useInstallExtension, useInstalledExtensions, useMarketConnections, usePublishRelease, usePurchaseExtension, useRemoveInstalledExtension, useRepoAuthorizations, useSaveListing, useSimulateProviderCallback, useSubmitListing, useSyncMarket, useUpdateInstalledExtension, useWithdrawListing };
