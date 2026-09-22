import { KNOWN_CONTEXTS } from "@schemastud/frame";
import type { Row } from "@schemastud/frame";
import type { FrameManifest } from "./manifest";

/** In-memory HTTP boundary for the packaged console's tests and standalone stories. */
export function resourceFiltersFixture({
  capabilities = true,
  writable = true,
  empty = false,
  state = "ready",
  path = "files",
}: {
  capabilities?: boolean;
  writable?: boolean;
  empty?: boolean;
  state?: "ready" | "loading" | "error";
  path?: string;
} = {}) {
  const rows: Row[] = empty
    ? []
    : [
        { id: "file-a", title: "Landing page", state: "clean" },
        { id: "file-b", title: "Release notes", state: "modified" },
      ];
  const permissions = { create: writable, update: writable, delete: writable };
  const manifest: FrameManifest = {
    resources: [
      {
        key: "files",
        creatable: false,
        editable: false,
        deletable: false,
        showable: false,
        nav: { label: "Files", group: null, icon: null },
      },
    ],
    contexts: {
      files: {
        byNode: {
          "": { "list-item": { participates: true } },
          title: {
            "list-column": { participates: true, label: "Title", sort: 0 },
          },
          state: {
            "list-column": { participates: true, label: "State", sort: 1 },
          },
        },
        inherits: {},
        known: KNOWN_CONTEXTS,
      },
      "saved-filters": {
        byNode: {},
        inherits: {},
        known: KNOWN_CONTEXTS,
        can: permissions,
      },
    },
    nav: { items: [] },
    routeContext: [
      {
        routeName: "files.index",
        path,
        shell: null,
        lazy: false,
        guard: null,
        mounts: "list",
        resource: "files",
      },
    ],
  };
  const views: Row[] = [];
  const requests: {
    url: string;
    method: string;
    body?: Record<string, unknown>;
  }[] = [];
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.href
        : input.url,
      "https://console.example"
    );
    const method = init?.method ?? "GET";
    const body =
      typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    requests.push({ url: url.pathname + url.search, method, body });
    if (url.pathname === "/frame/manifest") {
      if (state === "loading") return new Promise<Response>(() => {});
      if (state === "error")
        return Response.json({ message: "Unavailable" }, { status: 503 });
      return Response.json(manifest);
    }
    if (url.pathname === "/frame/resources/files/filters/schema")
      return Response.json({
        data: {
          type: "object",
          properties: capabilities
            ? {
                state: {
                  type: "string",
                  title: "State",
                  "x-filter": {
                    name: "state",
                    operator: "exact",
                    control: "text",
                  },
                },
                title: { type: "string", "x-sort": { name: "title" } },
              }
            : {},
        },
        ...(capabilities
          ? { savedViewsResource: "saved-filters", savedViewsCan: permissions }
          : {}),
      });
    if (url.pathname === "/frame/resources/files/filters/variants")
      return Response.json({ data: { resource: "files", variants: [] } });
    if (url.pathname === "/frame/resources/files") {
      const filter = url.searchParams.get("filter[state]");
      const data = rows.filter((row) => !filter || row.state === filter);
      if (url.searchParams.get("sort") === "-title") data.reverse();
      return Response.json({ data, total: data.length, page: 1, perPage: 25 });
    }
    if (url.pathname === "/frame/resources/saved-filters") {
      if (method === "POST") {
        if (!writable)
          return Response.json({ message: "Forbidden" }, { status: 403 });
        const view: Row = {
          ...body,
          id: `view-${views.length + 1}`,
          visibility: "private",
          is_default: false,
          can: permissions,
        };
        views.push(view);
        return Response.json({ data: view }, { status: 201 });
      }
      return Response.json({
        data: views,
        total: views.length,
        page: 1,
        perPage: 25,
      });
    }
    if (
      url.pathname.startsWith("/frame/resources/saved-filters/records/") &&
      method === "DELETE"
    ) {
      if (!writable)
        return Response.json({ message: "Forbidden" }, { status: 403 });
      const index = views.findIndex((view) =>
        url.pathname.endsWith(`/${view.id}`)
      );
      if (index < 0)
        return Response.json({ message: "Not found" }, { status: 404 });
      views.splice(index, 1);
      return new Response(null, { status: 204 });
    }
    return Response.json(
      { message: "Unexpected fixture request" },
      { status: 404 }
    );
  };
  return { fetch, manifest, requests, views };
}
