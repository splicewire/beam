import {
  useBeamUxMessages
} from "./chunk-B33ESE55.js";

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
  const link2 = (item, keyed) => /* @__PURE__ */ jsx(
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
    return /* @__PURE__ */ jsx(Fragment, { children: items.map((item) => link2(item, true)) });
  }
  const renderLevel = (level, depth) => {
    if (level.length === 0 || depth <= 0) return null;
    return /* @__PURE__ */ jsx("ul", { className: listClassName, children: level.map((item) => /* @__PURE__ */ jsxs("li", { className: itemWrapperClassName, children: [
      link2(item, false),
      item.children && renderLevel(item.children, depth - 1)
    ] }, item.href ?? item.title)) });
  };
  return /* @__PURE__ */ jsx(Fragment, { children: renderLevel(items, maxDepth) });
}

// src/site/PreviewBar.tsx
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var bar = { background: "#171717", color: "white", fontSize: 14, padding: "10px 16px" };
var row = { alignItems: "center", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" };
var link = { color: "white" };
var panel = { margin: "8px auto 0", maxWidth: 960 };
var list = { margin: "4px 0 8px", paddingLeft: 20 };
function PreviewBar({ preview }) {
  const m = useBeamUxMessages();
  const live = preview.mode === "live";
  const open = (path) => live && preview.previewUrl ? `${preview.previewUrl}&path=${encodeURIComponent(path)}` : path;
  return /* @__PURE__ */ jsxs2("aside", { "aria-label": m.t("splicewire-beam-ux::messages.site_preview_mode"), "data-beam-preview-bar": true, style: bar, children: [
    /* @__PURE__ */ jsxs2("div", { style: row, children: [
      /* @__PURE__ */ jsx2("span", { children: live ? m.t("splicewire-beam-ux::messages.site_preview_live_outside", { label: preview.label }) : m.t("splicewire-beam-ux::messages.site_previewing", { label: preview.label }) }),
      preview.switchUrl ? /* @__PURE__ */ jsx2("a", { href: preview.switchUrl, style: link, children: live ? m.t("splicewire-beam-ux::messages.site_preview_back") : m.t("splicewire-beam-ux::messages.site_preview_live_site") }) : preview.switchUrl === null ? /* @__PURE__ */ jsx2("span", { children: m.t("splicewire-beam-ux::messages.site_preview_new_in_release") }) : null,
      live ? null : /* @__PURE__ */ jsx2("span", { children: m.t("splicewire-beam-ux::messages.site_preview_forms_do_not_submit") }),
      preview.viewAsMeUrl ? /* @__PURE__ */ jsx2("a", { href: preview.viewAsMeUrl, style: link, children: m.t("splicewire-beam-ux::messages.site_preview_view_as_me") }) : null,
      /* @__PURE__ */ jsx2("a", { href: preview.exitUrl, style: link, children: m.t("splicewire-beam-ux::messages.site_preview_exit") })
    ] }),
    preview.changes ? /* @__PURE__ */ jsx2(ChangedPages, { preview, open }) : null,
    preview.redirects && preview.redirects.length > 0 ? /* @__PURE__ */ jsx2(Redirects, { redirects: preview.redirects }) : null,
    preview.readiness ? /* @__PURE__ */ jsx2(Readiness, { preview, open }) : null
  ] });
}
function ChangedPages({ preview, open }) {
  const m = useBeamUxMessages();
  const changes = preview.changes;
  const total = changes.pages.length + changes.reach.reduce((sum, reach) => sum + (reach.everyPage ? 0 : reach.count), 0);
  const page = (p) => /* @__PURE__ */ jsx2(PageLink, { page: p, open, choices: preview.recordChoices?.[p.entryId] }, p.entryId);
  return /* @__PURE__ */ jsxs2("details", { style: panel, children: [
    /* @__PURE__ */ jsx2("summary", { children: m.t("splicewire-beam-ux::messages.site_changed_pages_count", { count: total }) }),
    /* @__PURE__ */ jsxs2("section", { "aria-label": m.t("splicewire-beam-ux::messages.site_changed_pages"), children: [
      changes.pages.length > 0 ? /* @__PURE__ */ jsx2("ul", { style: list, children: changes.pages.map(page) }) : null,
      changes.reach.map((reach) => /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx2("span", { children: m.t("splicewire-beam-ux::messages.site_changed_reach", { name: reach.name, reach: reach.everyPage ? m.t("splicewire-beam-ux::messages.site_changed_every_page") : m.choice("splicewire-beam-ux::messages.site_changed_page_count", reach.count) }) }),
        reach.pages.length > 0 ? /* @__PURE__ */ jsx2("ul", { style: list, children: reach.pages.map(page) }) : null
      ] }, reach.entryId))
    ] })
  ] });
}
function Redirects({ redirects }) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs2("details", { style: panel, children: [
    /* @__PURE__ */ jsx2("summary", { children: m.t("splicewire-beam-ux::messages.site_redirects_count", { count: redirects.length }) }),
    /* @__PURE__ */ jsx2("section", { "aria-label": m.t("splicewire-beam-ux::messages.site_redirects"), children: /* @__PURE__ */ jsx2("ul", { style: list, children: redirects.map((redirect) => /* @__PURE__ */ jsx2("li", { children: m.t(redirect.match === "prefix" ? "splicewire-beam-ux::messages.site_redirect_prefix" : "splicewire-beam-ux::messages.site_redirect_exact", {
      from: redirect.from,
      to: redirect.to ?? m.t("splicewire-beam-ux::messages.site_redirect_not_found"),
      reason: redirect.reason === "moved" ? m.t("splicewire-beam-ux::messages.site_redirect_moved") : m.t("splicewire-beam-ux::messages.site_redirect_taken_down")
    }) }, `${redirect.from} ${redirect.match ?? "exact"}`)) }) })
  ] });
}
function PageLink({ page, open, choices }) {
  const m = useBeamUxMessages();
  const title = page.title ?? page.path ?? page.entryId;
  if (page.path === null) {
    return /* @__PURE__ */ jsx2("li", { children: title });
  }
  if (page.recordPage) {
    return /* @__PURE__ */ jsx2("li", { children: choices && choices.length > 0 ? choices.map((choice, index) => /* @__PURE__ */ jsxs2("span", { children: [
      index > 0 ? ", " : null,
      /* @__PURE__ */ jsx2("a", { href: open(choice.path), style: link, children: `${title}: ${choice.label}` })
    ] }, choice.path)) : m.t("splicewire-beam-ux::messages.site_page_no_readable_record", { title }) });
  }
  return /* @__PURE__ */ jsx2("li", { children: /* @__PURE__ */ jsx2("a", { href: open(page.path), style: link, children: title }) });
}
function Readiness({ preview, open }) {
  const m = useBeamUxMessages();
  const readiness = preview.readiness;
  const count = readiness.blockers.length;
  const paths = new Map((preview.changes?.pages ?? []).filter((p) => p.path && !p.recordPage).map((p) => [p.entryId, p.path]));
  return /* @__PURE__ */ jsxs2("section", { "aria-label": m.t("splicewire-beam-ux::messages.site_publish"), style: panel, children: [
    /* @__PURE__ */ jsx2("strong", { children: readiness.ready ? m.t("splicewire-beam-ux::messages.site_publish_nothing_stops") : m.choice("splicewire-beam-ux::messages.site_publish_things_stop", count) }),
    count > 0 ? /* @__PURE__ */ jsx2("ul", { style: list, children: readiness.blockers.map((item, index) => /* @__PURE__ */ jsxs2("li", { children: [
      item.message,
      item.fixes.length > 0 ? /* @__PURE__ */ jsxs2("span", { children: [
        " ",
        m.t("splicewire-beam-ux::messages.site_publish_fix", { fixes: item.fixes.join(m.t("splicewire-beam-ux::messages.site_publish_fix_joiner")) })
      ] }) : null,
      item.fixes.includes("open") && item.entryId && paths.has(item.entryId) ? /* @__PURE__ */ jsxs2(Fragment2, { children: [
        " ",
        /* @__PURE__ */ jsx2("a", { href: open(paths.get(item.entryId)), style: link, children: m.t("splicewire-beam-ux::messages.site_publish_open_page") })
      ] }) : null,
      item.fixes.some((fix) => fix !== "open") ? preview.releaseHref ? /* @__PURE__ */ jsxs2(Fragment2, { children: [
        " ",
        /* @__PURE__ */ jsx2("a", { href: preview.releaseHref, style: link, children: m.t("splicewire-beam-ux::messages.site_publish_fix_in_release") })
      ] }) : item.entryId && paths.has(item.entryId) ? (
        // No Release page on this host (a starter): the member's page, where the editor's
        // Release panel offers rebase and drop (orch-lead ruling A, EP-18).
        /* @__PURE__ */ jsxs2(Fragment2, { children: [
          " ",
          /* @__PURE__ */ jsx2("a", { href: open(paths.get(item.entryId)), style: link, children: m.t("splicewire-beam-ux::messages.site_publish_fix_on_page") })
        ] })
      ) : null : null
    ] }, `${item.code}-${item.entryId ?? ""}-${index}`)) }) : null,
    readiness.notes.length > 0 ? /* @__PURE__ */ jsx2("ul", { style: list, children: readiness.notes.map((item, index) => /* @__PURE__ */ jsxs2("li", { children: [
      item.message,
      item.releaseDueAt ? ` ${m.t("splicewire-beam-ux::messages.site_publish_due", { when: new Date(item.releaseDueAt).toLocaleString() })}` : null
    ] }, `${item.code}-${item.entryId ?? ""}-${index}`)) }) : null
  ] });
}
function PreviewBoundary({ preview, children }) {
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      "data-beam-preview-root": true,
      onSubmitCapture: preview.mode === "live" ? void 0 : (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      children: [
        /* @__PURE__ */ jsx2(PreviewBar, { preview }),
        children
      ]
    }
  );
}

