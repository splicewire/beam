// src/ExtensionsArea.tsx
import { Button as Button8, cn as cn2 } from "@schemastud/ui";
import { useState as useState4 } from "react";

// src/ExtensionDetailSheet.tsx
import {
  Badge as Badge2,
  Button as Button2,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from "@schemastud/ui";
import { AlertTriangle, Lock as Lock2 } from "lucide-react";
import { useEffect } from "react";

// src/EntitlementPanel.tsx
import { Button } from "@schemastud/ui";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function EntitlementPanel({
  entitlement,
  packageName
}) {
  const [revealed, setRevealed] = useState(false);
  const registryHost = hostOf(entitlement.registryUrl);
  const repositoryKey = repositoryKeyFor(entitlement.registryUrl);
  const key = entitlement.licenseKey;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "mt-3 w-full rounded-md border bg-muted/30 p-3",
      "data-testid": "entitlement-panel",
      children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsx(
          KeyRound,
          {
            className: "mt-0.5 size-4 shrink-0 text-muted-foreground",
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium", children: [
            "Your licence",
            entitlement.amountLabel ? ` \xB7 ${entitlement.amountLabel}` : null
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-sm text-muted-foreground", children: entitlement.registryUrl ? "Authenticate Composer with this key, then run the deployment step." : "This purchase is licensed. No package registry is configured on this host." }),
          entitlement.registryUrl && /* @__PURE__ */ jsx("pre", { className: "mt-2 whitespace-pre-wrap break-all rounded bg-background p-2 text-xs leading-relaxed", children: /* @__PURE__ */ jsx("code", { children: [
            `composer config repositories.${repositoryKey} composer ${entitlement.registryUrl}`,
            `composer config --global --auth http-basic.${registryHost} ${entitlement.registryUsername} ${revealed && key ? key : "<your key>"}`,
            packageName ? `composer require ${packageName}` : null
          ].filter(Boolean).join("\n") }) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-3", children: [
            key && /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: () => setRevealed((shown) => !shown),
                children: revealed ? "Hide key" : "Show key"
              }
            ),
            (entitlement.licenseId || entitlement.paymentRef || !key) && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              entitlement.licenseId ? `Licence ${entitlement.licenseId}` : key ? null : "No licence recorded",
              entitlement.paymentRef ? `${entitlement.licenseId ? " \xB7 " : ""}payment ${entitlement.paymentRef}` : null
            ] })
          ] }),
          revealed && key && /* @__PURE__ */ jsx(
            "p",
            {
              "data-testid": "entitlement-key",
              className: "mt-2 break-all rounded bg-background p-2 font-mono text-xs",
              children: key
            }
          )
        ] })
      ] })
    }
  );
}
function repositoryKeyFor(url) {
  if (!url) return "market";
  try {
    return new URL(url).hostname.replace(/[^a-z0-9._-]+/gi, "-") || "market";
  } catch {
    return "market";
  }
}
function hostOf(url) {
  if (!url) return "registry";
  try {
    return new URL(url).host;
  } catch {
    return "registry";
  }
}

// src/hooks.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// src/provider.tsx
import { createContext, useContext } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var ExtensionsServicesContext = createContext(
  null
);
function consoleNotify(event) {
  if (event.type === "error") console.error(`[beam-market] ${event.message}`);
  else console.info(`[beam-market] ${event.message}`);
}
function ExtensionsProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx2(ExtensionsServicesContext.Provider, { value: services, children });
}
function useExtensionsServices() {
  const services = useContext(ExtensionsServicesContext);
  if (!services) {
    throw new Error(
      "beam-market surfaces must be rendered inside an <ExtensionsProvider>."
    );
  }
  return services;
}
function extensionsErrorMessage(err, fallback) {
  const data = err?.response?.data;
  const fieldErrors = Object.values(data?.errors ?? {}).flat();
  if (fieldErrors.length > 0) return fieldErrors.join(" ");
  return data?.message ?? err?.message ?? fallback;
}
function useExtensionsNotify() {
  return useExtensionsServices().notify ?? consoleNotify;
}

// src/hooks.ts
function deploymentMessage(installed, verb) {
  const { state, detectedVersion, requestedVersion } = installed.deployment;
  if (state === "detected") {
    return `${installed.name} is active${detectedVersion ? ` at v${detectedVersion}` : ""}.`;
  }
  if (state === "not_applicable") {
    return `${verb === "Acquired" ? "Installed" : "Updated"}.`;
  }
  if (state === "removal_pending") {
    return "Still deployed \u2014 run the removal step shown on the row.";
  }
  return `${verb}. ${requestedVersion ? `v${requestedVersion} is not deployed yet` : "Nothing is deployed yet"} \u2014 follow the deployment step shown on the Installed tab.`;
}
var catalogKey = (filters) => [
  "beam-market",
  "catalog",
  filters?.category ?? null,
  filters?.kind ?? null
];
var listingKey = (id) => ["beam-market", "listing", id];
var INSTALLED_KEY = ["beam-market", "installed"];
var CONNECTION_STATUS_KEY = ["beam-market", "connection"];
var MARKETS_KEY = ["beam-market", "markets"];
function useExtensionsCatalog(filters) {
  const { client } = useExtensionsServices();
  return useQuery({
    queryKey: catalogKey(filters),
    queryFn: () => client.getCatalog(filters)
  });
}
function useExtensionListing(id) {
  const { client } = useExtensionsServices();
  return useQuery({
    queryKey: listingKey(id ?? -1),
    queryFn: () => client.getListing(id),
    enabled: id !== null
  });
}
function useConnectionStatus() {
  const { client } = useExtensionsServices();
  return useQuery({
    queryKey: CONNECTION_STATUS_KEY,
    queryFn: () => client.getConnectionStatus(),
    staleTime: 6e4
  });
}
function useMarketConnections() {
  const { client } = useExtensionsServices();
  return useQuery({
    queryKey: MARKETS_KEY,
    queryFn: async () => (await client.getConnectionStatus()).markets ?? []
  });
}
function useConnectMarket() {
  const { client, onError } = useExtensionsServices();
  const queryClient = useQueryClient();
  const notify = useExtensionsNotify();
  return useMutation({
    mutationFn: async (input) => {
      if (!client.connectMarket)
        throw new Error("This host does not support connecting to a market.");
      return client.connectMarket(input);
    },
    onSuccess: (connection) => {
      queryClient.invalidateQueries({ queryKey: ["beam-market"] });
      notify({
        type: "success",
        message: `Connected to ${connection.marketName || connection.marketUrl}. ${connection.listingCount} ${connection.listingCount === 1 ? "listing" : "listings"} synced.`
      });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: extensionsErrorMessage(
          err,
          "Could not connect to that market."
        )
      });
      onError?.(err);
    }
  });
}
function useSyncMarket() {
  const { client, onError } = useExtensionsServices();
  const queryClient = useQueryClient();
  const notify = useExtensionsNotify();
  return useMutation({
    mutationFn: async (connectionId) => {
      if (!client.syncMarket)
        throw new Error("This host does not support re-syncing a market.");
      return client.syncMarket(connectionId);
    },
    onSuccess: (connection) => {
      queryClient.invalidateQueries({ queryKey: ["beam-market"] });
      if (connection.status === "connected") {
        notify({
          type: "success",
          message: `${connection.marketName || connection.marketUrl}: ${connection.listingCount} ${connection.listingCount === 1 ? "listing" : "listings"}.`
        });
        return;
      }
      notify({
        type: "error",
        message: connection.lastSyncError ?? "The sync did not complete. The catalog below is the last one this site saw."
      });
    },
    onError: (err) => {
      notify({ type: "error", message: "Re-sync failed." });
      onError?.(err);
    }
  });
}
function useDisconnectMarket() {
  const { client, onError } = useExtensionsServices();
  const queryClient = useQueryClient();
  const notify = useExtensionsNotify();
  return useMutation({
    mutationFn: async (connectionId) => {
      if (!client.disconnectMarket)
        throw new Error("This host does not support disconnecting a market.");
      return client.disconnectMarket(connectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beam-market"] });
      notify({
        type: "success",
        message: "Disconnected. Its listings have left this catalog; anything already deployed here is untouched."
      });
    },
    onError: (err) => {
      notify({ type: "error", message: "Could not disconnect." });
      onError?.(err);
    }
  });
}
function useInstalledExtensions() {
  const { client } = useExtensionsServices();
  return useQuery({
    queryKey: INSTALLED_KEY,
    queryFn: () => client.getInstalled()
  });
}
function usePurchaseExtension() {
  const { client, onError } = useExtensionsServices();
  const queryClient = useQueryClient();
  const notify = useExtensionsNotify();
  return useMutation({
    mutationFn: (id) => client.purchase(id),
    onSuccess: (purchase) => {
      queryClient.invalidateQueries({ queryKey: ["beam-market"] });
      notify({
        type: "success",
        message: purchase.alreadyEntitled ? "You already own this \u2014 nothing was charged." : `Purchased${purchase.entitlement.amountLabel ? ` for ${purchase.entitlement.amountLabel}` : ""}. You can install it now.`
      });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: extensionsErrorMessage(err, "The payment was not completed.")
      });
      onError?.(err);
    }
  });
}
function useInstallExtension() {
  const { client, onError } = useExtensionsServices();
  const queryClient = useQueryClient();
  const notify = useExtensionsNotify();
  return useMutation({
    mutationFn: (id) => client.install(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["beam-market"] });
      notify({
        type: "success",
        message: "status" in result && result.status === "awaiting_ops_review" ? "Install request sent for review." : deploymentMessage(result, "Acquired")
      });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: extensionsErrorMessage(err, "Install failed.")
      });
      onError?.(err);
    }
  });
}
function useUpdateInstalledExtension() {
  const { client, onError } = useExtensionsServices();
  const queryClient = useQueryClient();
  const notify = useExtensionsNotify();
  return useMutation({
    mutationFn: (installId) => client.update(installId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: INSTALLED_KEY });
      notify({
        type: "success",
        message: deploymentMessage(result, "Checked")
      });
    },
    onError: (err) => {
      notify({ type: "error", message: "Update failed." });
      onError?.(err);
    }
  });
}
function useRemoveInstalledExtension() {
  const { client, onError } = useExtensionsServices();
  const queryClient = useQueryClient();
  const notify = useExtensionsNotify();
  return useMutation({
    mutationFn: (installId) => client.remove(installId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["beam-market"] });
      notify({
        type: "success",
        message: result?.status === "awaiting_ops_review" ? "Removal request sent for review." : "Removal requested. If the package is still deployed, run the removal step shown on the row."
      });
    },
    onError: (err) => {
      notify({ type: "error", message: "Remove failed." });
      onError?.(err);
    }
  });
}

