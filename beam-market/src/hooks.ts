import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useExtensionsNotify, useExtensionsServices } from "./provider";
import type { CatalogFilters, InstalledExtension } from "./types";

/**
 * ux-demo-convergence G5 — a mutation's toast reports the OBSERVED runtime state, never the fact
 * that a row was written. "Installed." after an acquire that deployed nothing is precisely the
 * claim JOURNEYS.md §G5 forbids ("It cannot label code installed or updated because only a
 * database row changed"), so the word only ever appears when the host's probe saw the package.
 */
function deploymentMessage(
  installed: InstalledExtension,
  verb: "Acquired" | "Checked",
): string {
  const { state, detectedVersion, requestedVersion } = installed.deployment;

  if (state === "detected") {
    return `${installed.name} is active${detectedVersion ? ` at v${detectedVersion}` : ""}.`;
  }

  if (state === "not_applicable") {
    return `${verb === "Acquired" ? "Installed" : "Updated"}.`;
  }

  if (state === "removal_pending") {
    return "Still deployed — run the removal step shown on the row.";
  }

  return `${verb}. ${requestedVersion ? `v${requestedVersion} is not deployed yet` : "Nothing is deployed yet"} — follow the deployment step shown on the Installed tab.`;
}

// Query keys are package-namespaced — the host owns the QueryClient; these hooks run on whatever
// provider wraps the host tree.
const catalogKey = (filters?: CatalogFilters) =>
  [
    "beam-market",
    "catalog",
    filters?.category ?? null,
    filters?.kind ?? null,
  ] as const;
const listingKey = (id: number) => ["beam-market", "listing", id] as const;
const INSTALLED_KEY = ["beam-market", "installed"] as const;
const CONNECTION_STATUS_KEY = ["beam-market", "connection"] as const;

/** The unified `/extensions` catalog — one query for both listing kinds, filterable by category/kind. */
export function useExtensionsCatalog(filters?: CatalogFilters) {
  const { client } = useExtensionsServices();
  return useQuery({
    queryKey: catalogKey(filters),
    queryFn: () => client.getCatalog(filters),
  });
}

export function useExtensionListing(id: number | null) {
  const { client } = useExtensionsServices();
  return useQuery({
    queryKey: listingKey(id ?? -1),
    queryFn: () => client.getListing(id as number),
    enabled: id !== null,
  });
}

/**
 * The site-wide connection fact (ticket 08 revision) — fetched ONCE, shared by every surface that
 * needs it (the disconnected promo banner, the detail sheet's gated-and-disconnected notice) rather
 * than each catalog/detail response carrying its own copy. Long `staleTime`: this fact changes only
 * when a human actually runs the connect flow, never on a normal catalog browse.
 */
export function useConnectionStatus() {
  const { client } = useExtensionsServices();
  return useQuery({
    queryKey: CONNECTION_STATUS_KEY,
    queryFn: () => client.getConnectionStatus(),
    staleTime: 60_000,
  });
}

/** The Installed tab's real data source. */
export function useInstalledExtensions() {
  const { client } = useExtensionsServices();
  return useQuery({
    queryKey: INSTALLED_KEY,
    queryFn: () => client.getInstalled(),
  });
}

/** Materializes an install — the ONLY path a Listing (any kind, including Platform Tier) ever becomes "installed". */
export function useInstallExtension() {
  const { client, onError } = useExtensionsServices();
  const queryClient = useQueryClient();
  const notify = useExtensionsNotify();

  return useMutation({
    mutationFn: (id: number) => client.install(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["beam-market"] });
      notify({
        type: "success",
        message:
          "status" in result && result.status === "awaiting_ops_review"
            ? "Install request sent for review."
            : deploymentMessage(result as InstalledExtension, "Acquired"),
      });
    },
    onError: (err) => {
      notify({ type: "error", message: "Install failed." });
      onError?.(err);
    },
  });
}

/** The Installed tab's real (inline) Update action — a mutation, never a read-only mirror. */
export function useUpdateInstalledExtension() {
  const { client, onError } = useExtensionsServices();
  const queryClient = useQueryClient();
  const notify = useExtensionsNotify();

  return useMutation({
    mutationFn: (installId: string) => client.update(installId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: INSTALLED_KEY });
      notify({ type: "success", message: deploymentMessage(result, "Checked") });
    },
    onError: (err) => {
      notify({ type: "error", message: "Update failed." });
      onError?.(err);
    },
  });
}

/** The Installed tab's real (inline) Remove action — a mutation, never a read-only mirror. */
export function useRemoveInstalledExtension() {
  const { client, onError } = useExtensionsServices();
  const queryClient = useQueryClient();
  const notify = useExtensionsNotify();

  return useMutation({
    mutationFn: (installId: string) => client.remove(installId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["beam-market"] });
      notify({
        type: "success",
        message:
          result?.status === "awaiting_ops_review"
            ? "Removal request sent for review."
            : "Removal requested. If the package is still deployed, run the removal step shown on the row.",
      });
    },
    onError: (err) => {
      notify({ type: "error", message: "Remove failed." });
      onError?.(err);
    },
  });
}
