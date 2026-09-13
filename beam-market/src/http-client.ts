import type { ExtensionsClient } from "./provider";
import type {
  AwaitingOpsReviewData,
  InstalledExtension,
  MarketConnection,
  MarketConnectionInput,
  MarketExtension,
  MarketPurchase,
} from "./types";

/** HTTP is injected; this helper owns the Beam envelope and pagination protocol. */
export interface ExtensionsRequest {
  <T>(
    method: "GET" | "POST" | "DELETE",
    url: string,
    params?: Record<string, string | number>,
    // ux-demo-convergence G5 — a BODY, which no call in this package needed until a site had to
    // send a market URL and a credential. Optional, so every existing host adapter keeps
    // compiling and keeps behaving identically.
    body?: Record<string, unknown>,
  ): Promise<{
    status: number;
    data: { data: T; limit?: number; offset?: number; total?: number };
  }>;
}
export interface ExtensionsEndpoints {
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

export function createExtensionsClient(
  request: ExtensionsRequest,
  endpoints: ExtensionsEndpoints,
): ExtensionsClient {
  const { connections, connectionRow, syncConnection } = endpoints;
  async function collect<T>(
    url: string,
    filters: Record<string, string | number> = {},
  ): Promise<T[]> {
    const rows: T[] = [];
    let previousOffset = -1;
    for (let page = 1; ; page += 1) {
      const response = await request<T[]>("GET", url, { ...filters, page });
      const envelope = response.data;
      if (!Array.isArray(envelope.data))
        throw new Error("Expected an extension collection.");
      if (
        page > 1 &&
        (envelope.offset === undefined || envelope.offset <= previousOffset)
      ) {
        throw new Error("Extension pagination did not advance.");
      }
      rows.push(...envelope.data);
      if (envelope.total === undefined || rows.length >= envelope.total)
        return rows;
      // A changing or broken collection must fail visibly rather than return a truncated
      // success or loop forever when a server ignores its page parameter.
      if (
        !envelope.data.length ||
        envelope.offset === undefined ||
        envelope.offset <= previousOffset
      ) {
        throw new Error("Extension pagination did not advance.");
      }
      previousOffset = envelope.offset;
    }
  }
  return {
    getCatalog: async (filters) => {
      const params: Record<string, string> = {};
      if (filters?.category) params["filter[category]"] = filters.category;
      if (filters?.kind) params["filter[kind]"] = filters.kind;
      return {
        listings: await collect<MarketExtension>(endpoints.catalog, params),
      };
    },
    getListing: async (id) =>
      (await request<MarketExtension>("GET", endpoints.listing(id))).data.data,
    getConnectionStatus: async () =>
      (
        await request<
          Awaited<ReturnType<ExtensionsClient["getConnectionStatus"]>>
        >("GET", endpoints.connection)
      ).data.data,
    getInstalled: () => collect<InstalledExtension>(endpoints.installed),
    install: async (id) =>
      (
        await request<InstalledExtension | AwaitingOpsReviewData>(
          "POST",
          endpoints.install(id),
        )
      ).data.data,
    purchase: async (id) =>
      (await request<MarketPurchase>("POST", endpoints.purchase(id))).data.data,
    update: async (id) =>
      (await request<InstalledExtension>("POST", endpoints.update(id))).data
        .data,
    ...(connections
      ? {
          connectMarket: async (input: MarketConnectionInput) =>
            (
              await request<MarketConnection>(
                "POST",
                connections,
                undefined,
                input as unknown as Record<string, unknown>,
              )
            ).data.data,
        }
      : {}),
    ...(syncConnection
      ? {
          syncMarket: async (id: string) =>
            (await request<MarketConnection>("POST", syncConnection(id))).data
              .data,
        }
      : {}),
    ...(connectionRow
      ? {
          disconnectMarket: async (id: string) => {
            await request<undefined>("DELETE", connectionRow(id));
          },
        }
      : {}),
    remove: async (id) => {
      const response = await request<AwaitingOpsReviewData | undefined>(
        "POST",
        endpoints.remove(id),
      );
      return response.status === 202 ? response.data.data : undefined;
    },
  };
}
