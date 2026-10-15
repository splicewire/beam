import {
  Gallery,
  NAMESPACE_DEFAULT,
  cn,
  parsePrototypePath
} from "./chunk-6GCWUJNE.js";

// src/createPrototypeRoutes.tsx
import { jsx } from "react/jsx-runtime";
function createPrototypeRoutes(glob, opts = {}) {
  const namespace = opts.namespace ?? NAMESPACE_DEFAULT;
  const withGallery = opts.gallery ?? true;
  const prototypeRoutes = Object.entries(glob).flatMap(([path, load]) => {
    const { slug, isExcluded } = parsePrototypePath(path);
    if (isExcluded) return [];
    return [
      {
        path: `${namespace}/${slug}`,
        lazy: async () => {
          const mod = await load();
          const named = Object.entries(mod).find(([k]) => k.endsWith("Prototype"));
          return {
            Component: named?.[1] ?? mod.default
          };
        }
      }
    ];
  });
  if (!withGallery) return prototypeRoutes;
  const galleryRoute = {
    path: namespace,
    lazy: async () => {
      const { Gallery: Gallery2 } = await import("./Gallery-HN6CAL5Y.js");
      return {
        Component: () => /* @__PURE__ */ jsx(Gallery2, { glob, namespace, cn: opts.cn })
      };
    }
  };
  return [galleryRoute, ...prototypeRoutes];
}

// src/VariantBar.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function VariantBar({
  variants,
  active,
  onSelect,
  hint = "variant \u2190/\u2192",
  cn: cn2 = cn
}) {
  return /* @__PURE__ */ jsxs("div", { className: "fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-card px-2 py-1.5 text-xs shadow-lg", children: [
    /* @__PURE__ */ jsx2("span", { className: "px-2 text-muted-foreground", children: hint }),
    variants.map((v) => /* @__PURE__ */ jsx2(
      "button",
      {
        type: "button",
        onClick: () => onSelect(v.key),
        className: cn2(
          "rounded-full px-3 py-1 font-medium transition-colors",
          v.key === active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
        ),
        children: v.label
      },
      v.key
    ))
  ] });
}

// src/SettingsFrame.tsx
import "react";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function SettingsFrame({
  active,
  tabs,
  children,
  title = "Settings",
  cn: cn2 = cn
}) {
  return /* @__PURE__ */ jsxs2("div", { className: "mx-auto max-w-5xl space-y-6", children: [
    /* @__PURE__ */ jsx3("h1", { className: "text-xl font-semibold tracking-tight", children: title }),
    /* @__PURE__ */ jsxs2("div", { className: "flex flex-col gap-6 md:flex-row", children: [
      /* @__PURE__ */ jsx3("nav", { className: "flex shrink-0 gap-1 overflow-x-auto md:w-44 md:flex-col", children: tabs.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        return /* @__PURE__ */ jsxs2(
          "div",
          {
            className: cn2(
              "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            ),
            children: [
              /* @__PURE__ */ jsx3(Icon, { className: "size-4" }),
              label
            ]
          },
          key
        );
      }) }),
      /* @__PURE__ */ jsx3("div", { className: "min-w-0 flex-1 space-y-6", children })
    ] })
  ] });
}

