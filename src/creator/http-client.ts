import type { CreatorClient } from "./provider";
import type {
  ExtensionArtifactData,
  MarketListingData,
  MarketListingInputData,
  MarketSellerData,
  SellerRepoAuthorizationData,
} from "./types";

/**
 * The creator surface's transport shape. Wider than `ExtensionsRequest` in one way only — it takes
 * a BODY — because every creator action writes something, where the buyer's half only ever POSTs a
 * verb at an id.
 */
export interface CreatorRequest {
  <T>(
    method: "GET" | "POST" | "PUT",
    url: string,
    options?: {
      params?: Record<string, string | number>;
      body?: unknown;
    },
  ): Promise<{
    status: number;
    data: { data: T; limit?: number; offset?: number; total?: number };
  }>;
}

/**
 * Every URL the workspace touches, supplied by the host — which resolves them BY ROUTE NAME off its
 * own generated route map, never as literals. That is not a style preference here: this package's
 * own sibling surface had exactly this endpoint set go stale and 404 when `laravel-beam-market`
 * re-expressed four operator transitions as `Route::particleOps()`, and a hand-written path cannot
 * notice a move (`features/operator/review-queue/api.ts` carries that scar).
 */
export interface CreatorEndpoints {
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

export function createCreatorClient(
  request: CreatorRequest,
  endpoints: CreatorEndpoints,
): CreatorClient {
  /**
   * Walk a paginated particle index to the end.
   *
   * ⚠️ Fails loudly rather than truncating when the cursor does not advance — the same guard the
   * buyer-side client already carries, for the same reason: a silently short list of a creator's
   * own listings looks exactly like a creator who has fewer listings than they do.
   */
  async function collect<T>(url: string): Promise<T[]> {
    const rows: T[] = [];
    let previousOffset = -1;

    for (let page = 1; ; page += 1) {
      const envelope = (await request<T[]>("GET", url, { params: { page } }))
        .data;

      if (!Array.isArray(envelope.data)) {
        throw new Error(`Expected a collection from ${url}.`);
      }

      rows.push(...envelope.data);

      if (envelope.total === undefined || rows.length >= envelope.total) {
        return rows;
      }

      if (
        !envelope.data.length ||
        envelope.offset === undefined ||
        envelope.offset <= previousOffset
      ) {
        throw new Error(`Pagination did not advance on ${url}.`);
      }

      previousOffset = envelope.offset;
    }
  }

  const client: CreatorClient = {
    // `market-sellers` is index-only and its scope admits exactly one row: the actor's own Seller,
    // or none. So "the first row" is not a guess — it is the resource's whole contract.
    getSeller: async () => {
      const rows = await collect<MarketSellerData>(endpoints.seller);
      return rows[0] ?? null;
    },
    getAuthorizations: () =>
      collect<SellerRepoAuthorizationData>(endpoints.authorizations),
    beginAuthorization: async () =>
      (
        await request<SellerRepoAuthorizationData>(
          "POST",
          endpoints.authorizations,
        )
      ).data.data,
    inspectArtifact: async (authorizationId, repoFullName, ref) =>
      (
        await request<ExtensionArtifactData>("GET", endpoints.inspect(authorizationId), {
          // `repo_full_name` is snake_case on the wire deliberately — it is GitHub's field name,
          // relayed rather than renamed, and the input DTO pins it with `#[MapInputName]` so a
          // host's camelCase input mapper cannot rewrite it.
          params: ref ? { repo_full_name: repoFullName, ref } : { repo_full_name: repoFullName },
        })
      ).data.data,
    getListings: () => collect<MarketListingData>(endpoints.listings),
    createListing: async (input: MarketListingInputData) =>
      (await request<MarketListingData>("POST", endpoints.listings, { body: toWire(input) }))
        .data.data,
    updateListing: async (id, input) =>
      (await request<MarketListingData>("PUT", endpoints.listing(id), { body: toWire(input) }))
        .data.data,
    release: async (id, ref, notes) =>
      (await request<MarketListingData>("POST", endpoints.release(id), { body: { ref, notes } }))
        .data.data,
    submit: async (id) =>
      (await request<MarketListingData>("POST", endpoints.submit(id))).data.data,
    withdraw: async (id) =>
      (await request<MarketListingData>("POST", endpoints.withdraw(id))).data.data,
  };

  // Present only when the host says the simulated callback exists — see `CreatorClient`'s own note
  // on why this is optional rather than always-there-and-failing.
  const simulate = endpoints.simulateProviderCallback;
  if (simulate) {
    client.simulateProviderCallback = async (authorizationId, repos) =>
      (
        await request<SellerRepoAuthorizationData>("POST", simulate(authorizationId), {
          body: { repos },
        })
      ).data.data;
  }

  return client;
}

/**
 * The one wire-name translation this client owns: `repoFullName` → `repo_full_name`, matching the
 * PHP DTO's `#[MapInputName('repo_full_name')]`. Everything else is camelCase on both sides.
 */
function toWire(input: MarketListingInputData): Record<string, unknown> {
  const { repoFullName, ...rest } = input;
  return { ...rest, repo_full_name: repoFullName };
}