// src/TrustBadge.tsx
import { Badge, cn } from "@schemastud/ui";
import { Lock, ShieldCheck, ShieldQuestion } from "lucide-react";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function TrustBadge({ tier, className }) {
  const config = tier === "Official" ? { label: "Official", icon: ShieldCheck, className: "bg-primary/10 text-primary border-primary/20" } : tier === "Verified" ? { label: "Verified", icon: ShieldCheck, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" } : { label: "Standard", icon: ShieldQuestion, className: "bg-muted text-muted-foreground border-transparent" };
  const Icon = config.icon;
  return /* @__PURE__ */ jsxs2(Badge, { variant: "outline", className: cn("gap-1 font-normal", config.className, className), children: [
    /* @__PURE__ */ jsx3(Icon, { className: "size-3", "aria-hidden": "true" }),
    config.label
  ] });
}
function RequiresSplicewireBadge({ className }) {
  return /* @__PURE__ */ jsxs2(Badge, { variant: "outline", className: cn("gap-1 font-normal text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10", className), children: [
    /* @__PURE__ */ jsx3(Lock, { className: "size-3", "aria-hidden": "true" }),
    "Requires Splicewire"
  ] });
}

// src/ExtensionDetailSheet.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
var KIND_LABELS = {
  scaffold_pack: "Scaffold Pack",
  beam_extension: "Beam Extension"
};
function ExtensionDetailSheet({
  listingId,
  onOpenChange
}) {
  const { data, isError } = useExtensionListing(listingId);
  const { data: connectionStatus } = useConnectionStatus();
  const install = useInstallExtension();
  const purchase = usePurchaseExtension();
  const { renderConnectCta, connectUrl, can } = useExtensionsServices();
  const mayInstall = can?.("market-extensions.install") ?? true;
  const { reset: resetInstall } = install;
  const { reset: resetPurchase } = purchase;
  useEffect(() => {
    resetInstall();
    resetPurchase();
  }, [listingId, resetInstall, resetPurchase]);
  const awaitingReview = install.data && "status" in install.data && install.data.status === "awaiting_ops_review";
  const gatedAndDisconnected = Boolean(data?.requiresSplicewire) && connectionStatus?.connected === false;
  const justPurchased = purchase.data?.entitlement ?? null;
  const needsPurchase = Boolean(data) && !data.isFree && !data.isEntitled && !purchase.isSuccess;
  return /* @__PURE__ */ jsx4(Sheet, { open: listingId !== null, onOpenChange, children: /* @__PURE__ */ jsxs3(SheetContent, { side: "right", className: "w-full max-w-md overflow-y-auto", children: [
    isError && /* @__PURE__ */ jsx4("p", { role: "alert", children: "Could not load this extension." }),
    data && /* @__PURE__ */ jsxs3(Fragment, { children: [
      /* @__PURE__ */ jsxs3(SheetHeader, { children: [
        /* @__PURE__ */ jsxs3("div", { className: "flex items-start justify-between gap-2 pr-8", children: [
          /* @__PURE__ */ jsx4(SheetTitle, { children: data.name }),
          data.requiresSplicewire && /* @__PURE__ */ jsx4(RequiresSplicewireBadge, {})
        ] }),
        /* @__PURE__ */ jsx4(SheetDescription, { children: data.description })
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "flex flex-col gap-4", children: [
        /* @__PURE__ */ jsxs3("div", { className: "flex flex-wrap items-center gap-1.5", children: [
          /* @__PURE__ */ jsx4(TrustBadge, { tier: data.trustTier }),
          /* @__PURE__ */ jsx4(
            Badge2,
            {
              variant: "outline",
              className: "font-normal text-muted-foreground",
              children: KIND_LABELS[data.kind] ?? data.kind
            }
          ),
          data.isPlatformTier && /* @__PURE__ */ jsx4(
            Badge2,
            {
              variant: "outline",
              className: "font-normal text-muted-foreground",
              children: "Platform Tier"
            }
          ),
          !data.isFree && (data.isEntitled || purchase.isSuccess) && /* @__PURE__ */ jsx4(
            Badge2,
            {
              variant: "outline",
              className: "font-normal text-emerald-600 dark:text-emerald-400",
              children: "Purchased"
            }
          )
        ] }),
        gatedAndDisconnected && /* @__PURE__ */ jsxs3("div", { className: "flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3", children: [
          /* @__PURE__ */ jsxs3("p", { className: "flex items-center gap-2 text-sm font-medium", children: [
            /* @__PURE__ */ jsx4(Lock2, { className: "size-4 shrink-0", "aria-hidden": "true" }),
            "This listing requires a connected Splicewire account."
          ] }),
          connectionStatus?.pairingGuidance && // The guided pairing step (splicewire-marketplace-build ticket 10):
          // `PairingGuidanceData` rode the wire with no consumer until this
          // block — the copy is the DTO's, never authored here.
          /* @__PURE__ */ jsxs3("div", { className: "flex flex-col gap-1 text-sm", children: [
            /* @__PURE__ */ jsx4("p", { className: "text-muted-foreground", children: "Pair this site from its own terminal, then approve in your browser:" }),
            /* @__PURE__ */ jsx4("code", { className: "rounded bg-muted px-2 py-1 font-mono text-xs", children: connectionStatus.pairingGuidance.connectCommand }),
            /* @__PURE__ */ jsxs3("p", { className: "text-xs text-muted-foreground", children: [
              connectionStatus.pairingGuidance.manualFallbackHint,
              " ",
              "(sets",
              " ",
              /* @__PURE__ */ jsx4("code", { className: "font-mono", children: connectionStatus.pairingGuidance.manualTokenEnvVar }),
              ")."
            ] })
          ] }),
          renderConnectCta ? renderConnectCta({ connectUrl }) : /* @__PURE__ */ jsx4(
            Button2,
            {
              variant: "outline",
              size: "sm",
              disabled: !connectUrl,
              onClick: () => {
                if (connectUrl && typeof window !== "undefined") {
                  window.location.href = connectUrl;
                }
              },
              children: "Connect Splicewire to install"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs3("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs3("span", { className: "text-sm text-muted-foreground", children: [
            "by ",
            data.sellerName
          ] }),
          /* @__PURE__ */ jsx4("span", { className: "font-medium", children: data.isFree ? "Free" : data.priceLabel })
        ] }),
        needsPurchase ? /* @__PURE__ */ jsx4(
          Button2,
          {
            disabled: purchase.isPending || gatedAndDisconnected,
            onClick: () => purchase.mutate(data.id),
            children: purchase.isPending ? "Purchasing\u2026" : purchase.isError ? "Try again" : `Buy ${data.priceLabel ?? ""}`.trim()
          }
        ) : /* @__PURE__ */ jsx4(
          Button2,
          {
            disabled: !mayInstall || data.isInstalled || install.isPending || gatedAndDisconnected || Boolean(awaitingReview) || data.requiresSplicewire && !connectionStatus,
            onClick: () => install.mutate(data.id),
            children: awaitingReview ? "Awaiting review" : data.isInstalled ? "Installed" : "Install"
          }
        ),
        !needsPurchase && !mayInstall && !data.isInstalled && /* @__PURE__ */ jsx4("p", { className: "text-sm text-muted-foreground", children: "You don't have permission to install extensions on this site." }),
        purchase.isError && /* @__PURE__ */ jsxs3(
          "p",
          {
            role: "alert",
            className: "flex items-start gap-1.5 text-sm text-destructive",
            children: [
              /* @__PURE__ */ jsx4(
                AlertTriangle,
                {
                  className: "mt-0.5 size-3.5 shrink-0",
                  "aria-hidden": "true"
                }
              ),
              extensionsErrorMessage(
                purchase.error,
                "The payment was not completed. Nothing was purchased."
              )
            ]
          }
        ),
        justPurchased && /* @__PURE__ */ jsx4(EntitlementPanel, { entitlement: justPurchased }),
        data.changelog.length > 0 && /* @__PURE__ */ jsxs3(Fragment, { children: [
          /* @__PURE__ */ jsx4(Separator, {}),
          /* @__PURE__ */ jsxs3("div", { className: "flex flex-col gap-3", children: [
            /* @__PURE__ */ jsx4("h4", { className: "text-sm font-semibold", children: "Changelog" }),
            data.changelog.map((entry) => /* @__PURE__ */ jsxs3("div", { className: "text-sm", children: [
              /* @__PURE__ */ jsxs3("span", { className: "font-medium", children: [
                "v",
                entry.version
              ] }),
              " ",
              /* @__PURE__ */ jsx4("span", { className: "text-muted-foreground", children: entry.notes })
            ] }, entry.version))
          ] })
        ] })
      ] })
    ] })
  ] }) });
}

// src/ExtensionsCatalog.tsx
import {
  Badge as Badge3,
  Button as Button4,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  ListSkeleton,
  ListState,
  SimpleSelect
} from "@schemastud/ui";
import { useState as useState2 } from "react";

// src/DisconnectedBanner.tsx
import { Button as Button3 } from "@schemastud/ui";
import { PlugZap } from "lucide-react";
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function DisconnectedBanner({ marketConnected = false }) {
  const { renderConnectCta, connectUrl } = useExtensionsServices();
  const headline = marketConnected ? "No Splicewire account connected" : "This site isn't connected to Splicewire";
  return /* @__PURE__ */ jsxs4("div", { className: "flex flex-col gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between", children: [
    /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx5(PlugZap, { className: "size-5 shrink-0 text-amber-600 dark:text-amber-400", "aria-hidden": "true" }),
      /* @__PURE__ */ jsxs4("div", { children: [
        /* @__PURE__ */ jsx5("p", { className: "text-sm font-medium", children: headline }),
        /* @__PURE__ */ jsx5("p", { className: "text-sm text-muted-foreground", children: "Extensions marked \u201CRequires Splicewire\u201D can't be installed until you connect an account." })
      ] })
    ] }),
    renderConnectCta ? renderConnectCta({ connectUrl }) : /* @__PURE__ */ jsx5(
      Button3,
      {
        variant: "outline",
        size: "sm",
        disabled: !connectUrl,
        onClick: () => {
          if (connectUrl && typeof window !== "undefined") window.location.href = connectUrl;
        },
        children: "Connect Splicewire"
      }
    )
  ] });
}

