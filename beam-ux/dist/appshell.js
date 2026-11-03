// src/appshell/shellMode.ts
import { useCallback, useMemo, useState } from "react";
function createEffectiveCan(storeCan, viewAsVisitor, previewStripCapability) {
  return (capability) => {
    if (viewAsVisitor && previewStripCapability && capability === previewStripCapability) {
      return false;
    }
    return storeCan(capability);
  };
}
function useShellMode({
  storeCan,
  previewStripCapability,
  initialMode = "desk"
}) {
  const [mode, setMode] = useState(initialMode);
  const [viewAsVisitor, setViewAsVisitor] = useState(false);
  const effectiveCan = useCallback(
    (capability) => createEffectiveCan(storeCan, viewAsVisitor, previewStripCapability)(capability),
    [storeCan, viewAsVisitor, previewStripCapability]
  );
  const windowChrome = useMemo(
    () => ({
      enterWindow: () => setMode("window"),
      exitWindow: () => {
        setViewAsVisitor(false);
        setMode("desk");
      },
      viewAsVisitor,
      setViewAsVisitor
    }),
    [viewAsVisitor]
  );
  const focusChrome = useMemo(
    () => ({
      enterFocus: () => setMode("focus"),
      exitFocus: () => setMode("desk"),
      active: mode === "focus"
    }),
    [mode]
  );
  return { mode, setMode, effectiveCan, viewAsVisitor, windowChrome, focusChrome };
}

// src/appshell/SectionShell.tsx
import { jsx } from "react/jsx-runtime";
var SHELL_VARIANTS = {
  /** KnowledgeLayout / ComplianceLayout — a spaced full-width column. */
  stack: "space-y-4",
  /** SettingsLayout — a centered, capped column. */
  contained: "mx-auto max-w-5xl"
};
function SectionShell({ children, variant = "stack", className }) {
  return /* @__PURE__ */ jsx("div", { className: className ?? SHELL_VARIANTS[variant], children });
}
var STRIP_DEFAULTS = {
  /** Section / meta-area strip: the primary sub-tab nav. */
  nav: "flex items-center gap-1",
  /** Group / record strip: a divider-separated secondary strip. */
  navDivided: "flex items-center gap-1 border-l border-border/60 pl-3"
};
function SectionTabStrip({
  tabs,
  linkComponent: Link,
  ariaLabel,
  variant = "primary",
  className
}) {
  if (tabs.length === 0) return null;
  const navClass = className ?? (variant === "divided" ? STRIP_DEFAULTS.navDivided : STRIP_DEFAULTS.nav);
  return /* @__PURE__ */ jsx("nav", { className: navClass, "aria-label": ariaLabel, children: tabs.map((tab) => /* @__PURE__ */ jsx(Link, { to: tab.path, end: tab.end, children: tab.label }, tab.path)) });
}

// src/appshell/sectionMeta.ts
function navGroupForPath(section, pathname) {
  return (section?.groups ?? []).filter((g) => pathname === g.match || pathname.startsWith(`${g.match}/`)).sort((a, b) => b.match.length - a.match.length)[0];
}
function sectionMetaForPath(sections, pathname) {
  return [...sections].filter((s) => pathname === s.match || pathname.startsWith(`${s.match}/`)).sort((a, b) => b.match.length - a.match.length)[0];
}
function metaAreaForPath(areas, pathname) {
  return areas.find((a) => pathname === a.match || pathname.startsWith(`${a.match}/`));
}
function metaAreaCrumbs(areas, pathname) {
  const area = metaAreaForPath(areas, pathname);
  if (!area) return void 0;
  const tab = [...area.tabs].sort((a, b) => b.path.length - a.path.length).find((t) => pathname === t.path || pathname.startsWith(`${t.path}/`));
  const crumbs = [{ label: area.root.label, path: area.root.path }];
  if (tab) crumbs.push({ label: tab.label });
  return crumbs;
}

// src/appshell/FrameSidePanelOverlay.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@schemastud/ui";
import { useFrameSidePanelStore } from "@schemastud/frame";
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
function FrameSidePanelOverlay() {
  const panels = useFrameSidePanelStore((s) => s.panels);
  return /* @__PURE__ */ jsx2(Fragment, { children: panels.map((panel) => /* @__PURE__ */ jsx2(Sheet, { open: panel.open, onOpenChange: panel.onOpenChange, children: /* @__PURE__ */ jsxs(SheetContent, { side: "right", className: "sm:max-w-md", children: [
    panel.title ? /* @__PURE__ */ jsx2(SheetHeader, { children: /* @__PURE__ */ jsx2(SheetTitle, { children: panel.title }) }) : null,
    panel.children
  ] }) }, panel.id)) });
}

