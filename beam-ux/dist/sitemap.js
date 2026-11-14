// src/sitemap/SiteMap.tsx
import { useEffect as useEffect4, useMemo, useState as useState5 } from "react";
import { cn as cn6 } from "@schemastud/ui";

// src/sitemap/chrome.tsx
import * as React from "react";
import { Columns3, ListTree, Network, Search } from "lucide-react";
import { cn } from "@schemastud/ui";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var VIEWS = [
  { key: "outline", label: "Outline", Icon: ListTree },
  { key: "canvas", label: "Canvas", Icon: Network },
  { key: "columns", label: "Columns", Icon: Columns3 }
];
function useRadioKeys(keys, value, onChange) {
  return (e) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = keys[(keys.indexOf(value) + step + keys.length) % keys.length];
    onChange(next);
    e.currentTarget.querySelector(`[data-key="${next}"]`)?.focus();
  };
}
function ViewToggle({ view, onView }) {
  const onKey = useRadioKeys(VIEWS.map((v) => v.key), view, onView);
  return /* @__PURE__ */ jsx("div", { role: "radiogroup", "aria-label": "View", onKeyDown: onKey, className: "inline-flex shrink-0 rounded-md border border-border p-0.5", children: VIEWS.map(({ key, label, Icon }) => /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      role: "radio",
      "data-key": key,
      "aria-checked": view === key,
      tabIndex: view === key ? 0 : -1,
      onClick: () => onView(key),
      className: cn(
        "inline-flex h-11 items-center gap-1.5 rounded px-2.5 md:h-8 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        view === key ? "bg-foreground text-background" : "text-foreground/75 hover:bg-muted hover:text-foreground"
      ),
      children: [
        /* @__PURE__ */ jsx(Icon, { "aria-hidden": true, className: "size-3.5" }),
        label
      ]
    },
    key
  )) });
}
function SiteMapHeader({ siteName, summary, filter, onFilter, query, onQuery, view, onView, actions }) {
  const filters = [
    { key: "all", label: "All pages", count: summary.pages },
    { key: "attention", label: "Needs attention", count: summary.attentionPages },
    { key: "drafts", label: "Drafts", count: summary.drafts },
    { key: "hidden", label: "Not in sitemap", count: summary.pages - summary.inSearch }
  ];
  const onFilterKey = useRadioKeys(filters.map((f) => f.key), filter, onFilter);
  return /* @__PURE__ */ jsxs("header", { className: "border-b border-border bg-background px-4 pb-3 pt-4 md:px-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-x-6 gap-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold tracking-[-0.02em]", children: "Site map" }),
        /* @__PURE__ */ jsxs("p", { className: "text-[13px] text-foreground/70", children: [
          siteName && /* @__PURE__ */ jsxs(Fragment, { children: [
            siteName,
            " \xB7 "
          ] }),
          summary.pages,
          " pages \xB7 ",
          summary.inSearch,
          " in the sitemap \xB7 ",
          summary.redirects,
          " redirects"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        actions,
        /* @__PURE__ */ jsx(ViewToggle, { view, onView })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between", children: [
      /* @__PURE__ */ jsx("div", { role: "radiogroup", "aria-label": "Show", onKeyDown: onFilterKey, className: "-mx-1 flex gap-1 overflow-x-auto px-1", children: filters.map((f) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          role: "radio",
          "data-key": f.key,
          "aria-checked": filter === f.key,
          tabIndex: filter === f.key ? 0 : -1,
          onClick: () => onFilter(f.key),
          className: cn(
            "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-8",
            filter === f.key ? "bg-foreground text-background" : "text-foreground/75 hover:bg-muted hover:text-foreground"
          ),
          children: [
            f.label,
            /* @__PURE__ */ jsx("span", { className: cn("text-xs tabular-nums", filter === f.key ? "text-background/80" : f.key === "attention" && f.count > 0 ? "text-destructive" : "text-foreground/70"), children: f.count })
          ]
        },
        f.key
      )) }),
      /* @__PURE__ */ jsxs("label", { className: "relative block md:w-64", children: [
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Find a page or address" }),
        /* @__PURE__ */ jsx(Search, { "aria-hidden": true, className: "pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-foreground/60" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "search",
            value: query,
            onChange: (e) => onQuery(e.target.value),
            placeholder: "Find a page or address",
            className: "h-11 w-full rounded-md border border-input bg-transparent pl-8 pr-2 text-[13px] placeholder:text-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-8"
          }
        )
      ] })
    ] })
  ] });
}
function useSheetLayout() {
  const query = "(max-width: 1023px)";
  const supported = typeof window !== "undefined" && typeof window.matchMedia === "function";
  const [sheet, setSheet] = React.useState(() => supported && window.matchMedia(query).matches);
  React.useEffect(() => {
    if (!supported) return;
    const mq = window.matchMedia(query);
    const on = () => setSheet(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [supported]);
  return sheet;
}
var SITE_MAP_VIEW_KEY = "beam-ux:site-map:view";
function browserViewStore(key = SITE_MAP_VIEW_KEY) {
  const valid = (v) => v === "outline" || v === "canvas" || v === "columns";
  return {
    get: () => {
      try {
        const v = window.localStorage.getItem(key);
        return valid(v) ? v : null;
      } catch {
        return null;
      }
    },
    set: (view) => {
      try {
        window.localStorage.setItem(key, view);
      } catch {
      }
    }
  };
}

// src/sitemap/model.ts
function publicationState(page) {
  if (page.publishedReadable === null) return "unpublished";
  return page.draftPending ? "draft" : "live";
}
var pageTitle = (page) => page.title || page.slug;
var byOrder = (a, b) => (a.navOrder ?? Number.MAX_SAFE_INTEGER) - (b.navOrder ?? Number.MAX_SAFE_INTEGER) || (a.url ?? "").localeCompare(b.url ?? "") || pageTitle(a).localeCompare(pageTitle(b));
function buildTree(pages) {
  const ids = new Set(pages.map((p) => p.id));
  const kids = /* @__PURE__ */ new Map();
  for (const p of pages) {
    const parent = p.parentId !== null && ids.has(p.parentId) ? p.parentId : null;
    kids.set(parent, [...kids.get(parent) ?? [], p]);
  }
  const build = (parent, depth, seen) => [...kids.get(parent) ?? []].sort(byOrder).filter((p) => !seen.has(p.id)).map((p) => ({ page: p, depth, children: build(p.id, depth + 1, /* @__PURE__ */ new Set([...seen, p.id])) }));
  return build(null, 0, /* @__PURE__ */ new Set());
}
function flatten(nodes, open = () => true) {
  return nodes.flatMap((n) => [n, ...open(n.page.id) ? flatten(n.children, open) : []]);
}
function countDescendants(n) {
  return n.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}
function findNode(nodes, id) {
  for (const n of nodes) {
    if (n.page.id === id) return n;
    const hit = findNode(n.children, id);
    if (hit) return hit;
  }
  return void 0;
}
function ancestry(pages, id) {
  const out = [];
  let cur = pages.get(id);
  while (cur && !out.includes(cur.id)) {
    out.unshift(cur.id);
    cur = cur.parentId ? pages.get(cur.parentId) : void 0;
  }
  return out;
}
var isSevere = (kind) => kind !== "file-changed";
function issuesFor(page) {
  const out = [];
  if (page.file?.state === "not-written") out.push({ kind: "file-missing", pageId: page.id });
  if (page.file?.state === "modified") out.push({ kind: "file-changed", pageId: page.id });
  const broken = page.redirects.inbound.filter((r) => r.attention);
  if (broken.length) out.push({ kind: "redirect-broken", pageId: page.id, count: broken.length, end: page.redirects.attention ?? broken[0].end });
  return out;
}
function looseTraces(traces, pageIds) {
  return traces.filter((t) => t.end !== "shadowed" && (t.pageId === null || pageIds !== void 0 && !pageIds.has(t.pageId)));
}
function looseRows(traces, pageIds) {
  const seen = /* @__PURE__ */ new Set();
  return looseTraces(traces, pageIds).filter((t) => {
    const key = t.end === "loop" ? [...t.steps].sort().join(" ") : t.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function looseIssues(traces, pageIds) {
  const seen = /* @__PURE__ */ new Set();
  return looseTraces(traces, pageIds).filter((t) => t.attention).flatMap((t) => {
    const key = t.end === "loop" ? [...t.steps].sort().join(" ") : t.id;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ kind: t.end === "loop" ? "redirect-loop" : "redirect-broken", redirectId: t.id, end: t.end }];
  });
}
function allIssues(pages, traces) {
  return [...pages.flatMap(issuesFor), ...looseIssues(traces, new Set(pages.map((p) => p.id)))];
}
function matches(page, filter, query) {
  const q = query.trim().toLowerCase();
  if (q && !pageTitle(page).toLowerCase().includes(q) && !(page.url ?? "").toLowerCase().includes(q) && !page.redirects.inbound.some((r) => r.path.toLowerCase().includes(q))) return false;
  if (filter === "attention") return issuesFor(page).length > 0;
  if (filter === "drafts") return page.draftPending;
  if (filter === "hidden") return !page.search.listed;
  return true;
}
function visibleIds(pages, filter, query) {
  const byId = new Map(pages.map((p) => [p.id, p]));
  const keep = /* @__PURE__ */ new Set();
  const matched = /* @__PURE__ */ new Set();
  for (const p of pages) {
    if (!matches(p, filter, query)) continue;
    matched.add(p.id);
    let cur = p;
    while (cur && !keep.has(cur.id)) {
      keep.add(cur.id);
      cur = cur.parentId ? byId.get(cur.parentId) : void 0;
    }
  }
  return { keep, matched };
}
function summarize(pages, traces) {
  const issues = allIssues(pages, traces);
  return {
    pages: pages.length,
    inSearch: pages.filter((p) => p.search.listed).length,
    drafts: pages.filter((p) => p.draftPending).length,
    redirects: traces.length,
    issues,
    // What "Needs attention" shows: the pages with an issue and the redirects that reach no page and fail a guest.
    attentionPages: new Set(issues.map((i) => i.pageId).filter(Boolean)).size + issues.filter((i) => !i.pageId).length,
    loops: issues.filter((i) => !i.pageId).length,
    // D-37-d: the server sends `file` only on a central site to a diagnostics reader; draw the column only then.
    hasFiles: pages.some((p) => p.file !== null)
  };
}

// src/sitemap/parts.tsx
import {
  ArrowUpRight,
  CircleDashed,
  CornerDownRight,
  EyeOff,
  FileCheck2,
  FileDiff,
  FileClock,
  FilePlus2,
  FileWarning,
  FileX2,
  Globe,
  Layers,
  LayoutTemplate,
  Lock,
  Palette,
  PenLine,
  Plus,
  Puzzle,
  Repeat2,
  RotateCcw,
  TriangleAlert,
  X
} from "lucide-react";
import { Button, cn as cn2 } from "@schemastud/ui";
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function PublicationStatus({ page, compact = false }) {
  const state = publicationState(page);
  return /* @__PURE__ */ jsxs2("span", { className: "inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-foreground/75", children: [
    /* @__PURE__ */ jsx2("span", { "aria-hidden": true, className: cn2("size-2 shrink-0 rounded-full", state === "unpublished" ? "border border-foreground/50" : "bg-primary") }),
    state === "unpublished" ? /* @__PURE__ */ jsx2("span", { className: "text-foreground", children: "Not published" }) : /* @__PURE__ */ jsxs2("span", { children: [
      "Live ",
      page.publishedReadable
    ] }),
    state === "draft" && /* @__PURE__ */ jsxs2("span", { className: "inline-flex items-center gap-1 rounded bg-muted px-1 text-[11px] font-medium text-foreground", children: [
      "draft ",
      page.headReadable,
      !compact && /* @__PURE__ */ jsx2("span", { className: "font-normal text-foreground/75", children: " pending" })
    ] })
  ] });
}
var SEARCH_COPY = {
  listed: { short: "Listed", long: "Search engines can find this page." },
  "record-page": { short: "Listed", long: "Listed once per record a guest can read." },
  unpublished: { short: "Waits for publish", long: "It will be listed once it is published." },
  "hidden-ancestor": { short: "Under an unpublished page", long: "A page above it is not published, and a hidden page hides the pages under it." },
  "not-listable": { short: "Restricted or unlisted", long: "Guests may not list it: it is for members only, or unlisted (readable by its link, never listed)." },
  "not-public": { short: "Members only", long: "Gated content is never listed." },
  unplaced: { short: "Not placed", long: "It has no place in the page tree, so it has no address." },
  "not-routable": { short: "Not a public page", long: "Only pages on the public site have an address in the sitemap." },
  "no-records": { short: "No public records", long: "A record page is listed once per record a guest can read; none is readable." }
};
var searchCopy = (reason) => SEARCH_COPY[reason] ?? { short: "Not listed", long: "Left out of the sitemap." };
function SearchStatus({ page, iconOnly = false }) {
  const { listed, reason, urlCount } = page.search;
  const short = searchCopy(reason).short + (reason === "record-page" ? ` \xB7 ${urlCount}` : "");
  const label = listed ? `In the sitemap: ${short}` : `Not in the sitemap: ${short}`;
  const Icon = listed ? Globe : reason === "not-public" || reason === "not-listable" ? Lock : EyeOff;
  return /* @__PURE__ */ jsxs2("span", { title: label, className: "inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-foreground/75", children: [
    /* @__PURE__ */ jsx2(Icon, { "aria-hidden": true, className: "size-3.5 shrink-0" }),
    iconOnly ? /* @__PURE__ */ jsx2("span", { className: "sr-only", children: label }) : /* @__PURE__ */ jsx2("span", { className: cn2(!listed && "text-foreground"), children: short })
  ] });
}
var FILE_COPY = {
  clean: { label: "In sync", Icon: FileCheck2, tone: "text-foreground/75" },
  modified: { label: "Changed on disk", Icon: FileDiff, tone: "text-warning-foreground dark:text-warning" },
  untracked: { label: "Not committed", Icon: FilePlus2, tone: "text-foreground/75" },
  "untracked-ignored": { label: "Ignored by git", Icon: FilePlus2, tone: "text-foreground/75" },
  "not-written": { label: "File missing", Icon: FileX2, tone: "text-destructive" },
  "mirror-disabled": { label: "No file mirror", Icon: CircleDashed, tone: "text-foreground/75" },
  "no-git-repo": { label: "Outside git", Icon: FileWarning, tone: "text-foreground/75" },
  "not-yet-saved": { label: "Not saved yet", Icon: FileClock, tone: "text-foreground/75" }
};
var fileCopy = (state) => FILE_COPY[state] ?? { label: state, Icon: FileWarning, tone: "text-foreground/75" };
function FileStatus({ page, iconOnly = false }) {
  if (!page.file) return null;
  const { label, Icon, tone } = fileCopy(page.file.state);
  return /* @__PURE__ */ jsxs2("span", { title: `File: ${label}`, className: cn2("inline-flex items-center gap-1.5 whitespace-nowrap text-xs", tone), children: [
    /* @__PURE__ */ jsx2(Icon, { "aria-hidden": true, className: "size-3.5 shrink-0" }),
    iconOnly ? /* @__PURE__ */ jsxs2("span", { className: "sr-only", children: [
      "File: ",
      label
    ] }) : /* @__PURE__ */ jsx2("span", { children: label })
  ] });
}
function RedirectCount({ page }) {
  const { count, attention, maxHops } = page.redirects;
  if (count === 0) return /* @__PURE__ */ jsxs2("span", { className: "text-xs text-foreground/50", children: [
    /* @__PURE__ */ jsx2("span", { "aria-hidden": true, children: "\xB7" }),
    /* @__PURE__ */ jsx2("span", { className: "sr-only", children: "No old addresses" })
  ] });
  return /* @__PURE__ */ jsxs2(
    "span",
    {
      title: `${count} old address${count === 1 ? "" : "es"} lead here`,
      className: cn2("inline-flex items-center gap-1 text-xs tabular-nums", attention ? "text-destructive" : "text-foreground/75"),
      children: [
        /* @__PURE__ */ jsx2(CornerDownRight, { "aria-hidden": true, className: "size-3.5" }),
        count,
        /* @__PURE__ */ jsxs2("span", { className: "sr-only", children: [
          " old address",
          count === 1 ? "" : "es",
          " lead here",
          attention ? ", and one fails a guest" : maxHops > 1 ? `, the longest through ${maxHops} redirects` : ""
        ] })
      ]
    }
  );
}
var ISSUE_COPY = {
  "file-missing": { label: "File missing", plural: "files missing", fix: "Restore the file from the published version", action: "Restore" },
  "file-changed": { label: "File changed on disk", plural: "files changed on disk", fix: "Take the file as a draft, or overwrite it", action: "Review" },
  "redirect-broken": { label: "Old address fails a guest", plural: "old addresses fail a guest", fix: "Point it at a published page", action: "Retarget" },
  "redirect-loop": { label: "Redirect loop", plural: "redirect loops", fix: "Point one of them at a page", action: "Fix" }
};
function issueLabel(issue) {
  return (issue.count ?? 1) > 1 ? `${issue.count} ${ISSUE_COPY[issue.kind].plural}` : ISSUE_COPY[issue.kind].label;
}
function IssueIcon({ kind, className, announce = true }) {
  const Icon = kind === "file-missing" ? FileX2 : kind === "file-changed" ? FileDiff : kind === "redirect-loop" ? Repeat2 : TriangleAlert;
  return /* @__PURE__ */ jsxs2(Fragment2, { children: [
    /* @__PURE__ */ jsx2(Icon, { "aria-hidden": true, className: cn2("size-3.5 shrink-0", isSevere(kind) ? "text-destructive" : "text-warning-foreground dark:text-warning", className) }),
    announce && /* @__PURE__ */ jsx2("span", { className: "sr-only", children: ISSUE_COPY[kind].label })
  ] });
}
var END_COPY = {
  loop: "Loops: guests get a 404",
  "too-long": "Too many steps: guests get a 404",
  "dead-end": "Ends on an unpublished page: guests get a 404",
  gone: "Its target is gone: guests get a 404",
  denied: "Only readers who may see the page get there"
};
var ORIGIN = {
  author: "added by an author",
  publish: "left by a move",
  release: "left by a release",
  takedown: "left by a takedown",
  record: "left by a record"
};
function WalkMeta({ permanent, match, origin, end, hops }) {
  return /* @__PURE__ */ jsxs2("p", { className: "mt-0.5 text-xs text-foreground/70", children: [
    permanent ? "301 permanent" : "302 temporary",
    match === "prefix" && " \xB7 and everything under it",
    ORIGIN[origin] && /* @__PURE__ */ jsxs2(Fragment2, { children: [
      " \xB7 ",
      ORIGIN[origin]
    ] }),
    end === "answered" && hops > 1 && /* @__PURE__ */ jsxs2(Fragment2, { children: [
      " \xB7 through ",
      hops,
      " redirects"
    ] }),
    END_COPY[end] && /* @__PURE__ */ jsxs2("span", { className: end === "denied" ? "" : "text-destructive", children: [
      " \xB7 ",
      END_COPY[end]
    ] })
  ] });
}
function InboundLine({ redirect, onOpen }) {
  const from = /* @__PURE__ */ jsxs2("span", { className: "font-mono text-xs text-foreground", children: [
    redirect.path,
    redirect.match === "prefix" ? "/\u2026" : ""
  ] });
  return /* @__PURE__ */ jsxs2("div", { className: "min-w-0", children: [
    onOpen ? /* @__PURE__ */ jsx2("button", { type: "button", onClick: () => onOpen(redirect.id), className: "rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", children: from }) : from,
    /* @__PURE__ */ jsx2(WalkMeta, { ...redirect })
  ] });
}
function TraceLine({ trace }) {
  const steps = trace.end === "answered" && trace.to ? [...trace.steps, trace.to] : trace.steps;
  return /* @__PURE__ */ jsxs2("div", { className: "min-w-0", children: [
    /* @__PURE__ */ jsxs2("p", { className: "flex flex-wrap items-center gap-x-1 font-mono text-xs", style: { rowGap: "0.125rem" }, children: [
      steps.map((step, i) => /* @__PURE__ */ jsxs2("span", { className: "inline-flex items-center gap-1", children: [
        i > 0 && /* @__PURE__ */ jsx2("span", { "aria-hidden": true, className: "text-foreground/60", children: "\u2192" }),
        /* @__PURE__ */ jsx2("span", { className: i === 0 ? "text-foreground" : "text-foreground/70", children: step })
      ] }, `${step}-${i}`)),
      trace.end === "loop" && /* @__PURE__ */ jsxs2("span", { className: "inline-flex items-center gap-1 text-destructive", children: [
        /* @__PURE__ */ jsx2("span", { "aria-hidden": true, children: "\u2192" }),
        trace.steps[0]
      ] })
    ] }),
    /* @__PURE__ */ jsx2(WalkMeta, { ...trace })
  ] });
}
function LooseRedirects({ traces, onOpen }) {
  return /* @__PURE__ */ jsx2("ul", { className: "divide-y divide-border", children: traces.map((t) => /* @__PURE__ */ jsxs2("li", { className: "flex items-start gap-3 px-4 py-2.5 md:px-6", children: [
    t.attention ? /* @__PURE__ */ jsx2(Repeat2, { "aria-hidden": true, className: "mt-0.5 size-3.5 shrink-0 text-destructive" }) : /* @__PURE__ */ jsx2(ArrowUpRight, { "aria-hidden": true, className: "mt-0.5 size-3.5 shrink-0 text-foreground/70" }),
    onOpen ? /* @__PURE__ */ jsx2("button", { type: "button", className: "min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", onClick: () => onOpen(t.id), children: /* @__PURE__ */ jsx2(TraceLine, { trace: t }) }) : /* @__PURE__ */ jsx2(TraceLine, { trace: t })
  ] }, t.id)) });
}
var PART_KINDS = [
  { type: "theme", label: "Theme", Icon: Palette },
  { type: "layout", label: "Layouts", Icon: LayoutTemplate },
  { type: "template", label: "Templates", Icon: Layers },
  { type: "component", label: "Components", Icon: Puzzle }
];
function SiteParts({ parts, onOpen }) {
  if (parts.length === 0) return null;
  const known = new Set(PART_KINDS.map((k) => k.type));
  const groups = [...PART_KINDS, ...[...new Set(parts.map((p) => p.type).filter((t) => !known.has(t)))].map((type) => ({ type, label: type, Icon: Puzzle }))];
  return /* @__PURE__ */ jsxs2("section", { "aria-labelledby": "site-parts-heading", className: "border-t border-border px-4 py-4 md:px-6", children: [
    /* @__PURE__ */ jsx2("h2", { id: "site-parts-heading", className: "text-[13px] font-semibold", children: "Site parts" }),
    /* @__PURE__ */ jsx2("p", { className: "mb-2 text-xs text-foreground/70", children: "What pages are built from. Each opens in its editor." }),
    /* @__PURE__ */ jsx2("div", { className: "grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4", children: groups.map(({ type, label, Icon }) => {
      const items = parts.filter((p) => p.type === type);
      if (items.length === 0) return null;
      return /* @__PURE__ */ jsxs2("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxs2("h3", { className: "mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground/70", children: [
          /* @__PURE__ */ jsx2(Icon, { "aria-hidden": true, className: "size-3.5" }),
          label
        ] }),
        /* @__PURE__ */ jsx2("ul", { children: items.map((part) => /* @__PURE__ */ jsx2("li", { children: /* @__PURE__ */ jsx2(
          "button",
          {
            type: "button",
            onClick: () => onOpen({ kind: "part", part }),
            className: "flex min-h-8 w-full items-center rounded px-1.5 text-left text-[13px] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            children: /* @__PURE__ */ jsx2("span", { className: "truncate", children: part.type === "theme" && !part.title ? "Theme" : part.title || part.slug })
          }
        ) }, part.id)) })
      ] }, type);
    }) })
  ] });
}
function Section({ title, children, aside }) {
  return /* @__PURE__ */ jsxs2("section", { className: "border-t border-border px-5 py-4", children: [
    /* @__PURE__ */ jsxs2("div", { className: "mb-2.5 flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx2("h3", { className: "text-[13px] font-semibold text-foreground", children: title }),
      aside
    ] }),
    children
  ] });
}
var REPAIR_BLOCKED = {
  "no-release": "No published Release holds this page yet, so there is nothing to repair the file from.",
  "pin-moved": "The newest Release froze another version than the one readers see; publish a Release first."
};
function PageInspector({ page, parent, onOpen, onSelect, onClose, sheet = false, onPageSettings, onAddRedirect, onOpenRedirect, onFileAction }) {
  const issues = issuesFor(page);
  const state = publicationState(page);
  const title = pageTitle(page);
  const canRepair = !!onFileAction && !!page.file?.repairMemberId;
  return /* @__PURE__ */ jsxs2(
    "aside",
    {
      "aria-label": `${title} details`,
      "data-testid": "site-map-inspector",
      className: cn2("flex min-h-0 flex-col bg-card text-card-foreground", sheet ? "max-h-[58dvh] rounded-t-2xl border-t border-border shadow-[0_-8px_32px_-12px_rgb(0_0_0/0.35)]" : "h-full"),
      children: [
        sheet && /* @__PURE__ */ jsx2("div", { "aria-hidden": true, className: "mx-auto mt-2 h-1 w-10 rounded-full bg-border" }),
        /* @__PURE__ */ jsxs2("header", { className: "px-5 pb-4 pt-4", children: [
          /* @__PURE__ */ jsxs2("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs2("div", { className: "min-w-0", children: [
              parent && /* @__PURE__ */ jsx2("button", { type: "button", onClick: () => onSelect?.(parent.id), className: "mb-1 rounded text-xs text-foreground/70 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", children: pageTitle(parent) }),
              /* @__PURE__ */ jsx2("h2", { className: "text-lg font-semibold leading-tight tracking-[-0.01em] text-balance", children: title }),
              page.url && /* @__PURE__ */ jsx2("p", { className: "mt-1 break-all font-mono text-xs text-foreground/75", children: page.url })
            ] }),
            onClose && /* @__PURE__ */ jsx2(Button, { variant: "ghost", size: "icon", "aria-label": "Close details", onClick: onClose, className: "-mr-2 -mt-1 size-9", children: /* @__PURE__ */ jsx2(X, {}) })
          ] }),
          /* @__PURE__ */ jsxs2("div", { className: "mt-4 flex gap-2", children: [
            /* @__PURE__ */ jsxs2(Button, { size: "sm", className: "h-9 flex-1", onClick: () => onOpen({ kind: "page", page }), children: [
              /* @__PURE__ */ jsx2(PenLine, {}),
              "Open in editor"
            ] }),
            onPageSettings && /* @__PURE__ */ jsx2(Button, { size: "sm", variant: "outline", className: "h-9", onClick: () => onPageSettings(page), children: "Page settings" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "min-h-0 flex-1 overflow-y-auto", children: [
          issues.length > 0 && /* @__PURE__ */ jsx2("section", { "aria-label": "Issues on this page", className: cn2("mx-5 mb-4 rounded-lg px-3 py-2.5", issues.some((i) => isSevere(i.kind)) ? "bg-destructive/10" : "bg-warning/10"), children: /* @__PURE__ */ jsx2("ul", { className: "space-y-2", children: issues.map((issue) => /* @__PURE__ */ jsxs2("li", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx2(IssueIcon, { kind: issue.kind, className: "mt-0.5", announce: false }),
            /* @__PURE__ */ jsxs2("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsx2("p", { className: "text-[13px] font-medium", children: issueLabel(issue) }),
              /* @__PURE__ */ jsxs2("p", { className: "text-xs text-foreground/75", children: [
                ISSUE_COPY[issue.kind].fix,
                "."
              ] })
            ] })
          ] }, issue.kind)) }) }),
          /* @__PURE__ */ jsx2(Section, { title: "Publication", aside: /* @__PURE__ */ jsx2(PublicationStatus, { page, compact: true }), children: /* @__PURE__ */ jsxs2("dl", { className: "grid grid-cols-[7rem_1fr] gap-y-1.5 text-[13px]", children: [
            /* @__PURE__ */ jsx2("dt", { className: "text-foreground/70", children: "Readers see" }),
            /* @__PURE__ */ jsx2("dd", { children: page.publishedReadable ?? "Nothing yet" }),
            /* @__PURE__ */ jsx2("dt", { className: "text-foreground/70", children: "Working draft" }),
            /* @__PURE__ */ jsxs2("dd", { children: [
              page.headReadable ?? "None",
              state === "draft" && /* @__PURE__ */ jsx2("span", { className: "text-foreground/70", children: " \xB7 not published" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs2(Section, { title: "Search engines", aside: /* @__PURE__ */ jsx2(SearchStatus, { page, iconOnly: true }), children: [
            /* @__PURE__ */ jsx2("p", { className: "text-[13px]", children: page.search.listed ? "Listed in the sitemap" : "Left out of the sitemap" }),
            /* @__PURE__ */ jsx2("p", { className: "text-xs text-foreground/70", children: searchCopy(page.search.reason).long })
          ] }),
          page.file && /* @__PURE__ */ jsxs2(Section, { title: "File", aside: /* @__PURE__ */ jsx2(FileStatus, { page }), children: [
            page.file.path && /* @__PURE__ */ jsx2("p", { className: "break-all font-mono text-xs text-foreground/70", children: page.file.path }),
            page.file.lastModifiedAt && /* @__PURE__ */ jsxs2("p", { className: "mt-1 text-xs text-foreground/70", children: [
              "Last written ",
              page.file.lastModifiedAt
            ] }),
            (page.file.state === "not-written" || page.file.state === "modified") && (page.file.repairBlocked ? /* @__PURE__ */ jsx2("p", { className: "mt-2 text-xs text-foreground/75", children: REPAIR_BLOCKED[page.file.repairBlocked] ?? "No Release member can repair this file." }) : canRepair && /* @__PURE__ */ jsx2("div", { className: "mt-3 flex flex-wrap gap-2", children: page.file.state === "not-written" ? /* @__PURE__ */ jsxs2(Button, { size: "sm", variant: "secondary", className: "h-9", onClick: () => onFileAction("restore", page), children: [
              /* @__PURE__ */ jsx2(RotateCcw, {}),
              "Restore file"
            ] }) : /* @__PURE__ */ jsxs2(Fragment2, { children: [
              /* @__PURE__ */ jsx2(Button, { size: "sm", variant: "secondary", className: "h-9", onClick: () => onFileAction("take-draft", page), children: "Take as draft" }),
              /* @__PURE__ */ jsx2(Button, { size: "sm", variant: "outline", className: "h-9", onClick: () => onFileAction("overwrite", page), children: "Overwrite with published\u2026" })
            ] }) }))
          ] }),
          /* @__PURE__ */ jsx2(
            Section,
            {
              title: "Old addresses that lead here",
              aside: onAddRedirect && /* @__PURE__ */ jsxs2(Button, { size: "sm", variant: "ghost", className: "-mr-2 h-8", onClick: () => onAddRedirect(page), children: [
                /* @__PURE__ */ jsx2(Plus, {}),
                "Add"
              ] }),
              children: page.redirects.inbound.length === 0 ? /* @__PURE__ */ jsx2("p", { className: "text-xs text-foreground/70", children: "None. When this page moves, its old address is kept here automatically." }) : /* @__PURE__ */ jsx2("ul", { className: "space-y-3", children: page.redirects.inbound.map((r) => /* @__PURE__ */ jsx2("li", { children: /* @__PURE__ */ jsx2(InboundLine, { redirect: r, onOpen: onOpenRedirect }) }, r.id)) })
            }
          )
        ] })
      ]
    }
  );
}

// src/sitemap/OutlineView.tsx
import { useRef, useState as useState2 } from "react";
import { ChevronRight } from "lucide-react";
import { cn as cn3 } from "@schemastud/ui";
import { Fragment as Fragment3, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var cols = (files) => files ? "md:grid-cols-[minmax(0,1fr)_9.5rem_11.5rem_9rem_5.5rem]" : "md:grid-cols-[minmax(0,1fr)_9.5rem_11.5rem_5.5rem]";
function Row({ node, open, toggle, selected, onSelect, onOpen, context, focusable, files }) {
  const { page, depth } = node;
  const issues = issuesFor(page);
  const hasKids = node.children.length > 0;
  const title = pageTitle(page);
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      role: "none",
      className: cn3(
        "group grid grid-cols-[minmax(0,1fr)] items-center border-b border-border/60",
        cols(files),
        context ? "md:h-8" : "md:h-10",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
      ),
      children: [
        /* @__PURE__ */ jsxs3("div", { className: "flex min-w-0 items-center py-2 pr-2 md:py-0", style: { paddingLeft: 8 + depth * 18 }, children: [
          hasKids ? /* @__PURE__ */ jsx3(
            "button",
            {
              type: "button",
              tabIndex: -1,
              onClick: toggle,
              "aria-label": open ? `Collapse ${title}` : `Expand ${title}`,
              className: "grid size-11 shrink-0 place-items-center rounded text-foreground/70 hover:bg-muted hover:text-foreground md:size-6",
              children: /* @__PURE__ */ jsx3(ChevronRight, { "aria-hidden": true, className: cn3("size-3.5 transition-transform duration-150 motion-reduce:transition-none", open && "rotate-90") })
            }
          ) : /* @__PURE__ */ jsx3("span", { className: "size-11 shrink-0 md:size-6" }),
          /* @__PURE__ */ jsxs3(
            "button",
            {
              type: "button",
              role: "treeitem",
              "aria-level": depth + 1,
              "aria-selected": selected,
              "aria-expanded": hasKids ? open : void 0,
              "data-row": page.id,
              tabIndex: focusable ? 0 : -1,
              onClick: onSelect,
              onDoubleClick: onOpen,
              className: "flex min-w-0 flex-1 flex-col items-start rounded px-1.5 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-row md:items-center md:gap-2",
              children: [
                /* @__PURE__ */ jsxs3("span", { className: "flex min-w-0 max-w-full items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx3("span", { className: cn3("truncate text-[13px]", context ? "text-foreground/60" : depth === 0 ? "font-semibold" : "font-medium"), children: title }),
                  !context && issues.slice(0, 2).map((i) => /* @__PURE__ */ jsx3(IssueIcon, { kind: i.kind }, i.kind)),
                  !open && hasKids && /* @__PURE__ */ jsxs3("span", { className: "text-xs tabular-nums text-foreground/70", children: [
                    "+",
                    countDescendants(node)
                  ] })
                ] }),
                /* @__PURE__ */ jsx3("span", { className: cn3("truncate font-mono text-[11px]", context ? "text-foreground/50" : "text-foreground/70"), children: page.url }),
                !context && /* @__PURE__ */ jsxs3("span", { className: "mt-1 flex items-center gap-3 md:hidden", children: [
                  /* @__PURE__ */ jsx3(PublicationStatus, { page, compact: true }),
                  /* @__PURE__ */ jsx3(SearchStatus, { page, iconOnly: true }),
                  /* @__PURE__ */ jsx3(FileStatus, { page, iconOnly: true }),
                  /* @__PURE__ */ jsx3(RedirectCount, { page })
                ] })
              ]
            }
          )
        ] }),
        context ? /* @__PURE__ */ jsx3("div", { className: cn3("hidden md:block", files ? "md:col-span-4" : "md:col-span-3") }) : /* @__PURE__ */ jsxs3(Fragment3, { children: [
          /* @__PURE__ */ jsx3("div", { className: "hidden md:block", children: /* @__PURE__ */ jsx3(PublicationStatus, { page, compact: true }) }),
          /* @__PURE__ */ jsx3("div", { className: "hidden md:block", children: page.search.listed ? /* @__PURE__ */ jsx3("span", { className: "sr-only", children: "Listed in the sitemap" }) : /* @__PURE__ */ jsx3(SearchStatus, { page }) }),
          files && /* @__PURE__ */ jsx3("div", { className: "hidden md:block", children: page.file && (page.file.state === "clean" ? /* @__PURE__ */ jsx3("span", { className: "sr-only", children: "File in sync" }) : /* @__PURE__ */ jsx3(FileStatus, { page })) }),
          /* @__PURE__ */ jsx3("div", { className: "hidden pr-3 text-right md:block", children: /* @__PURE__ */ jsx3(RedirectCount, { page }) })
        ] })
      ]
    }
  );
}
function OutlineView({ roots, summary, filtering, keep, matched, selected, onSelect, onOpenPage, footer }) {
  const [closed, setClosed] = useState2(/* @__PURE__ */ new Set());
  const treeRef = useRef(null);
  const rows = flatten(roots, (id) => filtering || !closed.has(id)).filter((n) => keep.has(n.page.id));
  const toggle = (id) => setClosed((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });
  const focusId = rows.some((r) => r.page.id === selected) ? selected : rows[0]?.page.id;
  const files = summary.hasFiles;
  const onKey = (e) => {
    const id = e.target.dataset.row;
    if (!id) return;
    const i = rows.findIndex((r) => r.page.id === id);
    const focus = (j) => treeRef.current?.querySelector(`[data-row="${rows[j]?.page.id}"]`)?.focus();
    const node = rows[i];
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focus(Math.min(rows.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        focus(Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        focus(0);
        break;
      case "End":
        e.preventDefault();
        focus(rows.length - 1);
        break;
      case "ArrowRight":
        if (node.children.length && closed.has(id) && !filtering) {
          e.preventDefault();
          toggle(id);
        } else if (node.children.length) {
          e.preventDefault();
          focus(i + 1);
        }
        break;
      case "ArrowLeft": {
        e.preventDefault();
        if (node.children.length && !closed.has(id) && !filtering) {
          toggle(id);
          break;
        }
        const parent = rows.findIndex((r) => r.page.id === node.page.parentId);
        if (parent >= 0) focus(parent);
        break;
      }
      case "Enter":
        if (selected === id) {
          e.preventDefault();
          onOpenPage(id);
        }
        break;
    }
  };
  return /* @__PURE__ */ jsxs3("div", { className: "min-h-0 min-w-0 overflow-y-auto", "data-view": "outline", children: [
    /* @__PURE__ */ jsxs3("div", { className: cn3("sticky top-0 z-10 hidden h-8 items-center border-b border-border bg-background text-xs text-foreground/70 md:grid", cols(files)), children: [
      /* @__PURE__ */ jsx3("span", { className: "pl-10", children: "Page" }),
      /* @__PURE__ */ jsx3("span", { children: "Publication" }),
      /* @__PURE__ */ jsx3("span", { children: "Sitemap" }),
      files && /* @__PURE__ */ jsx3("span", { children: "File" }),
      /* @__PURE__ */ jsx3("span", { className: "pr-3 text-right", title: "Old addresses that lead here", children: "Redirects" })
    ] }),
    /* @__PURE__ */ jsxs3("div", { role: "tree", "aria-label": "Pages", ref: treeRef, onKeyDown: onKey, children: [
      rows.map((n) => /* @__PURE__ */ jsx3(
        Row,
        {
          node: n,
          open: filtering || !closed.has(n.page.id),
          toggle: () => toggle(n.page.id),
          selected: selected === n.page.id,
          onSelect: () => onSelect(n.page.id),
          onOpen: () => onOpenPage(n.page.id),
          context: filtering && !matched.has(n.page.id),
          focusable: focusId === n.page.id,
          files
        },
        n.page.id
      )),
      rows.length === 0 && /* @__PURE__ */ jsx3("p", { className: "px-6 py-10 text-center text-[13px] text-foreground/70", children: "No page matches. Clear the filter to see the whole site." })
    ] }),
    footer
  ] });
}

// src/sitemap/CanvasView.tsx
import { useEffect as useEffect2, useRef as useRef2, useState as useState3 } from "react";
import { ChevronRight as ChevronRight2, Home, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button as Button2, cn as cn4 } from "@schemastud/ui";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var CARD_W = 208;
var CARD_H = 78;
var COL = CARD_W + 56;
var PITCH = CARD_H + 14;
var GHOST_W = 176;
var GHOST_H = 26;
var PAD = 24;
function layout(roots, open, keep) {
  const placed = [];
  const order = /* @__PURE__ */ new Map();
  const walk = (n) => {
    order.set(n.page.id, order.size);
    n.children.forEach(walk);
  };
  roots.forEach(walk);
  let row = 0;
  let maxDepth = 0;
  const place = (n) => {
    maxDepth = Math.max(maxDepth, n.depth);
    const kids = open(n.page.id) ? n.children.filter((c) => keep.has(c.page.id)) : [];
    let y;
    if (kids.length === 0) {
      y = row * PITCH;
      row += 1;
    } else {
      y = kids.map(place)[0];
    }
    placed.push({ node: n, x: n.depth * COL, y, order: order.get(n.page.id) ?? 0 });
    return y;
  };
  roots.filter((r) => keep.has(r.page.id)).forEach(place);
  placed.sort((a, b) => a.order - b.order);
  return { placed, height: Math.max(row * PITCH, CARD_H), laneX: (maxDepth + 1) * COL + 40 };
}
function Card({ p, selected, open, focusable, onSelect, onOpen, onToggle }) {
  const { page } = p.node;
  const issues = issuesFor(page);
  const hasKids = p.node.children.length > 0;
  const title = pageTitle(page);
  return /* @__PURE__ */ jsxs4("div", { className: "absolute", style: { left: p.x, top: p.y, width: CARD_W, height: CARD_H }, children: [
    /* @__PURE__ */ jsxs4(
      "button",
      {
        type: "button",
        "data-card": page.id,
        tabIndex: focusable ? 0 : -1,
        onClick: onSelect,
        onDoubleClick: onOpen,
        "aria-pressed": selected,
        className: cn4(
          "flex h-full w-full flex-col justify-between gap-1 rounded-lg border bg-card px-3 py-2 text-left shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
          selected ? "border-primary ring-2 ring-primary/25" : issues.some((i) => isSevere(i.kind)) ? "border-destructive/60" : "border-border hover:border-foreground/30",
          publicationState(page) === "unpublished" && "border-dashed"
        ),
        children: [
          /* @__PURE__ */ jsxs4("span", { className: "flex w-full min-w-0 items-center gap-1.5", children: [
            /* @__PURE__ */ jsx4("span", { className: "truncate text-[13px] font-medium", children: title }),
            issues.slice(0, 2).map((i) => /* @__PURE__ */ jsx4(IssueIcon, { kind: i.kind }, i.kind))
          ] }),
          /* @__PURE__ */ jsx4("span", { className: "truncate font-mono text-[11px] text-foreground/70", children: page.url }),
          /* @__PURE__ */ jsxs4("span", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsx4(PublicationStatus, { page, compact: true }),
            /* @__PURE__ */ jsx4(SearchStatus, { page, iconOnly: true }),
            /* @__PURE__ */ jsx4(FileStatus, { page, iconOnly: true })
          ] })
        ]
      }
    ),
    hasKids && /* @__PURE__ */ jsx4(
      "button",
      {
        type: "button",
        tabIndex: -1,
        onClick: onToggle,
        "aria-label": open ? `Collapse ${title}` : `Expand ${title}`,
        className: "absolute -right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-foreground/70 hover:text-foreground",
        children: open ? /* @__PURE__ */ jsx4(ChevronRight2, { "aria-hidden": true, className: "size-3.5 rotate-180" }) : /* @__PURE__ */ jsx4("span", { className: "text-[10px] font-medium tabular-nums", children: p.node.children.length })
      }
    )
  ] });
}
function CanvasView({ roots, pages, traces, filtering, keep, selected, onSelect, onOpenPage, footer }) {
  const [closed, setClosed] = useState3(/* @__PURE__ */ new Set());
  const [scale, setScale] = useState3(0.85);
  const isOpen = (id) => filtering || !closed.has(id);
  const { placed, height, laneX } = layout(roots, isOpen, keep);
  const at = new Map(placed.map((p) => [p.node.page.id, p]));
  const scroller = useRef2(null);
  const toggle = (id) => setClosed((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  });
  useEffect2(() => {
    const p = selected ? at.get(selected) : void 0;
    const el = scroller.current;
    if (!p || !el || typeof el.scrollTo !== "function") return;
    const left = p.x * scale + PAD;
    const top = p.y * scale + PAD;
    const right = left + CARD_W * scale;
    const bottom = top + CARD_H * scale;
    const inView = left >= el.scrollLeft && right <= el.scrollLeft + el.clientWidth && top >= el.scrollTop && bottom <= el.scrollTop + el.clientHeight;
    if (!inView) el.scrollTo({ left: Math.max(0, left - 16), top: Math.max(0, top - 16) });
  }, [selected]);
  const ghosts = placed.flatMap((p) => p.node.page.redirects.inbound.map((r) => ({ r, target: p }))).sort((a, b) => a.target.y - b.target.y);
  let cursor = -Infinity;
  const lane = ghosts.map((g) => {
    const y = Math.max(g.target.y + CARD_H / 2 - GHOST_H / 2, cursor + GHOST_H + 8);
    cursor = y;
    return { ...g, y };
  });
  const loose = looseRows(traces, new Set(pages.map((p) => p.id)));
  const loopTop = Math.max(height, cursor + GHOST_H + 40);
  const width = laneX + GHOST_W + 40;
  const totalH = loopTop + (loose.length ? loose.length * (GHOST_H + 10) + 40 : 0);
  const edges = placed.filter((p) => p.node.page.parentId && at.has(p.node.page.parentId)).map((p) => {
    const parent = at.get(p.node.page.parentId);
    const x1 = parent.x + CARD_W + 12;
    const y1 = parent.y + CARD_H / 2;
    const x2 = p.x;
    const y2 = p.y + CARD_H / 2;
    const mx = x1 + (x2 - x1) / 2;
    const dir = Math.sign(y2 - y1);
    return { id: p.node.page.id, d: dir === 0 ? `M${x1},${y1} H${x2}` : `M${x1},${y1} H${mx - 8} Q${mx},${y1} ${mx},${y1 + dir * 8} V${y2 - dir * 8} Q${mx},${y2} ${mx + 8},${y2} H${x2}` };
  });
  const focusId = placed.some((p) => p.node.page.id === selected) ? selected : placed[0]?.node.page.id;
  const onKeys = (e) => {
    const id = e.target.dataset.card;
    if (!id) return;
    const i = placed.findIndex((p) => p.node.page.id === id);
    const focus = (j) => scroller.current?.querySelector(`[data-card="${placed[j]?.node.page.id}"]`)?.focus();
    const node = placed[i].node;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focus(Math.min(placed.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        focus(Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        focus(0);
        break;
      case "End":
        e.preventDefault();
        focus(placed.length - 1);
        break;
      case "ArrowLeft": {
        e.preventDefault();
        const parent = placed.findIndex((p) => p.node.page.id === node.page.parentId);
        if (parent >= 0) focus(parent);
        break;
      }
      case "ArrowRight": {
        e.preventDefault();
        if (node.children.length && !isOpen(id)) {
          toggle(id);
          break;
        }
        const child = placed.findIndex((p) => p.node.page.parentId === id);
        if (child >= 0) focus(child);
        break;
      }
      case "Enter":
        if (selected === id) {
          e.preventDefault();
          onOpenPage(id);
        }
        break;
    }
  };
  useEffect2(() => {
    const el = scroller.current;
    if (el && el.clientWidth > 0 && el.clientWidth < 768) {
      setScale(Math.max(0.4, Math.min(1, +((el.clientWidth - PAD * 2) / width).toFixed(2))));
      el.scrollTo?.({ left: 0, top: 0 });
    }
  }, []);
  const fit = () => {
    const el = scroller.current;
    if (el) setScale(Math.max(0.4, Math.min(1, +((el.clientWidth - PAD * 2) / width).toFixed(2))));
  };
  const home = () => scroller.current?.scrollTo?.({ left: 0, top: 0 });
  const ghostTone = (r) => r.attention ? "border-destructive/60 text-destructive" : "border-border text-foreground/75";
  return /* @__PURE__ */ jsxs4("div", { className: "relative flex min-h-0 min-w-0 flex-col", "data-view": "canvas", children: [
    /* @__PURE__ */ jsxs4("div", { role: "group", "aria-label": "Zoom", className: "flex items-center justify-end gap-0.5 border-b border-border bg-background px-3 py-1", children: [
      /* @__PURE__ */ jsx4(Button2, { variant: "ghost", size: "icon", className: "size-11 md:size-8", "aria-label": "Back to the top", onClick: home, children: /* @__PURE__ */ jsx4(Home, {}) }),
      /* @__PURE__ */ jsx4(Button2, { variant: "ghost", size: "icon", className: "size-11 md:size-8", "aria-label": "Zoom out", onClick: () => setScale((s) => Math.max(0.4, +(s - 0.15).toFixed(2))), children: /* @__PURE__ */ jsx4(ZoomOut, {}) }),
      /* @__PURE__ */ jsxs4("span", { className: "w-10 text-center text-xs tabular-nums text-foreground/70", "aria-live": "polite", children: [
        Math.round(scale * 100),
        "%"
      ] }),
      /* @__PURE__ */ jsx4(Button2, { variant: "ghost", size: "icon", className: "size-11 md:size-8", "aria-label": "Zoom in", onClick: () => setScale((s) => Math.min(1.4, +(s + 0.15).toFixed(2))), children: /* @__PURE__ */ jsx4(ZoomIn, {}) }),
      /* @__PURE__ */ jsx4(Button2, { variant: "ghost", size: "icon", className: "size-11 md:size-8", "aria-label": "Fit to screen", onClick: fit, children: /* @__PURE__ */ jsx4(Maximize2, {}) })
    ] }),
    /* @__PURE__ */ jsxs4("div", { ref: scroller, onKeyDown: onKeys, className: "min-h-0 flex-1 overflow-auto bg-muted/30", children: [
      /* @__PURE__ */ jsx4("div", { style: { width: width * scale + PAD * 2, height: totalH * scale + PAD * 2 }, className: "relative", children: /* @__PURE__ */ jsxs4("div", { className: "absolute origin-top-left", style: { left: PAD, top: PAD + 8, width, height: totalH, transform: `scale(${scale})` }, children: [
        /* @__PURE__ */ jsxs4("svg", { className: "pointer-events-none absolute inset-0 overflow-visible", width, height: totalH, "aria-hidden": true, children: [
          edges.map((e) => /* @__PURE__ */ jsx4("path", { d: e.d, fill: "none", className: "stroke-border", strokeWidth: 1.5 }, e.id)),
          lane.map(({ r, y, target }) => {
            const hot = selected === target.node.page.id;
            const x1 = laneX;
            const y1 = y + GHOST_H / 2;
            const x2 = target.x + CARD_W;
            const y2 = target.y + CARD_H / 2;
            return /* @__PURE__ */ jsx4(
              "path",
              {
                d: `M${x1},${y1} C${x1 - 60},${y1} ${x2 + 60},${y2} ${x2 + 2},${y2}`,
                fill: "none",
                strokeWidth: hot ? 1.75 : 1.25,
                strokeDasharray: "4 3",
                opacity: hot ? 1 : 0.35,
                className: r.attention ? "stroke-destructive" : "stroke-foreground/50"
              },
              r.id
            );
          })
        ] }),
        lane.length > 0 && /* @__PURE__ */ jsx4("p", { className: "absolute text-xs font-medium text-foreground/70", style: { left: laneX, top: -22 }, children: "Old addresses" }),
        lane.map(({ r, y, target }) => /* @__PURE__ */ jsxs4(
          "button",
          {
            type: "button",
            tabIndex: -1,
            onClick: () => onSelect(target.node.page.id),
            title: `${r.path} \u2192 ${target.node.page.url ?? pageTitle(target.node.page)}`,
            className: cn4("absolute flex items-center gap-1.5 truncate rounded-md border border-dashed bg-background px-2 font-mono text-[11px]", ghostTone(r)),
            style: { left: laneX, top: y, width: GHOST_W, height: GHOST_H },
            children: [
              /* @__PURE__ */ jsxs4("span", { className: "truncate", children: [
                r.path,
                r.match === "prefix" ? "/\u2026" : ""
              ] }),
              r.hops > 1 && r.end === "answered" && /* @__PURE__ */ jsxs4("span", { className: "ml-auto shrink-0 font-sans tabular-nums text-foreground/70", children: [
                r.hops,
                " hops"
              ] }),
              r.attention && /* @__PURE__ */ jsx4("span", { className: "sr-only", children: "fails a guest" })
            ]
          },
          r.id
        )),
        loose.length > 0 && /* @__PURE__ */ jsx4("p", { className: "absolute text-xs font-medium text-foreground/70", style: { left: laneX, top: loopTop - 22 }, children: "Redirects that reach no page" }),
        loose.map((t, i) => /* @__PURE__ */ jsxs4(
          "div",
          {
            className: cn4("absolute flex items-center gap-1.5 rounded-md border border-dashed bg-background px-2 font-mono text-[11px]", t.attention ? "border-destructive/60 text-destructive" : "border-border text-foreground/75"),
            style: { left: laneX, top: loopTop + i * (GHOST_H + 10), width: GHOST_W, height: GHOST_H },
            children: [
              /* @__PURE__ */ jsxs4("span", { className: "truncate", children: [
                t.path,
                " \u2192 ",
                (t.to ?? t.steps[1] ?? "").replace(/^https?:\/\//, "")
              ] }),
              t.end === "loop" && /* @__PURE__ */ jsx4("span", { className: "ml-auto font-sans", children: "loop" })
            ]
          },
          t.id
        )),
        placed.map((p) => /* @__PURE__ */ jsx4(
          Card,
          {
            p,
            selected: selected === p.node.page.id,
            open: isOpen(p.node.page.id),
            focusable: focusId === p.node.page.id,
            onSelect: () => onSelect(p.node.page.id),
            onOpen: () => onOpenPage(p.node.page.id),
            onToggle: () => toggle(p.node.page.id)
          },
          p.node.page.id
        ))
      ] }) }),
      placed.length === 0 && /* @__PURE__ */ jsx4("p", { className: "px-6 py-10 text-center text-[13px] text-foreground/70", children: "No page matches. Clear the filter to see the whole site." }),
      footer
    ] })
  ] });
}

// src/sitemap/ColumnsView.tsx
import { useEffect as useEffect3, useState as useState4 } from "react";
import { ArrowLeft, ChevronRight as ChevronRight3 } from "lucide-react";
import { cn as cn5 } from "@schemastud/ui";
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function Column({ nodes, selected, onSelect, onOpen, label, crumbs }) {
  return /* @__PURE__ */ jsxs5("ul", { "aria-label": label, className: "h-full w-full shrink-0 overflow-y-auto border-r border-border md:w-72", children: [
    nodes.map(({ page, children }) => {
      const issues = issuesFor(page);
      const on = selected === page.id;
      const onKey = (e) => {
        if (e.key === "Enter" && on) {
          e.preventDefault();
          onOpen(page.id);
        }
      };
      return /* @__PURE__ */ jsx5("li", { children: /* @__PURE__ */ jsxs5(
        "button",
        {
          type: "button",
          onClick: () => onSelect(page.id),
          onDoubleClick: () => onOpen(page.id),
          onKeyDown: onKey,
          "aria-current": on ? "true" : void 0,
          className: cn5(
            "flex w-full items-center gap-2 border-b border-border/60 px-4 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            on ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
          ),
          children: [
            /* @__PURE__ */ jsxs5("span", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxs5("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx5("span", { className: "truncate text-[13px] font-medium", children: pageTitle(page) }),
                issues.slice(0, 2).map((i) => /* @__PURE__ */ jsx5(IssueIcon, { kind: i.kind }, i.kind))
              ] }),
              /* @__PURE__ */ jsx5("span", { className: "block truncate font-mono text-[11px] text-foreground/70", children: crumbs?.(page.id) || page.url }),
              /* @__PURE__ */ jsxs5("span", { className: "mt-1 flex items-center gap-3", children: [
                /* @__PURE__ */ jsx5(PublicationStatus, { page, compact: true }),
                /* @__PURE__ */ jsx5(SearchStatus, { page, iconOnly: true }),
                /* @__PURE__ */ jsx5(FileStatus, { page, iconOnly: true })
              ] })
            ] }),
            children.length > 0 && /* @__PURE__ */ jsxs5("span", { className: "flex shrink-0 items-center gap-0.5 text-xs tabular-nums text-foreground/70", children: [
              children.length,
              /* @__PURE__ */ jsx5(ChevronRight3, { "aria-hidden": true, className: "size-3.5" })
            ] })
          ]
        }
      ) }, page.id);
    }),
    nodes.length === 0 && /* @__PURE__ */ jsx5("li", { className: "px-4 py-8 text-center text-[13px] text-foreground/70", children: "No page matches." })
  ] });
}
function AttentionStrip({ issues, byId, traceTitle, onPick }) {
  if (issues.length === 0) return null;
  const pagesHit = new Set(issues.map((i) => i.pageId).filter(Boolean)).size;
  const loose = issues.filter((i) => !i.pageId).length;
  return /* @__PURE__ */ jsxs5("section", { "aria-label": "Needs attention", className: "border-b border-border bg-background px-4 py-3 md:px-6", children: [
    /* @__PURE__ */ jsxs5("h2", { className: "mb-2 text-[13px] font-semibold", children: [
      "Needs attention ",
      /* @__PURE__ */ jsxs5("span", { className: "font-normal text-foreground/70", children: [
        "\xB7 ",
        pagesHit,
        " page",
        pagesHit === 1 ? "" : "s",
        loose ? `, ${loose} redirect${loose === 1 ? "" : "s"} reaching no page` : ""
      ] })
    ] }),
    /* @__PURE__ */ jsx5("ul", { className: "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1", children: issues.map((issue, i) => /* @__PURE__ */ jsx5("li", { className: "shrink-0", children: /* @__PURE__ */ jsxs5(
      "button",
      {
        type: "button",
        onClick: () => onPick(issue),
        className: "flex h-full w-56 items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        children: [
          /* @__PURE__ */ jsx5(IssueIcon, { kind: issue.kind, className: "mt-0.5", announce: false }),
          /* @__PURE__ */ jsxs5("span", { className: "min-w-0", children: [
            /* @__PURE__ */ jsx5("span", { className: "block text-[13px] font-medium", children: issueLabel(issue) }),
            /* @__PURE__ */ jsx5("span", { className: cn5("block truncate text-xs text-foreground/70", !issue.pageId && "font-mono"), children: issue.pageId ? pageTitle(byId.get(issue.pageId)) : traceTitle(issue.redirectId) })
          ] })
        ]
      }
    ) }, `${issue.kind}-${issue.pageId ?? issue.redirectId}-${i}`)) })
  ] });
}
function ColumnsView({ roots, pages, byId, summary, traces, filtering, matched, selected, onSelect, onOpenPage, footer }) {
  const [path, setPath] = useState4(() => selected ? ancestry(byId, selected) : roots[0] ? [roots[0].page.id] : []);
  const [showLoose, setShowLoose] = useState4(false);
  useEffect3(() => {
    if (selected && path[path.length - 1] !== selected) setPath(ancestry(byId, selected));
  }, [selected]);
  useEffect3(() => {
    if (showLoose) document.querySelector('[data-view="columns"] [data-loose]')?.scrollIntoView?.({ block: "nearest" });
  }, [showLoose]);
  const crumbs = (id) => ancestry(byId, id).slice(0, -1).map((a) => pageTitle(byId.get(a))).join(" \u203A ") || null;
  const traceTitle = (id) => {
    const t = traces.find((x) => x.id === id);
    return t ? [...t.steps, t.steps[0]].join(" \u2192 ") : id;
  };
  const hits = pages.filter((p) => matched.has(p.id)).map((p) => findNode(roots, p.id)).filter((n) => !!n);
  const columns = filtering ? [{ label: "Matching pages", nodes: hits, selected: selected ?? void 0 }] : [
    { label: "Site", nodes: roots, selected: path[0] },
    ...path.map((id, i) => ({ label: pageTitle(byId.get(id)), nodes: findNode(roots, id)?.children ?? [], selected: path[i + 1] })).filter((c) => c.nodes.length > 0)
  ];
  const pick = (depth, id) => {
    setShowLoose(false);
    setPath(filtering ? ancestry(byId, id) : [...path.slice(0, depth), id]);
    onSelect(id);
  };
  const parentTitle = path.length > 1 ? pageTitle(byId.get(path[path.length - 2])) : null;
  return /* @__PURE__ */ jsxs5("div", { className: "flex min-h-0 min-w-0 flex-col", "data-view": "columns", children: [
    /* @__PURE__ */ jsx5(
      AttentionStrip,
      {
        issues: summary.issues,
        byId,
        traceTitle,
        onPick: (issue) => {
          if (issue.pageId) {
            setShowLoose(false);
            setPath(ancestry(byId, issue.pageId));
            onSelect(issue.pageId);
          } else setShowLoose(true);
        }
      }
    ),
    parentTitle && !filtering && /* @__PURE__ */ jsxs5(
      "button",
      {
        type: "button",
        onClick: () => setPath(path.slice(0, -1)),
        className: "flex min-h-11 items-center gap-1.5 border-b border-border px-4 text-[13px] text-foreground/70 hover:text-foreground md:hidden",
        children: [
          /* @__PURE__ */ jsx5(ArrowLeft, { "aria-hidden": true, className: "size-3.5" }),
          parentTitle
        ]
      }
    ),
    /* @__PURE__ */ jsx5("div", { className: "flex min-h-[18rem] flex-1 overflow-x-auto", children: columns.map((c, i) => /* @__PURE__ */ jsx5("div", { className: cn5("h-full min-w-0 md:block", i === columns.length - 1 || filtering ? "block w-full md:w-auto" : "hidden"), children: /* @__PURE__ */ jsx5(
      Column,
      {
        label: c.label,
        nodes: c.nodes,
        selected: c.selected,
        onSelect: (id) => pick(i, id),
        onOpen: onOpenPage,
        crumbs: filtering ? crumbs : void 0
      }
    ) }, `${c.label}-${i}`)) }),
    /* @__PURE__ */ jsx5("div", { className: cn5("min-h-0 overflow-y-auto", showLoose && "ring-2 ring-inset ring-destructive/30"), "data-loose-open": showLoose || void 0, children: footer })
  ] });
}

// src/sitemap/SiteMap.tsx
import { Fragment as Fragment4, jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function SiteMap({
  pages,
  traces = [],
  parts = [],
  siteName,
  view: controlledView,
  onViewChange,
  viewStore,
  defaultView = "outline",
  selectedId,
  onSelectedChange,
  defaultSelectedId = null,
  defaultFilter = "all",
  actions,
  className,
  onOpen,
  onPageSettings,
  onAddRedirect,
  onOpenRedirect,
  onFileAction
}) {
  const store = useMemo(() => viewStore === void 0 ? browserViewStore() : viewStore, [viewStore]);
  const [ownView, setOwnView] = useState5(() => store?.get() ?? defaultView);
  useEffect4(() => {
    setOwnView(store?.get() ?? defaultView);
  }, [store]);
  const view = controlledView ?? ownView;
  const setView = (next) => {
    if (controlledView === void 0) setOwnView(next);
    store?.set(next);
    onViewChange?.(next);
  };
  const sheet = useSheetLayout();
  const [ownSelected, setOwnSelected] = useState5(defaultSelectedId);
  const selected = selectedId !== void 0 ? selectedId : ownSelected;
  const [inspecting, setInspecting] = useState5(() => !!defaultSelectedId && !sheet);
  const select = (id) => {
    if (selectedId === void 0) setOwnSelected(id);
    onSelectedChange?.(id);
    setInspecting(id !== null);
  };
  const [filter, setFilter] = useState5(defaultFilter);
  const [query, setQuery] = useState5("");
  const byId = useMemo(() => new Map(pages.map((p) => [p.id, p])), [pages]);
  const roots = useMemo(() => buildTree(pages), [pages]);
  const summary = useMemo(() => summarize(pages, traces), [pages, traces]);
  const { keep, matched } = useMemo(() => visibleIds(pages, filter, query), [pages, filter, query]);
  const filtering = filter !== "all" || query.trim() !== "";
  const loose = useMemo(() => looseRows(traces, new Set(pages.map((p) => p.id))), [traces, pages]);
  const page = selected ? byId.get(selected) : void 0;
  const showInspector = !!page && (!sheet || inspecting);
  useEffect4(() => {
    if (!sheet || !showInspector) return;
    const onKey = (e) => {
      if (e.key === "Escape") setInspecting(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, showInspector]);
  const footer = /* @__PURE__ */ jsxs6(Fragment4, { children: [
    (filter === "all" || filter === "attention") && !query && loose.length > 0 && /* @__PURE__ */ jsxs6("section", { "aria-labelledby": "site-map-loose", "data-loose": true, className: "mt-6 border-t border-border", children: [
      /* @__PURE__ */ jsx6("h2", { id: "site-map-loose", className: "px-4 pb-1 pt-4 text-[13px] font-semibold md:px-6", children: "Redirects that reach no page" }),
      /* @__PURE__ */ jsx6("p", { className: "px-4 pb-2 text-xs text-foreground/70 md:px-6", children: "Loops and addresses that leave the site. Every other redirect sits on the page it reaches." }),
      /* @__PURE__ */ jsx6(LooseRedirects, { traces: loose, onOpen: onOpenRedirect })
    ] }),
    filter === "all" && !query && /* @__PURE__ */ jsx6(SiteParts, { parts, onOpen }),
    sheet && showInspector && /* @__PURE__ */ jsx6("div", { "aria-hidden": true, className: "h-[60dvh]" })
  ] });
  const viewProps = {
    roots,
    pages,
    byId,
    summary,
    traces,
    filter,
    query,
    filtering,
    keep,
    matched,
    selected,
    onSelect: (id) => select(id),
    onOpenPage: (id) => {
      const p = byId.get(id);
      if (p) onOpen({ kind: "page", page: p });
    },
    footer
  };
  return /* @__PURE__ */ jsxs6("div", { className: cn6("flex h-full min-h-0 flex-col bg-background text-foreground", className), "data-site-map-view": view, children: [
    /* @__PURE__ */ jsx6(
      SiteMapHeader,
      {
        siteName,
        summary,
        filter,
        onFilter: setFilter,
        query,
        onQuery: setQuery,
        view,
        onView: setView,
        actions
      }
    ),
    /* @__PURE__ */ jsxs6("div", { className: cn6("grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)]", showInspector && !sheet && "lg:grid-cols-[minmax(0,1fr)_23rem]"), children: [
      view === "outline" && /* @__PURE__ */ jsx6(OutlineView, { ...viewProps }),
      view === "canvas" && /* @__PURE__ */ jsx6(CanvasView, { ...viewProps }),
      view === "columns" && /* @__PURE__ */ jsx6(ColumnsView, { ...viewProps }),
      showInspector && page && /* @__PURE__ */ jsx6("div", { className: cn6(sheet ? "fixed inset-x-0 bottom-0 z-20" : "min-h-0 border-l border-border"), children: /* @__PURE__ */ jsx6(
        PageInspector,
        {
          page,
          parent: page.parentId ? byId.get(page.parentId) : void 0,
          onSelect: (id) => select(id),
          onClose: () => sheet ? setInspecting(false) : select(null),
          sheet,
          onOpen,
          onPageSettings,
          onAddRedirect,
          onOpenRedirect,
          onFileAction
        }
      ) })
    ] })
  ] });
}
export {
  PageInspector,
  SITE_MAP_VIEW_KEY,
  SiteMap,
  SiteParts,
  ViewToggle,
  browserViewStore,
  buildTree,
  issuesFor,
  looseTraces,
  summarize
};
//# sourceMappingURL=sitemap.js.map