// src/ExtensionsCatalog.tsx
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
var KIND_LABELS2 = {
  scaffold_pack: "Scaffold Pack",
  beam_extension: "Beam Extension"
};
function kindLabel(kind) {
  return KIND_LABELS2[kind] ?? kind;
}
function syncedAgo(iso) {
  const when = new Date(iso).getTime();
  if (Number.isNaN(when)) return "at an unknown time";
  const minutes = Math.max(0, Math.round((Date.now() - when) / 6e4));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}
function ListingCard({
  listing,
  onSelect
}) {
  return /* @__PURE__ */ jsxs5(
    Card,
    {
      role: "button",
      tabIndex: 0,
      "data-testid": "extension-card",
      onClick: () => onSelect(listing.id),
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(listing.id);
      },
      className: "cursor-pointer transition-colors hover:border-primary/40",
      children: [
        /* @__PURE__ */ jsxs5(CardHeader, { children: [
          /* @__PURE__ */ jsxs5("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsx6(CardTitle, { className: "text-base", children: listing.name }),
            listing.requiresSplicewire && /* @__PURE__ */ jsx6(RequiresSplicewireBadge, {})
          ] }),
          /* @__PURE__ */ jsxs5("div", { className: "flex flex-wrap items-center gap-1.5", children: [
            /* @__PURE__ */ jsx6(TrustBadge, { tier: listing.trustTier }),
            /* @__PURE__ */ jsx6(
              Badge3,
              {
                variant: "outline",
                className: "font-normal text-muted-foreground",
                children: kindLabel(listing.kind)
              }
            ),
            listing.isInstalled && /* @__PURE__ */ jsx6(
              Badge3,
              {
                variant: "outline",
                className: "font-normal text-emerald-600 dark:text-emerald-400",
                children: "Installed"
              }
            ),
            !listing.isFree && listing.isEntitled && !listing.isInstalled && /* @__PURE__ */ jsx6(
              Badge3,
              {
                variant: "outline",
                className: "font-normal text-emerald-600 dark:text-emerald-400",
                children: "Purchased"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs5(CardContent, { className: "flex flex-col gap-1 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx6("span", { children: listing.sellerName }),
            /* @__PURE__ */ jsx6("span", { className: "font-medium text-foreground", children: listing.isFree ? "Free" : listing.priceLabel })
          ] }),
          listing.marketName && /* @__PURE__ */ jsxs5("span", { className: "text-xs", "data-testid": "listing-provenance", children: [
            "From ",
            listing.marketName,
            listing.syncedAt ? ` \xB7 synced ${syncedAgo(listing.syncedAt)}` : null
          ] })
        ] })
      ]
    }
  );
}
var KIND_OPTIONS = [
  { value: "", label: "All kinds" },
  { value: "scaffold_pack", label: "Scaffold Pack" },
  { value: "beam_extension", label: "Beam Extension" }
];
function ExtensionsCatalog({
  onSelect,
  plays,
  onManageMarkets
}) {
  const [filters, setFilters] = useState2({});
  const { data, isPending, isError, isFetching, refetch } = useExtensionsCatalog(filters);
  const { data: connectionStatus } = useConnectionStatus();
  if (isError) {
    return /* @__PURE__ */ jsxs5(
      "div",
      {
        role: "alert",
        className: "flex flex-col items-start gap-3 rounded-md border border-dashed p-6",
        children: [
          /* @__PURE__ */ jsxs5("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsx6("p", { className: "text-sm font-medium", children: "Could not load extensions." }),
            /* @__PURE__ */ jsx6("p", { className: "text-sm text-muted-foreground", children: "The catalog did not answer. Check the connection and retry." })
          ] }),
          /* @__PURE__ */ jsx6(
            Button4,
            {
              variant: "outline",
              size: "sm",
              disabled: isFetching,
              onClick: () => void refetch(),
              children: isFetching ? "Retrying\u2026" : "Retry"
            }
          )
        ]
      }
    );
  }
  const filtered = Boolean(filters.category || filters.kind);
  const listings = data?.listings ?? [];
  const platformTier = listings.filter((l) => l.isPlatformTier);
  const rest = listings.filter((l) => !l.isPlatformTier);
  return /* @__PURE__ */ jsxs5("div", { className: "flex flex-col gap-6", children: [
    connectionStatus && !connectionStatus.connected && // APP-24 (host-true): a hub has no upstream, so the disconnected banner is a client-only
    // surface. Render it only where this host plays `client`; `undefined` keeps prior behavior.
    (plays === void 0 || plays.includes("client")) && /* @__PURE__ */ jsx6(
      DisconnectedBanner,
      {
        marketConnected: (connectionStatus.markets ?? []).some((market) => market.status === "connected")
      }
    ),
    /* @__PURE__ */ jsxs5("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx6(
        Input,
        {
          "aria-label": "Filter by category",
          value: filters.category ?? "",
          onChange: (e) => setFilters((f) => ({ ...f, category: e.target.value || void 0 })),
          placeholder: "Filter by category\u2026",
          className: "w-48"
        }
      ),
      /* @__PURE__ */ jsx6(
        SimpleSelect,
        {
          "aria-label": "Filter by kind",
          value: filters.kind ?? "",
          onValueChange: (value) => setFilters((f) => ({ ...f, kind: value || void 0 })),
          options: KIND_OPTIONS,
          placeholder: "All kinds",
          className: "w-48"
        }
      ),
      filtered && /* @__PURE__ */ jsx6(Button4, { variant: "ghost", size: "sm", onClick: () => setFilters({}), children: "Clear filters" })
    ] }),
    /* @__PURE__ */ jsx6(
      ListState,
      {
        isPending,
        hasItems: listings.length > 0,
        skeleton: /* @__PURE__ */ jsx6(ListSkeleton, { variant: "grid" }),
        children: /* @__PURE__ */ jsxs5("div", { className: "flex flex-col gap-6", children: [
          listings.length === 0 && // The empty state says WHICH empty it is: a filter that matched nothing is recoverable
          // from right here, a catalog with no listings at all is not.
          /* @__PURE__ */ jsxs5(
            "div",
            {
              "data-testid": "catalog-empty",
              className: "flex flex-col items-start gap-1 rounded-md border border-dashed p-6 text-sm",
              children: [
                /* @__PURE__ */ jsx6("p", { className: "font-medium", children: filtered ? "No extensions match these filters." : "No extensions are available yet." }),
                /* @__PURE__ */ jsx6("p", { className: "text-muted-foreground", children: filtered ? "Clear the filters to see the whole catalog." : "Listings appear here once this site publishes or connects to a market." }),
                !filtered && onManageMarkets ? /* @__PURE__ */ jsx6(Button4, { variant: "outline", size: "sm", className: "mt-2", onClick: onManageMarkets, children: "Connect a market" }) : null
              ]
            }
          ),
          platformTier.length > 0 && /* @__PURE__ */ jsxs5("section", { className: "flex flex-col gap-3", children: [
            /* @__PURE__ */ jsx6("h3", { className: "text-sm font-semibold text-muted-foreground", children: "Platform Tier" }),
            /* @__PURE__ */ jsx6("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", children: platformTier.map((listing) => /* @__PURE__ */ jsx6(
              ListingCard,
              {
                listing,
                onSelect
              },
              listing.id
            )) })
          ] }),
          rest.length > 0 && /* @__PURE__ */ jsxs5("section", { className: "flex flex-col gap-3", children: [
            platformTier.length > 0 && /* @__PURE__ */ jsx6("h3", { className: "text-sm font-semibold text-muted-foreground", children: "Extensions" }),
            /* @__PURE__ */ jsx6("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", children: rest.map((listing) => /* @__PURE__ */ jsx6(
              ListingCard,
              {
                listing,
                onSelect
              },
              listing.id
            )) })
          ] })
        ] })
      }
    )
  ] });
}

// src/InstalledTab.tsx
import { Badge as Badge5, Button as Button6, ListSkeleton as ListSkeleton2, ListState as ListState2 } from "@schemastud/ui";
import { RefreshCw, Trash2 } from "lucide-react";

