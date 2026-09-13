import { describe, expect, it, vi } from "vitest";
import {
  createExtensionsClient,
  type ExtensionsEndpoints,
  type ExtensionsRequest,
} from "../src/http-client";
const endpoints: ExtensionsEndpoints = {
  catalog: "/catalog",
  listing: (id) => `/catalog/${id}`,
  connection: "https://central.example.test/connection",
  installed: "/installed",
  install: (id) => `/catalog/${id}/install`,
  purchase: (id) => `/catalog/${id}/purchase`,
  update: (id) => `/installed/${id}/refresh`,
  remove: (id) => `/installed/${id}/remove`,
  // ux-demo-convergence G5 — the `market-connections` resource and its `sync` op.
  connections: "/market-connections",
  connectionRow: (id) => `/market-connections/${id}`,
  syncConnection: (id) => `/market-connections/${id}/sync`,
};
// Generic transport fixture: actual consumers supply axios/fetch; this test verifies the protocol.
function transport(
  respond: (
    method: string,
    url: string,
    params?: Record<string, string | number>,
    body?: Record<string, unknown>,
  ) => unknown,
): ExtensionsRequest {
  return async <T>(
    method: "GET" | "POST" | "DELETE",
    url: string,
    params?: Record<string, string | number>,
    body?: Record<string, unknown>,
  ) =>
    (body === undefined
      ? respond(method, url, params)
      : respond(method, url, params, body)) as {
      status: number;
      data: { data: T; limit?: number; offset?: number; total?: number };
    };
}
describe("Extensions wire adapter", () => {
  it.each(["syncMarket", "disconnectMarket"] as const)(
    "preserves endpoint method receivers for %s",
    async (operation) => {
      const receiverEndpoints: ExtensionsEndpoints = {
        ...endpoints,
        connections: "/host/market-connections",
        syncConnection(id) {
          return `${this.connections}/${id}/sync`;
        },
        connectionRow(id) {
          return `${this.connections}/${id}`;
        },
      };
      const request = vi.fn(() => ({ status: 200, data: { data: undefined } }));
      const client = createExtensionsClient(
        transport(request),
        receiverEndpoints,
      );
      const mutate = client[operation];
      if (!mutate) throw new Error("Expected connection support");
      await mutate("connection-id");
      expect(request).toHaveBeenCalledWith(
        operation === "syncMarket" ? "POST" : "DELETE",
        `/host/market-connections/connection-id${
          operation === "syncMarket" ? "/sync" : ""
        }`,
        undefined,
      );
    },
  );

  it("omits market mutations when the host supplies no connection endpoints", async () => {
    const { connections, connectionRow, syncConnection, ...publisher } =
      endpoints;
    const respond = vi.fn(() => ({ status: 200, data: { data: [] } }));
    const client = createExtensionsClient(transport(respond), publisher);

    expect(client.connectMarket).toBeUndefined();
    expect(client.syncMarket).toBeUndefined();
    expect(client.disconnectMarket).toBeUndefined();
    await client.getCatalog();
    expect(respond).toHaveBeenCalledTimes(1);
    expect(respond).toHaveBeenCalledWith("GET", "/catalog", { page: 1 });
  });

  it("preserves supported connection request bodies and disconnect status", async () => {
    const request = vi.fn(() => ({ status: 204, data: { data: undefined } }));
    const client = createExtensionsClient(transport(request), endpoints);
    const input = {
      marketUrl: "https://market.example.test",
      credential: "credential",
    };
    if (!client.connectMarket || !client.syncMarket || !client.disconnectMarket)
      throw new Error("Expected connection support");
    await client.connectMarket(input);
    await client.syncMarket("connection-id");
    await client.disconnectMarket("connection-id");
    expect(request.mock.calls).toEqual([
      ["POST", "/market-connections", undefined, input],
      ["POST", "/market-connections/connection-id/sync", undefined],
      ["DELETE", "/market-connections/connection-id", undefined],
    ]);
  });

  it("drains every installed page using page, preserving opaque UUID identifiers", async () => {
    const respond = vi.fn(
      (
        _method: string,
        _url: string,
        params?: Record<string, string | number>,
      ) => ({
        status: 200,
        data: {
          data: [
            { installId: params?.page === 1 ? "uuid-first" : "uuid-second" },
          ],
          limit: 1,
          offset: Number(params?.page) - 1,
          total: 2,
        },
      }),
    );
    const client = createExtensionsClient(transport(respond), endpoints);
    expect((await client.getInstalled()).map((row) => row.installId)).toEqual([
      "uuid-first",
      "uuid-second",
    ]);
    expect(respond.mock.calls.map((call) => call[2])).toEqual([
      { page: 1 },
      { page: 2 },
    ]);
  });
  it("carries bracketed category slugs and kinds through every catalog page", async () => {
    const respond = vi.fn(
      (
        _method: string,
        _url: string,
        _params?: Record<string, string | number>,
      ) => ({ status: 200, data: { data: [], offset: 0, total: 0 } }),
    );
    await createExtensionsClient(transport(respond), endpoints).getCatalog({
      category: "developer-tools",
      kind: "beam_extension",
    });
    expect(respond).toHaveBeenCalledWith("GET", "/catalog", {
      page: 1,
      "filter[category]": "developer-tools",
      "filter[kind]": "beam_extension",
    });
  });
  it("rejects a server that repeats its first page instead of silently duplicating rows", async () => {
    const client = createExtensionsClient(
      transport(() => ({
        status: 200,
        data: { data: [{ installId: "one" }], offset: 0, total: 2 },
      })),
      endpoints,
    );
    await expect(client.getInstalled()).rejects.toThrow(
      "pagination did not advance",
    );
  });
  it("preserves review outcomes instead of claiming installation or removal", async () => {
    const pending = {
      status: "awaiting_ops_review",
      requestId: "request-uuid",
      action: "install",
    };
    const client = createExtensionsClient(
      transport(() => ({ status: 202, data: { data: pending } })),
      endpoints,
    );
    expect(await client.install(2)).toEqual(pending);
    expect(await client.remove("install-uuid")).toEqual(pending);
  });
  it("uses the configured central connection URL independently of the catalog URL", async () => {
    const respond = vi.fn(() => ({
      status: 200,
      data: { data: { connected: false } },
    }));
    await createExtensionsClient(
      transport(respond),
      endpoints,
    ).getConnectionStatus();
    expect(respond).toHaveBeenCalledWith(
      "GET",
      endpoints.connection,
      undefined,
    );
  });
});
