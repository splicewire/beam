// src/Gallery.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@schemastud/ui";

// src/cn.ts
function collect(input, out) {
  if (!input) return;
  if (typeof input === "string" || typeof input === "number") {
    out.push(String(input));
    return;
  }
  if (Array.isArray(input)) {
    for (const item of input) collect(item, out);
    return;
  }
  for (const [key, active] of Object.entries(input)) {
    if (active) out.push(key);
  }
}
var cn = (...inputs) => {
  const out = [];
  for (const input of inputs) collect(input, out);
  return out.join(" ");
};

// src/discovery.ts
var NAMESPACE_DEFAULT = "/_prototype";
var DIR_MARKER = "_prototype/";
function relPath(path) {
  const at = path.indexOf(DIR_MARKER);
  return at === -1 ? path.replace(/^\.\//, "") : path.slice(at + DIR_MARKER.length);
}
function parsePrototypePath(path) {
  const rel = relPath(path);
  const parts = rel.split("/");
  const isExcluded = parts.slice(0, -1).some((seg) => seg.startsWith("_"));
  const dir = parts.length > 1 ? parts[0] : "root";
  const base = parts[parts.length - 1].replace(/\.tsx$/, "");
  const m = base.match(/^(ar)?(\d+)-(.*)$/);
  return { dir, slug: m ? m[3] : base, ticket: m ? m[2] : null, isExcluded };
}

// src/Gallery.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function toTitle(slug) {
  const s = slug.replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function toEntries(glob) {
  return Object.keys(glob).map(parsePrototypePath).filter((p) => !p.isExcluded).map(({ dir, slug, ticket }) => ({ dir, slug, ticket, title: toTitle(slug) })).sort(
    (a, b) => a.dir.localeCompare(b.dir) || (a.ticket ?? "").localeCompare(b.ticket ?? "") || a.slug.localeCompare(b.slug)
  );
}
function Gallery({ glob, namespace = NAMESPACE_DEFAULT, cn: cn2 = cn }) {
  const entries = useMemo(() => toEntries(glob), [glob]);
  const dirs = useMemo(() => Array.from(new Set(entries.map((e) => e.dir))).sort(), [entries]);
  const [filter, setFilter] = useState("all");
  const shownDirs = useMemo(() => filter === "all" ? dirs : [filter], [filter, dirs]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx("header", { className: "border-b border-border py-6", children: /* @__PURE__ */ jsxs(
      "div",
      {
        "data-testid": "gallery-header",
        className: "mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4 px-8",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Prototype gallery" }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "font-mono text-[10px] uppercase", children: "dev \xB7 throwaway" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
              entries.length,
              " real-React prototypes across ",
              dirs.length,
              " ",
              dirs.length === 1 ? "group" : "groups",
              ", auto-discovered from the prototype glob. Many carry a",
              " ",
              /* @__PURE__ */ jsx("code", { className: "font-mono text-xs", children: "?variant" }),
              " switcher."
            ] })
          ] }),
          dirs.length > 1 && /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Filter" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: filter,
                onChange: (e) => setFilter(e.target.value),
                className: "rounded-md border border-input bg-background px-2.5 py-1.5 text-sm shadow-sm",
                children: [
                  /* @__PURE__ */ jsxs("option", { value: "all", children: [
                    "All groups (",
                    entries.length,
                    ")"
                  ] }),
                  dirs.map((d) => /* @__PURE__ */ jsxs("option", { value: d, children: [
                    d,
                    " (",
                    entries.filter((e) => e.dir === d).length,
                    ")"
                  ] }, d))
                ]
              }
            )
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx("main", { "data-testid": "gallery-main", className: "mx-auto max-w-5xl space-y-10 px-8 py-8", children: shownDirs.map((dir) => {
      const rows = entries.filter((e) => e.dir === dir);
      if (!rows.length) return null;
      return /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("h2", { className: "font-mono text-[11px] uppercase tracking-wide text-muted-foreground", children: [
          dir,
          " \xB7 ",
          rows.length
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: rows.map((e) => /* @__PURE__ */ jsx(
          Link,
          {
            to: `${namespace}/${e.slug}`,
            className: cn2(
              "group block rounded-lg transition-transform hover:-translate-y-0.5"
            ),
            children: /* @__PURE__ */ jsx(Card, { className: "h-full transition-colors group-hover:border-primary/50", children: /* @__PURE__ */ jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                e.ticket && /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-primary", children: e.ticket }),
                /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: e.title })
              ] }),
              /* @__PURE__ */ jsxs(CardDescription, { className: "font-mono text-[11px]", children: [
                namespace,
                "/",
                e.slug
              ] })
            ] }) })
          },
          e.slug
        )) })
      ] }, dir);
    }) })
  ] });
}

export {
  NAMESPACE_DEFAULT,
  parsePrototypePath,
  cn,
  Gallery
};
//# sourceMappingURL=chunk-6GCWUJNE.js.map