// src/DeploymentPanel.tsx
import { Badge as Badge4, Button as Button5 } from "@schemastud/ui";
import { AlertTriangle as AlertTriangle2, Terminal } from "lucide-react";
import { jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
var DEPLOYMENT_LABELS = {
  pending: "Deploy pending",
  instructed: "Deploy pending",
  detected: "Active",
  removal_pending: "Removal pending",
  not_applicable: "Installed"
};
function DeploymentBadge({
  installed
}) {
  const state = installed.deployment.state;
  if (state === "not_applicable") return null;
  return /* @__PURE__ */ jsxs6(
    Badge4,
    {
      variant: state === "detected" ? "secondary" : "outline",
      className: "font-normal",
      children: [
        DEPLOYMENT_LABELS[state] ?? state,
        state === "detected" && installed.deployment.detectedVersion ? ` v${installed.deployment.detectedVersion}` : null
      ]
    }
  );
}
function DeploymentPanel({
  installed,
  onRecheck,
  rechecking
}) {
  const { state, instructions, error, lastVerifiedVersion, requestedVersion, notes } = installed.deployment;
  if (state === "detected" || state === "not_applicable") return null;
  const heading = state === "removal_pending" ? "Remove the package from this host to finish" : requestedVersion ? `Version ${requestedVersion} is not deployed on this host yet` : "This listing is not deployed on this host yet";
  return /* @__PURE__ */ jsx7(
    "div",
    {
      className: "mt-3 w-full rounded-md border border-dashed bg-muted/40 p-3",
      "data-testid": "deployment-panel",
      children: /* @__PURE__ */ jsxs6("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsx7(
          Terminal,
          {
            className: "mt-0.5 size-4 shrink-0 text-muted-foreground",
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsxs6("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsx7("p", { className: "text-sm font-medium", children: heading }),
          /* @__PURE__ */ jsx7("p", { className: "mt-0.5 text-sm text-muted-foreground", children: "Run these on the host, then check again. Nothing changes here until this site can see the package." }),
          notes && // The creator's own free-text instructions: prose beside the commands, never a line inside them.
          /* @__PURE__ */ jsxs6("div", { className: "mt-2", "data-testid": "deployment-notes", children: [
            /* @__PURE__ */ jsx7("p", { className: "text-xs font-medium text-muted-foreground", children: "From the creator" }),
            /* @__PURE__ */ jsx7("p", { className: "mt-0.5 whitespace-pre-wrap break-words text-sm", children: notes })
          ] }),
          instructions.length > 0 && /* @__PURE__ */ jsx7("pre", { className: "mt-2 whitespace-pre-wrap break-all rounded bg-background p-2 text-xs leading-relaxed", children: /* @__PURE__ */ jsx7("code", { children: instructions.join("\n") }) }),
          error && /* @__PURE__ */ jsxs6(
            "p",
            {
              role: "alert",
              className: "mt-2 flex items-start gap-1.5 text-sm text-destructive",
              children: [
                /* @__PURE__ */ jsx7(AlertTriangle2, { className: "mt-0.5 size-3.5 shrink-0", "aria-hidden": "true" }),
                error
              ]
            }
          ),
          /* @__PURE__ */ jsxs6("div", { className: "mt-2 flex flex-wrap items-center gap-3", children: [
            onRecheck && /* @__PURE__ */ jsx7(
              Button5,
              {
                variant: "outline",
                size: "sm",
                disabled: rechecking,
                onClick: onRecheck,
                children: "Check again"
              }
            ),
            /* @__PURE__ */ jsx7("span", { className: "text-xs text-muted-foreground", children: lastVerifiedVersion ? `Last verified deployment: v${lastVerifiedVersion}` : "No deployment verified on this host yet" })
          ] })
        ] })
      ] })
    }
  );
}