// src/PrototypeDesk.tsx
import "react";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function Rail({
  groups,
  active,
  BrandComponent,
  cn: cn2
}) {
  return /* @__PURE__ */ jsxs3("aside", { className: "flex w-[216px] flex-none flex-col bg-sidebar-deep py-[18px] text-sidebar-foreground", children: [
    /* @__PURE__ */ jsx4("div", { className: "flex items-center gap-[9px] px-[18px] pb-[22px] text-[17px] font-semibold tracking-tight text-sidebar-active-foreground", children: BrandComponent && /* @__PURE__ */ jsx4(BrandComponent, {}) }),
    /* @__PURE__ */ jsx4("nav", { className: "flex-1 space-y-4 overflow-y-auto px-2.5", children: groups.map((group, gi) => /* @__PURE__ */ jsxs3("div", { className: "space-y-0.5", children: [
      group.label && /* @__PURE__ */ jsx4("div", { className: "px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-sidebar-foreground/55", children: group.label }),
      group.items.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === active;
        return /* @__PURE__ */ jsxs3(
          "div",
          {
            className: cn2(
              "flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-2.5 py-2 text-[13px] transition-colors",
              isActive ? "border-sidebar-primary bg-sidebar-accent font-medium text-sidebar-active-foreground" : "text-sidebar-foreground/85 hover:bg-sidebar-accent/40"
            ),
            children: [
              /* @__PURE__ */ jsx4(Icon, { className: "size-[17px] flex-none opacity-90", strokeWidth: 1.75 }),
              /* @__PURE__ */ jsx4("span", { className: "min-w-0 flex-1 truncate", children: item.label }),
              item.proposed && /* @__PURE__ */ jsx4(
                "span",
                {
                  className: "size-1.5 flex-none rounded-full ring-1 ring-sidebar-primary/70",
                  title: `Proposed by the redesign${item.ticket ? ` (ticket ${item.ticket})` : ""} \u2014 not in today's rail`
                }
              )
            ]
          },
          item.key
        );
      })
    ] }, gi)) }),
    /* @__PURE__ */ jsxs3("div", { className: "mt-1 flex items-center gap-2 px-4 py-1 text-[10px] text-sidebar-foreground/45", children: [
      /* @__PURE__ */ jsx4("span", { className: "size-1.5 flex-none rounded-full ring-1 ring-sidebar-primary/70" }),
      "proposed by the redesign"
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "mt-2 space-y-1 px-3 pt-3", children: [
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2 rounded-md bg-sidebar-accent/50 px-2.5 py-1.5 text-[12px] text-sidebar-active-foreground", children: [
        /* @__PURE__ */ jsx4("span", { className: "grid size-5 flex-none place-items-center rounded bg-sidebar-primary/25 text-[9px] font-bold text-sidebar-active-foreground", children: "BI" }),
        /* @__PURE__ */ jsx4("span", { className: "min-w-0 flex-1 truncate", children: "tenant: billing-demo" }),
        /* @__PURE__ */ jsx4("span", { className: "text-sidebar-foreground/50", children: "\u2304" })
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-sidebar-foreground/75", children: [
        /* @__PURE__ */ jsx4("span", { className: "grid size-5 flex-none place-items-center rounded-full bg-sidebar-avatar text-[9px] font-semibold text-sidebar-active-foreground", children: "S" }),
        /* @__PURE__ */ jsx4("span", { className: "min-w-0 flex-1 truncate", children: "Stephen Rushing" })
      ] })
    ] })
  ] });
}
function PrototypeDesk({
  nav,
  BrandComponent,
  active,
  breadcrumb,
  actions,
  canvas = "dotted",
  children,
  overlay,
  cn: cn2 = cn
}) {
  return /* @__PURE__ */ jsxs3("div", { className: "flex h-screen overflow-hidden", children: [
    /* @__PURE__ */ jsx4(Rail, { groups: nav, active, BrandComponent, cn: cn2 }),
    /* @__PURE__ */ jsxs3("div", { className: "flex min-w-0 flex-1 flex-col", children: [
      /* @__PURE__ */ jsxs3(
        "div",
        {
          "data-testid": "desk-topbar",
          className: "flex min-h-12 flex-none items-center gap-3 border-b border-border bg-card px-6 py-2",
          children: [
            /* @__PURE__ */ jsx4("div", { className: "min-w-0 flex-1 text-sm", children: breadcrumb }),
            /* @__PURE__ */ jsx4("div", { className: "flex items-center gap-2", children: actions })
          ]
        }
      ),
      /* @__PURE__ */ jsx4(
        "main",
        {
          "data-canvas": canvas,
          className: cn2(
            "canvas-surface flex-1 overflow-y-auto px-6 py-6",
            canvas === "flat" ? "bg-background" : "dotted-bg"
          ),
          children
        }
      )
    ] }),
    overlay
  ] });
}
function Crumb({ trail }) {
  return /* @__PURE__ */ jsx4("div", { className: "flex items-center gap-1.5 font-medium text-muted-foreground", children: trail.map((part, i) => /* @__PURE__ */ jsxs3("span", { className: "flex items-center gap-1.5", children: [
    i > 0 && /* @__PURE__ */ jsx4("span", { className: "text-muted-foreground/50", children: "\u203A" }),
    /* @__PURE__ */ jsx4("span", { className: i === trail.length - 1 ? "text-foreground" : void 0, children: part })
  ] }, i)) });
}
export {
  Crumb,
  Gallery,
  PrototypeDesk,
  SettingsFrame,
  VariantBar,
  cn,
  createPrototypeRoutes
};
//# sourceMappingURL=index.js.map