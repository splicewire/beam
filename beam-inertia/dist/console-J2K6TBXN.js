import {
  TenantFrameProvider
} from "./chunk-4RAMXKLT.js";
import "./chunk-O7ZKQDZR.js";
import "./chunk-BBYPLYMO.js";
import {
  DefaultFrameRealm,
  FrameRealmProvider,
  formFromManifest,
  frameIcon,
  labelFromManifest,
  manifestLookup,
  realmHref,
  realmRelative,
  useFrameManifest,
  useFrameRealm
} from "./chunk-WB76RVEA.js";
import "./chunk-QMLU62K5.js";
import "./chunk-FADCRF7N.js";
import "./chunk-563T736C.js";
import {
  getBeamInertiaConfig
} from "./chunk-MTKP2AW3.js";
import "./chunk-UZPKVCAK.js";
import "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";

// src/pages/frame/console.tsx
import { Head } from "@inertiajs/react";
import { BrowserRouter } from "react-router";

// src/frame/router.tsx
import { Link, router } from "@inertiajs/react";
import {
  buildRealmRoutes,
  createGuardRegistry,
  createMountDispatcher,
  createRouteRegistry,
  ListShell,
  EditShell
} from "@schemastud/frame";
import { useMemo } from "react";
import { useParams, useRoutes } from "react-router";
import { jsx, jsxs } from "react/jsx-runtime";
var isDev = () => Boolean(getBeamInertiaConfig().development);
function SectionIndex({ node }) {
  return /* @__PURE__ */ jsxs("div", { className: "px-6 py-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "mb-1 text-2xl font-semibold", children: node.title }),
    /* @__PURE__ */ jsxs("p", { className: "mb-6 text-sm text-muted-foreground", children: [
      node.children.length,
      " ",
      node.children.length === 1 ? "surface" : "surfaces",
      " in this section."
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: node.children.map((child) => {
      const Icon = frameIcon(child.icon);
      return child.href ? /* @__PURE__ */ jsxs(
        Link,
        {
          href: child.href,
          className: "flex items-center gap-3 rounded-lg border p-4 text-sm transition-colors hover:bg-accent",
          children: [
            /* @__PURE__ */ jsx(Icon, { className: "size-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: child.title })
          ]
        },
        child.href
      ) : null;
    }) })
  ] });
}
function NotFound() {
  return /* @__PURE__ */ jsxs("div", { className: "px-6 py-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "mb-1 text-2xl font-semibold", children: "No surface here" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "This path is served by the tenant frame console, but the manifest declares no route for it." })
  ] });
}
function Undispatchable({
  entry,
  reason
}) {
  return /* @__PURE__ */ jsxs("div", { className: "px-6 py-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "mb-1 text-2xl font-semibold", children: entry.routeName }),
    /* @__PURE__ */ jsxs("p", { className: "max-w-prose text-sm text-muted-foreground", children: [
      "The manifest declares this route (",
      /* @__PURE__ */ jsxs("code", { children: [
        "mounts: ",
        String(entry.mounts)
      ] }),
      ") and the generic mount dispatcher cannot render it: ",
      reason
    ] })
  ] });
}
function Titled({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "px-6 py-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "mb-6 text-2xl font-semibold", children: title }),
    children
  ] });
}
function recordHref(recordBase, id) {
  return `${recordBase}/${String(id)}`;
}
function idFromParam(param) {
  return param ?? null;
}
function FrameRoutes({ manifest }) {
  const { basename } = useFrameRealm();
  const routes = useMemo(() => {
    const declined = /* @__PURE__ */ new Map();
    const manifestFor = manifestLookup(manifest);
    const dispatch = createMountDispatcher({
      // A hook, called during the dispatched component's render — exactly how the dispatcher
      // documents this seam, and the only reason it can stay react-router-free.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      resolveId: () => idFromParam(useParams().id),
      manifestFor,
      formFor: (resource) => formFromManifest(manifest, resource),
      onDecline: (entry, reason) => {
        declined.set(entry.routeName, reason);
        if (isDev()) {
          console.warn(
            `[frame] declined "${entry.routeName}" (${entry.path}): ${reason}`
          );
        }
      }
    });
    const routeRegistry = createRouteRegistry();
    for (const entry of manifest.routeContext) {
      if (entry.mounts !== "list" || !entry.resource) {
        continue;
      }
      const resource = entry.resource;
      const twin = manifest.routeContext.find(
        (candidate) => candidate.resource === resource && candidate.shell === entry.shell && candidate.path.endsWith("/:id")
      );
      const stem = entry.routeName.endsWith(".index") ? entry.routeName.slice(0, -".index".length) : resource;
      const create = manifest.routeContext.find(
        (candidate) => candidate.resource === resource && candidate.shell === entry.shell && candidate.routeName === `${stem}.create`
      );
      const recordBase = twin ? realmHref(basename, twin.path.replace(/\/:id$/, "")) : null;
      const createHref = create ? realmHref(basename, create.path) : null;
      routeRegistry.registerRoute(entry.routeName, () => /* @__PURE__ */ jsx(
        ListShell,
        {
          resource,
          columns: [],
          manifest: manifestFor(resource),
          onOpen: recordBase || createHref ? (record) => {
            const href = record.id === null ? createHref : recordBase ? recordHref(recordBase, record.id) : null;
            if (href) router.visit(href);
          } : void 0
        }
      ));
      if (create?.mounts === "edit") {
        routeRegistry.registerRoute(create.routeName, () => /* @__PURE__ */ jsx(
          EditShell,
          {
            resource,
            id: null,
            container: "page",
            form: formFromManifest(manifest, resource),
            schemaPurpose: "write",
            onSaved: () => router.visit(realmHref(basename, entry.path))
          }
        ));
      }
      const definition = manifest.resources.find((candidate) => candidate.key === resource);
      if (twin?.mounts === "detail" && definition?.editable === false && definition.showable !== false) {
        routeRegistry.registerRoute(twin.routeName, function ReadDetail() {
          const id = idFromParam(useParams().id);
          return /* @__PURE__ */ jsx(
            EditShell,
            {
              resource,
              id,
              readOnly: true,
              schemaPurpose: "read",
              container: "page",
              form: formFromManifest(manifest, resource)
            }
          );
        });
      }
    }
    const generated = buildRealmRoutes(manifest.routeContext, {
      routes: routeRegistry,
      guards: createGuardRegistry(),
      fallback: (entry) => {
        const Component = dispatch(entry);
        if (!Component) {
          const reason = declined.get(entry.routeName) ?? "no reason reported";
          return () => /* @__PURE__ */ jsx(Undispatchable, { entry, reason });
        }
        return Component;
      },
      onUnbound: (entry) => {
        if (isDev()) {
          console.warn(
            `[frame] no component for "${entry.routeName}" (${entry.path})`
          );
        }
      }
    });
    const byPath = new Map(
      manifest.routeContext.map((entry) => [entry.path, entry])
    );
    const titled = generated.map((leaf) => {
      const entry = byPath.get(leaf.path);
      const title = entry?.resource ? labelFromManifest(manifest, entry.resource) : entry?.routeName ?? leaf.path;
      return {
        ...leaf,
        element: /* @__PURE__ */ jsx(Titled, { title, children: leaf.element })
      };
    });
    const bound = new Set(manifest.routeContext.map((entry) => entry.routeName));
    const sections = manifest.nav.items.filter(
      (item) => typeof item.href === "string" && !(item.routeName !== null && bound.has(item.routeName))
    ).map((item) => ({
      // REALM-RELATIVE, because this one is matched BY React Router under the basename.
      // `nav[].href` is realm-PREFIXED (`RouteContextProjector::hrefs()` joins `routeBase`
      // + shell + path) while `routeContext[].path` beside it is realm-relative; stripping
      // only the leading slash produced `operator/…` paths a `/operator` basename could
      // never match. The two shapes coincide in the tenant realm, which is why the
      // difference was invisible while tenant was the only servable realm.
      path: realmRelative(basename, item.href),
      element: /* @__PURE__ */ jsx(SectionIndex, { node: item })
    }));
    return [...sections, ...titled, { path: "*", element: /* @__PURE__ */ jsx(NotFound, {}) }];
  }, [manifest, basename]);
  return useRoutes(routes);
}