// src/InstalledTab.tsx
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
var KIND_LABELS3 = {
  scaffold_pack: "Scaffold Pack",
  beam_extension: "Beam Extension"
};
function InstalledRow({ installed }) {
  const update = useUpdateInstalledExtension();
  const remove = useRemoveInstalledExtension();
  const { can } = useExtensionsServices();
  const mayRefresh = can?.("installed-extensions.refresh") ?? true;
  const mayRemove = can?.("installed-extensions.remove") ?? true;
  return (
    // A stable handle for the row, because everything the deployment honesty rule is about — the
    // pending state, the requested version, the "available" offer — is asserted PER ROW, and a
    // browser probe addressing it by Tailwind class would be measuring the stylesheet.
    /* @__PURE__ */ jsxs7(
      "div",
      {
        className: "flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3",
        "data-testid": "installed-extension-row",
        children: [
          /* @__PURE__ */ jsxs7("div", { className: "flex min-w-0 flex-col gap-1", children: [
            /* @__PURE__ */ jsxs7("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsx8("span", { className: "truncate font-medium", children: installed.name }),
              /* @__PURE__ */ jsx8(TrustBadge, { tier: installed.trustTier }),
              /* @__PURE__ */ jsx8(DeploymentBadge, { installed }),
              installed.isPlatformTier && /* @__PURE__ */ jsx8(
                Badge5,
                {
                  variant: "outline",
                  className: "font-normal text-muted-foreground",
                  children: "Platform Tier"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs7("p", { className: "text-sm text-muted-foreground", children: [
              KIND_LABELS3[installed.kind] ?? installed.kind,
              installed.installedVersion ? ` \xB7 v${installed.installedVersion}` : null,
              installed.updateAvailable && installed.latestVersion ? ` \xB7 v${installed.latestVersion} available` : null
            ] })
          ] }),
          /* @__PURE__ */ jsxs7("div", { className: "flex shrink-0 items-center gap-2", children: [
            installed.updateAvailable && /* @__PURE__ */ jsxs7(
              Button6,
              {
                variant: "outline",
                size: "sm",
                disabled: !mayRefresh || update.isPending,
                onClick: () => update.mutate(installed.installId),
                children: [
                  /* @__PURE__ */ jsx8(RefreshCw, { className: "size-3.5", "aria-hidden": "true" }),
                  "Update"
                ]
              }
            ),
            /* @__PURE__ */ jsxs7(
              Button6,
              {
                variant: "ghost",
                size: "sm",
                disabled: !mayRemove || remove.isPending,
                onClick: () => remove.mutate(installed.installId),
                children: [
                  /* @__PURE__ */ jsx8(Trash2, { className: "size-3.5", "aria-hidden": "true" }),
                  "Remove"
                ]
              }
            )
          ] }),
          (!mayRefresh || !mayRemove) && /* @__PURE__ */ jsxs7("p", { className: "w-full basis-full text-sm text-muted-foreground", children: [
            "You don't have permission to",
            " ",
            !mayRefresh && !mayRemove ? "update or remove" : !mayRefresh ? "update" : "remove",
            " extensions on this site."
          ] }),
          /* @__PURE__ */ jsxs7("div", { className: "w-full basis-full", children: [
            /* @__PURE__ */ jsx8(
              DeploymentPanel,
              {
                installed,
                rechecking: update.isPending,
                onRecheck: mayRefresh ? () => update.mutate(installed.installId) : void 0
              }
            ),
            installed.entitlement && /* @__PURE__ */ jsx8(
              EntitlementPanel,
              {
                entitlement: installed.entitlement,
                packageName: installed.deployment.package
              }
            )
          ] })
        ]
      }
    )
  );
}
function InstalledTab() {
  const { data, isPending, isError } = useInstalledExtensions();
  if (isError) return /* @__PURE__ */ jsx8("p", { role: "alert", children: "Could not load extensions. Try again." });
  const installed = data ?? [];
  return /* @__PURE__ */ jsx8(
    ListState2,
    {
      isPending,
      hasItems: installed.length > 0,
      skeleton: /* @__PURE__ */ jsx8(ListSkeleton2, { variant: "stack" }),
      children: installed.length === 0 ? /* @__PURE__ */ jsx8("p", { className: "py-8 text-center text-sm text-muted-foreground", children: "Nothing installed yet \u2014 install a listing from the catalog to see it here." }) : /* @__PURE__ */ jsx8("div", { className: "flex flex-col gap-2", children: installed.map((row) => /* @__PURE__ */ jsx8(InstalledRow, { installed: row }, row.installId)) })
    }
  );
}

// src/MarketConnectionPanel.tsx
import { Badge as Badge6, Button as Button7, Input as Input2, ListSkeleton as ListSkeleton3, ListState as ListState3 } from "@schemastud/ui";
import { AlertTriangle as AlertTriangle3, Link2, Link2Off, RefreshCw as RefreshCw2, Store } from "lucide-react";
import { useState as useState3 } from "react";
import { jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
function statusBadge(connection) {
  switch (connection.status) {
    case "connected":
      return /* @__PURE__ */ jsx9(
        Badge6,
        {
          variant: "outline",
          className: "font-normal text-emerald-600 dark:text-emerald-400",
          children: "Connected"
        }
      );
    case "refused":
      return /* @__PURE__ */ jsx9(Badge6, { variant: "outline", className: "font-normal text-destructive", children: "Credential refused" });
    case "error":
      return /* @__PURE__ */ jsx9(
        Badge6,
        {
          variant: "outline",
          className: "font-normal text-amber-600 dark:text-amber-400",
          children: "Sync failed"
        }
      );
    default:
      return /* @__PURE__ */ jsx9(Badge6, { variant: "outline", className: "font-normal text-muted-foreground", children: "Not synced yet" });
  }
}
function syncedLabel(connection) {
  if (!connection.lastSyncedAt) return "Never synced";
  const when = new Date(connection.lastSyncedAt);
  return Number.isNaN(when.getTime()) ? "Never synced" : `Last synced ${when.toLocaleString()}`;
}
function ConnectionRow({ connection }) {
  const { client } = useExtensionsServices();
  const sync = useSyncMarket();
  const disconnect = useDisconnectMarket();
  return /* @__PURE__ */ jsxs8(
    "div",
    {
      className: "flex flex-col gap-3 rounded-lg border p-4",
      "data-testid": "market-connection",
      "data-status": connection.status,
      children: [
        /* @__PURE__ */ jsxs8("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs8("div", { className: "flex min-w-0 items-start gap-3", children: [
            /* @__PURE__ */ jsx9(
              Store,
              {
                className: "mt-0.5 size-5 shrink-0 text-muted-foreground",
                "aria-hidden": "true"
              }
            ),
            /* @__PURE__ */ jsxs8("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxs8("div", { className: "flex flex-wrap items-center gap-2", children: [
                /* @__PURE__ */ jsx9("span", { className: "truncate font-medium", children: connection.marketName || connection.marketUrl }),
                statusBadge(connection)
              ] }),
              /* @__PURE__ */ jsx9("p", { className: "truncate text-sm text-muted-foreground", children: connection.marketUrl }),
              /* @__PURE__ */ jsxs8("p", { className: "text-sm text-muted-foreground", children: [
                connection.listingCount,
                " ",
                connection.listingCount === 1 ? "listing" : "listings",
                " \xB7",
                " ",
                syncedLabel(connection),
                connection.credentialHint ? ` \xB7 key \u2026${connection.credentialHint}` : null
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs8("div", { className: "flex shrink-0 items-center gap-2", children: [
            client.syncMarket && /* @__PURE__ */ jsxs8(
              Button7,
              {
                variant: "outline",
                size: "sm",
                disabled: sync.isPending,
                onClick: () => sync.mutate(connection.id),
                children: [
                  /* @__PURE__ */ jsx9(RefreshCw2, { className: "size-3.5", "aria-hidden": "true" }),
                  "Re-sync"
                ]
              }
            ),
            client.disconnectMarket && /* @__PURE__ */ jsxs8(
              Button7,
              {
                variant: "ghost",
                size: "sm",
                disabled: disconnect.isPending,
                onClick: () => disconnect.mutate(connection.id),
                children: [
                  /* @__PURE__ */ jsx9(Link2Off, { className: "size-3.5", "aria-hidden": "true" }),
                  "Disconnect"
                ]
              }
            )
          ] })
        ] }),
        connection.registryUrl ? /* @__PURE__ */ jsxs8("p", { className: "text-xs text-muted-foreground", children: [
          "Packages resolve from",
          " ",
          /* @__PURE__ */ jsx9("code", { className: "rounded bg-muted px-1 py-0.5", children: connection.registryUrl })
        ] }) : /* @__PURE__ */ jsx9("p", { className: "text-xs text-muted-foreground", children: "This market publishes a catalog and distributes no packages." }),
        connection.lastSyncError && /* @__PURE__ */ jsxs8(
          "p",
          {
            role: "alert",
            "data-testid": "market-connection-error",
            className: "flex items-start gap-1.5 text-sm text-destructive",
            children: [
              /* @__PURE__ */ jsx9(
                AlertTriangle3,
                {
                  className: "mt-0.5 size-3.5 shrink-0",
                  "aria-hidden": "true"
                }
              ),
              /* @__PURE__ */ jsxs8("span", { children: [
                connection.lastSyncError,
                connection.status === "refused" && client.connectMarket ? " Ask its operator to issue a new one, then connect again below." : null
              ] })
            ]
          }
        )
      ]
    }
  );
}
function ConnectForm() {
  const connect = useConnectMarket();
  const [marketUrl, setMarketUrl] = useState3("");
  const [credential, setCredential] = useState3("");
  const submit = (event) => {
    event.preventDefault();
    connect.mutate(
      { marketUrl, credential },
      {
        onSuccess: () => {
          setMarketUrl("");
          setCredential("");
        }
      }
    );
  };
  return /* @__PURE__ */ jsxs8(
    "form",
    {
      className: "flex flex-col gap-3 rounded-lg border border-dashed p-4",
      onSubmit: submit,
      "data-testid": "market-connect-form",
      children: [
        /* @__PURE__ */ jsxs8("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx9(Link2, { className: "size-4 text-muted-foreground", "aria-hidden": "true" }),
          /* @__PURE__ */ jsx9("p", { className: "text-sm font-medium", children: "Connect to a market" })
        ] }),
        /* @__PURE__ */ jsx9("p", { className: "text-sm text-muted-foreground", children: "Paste the market's address and the connection credential its operator issued for this site. The credential is checked against that market before anything is saved." }),
        /* @__PURE__ */ jsxs8("div", { className: "flex flex-col gap-2 sm:flex-row", children: [
          /* @__PURE__ */ jsx9(
            Input2,
            {
              "aria-label": "Market URL",
              placeholder: "https://market.example.com",
              value: marketUrl,
              onChange: (e) => {
                setMarketUrl(e.target.value);
                if (connect.isError) connect.reset();
              },
              className: "sm:flex-1"
            }
          ),
          /* @__PURE__ */ jsx9(
            Input2,
            {
              "aria-label": "Connection credential",
              type: "password",
              placeholder: "Connection credential",
              value: credential,
              onChange: (e) => {
                setCredential(e.target.value);
                if (connect.isError) connect.reset();
              },
              className: "sm:flex-1"
            }
          ),
          /* @__PURE__ */ jsx9(
            Button7,
            {
              type: "submit",
              disabled: connect.isPending || !marketUrl || !credential,
              children: connect.isPending ? "Connecting\u2026" : "Connect"
            }
          )
        ] }),
        connect.isError && /* @__PURE__ */ jsx9("p", { role: "alert", className: "text-sm text-destructive", "data-testid": "market-connect-error", children: extensionsErrorMessage(connect.error, "Could not connect to that market.") })
      ]
    }
  );
}
function MarketConnectionPanel() {
  const { client } = useExtensionsServices();
  const { data, isPending, isError } = useMarketConnections();
  if (isError) {
    return /* @__PURE__ */ jsx9("p", { role: "alert", children: "Could not load market connections. Try again." });
  }
  const connections = data ?? [];
  return /* @__PURE__ */ jsxs8("div", { className: "flex flex-col gap-4", children: [
    /* @__PURE__ */ jsx9(
      ListState3,
      {
        isPending,
        hasItems: connections.length > 0,
        skeleton: /* @__PURE__ */ jsx9(ListSkeleton3, { variant: "stack" }),
        children: connections.length === 0 ? /* @__PURE__ */ jsx9(
          "p",
          {
            className: "py-6 text-center text-sm text-muted-foreground",
            "data-testid": "market-disconnected",
            children: "This site isn't connected to a market. Its catalog is whatever has been published here."
          }
        ) : /* @__PURE__ */ jsx9("div", { className: "flex flex-col gap-3", children: connections.map((connection) => /* @__PURE__ */ jsx9(ConnectionRow, { connection }, connection.id)) })
      }
    ),
    client.connectMarket && /* @__PURE__ */ jsx9(ConnectForm, {})
  ] });
}

// src/ExtensionsArea.tsx
import { jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
function ExtensionsArea({
  className,
  plays,
  title = "Extensions"
}) {
  const [tab, setTab] = useState4("browse");
  const [selectedListingId, setSelectedListingId] = useState4(null);
  const { client, can } = useExtensionsServices();
  const hasMarketActions = Boolean(client.connectMarket || client.syncMarket || client.disconnectMarket);
  const canConnectMarket = Boolean(client.connectMarket) && (can?.("market-connection.create") ?? true);
  const activeTab = tab === "market" && !hasMarketActions ? "browse" : tab;
  return /* @__PURE__ */ jsxs9("div", { className: cn2("flex flex-col gap-4", className), children: [
    /* @__PURE__ */ jsx10("h1", { className: "text-lg font-semibold tracking-tight", children: title }),
    /* @__PURE__ */ jsxs9("div", { className: "flex items-center gap-1 border-b", children: [
      /* @__PURE__ */ jsx10(TabButton, { active: activeTab === "browse", onClick: () => setTab("browse"), children: "Browse" }),
      /* @__PURE__ */ jsx10(TabButton, { active: tab === "installed", onClick: () => setTab("installed"), children: "Installed" }),
      hasMarketActions && /* @__PURE__ */ jsx10(TabButton, { active: tab === "market", onClick: () => setTab("market"), children: "Market" })
    ] }),
    activeTab === "browse" && /* @__PURE__ */ jsx10(
      ExtensionsCatalog,
      {
        onSelect: setSelectedListingId,
        plays,
        onManageMarkets: canConnectMarket ? () => setTab("market") : void 0
      }
    ),
    activeTab === "installed" && /* @__PURE__ */ jsx10(InstalledTab, {}),
    activeTab === "market" && /* @__PURE__ */ jsx10(MarketConnectionPanel, {}),
    /* @__PURE__ */ jsx10(
      ExtensionDetailSheet,
      {
        listingId: selectedListingId,
        onOpenChange: (open) => {
          if (!open) setSelectedListingId(null);
        }
      }
    )
  ] });
}
function TabButton({
  active,
  onClick,
  children
}) {
  return /* @__PURE__ */ jsx10(
    Button8,
    {
      variant: "ghost",
      className: cn2(
        "rounded-none border-b-2 border-transparent px-3 pb-2 font-normal text-muted-foreground hover:bg-transparent",
        active && "border-primary font-medium text-foreground"
      ),
      onClick,
      children
    }
  );
}

// src/http-client.ts
function createExtensionsClient(request, endpoints) {
  const { connections, connectionRow, syncConnection } = endpoints;
  async function collect(url, filters = {}) {
    const rows = [];
    let previousOffset = -1;
    for (let page = 1; ; page += 1) {
      const response = await request("GET", url, { ...filters, page });
      const envelope = response.data;
      if (!Array.isArray(envelope.data))
        throw new Error("Expected an extension collection.");
      if (page > 1 && (envelope.offset === void 0 || envelope.offset <= previousOffset)) {
        throw new Error("Extension pagination did not advance.");
      }
      rows.push(...envelope.data);
      if (envelope.total === void 0 || rows.length >= envelope.total)
        return rows;
      if (!envelope.data.length || envelope.offset === void 0 || envelope.offset <= previousOffset) {
        throw new Error("Extension pagination did not advance.");
      }
      previousOffset = envelope.offset;
    }
  }
  return {
    getCatalog: async (filters) => {
      const params = {};
      if (filters?.category) params["filter[category]"] = filters.category;
      if (filters?.kind) params["filter[kind]"] = filters.kind;
      return {
        listings: await collect(endpoints.catalog, params)
      };
    },
    getListing: async (id) => (await request("GET", endpoints.listing(id))).data.data,
    getConnectionStatus: async () => (await request("GET", endpoints.connection)).data.data,
    getInstalled: () => collect(endpoints.installed),
    install: async (id) => (await request(
      "POST",
      endpoints.install(id)
    )).data.data,
    purchase: async (id) => (await request("POST", endpoints.purchase(id))).data.data,
    update: async (id) => (await request("POST", endpoints.update(id))).data.data,
    ...connections ? {
      connectMarket: async (input) => (await request(
        "POST",
        connections,
        void 0,
        input
      )).data.data
    } : {},
    ...syncConnection ? {
      syncMarket: async (id) => (await request(
        "POST",
        syncConnection.call(endpoints, id)
      )).data.data
    } : {},
    ...connectionRow ? {
      disconnectMarket: async (id) => {
        await request(
          "DELETE",
          connectionRow.call(endpoints, id)
        );
      }
    } : {},
    remove: async (id) => {
      const response = await request(
        "POST",
        endpoints.remove(id)
      );
      return response.status === 202 ? response.data.data : void 0;
    }
  };
}

// src/creator/CreatorWorkspaceArea.tsx
import { Badge as Badge9, Button as Button11, cn as cn3 } from "@schemastud/ui";

// src/creator/hooks.ts
import { useMutation as useMutation2, useQuery as useQuery2, useQueryClient as useQueryClient2 } from "@tanstack/react-query";

// src/creator/provider.tsx
import { createContext as createContext2, useContext as useContext2 } from "react";
import { jsx as jsx11 } from "react/jsx-runtime";
var CreatorServicesContext = createContext2(null);
function consoleNotify2(event) {
  if (event.type === "error")
    console.error(`[beam-market/creator] ${event.message}`);
  else console.info(`[beam-market/creator] ${event.message}`);
}
function CreatorProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx11(CreatorServicesContext.Provider, { value: services, children });
}
function useCreatorServices() {
  const services = useContext2(CreatorServicesContext);
  if (!services) {
    throw new Error(
      "beam-market creator surfaces must be rendered inside a <CreatorProvider>."
    );
  }
  return services;
}
function useCreatorNotify() {
  return useCreatorServices().notify ?? consoleNotify2;
}
function creatorErrorMessage(err, fallback) {
  const data = err?.response?.data;
  const fieldErrors = Object.values(data?.errors ?? {}).flat();
  if (fieldErrors.length > 0) return fieldErrors.join(" ");
  return data?.message ?? err?.message ?? fallback;
}

// src/creator/hooks.ts
var SELLER_KEY = ["beam-market-creator", "seller"];
var AUTHORIZATIONS_KEY = ["beam-market-creator", "authorizations"];
var LISTINGS_KEY = ["beam-market-creator", "listings"];
function useCreatorSeller() {
  const { client } = useCreatorServices();
  return useQuery2({ queryKey: SELLER_KEY, queryFn: () => client.getSeller() });
}
function useRepoAuthorizations() {
  const { client } = useCreatorServices();
  return useQuery2({
    queryKey: AUTHORIZATIONS_KEY,
    queryFn: () => client.getAuthorizations()
  });
}
function useCreatorListings() {
  const { client } = useCreatorServices();
  return useQuery2({
    queryKey: LISTINGS_KEY,
    queryFn: () => client.getListings()
  });
}
function useBeginAuthorization() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: () => client.beginAuthorization(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTHORIZATIONS_KEY });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not start the authorization.")
      });
      onError?.(err);
    }
  });
}
function useSimulateProviderCallback() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: ({ id, repos }) => {
      if (!client.simulateProviderCallback) {
        return Promise.reject(
          new Error("This host has no simulated provider callback.")
        );
      }
      return client.simulateProviderCallback(id, repos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTHORIZATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      notify({ type: "success", message: "Repository connected (simulated)." });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "The simulated callback failed.")
      });
      onError?.(err);
    }
  });
}
function useInspectArtifact() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  return useMutation2({
    mutationFn: ({
      id,
      repoFullName,
      ref
    }) => client.inspectArtifact(id, repoFullName, ref),
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not inspect that artifact.")
      });
      onError?.(err);
    }
  });
}
function useSaveListing() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: ({
      id,
      input
    }) => id === null ? client.createListing(input) : client.updateListing(id, input),
    onSuccess: (_listing, { id }) => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      notify({ type: "success", message: id === null ? "Listing created." : "Listing saved." });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not save the listing.")
      });
      onError?.(err);
    }
  });
}
function usePublishRelease() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: ({
      id,
      ref,
      notes
    }) => client.release(id, ref, notes),
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      notify({ type: "success", message: `Released ${listing.latestVersion}.` });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not publish that release.")
      });
      onError?.(err);
    }
  });
}
function useSubmitListing() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: (id) => client.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      notify({ type: "success", message: "Submitted for review." });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not submit for review.")
      });
      onError?.(err);
    }
  });
}
function useWithdrawListing() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient2();
  return useMutation2({
    mutationFn: (id) => client.withdraw(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      notify({
        type: "success",
        message: "Withdrawn. Existing installs are untouched."
      });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not withdraw the listing.")
      });
      onError?.(err);
    }
  });
}

