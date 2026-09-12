import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  creatorErrorMessage,
  useCreatorNotify,
  useCreatorServices,
} from "./provider";
import type { MarketListingInputData } from "./types";

// Package-namespaced query keys — the host owns the QueryClient, these run on whatever provider
// wraps its tree. Separate namespace from the buyer's half (`["beam-market", …]`) because the two
// answer different questions about the same rows: a creator's draft is not in the catalog, and a
// catalog invalidation must not claim to have refreshed a creator's workspace.
const SELLER_KEY = ["beam-market-creator", "seller"] as const;
const AUTHORIZATIONS_KEY = ["beam-market-creator", "authorizations"] as const;
const LISTINGS_KEY = ["beam-market-creator", "listings"] as const;

export function useCreatorSeller() {
  const { client } = useCreatorServices();
  return useQuery({ queryKey: SELLER_KEY, queryFn: () => client.getSeller() });
}

export function useRepoAuthorizations() {
  const { client } = useCreatorServices();
  return useQuery({
    queryKey: AUTHORIZATIONS_KEY,
    queryFn: () => client.getAuthorizations(),
  });
}

export function useCreatorListings() {
  const { client } = useCreatorServices();
  return useQuery({
    queryKey: LISTINGS_KEY,
    queryFn: () => client.getListings(),
  });
}

export function useBeginAuthorization() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => client.beginAuthorization(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTHORIZATIONS_KEY });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not start the authorization."),
      });
      onError?.(err);
    },
  });
}

export function useSimulateProviderCallback() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, repos }: { id: string; repos: string[] }) => {
      if (!client.simulateProviderCallback) {
        return Promise.reject(
          new Error("This host has no simulated provider callback."),
        );
      }
      return client.simulateProviderCallback(id, repos);
    },
    onSuccess: () => {
      // Both: an authorization changes which repositories exist AND whether every listing backed by
      // one is submittable (`repoAuthorized` rides the listing projection).
      queryClient.invalidateQueries({ queryKey: AUTHORIZATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      notify({ type: "success", message: "Repository connected (simulated)." });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "The simulated callback failed."),
      });
      onError?.(err);
    },
  });
}

export function useInspectArtifact() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();

  return useMutation({
    mutationFn: ({
      id,
      repoFullName,
      ref,
    }: {
      id: string;
      repoFullName: string;
      ref?: string;
    }) => client.inspectArtifact(id, repoFullName, ref),
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not inspect that artifact."),
      });
      onError?.(err);
    },
  });
}

export function useSaveListing() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number | null;
      input: MarketListingInputData;
    }) =>
      id === null ? client.createListing(input) : client.updateListing(id, input),
    onSuccess: (_listing, { id }) => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      notify({ type: "success", message: id === null ? "Listing created." : "Listing saved." });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not save the listing."),
      });
      onError?.(err);
    },
  });
}

export function usePublishRelease() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ref,
      notes,
    }: {
      id: number;
      ref: string;
      notes?: string | null;
    }) => client.release(id, ref, notes),
    onSuccess: (listing) => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      notify({ type: "success", message: `Released ${listing.latestVersion}.` });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not publish that release."),
      });
      onError?.(err);
    },
  });
}

export function useSubmitListing() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => client.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      notify({ type: "success", message: "Submitted for review." });
    },
    onError: (err) => {
      // The one refusal a creator hits most: an unauthorized backing repository. The server's 422
      // names the field and says what to do, so it is shown verbatim rather than replaced.
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not submit for review."),
      });
      onError?.(err);
    },
  });
}

export function useWithdrawListing() {
  const { client, onError } = useCreatorServices();
  const notify = useCreatorNotify();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => client.withdraw(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
      notify({
        type: "success",
        message: "Withdrawn. Existing installs are untouched.",
      });
    },
    onError: (err) => {
      notify({
        type: "error",
        message: creatorErrorMessage(err, "Could not withdraw the listing."),
      });
      onError?.(err);
    },
  });
}