// src/appshell/AppShell.tsx
import { useMemo as useMemo2 } from "react";
import {
  createMainframeRegistry,
  createSlotRegistry,
  MainframeOutlet,
  MainframeProvider
} from "@schemastud/mainframe";

// src/appshell/DeskMainframe.tsx
import { Fragment as Fragment2 } from "react";
import {
  Button,
  Sheet as Sheet2,
  SheetContent as SheetContent2,
  SheetTitle as SheetTitle2,
  SheetTrigger
} from "@schemastud/ui";
import { PanelLeft } from "lucide-react";
import { cn } from "@schemastud/ui";
import { Fragment as Fragment3, jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function DeskMainframe({
  slots,
  ctx
}) {
  const canvas = ctx.canvas === "flat" ? "bg-background" : "dotted-bg";
  const navigation = ctx.navigation;
  const mobile = navigation?.mobile ?? false;
  const rail = /* @__PURE__ */ jsxs2(Fragment3, { children: [
    slots.node("brand"),
    slots.node("rail"),
    slots.node("railFooter")
  ] });
  return /* @__PURE__ */ jsx3(
    Sheet2,
    {
      open: mobile && navigation?.open,
      onOpenChange: navigation?.onOpenChange,
      children: /* @__PURE__ */ jsxs2("div", { className: "flex h-dvh overflow-hidden", children: [
        !mobile && /* @__PURE__ */ jsx3("aside", { className: "flex w-[216px] flex-none flex-col bg-sidebar-deep py-[18px] text-sidebar-foreground", children: rail }),
        /* @__PURE__ */ jsxs2("div", { className: "flex min-w-0 flex-1 flex-col", children: [
          /* @__PURE__ */ jsxs2("div", { className: "flex flex-none flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2 md:flex-nowrap md:gap-3 md:px-6", children: [
            mobile && /* @__PURE__ */ jsx3(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsx3(
              Button,
              {
                variant: "ghost",
                size: "icon",
                className: "size-11 flex-none",
                "aria-label": "Open navigation",
                children: /* @__PURE__ */ jsx3(PanelLeft, {})
              }
            ) }),
            /* @__PURE__ */ jsx3("div", { className: "order-last min-w-0 basis-full md:order-none md:basis-auto md:flex-1", children: slots.node("topBar.lead") }),
            /* @__PURE__ */ jsx3("div", { className: "ml-auto flex flex-none items-center gap-2 md:gap-3", children: renderItems(slots.items("topBar.actions", "end")) })
          ] }),
          /* @__PURE__ */ jsx3(
            "main",
            {
              className: cn(
                "min-h-0 min-w-0 flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-6",
                canvas
              ),
              children: slots.main(ctx.payload)
            }
          )
        ] }),
        mobile && /* @__PURE__ */ jsxs2(
          SheetContent2,
          {
            side: "left",
            "aria-describedby": void 0,
            className: "w-[min(20rem,calc(100vw-2rem))] gap-0 overflow-y-auto bg-sidebar-deep p-0 py-[18px] text-sidebar-foreground",
            children: [
              /* @__PURE__ */ jsx3(SheetTitle2, { className: "sr-only", children: "Navigation" }),
              rail
            ]
          }
        ),
        renderItems(slots.items("overlay"))
      ] })
    }
  );
}
function renderItems(items) {
  return items.map((node, i) => /* @__PURE__ */ jsx3(Fragment2, { children: node }, i));
}

// src/appshell/WindowMainframe.tsx
import { Fragment as Fragment4 } from "react";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function WindowMainframe({ slots, ctx }) {
  return /* @__PURE__ */ jsxs3("div", { className: "relative h-screen w-screen overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsx4("div", { className: "h-full w-full overflow-y-auto", children: slots.main(ctx.payload) }),
    renderItems2(slots.items("windowEdit"))
  ] });
}
function renderItems2(items) {
  return items.map((node, i) => /* @__PURE__ */ jsx4(Fragment4, { children: node }, i));
}

// src/appshell/FocusMainframe.tsx
import { Fragment as Fragment5 } from "react";
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function FocusMainframe({ slots, ctx }) {
  return /* @__PURE__ */ jsxs4("div", { className: "relative h-screen w-screen overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsx5("div", { className: "h-full w-full overflow-y-auto", children: slots.main(ctx.payload) }),
    renderItems3(slots.items("focusExit"))
  ] });
}
function renderItems3(items) {
  return items.map((node, i) => /* @__PURE__ */ jsx5(Fragment5, { children: node }, i));
}