// src/creator/ListingsSection.tsx
import {
  Badge as Badge7,
  Button as Button9,
  Card as Card2,
  CardContent as CardContent2,
  CardDescription,
  CardHeader as CardHeader2,
  CardTitle as CardTitle2,
  Input as Input3,
  Label,
  Textarea
} from "@schemastud/ui";
import { useState as useState5 } from "react";

// src/creator/types.ts
function presentListingStatus(listing) {
  switch (listing.reviewStatus) {
    case "pending_automated":
    case "pending_human":
      return {
        label: "In review",
        tone: "pending",
        hint: "Submitted. An operator has to approve it before anyone can install it."
      };
    case "approved_automated":
    case "approved_human":
      return listing.status === "published" ? {
        label: "Published",
        tone: "approved",
        hint: "Live in the catalog. Releasing a new version sends it back through review."
      } : {
        label: "Approved",
        tone: "approved",
        hint: "Approved but not currently in the catalog."
      };
    case "rejected":
      return {
        label: "Rejected",
        tone: "rejected",
        hint: listing.reviewNote ?? "Rejected without a stated reason. Edit and resubmit when you have changed something."
      };
    case "taken_down":
      return {
        label: "Withdrawn",
        tone: "withdrawn",
        hint: "Out of the catalog, so nobody new can install it. Existing installs are untouched."
      };
    default:
      return {
        label: "Draft",
        tone: "draft",
        hint: "Only you can see this. Submit it for review when a release is ready."
      };
  }
}
function submitBlocker(listing) {
  if (!listing.repoFullName) {
    return "Link the repository that backs this listing first.";
  }
  if (!listing.repoAuthorized) {
    return `Authorize ${listing.repoFullName} before submitting \u2014 the server refuses a submission without it.`;
  }
  if (!listing.latestVersion) {
    return "Publish a release before submitting: there is nothing to review yet.";
  }
  if (listing.reviewStatus === "pending_automated" || listing.reviewStatus === "pending_human") {
    return "Already in review.";
  }
  return null;
}