// src/site/ManifestTable.tsx
import { useQuery } from "@tanstack/react-query";
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
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
  const m = useBeamUxMessages();
  if (absent) {
    return /* @__PURE__ */ jsx3("div", { className: classNames?.message, style, "data-beam-ux-manifest": "not-installed", children: notInstalled ?? m.t("splicewire-beam-ux::messages.site_manifest_not_installed") });
  }
  if (items.length === 0) {
    return /* @__PURE__ */ jsx3("div", { className: classNames?.message, style, "data-beam-ux-manifest": "empty", children: empty ?? m.t("splicewire-beam-ux::messages.site_manifest_empty") });
  }
  return /* @__PURE__ */ jsx3("table", { className: classNames?.root, style, "data-beam-ux-manifest": "ok", children: /* @__PURE__ */ jsx3("tbody", { children: items.map((item) => {
    const mark = availability?.[item.name];
    return /* @__PURE__ */ jsxs3("tr", { className: classNames?.row, children: [
      /* @__PURE__ */ jsxs3("td", { children: [
        /* @__PURE__ */ jsx3("code", { className: classNames?.name, children: item.name }),
        mark && " ",
        mark && /* @__PURE__ */ jsx3(
          "span",
          {
            className: classNames?.mark,
            "data-available": mark.available,
            title: mark.available ? m.t("splicewire-beam-ux::messages.site_manifest_available_to_you") : m.t("splicewire-beam-ux::messages.site_manifest_not_available_to_you"),
            children: mark.label ?? (mark.available ? m.t("splicewire-beam-ux::messages.site_manifest_available") : m.t("splicewire-beam-ux::messages.site_manifest_unavailable"))
          }
        )
      ] }),
      /* @__PURE__ */ jsxs3("td", { children: [
        item.title && /* @__PURE__ */ jsx3("span", { className: classNames?.title, children: item.title }),
        item.description && /* @__PURE__ */ jsx3("p", { className: classNames?.description, children: item.description })
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
  const m = useBeamUxMessages();
  const query = useQuery({
    queryKey: ["beam-ux", "site", "manifest", endpoint],
    queryFn: () => fetcher(endpoint)
  });
  if (query.isPending) {
    return /* @__PURE__ */ jsx3("div", { className: view.classNames?.message, "data-beam-ux-manifest": "loading", children: loading ?? m.t("splicewire-beam-ux::messages.site_manifest_loading") });
  }
  if (query.isError) {
    return /* @__PURE__ */ jsx3("div", { className: view.classNames?.message, "data-beam-ux-manifest": "error", children: typeof error === "function" ? error(query.error) : error ?? m.t("splicewire-beam-ux::messages.site_manifest_load_failed") });
  }
  const result = query.data;
  return /* @__PURE__ */ jsx3(
    ManifestTableView,
    {
      ...view,
      absent: result.status === "absent",
      items: result.status === "ok" ? result.items : []
    }
  );
}

// src/site/events.ts
import { useEffect } from "react";
function reportEvent(name, parameters = {}) {
  if (!name || typeof window === "undefined") return;
  const target = window;
  const data = Object.fromEntries(Object.entries(parameters).filter(([, value]) => value !== void 0 && value !== null));
  if (typeof target.gtag === "function") {
    target.gtag("event", name, data);
  } else if (Array.isArray(target.dataLayer)) {
    target.dataLayer.push({ event: name, ...data });
  }
}
function installClickEventListener(root = document) {
  const handleClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const block = target.closest("[data-bd-event]");
    if (!block) return;
    const value = parseClickEvent(block.dataset.bdEvent);
    if (value) reportEvent(value.name, value.label === void 0 ? {} : { event_label: value.label });
  };
  root.addEventListener("click", handleClick);
  return () => root.removeEventListener("click", handleClick);
}
function SiteClickEventListener({ enabled = true }) {
  useEffect(() => enabled ? installClickEventListener() : void 0, [enabled]);
  return null;
}
function parseClickEvent(raw) {
  if (!raw) return void 0;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
    const record = value;
    if (typeof record.name !== "string" || !record.name || Object.keys(record).some((key) => key !== "name" && key !== "label")) return void 0;
    if (record.label !== void 0 && typeof record.label !== "string") return void 0;
    return { name: record.name, ...record.label !== void 0 ? { label: record.label } : {} };
  } catch {
    return void 0;
  }
}

export {
  SiteNav,
  PreviewBar,
  PreviewBoundary,
  fetchManifest,
  ManifestTableView,
  ManifestTable,
  reportEvent,
  installClickEventListener,
  SiteClickEventListener
};
//# sourceMappingURL=chunk-2YRKADTE.js.map