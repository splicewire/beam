import { createContext, useContext, type ReactNode } from "react";
import type {
  ExtensionArtifactData,
  MarketListingData,
  MarketListingInputData,
  MarketSellerData,
  SellerRepoAuthorizationData,
} from "./types";

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
export interface CreatorClient {
  getSeller(): Promise<MarketSellerData | null>;
  getAuthorizations(): Promise<SellerRepoAuthorizationData[]>;
  beginAuthorization(): Promise<SellerRepoAuthorizationData>;
  inspectArtifact(
    authorizationId: string,
    repoFullName: string,
    ref?: string,
  ): Promise<ExtensionArtifactData>;
  getListings(): Promise<MarketListingData[]>;
  createListing(input: MarketListingInputData): Promise<MarketListingData>;
  updateListing(
    id: number,
    input: MarketListingInputData,
  ): Promise<MarketListingData>;
  release(
    id: number,
    ref: string,
    notes?: string | null,
  ): Promise<MarketListingData>;
  submit(id: number): Promise<MarketListingData>;
  withdraw(id: number): Promise<MarketListingData>;
  /** Present only where the host has enabled the simulated provider callback. */
  simulateProviderCallback?(
    authorizationId: string,
    repos: string[],
  ): Promise<SellerRepoAuthorizationData>;
}

export interface CreatorNotifyEvent {
  type: "success" | "error";
  message: string;
}

export interface CreatorServices {
  /** kind 1 — the transport adapter (required). */
  client: CreatorClient;
  /** kind 2 — feedback sink; a dependency-free console default applies when omitted. */
  notify?: (event: CreatorNotifyEvent) => void;
  /** kind 2 — mutation-error hook. The rejection still propagates. */
  onError?: (err: unknown) => void;
}

const CreatorServicesContext = createContext<CreatorServices | null>(null);

function consoleNotify(event: CreatorNotifyEvent): void {
  if (event.type === "error")
    console.error(`[beam-market/creator] ${event.message}`);
  else console.info(`[beam-market/creator] ${event.message}`);
}

export function CreatorProvider({
  services,
  children,
}: {
  services: CreatorServices;
  children: ReactNode;
}) {
  return (
    <CreatorServicesContext.Provider value={services}>
      {children}
    </CreatorServicesContext.Provider>
  );
}

export function useCreatorServices(): CreatorServices {
  const services = useContext(CreatorServicesContext);
  if (!services) {
    throw new Error(
      "beam-market creator surfaces must be rendered inside a <CreatorProvider>.",
    );
  }
  return services;
}

export function useCreatorNotify(): (event: CreatorNotifyEvent) => void {
  return useCreatorServices().notify ?? consoleNotify;
}

/**
 * The message a failed mutation should show a creator.
 *
 * ⚠️ It reads `errors` before `message`, and that order is the point. Every refusal on this surface
 * is a declared 422 whose `errors` bag names the FIELD and the reason — an unauthorized repository,
 * a tag the repository does not carry, a manifest that broke four rules at once. The envelope's
 * top-level `message` is the first sentence only; showing it alone throws away the list of rules a
 * creator has to fix and sends them round the loop once per rule.
 */
export function creatorErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined;

  const fieldErrors = Object.values(data?.errors ?? {}).flat();
  if (fieldErrors.length > 0) return fieldErrors.join(" ");

  return data?.message ?? (err as Error)?.message ?? fallback;
}