// src/pages/frame/console.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function FrameConsole(props) {
  const realm = props.realm ?? DefaultFrameRealm.realm;
  const basename = props.basename ?? DefaultFrameRealm.basename;
  const manifestUrl = props.manifestUrl ?? DefaultFrameRealm.manifestUrl;
  return /* @__PURE__ */ jsx2(FrameRealmProvider, { realm, basename, manifestUrl, children: /* @__PURE__ */ jsx2(TenantFrameProvider, { children: /* @__PURE__ */ jsx2(BrowserRouter, { basename, children: /* @__PURE__ */ jsx2(ConsoleBody, {}) }) }) });
}
function ConsoleBody() {
  const { manifestUrl } = useFrameRealm();
  const { data: manifest, isLoading, error } = useFrameManifest();
  if (isLoading) {
    return /* @__PURE__ */ jsxs2("div", { className: "px-6 py-8 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx2(Head, { title: "Console" }),
      "Loading the console\u2026"
    ] });
  }
  if (error || !manifest) {
    return /* @__PURE__ */ jsxs2("div", { className: "px-6 py-8", children: [
      /* @__PURE__ */ jsx2(Head, { title: "Console" }),
      /* @__PURE__ */ jsx2("h1", { className: "mb-1 text-2xl font-semibold", children: "The frame manifest did not load" }),
      /* @__PURE__ */ jsx2("p", { className: "max-w-prose text-sm text-muted-foreground", children: error instanceof Error ? error.message : `GET ${manifestUrl} failed.` })
    ] });
  }
  return /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2(Head, { title: "Console" }),
    /* @__PURE__ */ jsx2(FrameRoutes, { manifest })
  ] });
}
export {
  FrameConsole as default
};
//# sourceMappingURL=console-J2K6TBXN.js.map