// src/appshell/AppShell.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function AppShell({
  mode,
  can,
  context,
  contribute,
  outlet,
  routeKey,
  unframed = false
}) {
  const registries = useMemo2(() => {
    const slots = createSlotRegistry();
    const mainframes = createMainframeRegistry();
    mainframes.register("desk", DeskMainframe);
    mainframes.register("window", WindowMainframe, {
      slots: [{ name: "windowEdit", fillType: "ordered-multi-source" }]
    });
    mainframes.register("focus", FocusMainframe, {
      slots: [{ name: "focusExit", fillType: "ordered-multi-source" }]
    });
    slots.contribute({
      slot: "main",
      key: "beam.app.main",
      render: (payload) => {
        const p = payload;
        if (p.unframed) return p.outlet;
        return /* @__PURE__ */ jsx6(
          "div",
          {
            className: "route-enter min-w-0 max-w-full",
            children: p.outlet
          },
          p.routeKey
        );
      }
    });
    contribute?.(slots);
    return { slots, mainframes };
  }, [contribute]);
  const injection = useMemo2(
    () => ({ ...registries, can }),
    [registries, can]
  );
  return /* @__PURE__ */ jsx6(MainframeProvider, { injection, children: /* @__PURE__ */ jsx6(MainframeOutlet, { mode, ctx: { ...context, payload: { outlet, routeKey, unframed } } }) });
}

// src/appshell/AppRail.tsx
import { Fragment as Fragment6 } from "react";
import { cn as cn2 } from "@schemastud/ui";
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
var Anchor = (props) => /* @__PURE__ */ jsx7("a", { ...props });
function AppRail({
  groups,
  Link = Anchor,
  isActive,
  label = "Navigation",
  className = "min-w-0 space-y-4 px-3",
  renderItem,
  renderGroup
}) {
  return /* @__PURE__ */ jsx7("nav", { "aria-label": label, className, children: groups.filter((group) => group.items.length > 0).map((group) => {
    const items = group.items.map((item) => {
      const active = isActive?.(item.href) ?? false;
      return /* @__PURE__ */ jsx7(Fragment6, { children: renderItem ? renderItem(item, { active }) : /* @__PURE__ */ jsx7("li", { children: /* @__PURE__ */ jsxs5(
        Link,
        {
          href: item.href,
          "aria-current": active ? "page" : void 0,
          className: cn2(
            "flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-sm",
            active ? "bg-sidebar-accent text-sidebar-active-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          ),
          children: [
            item.icon,
            /* @__PURE__ */ jsx7("span", { className: "min-w-0 break-words", children: item.title })
          ]
        }
      ) }) }, item.id);
    });
    return /* @__PURE__ */ jsx7(Fragment6, { children: renderGroup ? renderGroup(group, items) : /* @__PURE__ */ jsxs5("section", { "aria-label": group.label, children: [
      /* @__PURE__ */ jsx7("h2", { className: "px-3 text-xs font-medium text-sidebar-foreground/60", children: group.label }),
      /* @__PURE__ */ jsx7("ul", { className: "space-y-1", children: items })
    ] }) }, group.id);
  }) });
}

// src/appshell/createBeamApp.tsx
import { createContext, useContext } from "react";
import { jsx as jsx8 } from "react/jsx-runtime";
function createBeamApp({ runtime, Providers }) {
  const RuntimeContext = createContext(null);
  const value = { value: runtime };
  function useRuntime() {
    const current = useContext(RuntimeContext);
    if (!current) throw new Error("App runtime must be read inside its own App.");
    return current.value;
  }
  function Provider({ children }) {
    return /* @__PURE__ */ jsx8(RuntimeContext.Provider, { value, children: Providers ? /* @__PURE__ */ jsx8(Providers, { children }) : children });
  }
  function App(props) {
    return /* @__PURE__ */ jsx8(Provider, { children: /* @__PURE__ */ jsx8(AppShell, { ...props }) });
  }
  return { runtime, App, Provider, useRuntime };
}
export {
  AppRail,
  AppShell,
  DeskMainframe,
  FocusMainframe,
  FrameSidePanelOverlay,
  SectionShell,
  SectionTabStrip,
  WindowMainframe,
  createBeamApp,
  createEffectiveCan,
  metaAreaCrumbs,
  metaAreaForPath,
  navGroupForPath,
  sectionMetaForPath,
  useShellMode
};
//# sourceMappingURL=appshell.js.map