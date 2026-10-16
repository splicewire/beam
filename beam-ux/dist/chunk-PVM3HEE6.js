// src/site/SiteNav.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function samePath(a, b) {
  if (a == null || b == null) return false;
  const trim = (value) => value.length > 1 ? value.replace(/\/+$/, "") : value;
  return trim(a) === trim(b);
}
function findNode(items, href) {
  for (const item of items) {
    if (samePath(item.href, href)) return item;
    const nested = item.children ? findNode(item.children, href) : null;
    if (nested) return nested;
  }
  return null;
}
function SiteNav({
  nav,
  linkComponent,
  itemClassName,
  itemStyle,
  rootPath,
  maxDepth = 1,
  listClassName,
  itemWrapperClassName
}) {
  const all = nav?.items ?? [];
  const items = rootPath ? findNode(all, rootPath)?.children ?? [] : all;
  const Link = linkComponent ?? (({ href, ...rest }) => /* @__PURE__ */ jsx("a", { href, ...rest }));
  const link = (item, keyed) => /* @__PURE__ */ jsx(
    Link,
    {
      href: item.href ?? "#",
      className: itemClassName,
      style: itemStyle,
      children: item.title
    },
    keyed ? item.href ?? item.title : void 0
  );
  if (maxDepth <= 1) {
    return /* @__PURE__ */ jsx(Fragment, { children: items.map((item) => link(item, true)) });
  }
  const renderLevel = (level, depth) => {
    if (level.length === 0 || depth <= 0) return null;
    return /* @__PURE__ */ jsx("ul", { className: listClassName, children: level.map((item) => /* @__PURE__ */ jsxs("li", { className: itemWrapperClassName, children: [
      link(item, false),
      item.children && renderLevel(item.children, depth - 1)
    ] }, item.href ?? item.title)) });
  };
  return /* @__PURE__ */ jsx(Fragment, { children: renderLevel(items, maxDepth) });
}

// src/site/ManifestTable.tsx
import { useQuery } from "@tanstack/react-query";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function readPayload(payload) {
  const raw = Array.isArray(payload) ? payload : payload?.items;
  if (!Array.isArray(raw)) {
    throw new Error("beam-ux ManifestTable: endpoint did not return `{ items: [] }` or an array.");
  }
  return raw;
}
var fetchManifest = async (url) => {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (response.status === 404) return { status: "absent" };
  if (!response.ok) {
    throw new Error(`beam-ux ManifestTable: ${url} responded ${response.status}.`);
  }
  return { status: "ok", items: readPayload(await response.json()) };
};
function ManifestTableView({
  items,
  availability,
  notInstalled,
  empty,
  absent = false,
  classNames,
  style
}) {
  if (absent) {
    return /* @__PURE__ */ jsx2("div", { className: classNames?.message, style, "data-beam-ux-manifest": "not-installed", children: notInstalled ?? "This surface is not installed on this site." });
  }
  if (items.length === 0) {
    return /* @__PURE__ */ jsx2("div", { className: classNames?.message, style, "data-beam-ux-manifest": "empty", children: empty ?? "Nothing is advertised here yet." });
  }
  return /* @__PURE__ */ jsx2("table", { className: classNames?.root, style, "data-beam-ux-manifest": "ok", children: /* @__PURE__ */ jsx2("tbody", { children: items.map((item) => {
    const mark = availability?.[item.name];
    return /* @__PURE__ */ jsxs2("tr", { className: classNames?.row, children: [
      /* @__PURE__ */ jsxs2("td", { children: [
        /* @__PURE__ */ jsx2("code", { className: classNames?.name, children: item.name }),
        mark && " ",
        mark && /* @__PURE__ */ jsx2(
          "span",
          {
            className: classNames?.mark,
            "data-available": mark.available,
            title: mark.available ? "Available to you" : "Not available to you",
            children: mark.label ?? (mark.available ? "available" : "unavailable")
          }
        )
      ] }),
      /* @__PURE__ */ jsxs2("td", { children: [
        item.title && /* @__PURE__ */ jsx2("span", { className: classNames?.title, children: item.title }),
        item.description && /* @__PURE__ */ jsx2("p", { className: classNames?.description, children: item.description })
      ] })
    ] }, item.name);
  }) }) });
}
function ManifestTable({
  endpoint,
  fetcher = fetchManifest,
  loading,
  error,
  ...view
}) {
  const query = useQuery({
    queryKey: ["beam-ux", "site", "manifest", endpoint],
    queryFn: () => fetcher(endpoint)
  });
  if (query.isPending) {
    return /* @__PURE__ */ jsx2("div", { className: view.classNames?.message, "data-beam-ux-manifest": "loading", children: loading ?? "Loading\u2026" });
  }
  if (query.isError) {
    return /* @__PURE__ */ jsx2("div", { className: view.classNames?.message, "data-beam-ux-manifest": "error", children: typeof error === "function" ? error(query.error) : error ?? "Could not load this list." });
  }
  const result = query.data;
  return /* @__PURE__ */ jsx2(
    ManifestTableView,
    {
      ...view,
      absent: result.status === "absent",
      items: result.status === "ok" ? result.items : []
    }
  );
}

export {
  SiteNav,
  fetchManifest,
  ManifestTableView,
  ManifestTable
};
//# sourceMappingURL=chunk-PVM3HEE6.js.map