// src/creator/ListingsSection.tsx
import { jsx as jsx12, jsxs as jsxs10 } from "react/jsx-runtime";
var EMPTY = {
  name: "",
  summary: null,
  repoFullName: null,
  installationNotes: null,
  compatibility: null
};
function ListingsSection() {
  const listings = useCreatorListings();
  const [editing, setEditing] = useState5(null);
  const [creating, setCreating] = useState5(false);
  const rows = listings.data ?? [];
  return /* @__PURE__ */ jsxs10(Card2, { "data-testid": "creator-listings", children: [
    /* @__PURE__ */ jsxs10(CardHeader2, { className: "flex flex-row items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12(CardTitle2, { children: "Listings" }),
        /* @__PURE__ */ jsx12(CardDescription, { children: "Everything you have published or are preparing to." })
      ] }),
      /* @__PURE__ */ jsx12(
        Button9,
        {
          variant: "outline",
          "data-testid": "creator-new-listing",
          onClick: () => {
            setEditing(null);
            setCreating(true);
          },
          children: "New listing"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs10(CardContent2, { className: "flex flex-col gap-4", children: [
      listings.isPending ? /* @__PURE__ */ jsx12("p", { className: "text-sm text-muted-foreground", children: "Loading listings\u2026" }) : null,
      !listings.isPending && rows.length === 0 && !creating ? /* @__PURE__ */ jsx12("p", { className: "text-sm text-muted-foreground", "data-testid": "creator-no-listings", children: "No listings yet. Create one to prepare an extension for the marketplace." }) : null,
      creating ? /* @__PURE__ */ jsx12(
        ListingForm,
        {
          initial: EMPTY,
          listingId: null,
          onDone: () => setCreating(false),
          onCancel: () => setCreating(false)
        }
      ) : null,
      rows.map(
        (listing) => editing?.id === listing.id ? /* @__PURE__ */ jsx12(
          ListingForm,
          {
            listingId: listing.id,
            initial: {
              name: listing.name,
              summary: listing.summary,
              repoFullName: listing.repoFullName,
              installationNotes: listing.installationNotes,
              compatibility: listing.compatibility
            },
            onDone: () => setEditing(null),
            onCancel: () => setEditing(null)
          },
          listing.id
        ) : /* @__PURE__ */ jsx12(ListingRow, { listing, onEdit: () => setEditing(listing) }, listing.id)
      )
    ] })
  ] });
}
function ListingRow({
  listing,
  onEdit
}) {
  const status = presentListingStatus(listing);
  const blocker = submitBlocker(listing);
  const submit = useSubmitListing();
  const withdraw = useWithdrawListing();
  const [releaseRef, setReleaseRef] = useState5("");
  const [releaseNotes, setReleaseNotes] = useState5("");
  const release = usePublishRelease();
  return /* @__PURE__ */ jsxs10("div", { className: "flex flex-col gap-3 rounded-md border p-3", "data-testid": "creator-listing-row", children: [
    /* @__PURE__ */ jsxs10("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx12("span", { className: "font-medium", "data-testid": "creator-listing-name", children: listing.name }),
      /* @__PURE__ */ jsx12(
        Badge7,
        {
          variant: status.tone === "rejected" ? "destructive" : "secondary",
          "data-testid": "creator-listing-status",
          children: status.label
        }
      ),
      listing.latestVersion ? /* @__PURE__ */ jsxs10(Badge7, { variant: "outline", "data-testid": "creator-listing-version", children: [
        "v",
        listing.latestVersion
      ] }) : null,
      /* @__PURE__ */ jsx12(Button9, { size: "sm", variant: "ghost", className: "ml-auto", "data-testid": "creator-edit-listing", onClick: onEdit, children: "Edit" })
    ] }),
    /* @__PURE__ */ jsx12("p", { className: "text-sm text-muted-foreground", "data-testid": "creator-listing-hint", children: status.hint }),
    listing.repoFullName ? /* @__PURE__ */ jsxs10("p", { className: "text-xs text-muted-foreground", children: [
      "Backed by ",
      listing.repoFullName,
      listing.repoAuthorized ? "" : " \u2014 not authorized"
    ] }) : null,
    /* @__PURE__ */ jsxs10(
      "form",
      {
        className: "flex flex-wrap items-end gap-2",
        onSubmit: (event) => {
          event.preventDefault();
          if (!releaseRef.trim()) return;
          release.mutate(
            { id: listing.id, ref: releaseRef.trim(), notes: releaseNotes.trim() || null },
            {
              onSuccess: () => {
                setReleaseRef("");
                setReleaseNotes("");
              }
            }
          );
        },
        children: [
          /* @__PURE__ */ jsxs10("div", { className: "flex flex-col gap-1", children: [
            /* @__PURE__ */ jsx12(Label, { htmlFor: `ref-${listing.id}`, children: "Release tag" }),
            /* @__PURE__ */ jsx12(
              Input3,
              {
                id: `ref-${listing.id}`,
                "data-testid": "creator-release-ref",
                value: releaseRef,
                placeholder: "v1.0.0",
                onChange: (event) => setReleaseRef(event.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsxs10("div", { className: "flex flex-1 flex-col gap-1", children: [
            /* @__PURE__ */ jsx12(Label, { htmlFor: `notes-${listing.id}`, children: "Release notes" }),
            /* @__PURE__ */ jsx12(
              Input3,
              {
                id: `notes-${listing.id}`,
                "data-testid": "creator-release-notes",
                value: releaseNotes,
                onChange: (event) => setReleaseNotes(event.target.value)
              }
            )
          ] }),
          /* @__PURE__ */ jsx12(Button9, { type: "submit", size: "sm", variant: "outline", "data-testid": "creator-release-submit", disabled: release.isPending, children: "Publish release" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs10("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx12(
        Button9,
        {
          size: "sm",
          "data-testid": "creator-submit-listing",
          disabled: blocker !== null || submit.isPending,
          onClick: () => submit.mutate(listing.id),
          children: listing.reviewStatus === "rejected" ? "Resubmit for review" : "Submit for review"
        }
      ),
      blocker ? /* @__PURE__ */ jsx12("span", { className: "text-xs text-muted-foreground", "data-testid": "creator-submit-blocked", children: blocker }) : null,
      listing.status === "published" ? /* @__PURE__ */ jsx12(
        Button9,
        {
          size: "sm",
          variant: "outline",
          "data-testid": "creator-withdraw-listing",
          disabled: withdraw.isPending,
          onClick: () => withdraw.mutate(listing.id),
          children: "Withdraw"
        }
      ) : null
    ] }),
    listing.releases.length > 0 ? /* @__PURE__ */ jsx12("ul", { className: "text-xs text-muted-foreground", "data-testid": "creator-release-history", children: listing.releases.map((entry) => /* @__PURE__ */ jsxs10("li", { children: [
      "v",
      entry.version,
      " \u2014 ",
      entry.notes || "no notes"
    ] }, entry.version)) }) : null
  ] });
}
function ListingForm({
  listingId,
  initial,
  onDone,
  onCancel
}) {
  const [form, setForm] = useState5(initial);
  const save = useSaveListing();
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value === "" ? null : value }));
  return /* @__PURE__ */ jsxs10(
    "form",
    {
      className: "flex flex-col gap-3 rounded-md border border-dashed p-3",
      "data-testid": "creator-listing-form",
      onSubmit: (event) => {
        event.preventDefault();
        save.mutate({ id: listingId, input: { ...form, name: form.name.trim() } }, { onSuccess: onDone });
      },
      children: [
        /* @__PURE__ */ jsx12(Field, { id: "listing-name", label: "Name", testId: "creator-field-name", value: form.name, onChange: (v) => setForm((c) => ({ ...c, name: v })) }),
        /* @__PURE__ */ jsx12(Field, { id: "listing-summary", label: "Description", testId: "creator-field-summary", value: form.summary ?? "", onChange: set("summary") }),
        /* @__PURE__ */ jsx12(
          Field,
          {
            id: "listing-repo",
            label: "Backing repository (owner/repo)",
            testId: "creator-field-repo",
            value: form.repoFullName ?? "",
            onChange: set("repoFullName")
          }
        ),
        /* @__PURE__ */ jsx12(
          Field,
          {
            id: "listing-compat",
            label: "Compatibility",
            testId: "creator-field-compatibility",
            value: form.compatibility ?? "",
            onChange: set("compatibility")
          }
        ),
        /* @__PURE__ */ jsxs10("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsx12(Label, { htmlFor: "listing-install", children: "Installation instructions" }),
          /* @__PURE__ */ jsx12(
            Textarea,
            {
              id: "listing-install",
              "data-testid": "creator-field-installation",
              rows: 3,
              value: form.installationNotes ?? "",
              onChange: (event) => set("installationNotes")(event.target.value)
            }
          ),
          /* @__PURE__ */ jsx12("p", { className: "text-xs text-muted-foreground", children: "A Composer extension needs a CLI step on the installing site. Say what it is \u2014 this is the product step, not a footnote." })
        ] }),
        /* @__PURE__ */ jsxs10("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx12(Button9, { type: "submit", size: "sm", "data-testid": "creator-save-listing", disabled: save.isPending, children: "Save" }),
          /* @__PURE__ */ jsx12(Button9, { type: "button", size: "sm", variant: "ghost", onClick: onCancel, children: "Cancel" })
        ] })
      ]
    }
  );
}
function Field({
  id,
  label,
  testId,
  value,
  onChange
}) {
  return /* @__PURE__ */ jsxs10("div", { className: "flex flex-col gap-1", children: [
    /* @__PURE__ */ jsx12(Label, { htmlFor: id, children: label }),
    /* @__PURE__ */ jsx12(Input3, { id, "data-testid": testId, value, onChange: (event) => onChange(event.target.value) })
  ] });
}

// src/creator/RepositorySection.tsx
import {
  Badge as Badge8,
  Button as Button10,
  Card as Card3,
  CardContent as CardContent3,
  CardDescription as CardDescription2,
  CardHeader as CardHeader3,
  CardTitle as CardTitle3,
  Input as Input4,
  Label as Label2
} from "@schemastud/ui";
import { useState as useState6 } from "react";
import { jsx as jsx13, jsxs as jsxs11 } from "react/jsx-runtime";
function RepositorySection() {
  const { client } = useCreatorServices();
  const authorizations = useRepoAuthorizations();
  const begin = useBeginAuthorization();
  const simulate = useSimulateProviderCallback();
  const inspect = useInspectArtifact();
  const [repoInput, setRepoInput] = useState6("");
  const [artifact, setArtifact] = useState6(null);
  const rows = authorizations.data ?? [];
  const pending = rows.find((row) => row.status === "pending");
  const active = rows.filter((row) => row.status === "active");
  const canSimulate = typeof client.simulateProviderCallback === "function";
  return /* @__PURE__ */ jsxs11(Card3, { "data-testid": "creator-repositories", children: [
    /* @__PURE__ */ jsxs11(CardHeader3, { children: [
      /* @__PURE__ */ jsx13(CardTitle3, { children: "Repositories" }),
      /* @__PURE__ */ jsx13(CardDescription2, { children: "Listings are submitted from a repository you have authorized. Authorize one before you submit." })
    ] }),
    /* @__PURE__ */ jsxs11(CardContent3, { className: "flex flex-col gap-4", children: [
      authorizations.isPending ? /* @__PURE__ */ jsx13("p", { className: "text-sm text-muted-foreground", children: "Loading repositories\u2026" }) : null,
      active.length === 0 && !authorizations.isPending ? /* @__PURE__ */ jsx13("p", { className: "text-sm text-muted-foreground", "data-testid": "creator-no-repositories", children: "No repositories authorized yet." }) : null,
      /* @__PURE__ */ jsx13("ul", { className: "flex flex-col gap-2", children: active.flatMap(
        (row) => (row.repos ?? []).map((repo) => /* @__PURE__ */ jsxs11(
          "li",
          {
            className: "flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm",
            "data-testid": "creator-repository-row",
            children: [
              /* @__PURE__ */ jsx13("span", { className: "font-medium", children: repo.full_name }),
              /* @__PURE__ */ jsx13(Badge8, { variant: "secondary", children: "Authorized" }),
              row.simulated ? /* @__PURE__ */ jsx13(Badge8, { variant: "outline", "data-testid": "creator-simulated-badge", children: "Simulated" }) : null,
              /* @__PURE__ */ jsx13(
                Button10,
                {
                  size: "sm",
                  variant: "ghost",
                  className: "ml-auto",
                  "data-testid": "creator-inspect",
                  onClick: () => inspect.mutate(
                    { id: row.id, repoFullName: repo.full_name },
                    { onSuccess: setArtifact }
                  ),
                  children: "Inspect artifact"
                }
              )
            ]
          },
          `${row.id}:${repo.full_name}`
        ))
      ) }),
      pending ? /* @__PURE__ */ jsxs11("div", { className: "rounded-md border border-dashed p-3 text-sm", "data-testid": "creator-pending-authorization", children: [
        /* @__PURE__ */ jsx13("p", { className: "font-medium", children: "Authorization started" }),
        pending.installUrl ? /* @__PURE__ */ jsxs11("p", { className: "mt-1 break-all text-muted-foreground", children: [
          "Finish it by installing the GitHub App:",
          " ",
          /* @__PURE__ */ jsx13("a", { className: "underline", href: pending.installUrl, rel: "noreferrer", target: "_blank", children: pending.installUrl })
        ] }) : null,
        canSimulate ? /* @__PURE__ */ jsx13(
          SimulateForm,
          {
            pendingId: pending.id,
            repoInput,
            onRepoInput: setRepoInput,
            busy: simulate.isPending,
            onSimulate: (repo) => simulate.mutate({ id: pending.id, repos: [repo] }, { onSuccess: () => setRepoInput("") })
          }
        ) : /* @__PURE__ */ jsx13("p", { className: "mt-2 text-muted-foreground", children: "This host cannot complete the handshake for you \u2014 the provider install has to happen on GitHub." })
      ] }) : /* @__PURE__ */ jsx13(
        Button10,
        {
          variant: "outline",
          className: "self-start",
          "data-testid": "creator-connect-repository",
          disabled: begin.isPending,
          onClick: () => begin.mutate(),
          children: "Connect a repository"
        }
      ),
      artifact ? /* @__PURE__ */ jsx13(ArtifactReport, { artifact }) : null
    ] })
  ] });
}
function SimulateForm({
  pendingId,
  repoInput,
  onRepoInput,
  busy,
  onSimulate
}) {
  return /* @__PURE__ */ jsxs11(
    "form",
    {
      className: "mt-3 flex flex-wrap items-end gap-2",
      onSubmit: (event) => {
        event.preventDefault();
        if (repoInput.trim()) onSimulate(repoInput.trim());
      },
      children: [
        /* @__PURE__ */ jsxs11("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsx13(Label2, { htmlFor: `simulate-${pendingId}`, children: "Repository (owner/repo)" }),
          /* @__PURE__ */ jsx13(
            Input4,
            {
              id: `simulate-${pendingId}`,
              "data-testid": "creator-simulate-repo",
              value: repoInput,
              onChange: (event) => onRepoInput(event.target.value),
              placeholder: "acme/widgets"
            }
          )
        ] }),
        /* @__PURE__ */ jsx13(Button10, { type: "submit", size: "sm", disabled: busy, "data-testid": "creator-simulate-submit", children: "Complete (simulated)" }),
        /* @__PURE__ */ jsx13("p", { className: "w-full text-xs text-muted-foreground", children: "Simulated: this stands in for the GitHub install callback. The authorization it writes is marked simulated and is not evidence of a live GitHub integration." })
      ]
    }
  );
}
function ArtifactReport({ artifact }) {
  if (!artifact.available) {
    return /* @__PURE__ */ jsxs11("div", { className: "rounded-md border p-3 text-sm", "data-testid": "creator-artifact-unavailable", children: [
      /* @__PURE__ */ jsxs11("p", { className: "font-medium", children: [
        "Could not inspect ",
        artifact.repoFullName
      ] }),
      /* @__PURE__ */ jsx13("p", { className: "mt-1 text-muted-foreground", children: artifact.problems[0] })
    ] });
  }
  return /* @__PURE__ */ jsxs11("div", { className: "rounded-md border p-3 text-sm", "data-testid": "creator-artifact-report", children: [
    /* @__PURE__ */ jsxs11("p", { className: "flex flex-wrap items-center gap-2 font-medium", children: [
      artifact.packageName ?? artifact.repoFullName,
      artifact.ref ? /* @__PURE__ */ jsx13(Badge8, { variant: "secondary", children: artifact.ref }) : null,
      /* @__PURE__ */ jsx13(Badge8, { variant: artifact.valid ? "secondary" : "destructive", "data-testid": "creator-artifact-verdict", children: artifact.valid ? "Valid Beam Extension" : "Not listable" })
    ] }),
    artifact.description ? /* @__PURE__ */ jsx13("p", { className: "mt-1 text-muted-foreground", children: artifact.description }) : null,
    artifact.valid ? /* @__PURE__ */ jsxs11("p", { className: "mt-1 text-muted-foreground", children: [
      "Release version ",
      artifact.version,
      ". Tags available:",
      " ",
      artifact.refs.join(", ")
    ] }) : /* @__PURE__ */ jsx13("ul", { className: "mt-2 list-disc pl-5 text-muted-foreground", "data-testid": "creator-artifact-problems", children: artifact.problems.map((problem) => /* @__PURE__ */ jsx13("li", { children: problem }, problem)) })
  ] });
}

// src/creator/CreatorWorkspaceArea.tsx
import { Fragment as Fragment2, jsx as jsx14, jsxs as jsxs12 } from "react/jsx-runtime";
function CreatorWorkspaceArea({ className }) {
  const seller = useCreatorSeller();
  return /* @__PURE__ */ jsxs12("div", { className: cn3("flex flex-col gap-4", className), "data-testid": "creator-workspace", children: [
    /* @__PURE__ */ jsxs12("header", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx14("h1", { className: "text-lg font-semibold", children: "Creator workspace" }),
      seller.data ? /* @__PURE__ */ jsxs12(Badge9, { variant: "secondary", "data-testid": "creator-seller-name", children: [
        "Selling as ",
        seller.data.name
      ] }) : null,
      seller.isPending ? /* @__PURE__ */ jsx14("span", { className: "text-sm text-muted-foreground", children: "Resolving your seller identity\u2026" }) : null,
      seller.isError ? /* @__PURE__ */ jsxs12("span", { className: "flex items-center gap-2 text-sm", role: "alert", children: [
        "Unable to load the creator workspace.",
        /* @__PURE__ */ jsx14(Button11, { size: "sm", variant: "outline", onClick: () => void seller.refetch(), children: "Retry" })
      ] }) : null,
      !seller.isPending && !seller.isError && !seller.data ? (
        // Not an error state: a host whose actor resolves to no Seller (no tenant, or a
        // deliberately null resolver) reaches this surface and can do nothing on it. Saying so is
        // better than an empty page that looks broken.
        /* @__PURE__ */ jsx14("span", { className: "text-sm text-muted-foreground", "data-testid": "creator-no-seller", children: "This account has no seller identity here, so there is nothing to manage." })
      ) : null
    ] }),
    seller.data ? /* @__PURE__ */ jsxs12(Fragment2, { children: [
      /* @__PURE__ */ jsx14(RepositorySection, {}),
      /* @__PURE__ */ jsx14(ListingsSection, {})
    ] }) : null
  ] });
}

// src/creator/http-client.ts
function createCreatorClient(request, endpoints) {
  async function collect(url) {
    const rows = [];
    let previousOffset = -1;
    for (let page = 1; ; page += 1) {
      const envelope = (await request("GET", url, { params: { page } })).data;
      if (!Array.isArray(envelope.data)) {
        throw new Error(`Expected a collection from ${url}.`);
      }
      rows.push(...envelope.data);
      if (envelope.total === void 0 || rows.length >= envelope.total) {
        return rows;
      }
      if (!envelope.data.length || envelope.offset === void 0 || envelope.offset <= previousOffset) {
        throw new Error(`Pagination did not advance on ${url}.`);
      }
      previousOffset = envelope.offset;
    }
  }
  const client = {
    // `market-sellers` is index-only and its scope admits exactly one row: the actor's own Seller,
    // or none. So "the first row" is not a guess — it is the resource's whole contract.
    getSeller: async () => {
      const rows = await collect(endpoints.seller);
      return rows[0] ?? null;
    },
    getAuthorizations: () => collect(endpoints.authorizations),
    beginAuthorization: async () => (await request(
      "POST",
      endpoints.authorizations
    )).data.data,
    inspectArtifact: async (authorizationId, repoFullName, ref) => (await request("GET", endpoints.inspect(authorizationId), {
      // `repo_full_name` is snake_case on the wire deliberately — it is GitHub's field name,
      // relayed rather than renamed, and the input DTO pins it with `#[MapInputName]` so a
      // host's camelCase input mapper cannot rewrite it.
      params: ref ? { repo_full_name: repoFullName, ref } : { repo_full_name: repoFullName }
    })).data.data,
    getListings: () => collect(endpoints.listings),
    createListing: async (input) => (await request("POST", endpoints.listings, { body: toWire(input) })).data.data,
    updateListing: async (id, input) => (await request("PUT", endpoints.listing(id), { body: toWire(input) })).data.data,
    release: async (id, ref, notes) => (await request("POST", endpoints.release(id), { body: { ref, notes } })).data.data,
    submit: async (id) => (await request("POST", endpoints.submit(id))).data.data,
    withdraw: async (id) => (await request("POST", endpoints.withdraw(id))).data.data
  };
  const simulate = endpoints.simulateProviderCallback;
  if (simulate) {
    client.simulateProviderCallback = async (authorizationId, repos) => (await request("POST", simulate(authorizationId), {
      body: { repos }
    })).data.data;
  }
  return client;
}
function toWire(input) {
  const { repoFullName, ...rest } = input;
  return { ...rest, repo_full_name: repoFullName };
}
export {
  CreatorProvider,
  CreatorWorkspaceArea,
  DEPLOYMENT_LABELS,
  DeploymentBadge,
  DeploymentPanel,
  DisconnectedBanner,
  EntitlementPanel,
  ExtensionDetailSheet,
  ExtensionsArea,
  ExtensionsCatalog,
  ExtensionsProvider,
  InstalledTab,
  ListingsSection,
  MarketConnectionPanel,
  RepositorySection,
  RequiresSplicewireBadge,
  TrustBadge,
  createCreatorClient,
  createExtensionsClient,
  creatorErrorMessage,
  extensionsErrorMessage,
  presentListingStatus,
  submitBlocker,
  useBeginAuthorization,
  useConnectMarket,
  useConnectionStatus,
  useCreatorListings,
  useCreatorNotify,
  useCreatorSeller,
  useCreatorServices,
  useDisconnectMarket,
  useExtensionListing,
  useExtensionsCatalog,
  useExtensionsNotify,
  useExtensionsServices,
  useInspectArtifact,
  useInstallExtension,
  useInstalledExtensions,
  useMarketConnections,
  usePublishRelease,
  usePurchaseExtension,
  useRemoveInstalledExtension,
  useRepoAuthorizations,
  useSaveListing,
  useSimulateProviderCallback,
  useSubmitListing,
  useSyncMarket,
  useUpdateInstalledExtension,
  useWithdrawListing
};
//# sourceMappingURL=index.js.map