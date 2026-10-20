import {
  PlatformConnectionPanel,
  createPlatformConnectionClient
} from "./chunk-CPMRENLV.js";
import {
  AppSidebarLayout,
  OperatorLayout,
  TooltipProvider
} from "./chunk-GEE7ZNUZ.js";
import "./chunk-O7ZKQDZR.js";
import "./chunk-BBYPLYMO.js";
import {
  SiteLayout
} from "./chunk-J5BI4QL2.js";
import {
  InertiaEditorKit
} from "./chunk-N65CBBMK.js";
import {
  bodyClient
} from "./chunk-O72DNJUK.js";
import {
  BeamAccountLayout
} from "./chunk-DKZRPX6S.js";
import {
  AppLogoIcon,
  brandTitle,
  useCurrentUrl
} from "./chunk-44FAKLSM.js";
import {
  resolveBeamPage
} from "./chunk-4AX6DJVW.js";
import "./chunk-WB76RVEA.js";
import "./chunk-QMLU62K5.js";
import {
  initializeTheme,
  useAppearance
} from "./chunk-6C5PVJOV.js";
import {
  Heading
} from "./chunk-C5OGDGGA.js";
import {
  Separator
} from "./chunk-L5EIPFNI.js";
import "./chunk-563T736C.js";
import {
  authFeaturesFrom,
  configureBeamInertia,
  featureEnabled
} from "./chunk-MTKP2AW3.js";
import "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import {
  cn,
  toUrl
} from "./chunk-GBIJGQ7E.js";

// src/index.tsx
import { Link as Link4 } from "@inertiajs/react";
import { configureEntryPage } from "@splicewire/beam-ux/docs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// src/hooks/use-flash-toast.ts
import { router } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";
function useFlashToast() {
  useEffect(() => {
    return router.on("flash", (event) => {
      const flash = event.detail?.flash;
      const data = flash?.toast;
      if (!data) {
        return;
      }
      toast[data.type](data.message);
    });
  }, []);
}

// src/components/ui/sonner.tsx
import { Toaster as Sonner } from "sonner";
import { jsx } from "react/jsx-runtime";
function Toaster({ ...props }) {
  const { appearance } = useAppearance();
  useFlashToast();
  return /* @__PURE__ */ jsx(
    Sonner,
    {
      theme: appearance,
      className: "toaster group",
      position: "bottom-right",
      style: {
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)"
      },
      ...props
    }
  );
}

// src/layouts/app-layout.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function AppLayout({
  breadcrumbs = [],
  children
}) {
  return /* @__PURE__ */ jsx2(AppSidebarLayout, { breadcrumbs, children });
}

// src/layouts/auth/auth-simple-layout.tsx
import { Link } from "@inertiajs/react";
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
function AuthSimpleLayout({
  children,
  title,
  description
}) {
  return /* @__PURE__ */ jsx3("div", { className: "flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10", children: /* @__PURE__ */ jsx3("div", { className: "w-full max-w-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: "/",
          className: "flex flex-col items-center gap-2 font-medium",
          children: [
            /* @__PURE__ */ jsx3("div", { className: "mb-1 flex h-9 w-9 items-center justify-center rounded-md", children: /* @__PURE__ */ jsx3(AppLogoIcon, { className: "size-9 fill-current text-[var(--foreground)] dark:text-white" }) }),
            /* @__PURE__ */ jsx3("span", { className: "sr-only", children: title })
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-center", children: [
        /* @__PURE__ */ jsx3("h1", { className: "text-xl font-medium", children: title }),
        /* @__PURE__ */ jsx3("p", { className: "text-center text-sm text-muted-foreground", children: description })
      ] })
    ] }),
    children
  ] }) }) });
}

// src/layouts/auth-layout.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
function AuthLayout({
  title = "",
  description = "",
  children
}) {
  return /* @__PURE__ */ jsx4(AuthSimpleLayout, { title, description, children });
}

// src/layouts/beam-ux/mainframe-host.tsx
import { usePage } from "@inertiajs/react";
import {
  createMainframeHost,
  useBeamUxEntry as useBeamUxEntryBase
} from "@splicewire/beam-mainframe";
import { CanvasOrRefusal } from "@splicewire/beam-ux/editor";
import { lazy, Suspense } from "react";
import { CanvasOrRefusal as CanvasOrRefusal2 } from "@splicewire/beam-ux/editor";
import { jsx as jsx5 } from "react/jsx-runtime";
var VisualEditorMount = lazy(
  () => import("./mount-J4LB75J3.js").then((m) => ({ default: m.VisualEditorMount }))
);
var SELF_MANAGED_COMPONENTS = /* @__PURE__ */ new Set(["site/home", "site/entry"]);
var currentComponent = "";
var ribbon = () => null;
async function loadEntryBody(ref) {
  if (ref.id === null) {
    return null;
  }
  try {
    return await bodyClient.loadBody(ref.id);
  } catch {
    return null;
  }
}
var mainframe_host_default = createMainframeHost({
  // Every starter route page renders its OWN body (its layout chrome + scoped CSS). So read mode must
  // NOT swap the page for the bare entry body. Author (window) mode still opens the in-place editor.
  readMode: "page",
  usePageContext: () => {
    const page = usePage();
    currentComponent = page.component;
    const entry = page.props.entry;
    const explicit = typeof page.props.slug === "string" && page.props.slug !== "" ? page.props.slug : null;
    return {
      component: page.component,
      canAuthor: page.props.auth?.canAuthorUx === true,
      slug: explicit ?? (typeof entry?.slug === "string" && entry.slug !== "" ? entry.slug : null),
      // The ID half of the same prop — the branch that replaced `componentToEntry`. Shared by
      // `App\Support\PageEntryRef` for a hand-written page, and by the package's
      // `PublicEntryController` (ADR-0209 §6) for a RENDERED entry, which has carried it all along.
      entryId: typeof entry?.id === "string" && entry.id !== "" ? entry.id : null,
      // The BODY LANGUAGE half. `PublicEntryController` has always put it in `props.entry.format`
      // and `App\\Support\\PageEntryRef` now does too; the host simply never read it, which is
      // how the JsonDoc canvas came to be offered on the mdx `/docs` entry and blanked it on Save
      // (G2-BEAM-AUTHOR-ENTRY, 2026-09-11). Null means the page did not say.
      entryFormat: typeof entry?.format === "string" && entry.format !== "" ? entry.format : null
    };
  },
  loadEntryBody,
  ribbon,
  renderEditor: ({ ref }) => SELF_MANAGED_COMPONENTS.has(currentComponent) || ref.id === null ? null : /* @__PURE__ */ jsx5(CanvasOrRefusal, { entry: ref, children: /* @__PURE__ */ jsx5(
    Suspense,
    {
      fallback: /* @__PURE__ */ jsx5("div", { className: "p-6 text-sm text-slate-500", children: "Loading editor\u2026" }),
      children: /* @__PURE__ */ jsx5(VisualEditorMount, { entryRef: ref })
    }
  ) }),
  // readMode: 'page' means the read fork renders the real page, never this — so it's a no-op. Kept only
  // to satisfy the factory's renderer contract.
  renderRead: () => null,
  renderInspector: ({ ref }) => SELF_MANAGED_COMPONENTS.has(currentComponent) || ref.id === null ? null : /* @__PURE__ */ jsx5(CanvasOrRefusal, { entry: ref, children: /* @__PURE__ */ jsx5(Suspense, { fallback: null, children: /* @__PURE__ */ jsx5(VisualEditorMount, { entryRef: ref }) }) })
});

// src/editor/entry-body-editor.tsx
import { EditableEntryBody as KitComponent } from "@splicewire/beam-ux/editor";
import { jsx as jsx6 } from "react/jsx-runtime";
function EditableEntryBody(props) {
  return /* @__PURE__ */ jsx6(InertiaEditorKit, { children: /* @__PURE__ */ jsx6(KitComponent, { ...props }) });
}

// src/layouts/os-layout.tsx
import { usePage as usePage3 } from "@inertiajs/react";
import { useEffect as useEffect2 } from "react";

// src/os/operator-desk.tsx
import { router as router2, usePage as usePage2 } from "@inertiajs/react";
import { OperatorDesk as Desk } from "@splicewire/beam-ux/desk";
import { Suspense as Suspense3, lazy as lazy3 } from "react";

// src/os/page-properties.tsx
import { lazy as lazy2, Suspense as Suspense2 } from "react";
import { jsx as jsx7, jsxs as jsxs2 } from "react/jsx-runtime";
var EntryPropertiesForm = lazy2(() => import("./entry-properties-form-24F62CGA.js"));
function PageProperties({
  slug,
  entryId = null,
  editable,
  editing,
  onEditContent,
  onExitContent
}) {
  return /* @__PURE__ */ jsxs2("div", { className: "pp", children: [
    /* @__PURE__ */ jsx7("style", { dangerouslySetInnerHTML: { __html: PP_CSS } }),
    /* @__PURE__ */ jsxs2("div", { className: "pp-head", children: [
      /* @__PURE__ */ jsxs2("div", { className: "pp-row pp-meta", children: [
        /* @__PURE__ */ jsxs2("span", { children: [
          "slug ",
          /* @__PURE__ */ jsx7("b", { children: slug })
        ] }),
        /* @__PURE__ */ jsx7("span", { className: editable ? "pp-pub on" : "pp-pub", children: editable ? "\u25CF editable" : "\u25CB read-only" })
      ] }),
      /* @__PURE__ */ jsx7("div", { className: "pp-actions", children: editing ? /* @__PURE__ */ jsx7(
        "button",
        {
          type: "button",
          className: "pp-btn",
          onClick: onExitContent,
          children: "\u2715 Exit editing"
        }
      ) : /* @__PURE__ */ jsx7(
        "button",
        {
          type: "button",
          className: "pp-btn primary",
          disabled: !editable,
          onClick: onEditContent,
          children: "\u270E Edit content"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx7("div", { className: "pp-form", "data-beam-entry-properties": slug, children: entryId ? /* @__PURE__ */ jsx7(
      Suspense2,
      {
        fallback: /* @__PURE__ */ jsx7("p", { className: "p-4 text-sm text-muted-foreground", children: "Loading the entry form\u2026" }),
        children: /* @__PURE__ */ jsx7(EntryPropertiesForm, { entryId })
      }
    ) : /* @__PURE__ */ jsxs2("p", { role: "note", className: "p-4 text-sm text-muted-foreground", children: [
      "Open the ",
      slug,
      " page to edit its entry here."
    ] }) })
  ] });
}
var PP_CSS = `
.pp{min-height:100%;display:flex;flex-direction:column;font-size:13px}
.pp-head{padding:14px 20px;display:flex;flex-direction:column;gap:10px;color:var(--beam-ink, #dcede8);background:var(--beam-paper, #08120f)}
.pp-form{flex:1;padding:4px 8px 12px;background:var(--background, #fff);color:var(--foreground, #0f172a)}
.pp-row{display:flex;flex-direction:column;gap:5px}
.pp-meta{flex-direction:row;gap:16px;font-family:ui-monospace,monospace;font-size:11px;color:var(--beam-ink-muted, rgba(220, 237, 232, .5));flex-wrap:wrap;align-items:center}
.pp-meta b{color:var(--beam-ink, #dcede8);font-weight:600}
.pp-pub.on{color:var(--beam-accent, #00b3c8)}
.pp-actions{display:flex;gap:8px;flex-wrap:wrap}
.pp-btn{padding:8px 14px;border-radius:8px;border:1px solid var(--beam-line, #1b2e2a);background:none;color:var(--beam-ink, #dcede8);cursor:pointer;font:inherit;font-size:12px}
.pp-btn:hover:not(:disabled){border-color:var(--beam-accent, #00b3c8)}
.pp-btn:disabled{opacity:.5;cursor:default}
.pp-btn.primary{background:var(--beam-accent, #00b3c8);border-color:var(--beam-accent, #00b3c8);color:#08120f}
.pp-btn.primary:hover:not(:disabled){opacity:.9}
`;

// src/os/operator-desk.tsx
import { jsx as jsx8, jsxs as jsxs3 } from "react/jsx-runtime";
var OperatorDashboard = lazy3(async () => ({ default: await resolveBeamPage("operator/dashboard") }));
var TOOLS = [
  {
    key: "dashboard",
    title: "Dashboard",
    accent: "#4B5563",
    render: () => /* @__PURE__ */ jsx8(
      Suspense3,
      {
        fallback: /* @__PURE__ */ jsx8("div", { className: "p-6 text-sm text-slate-500", children: "Loading\u2026" }),
        children: /* @__PURE__ */ jsx8(OperatorDashboard, {})
      }
    ),
    size: { width: 720, height: 560 }
  }
];
function BeamMark({ className }) {
  return /* @__PURE__ */ jsxs3(
    "svg",
    {
      className,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx8(
          "path",
          {
            d: "M3 7 C9 7 10 12 14 12 M3 17 C9 17 10 12 14 12 M14 12 H21",
            stroke: "currentColor",
            strokeWidth: "1.7",
            strokeLinecap: "round"
          }
        ),
        /* @__PURE__ */ jsx8("circle", { cx: "3", cy: "7", r: "1.6", fill: "currentColor" }),
        /* @__PURE__ */ jsx8("circle", { cx: "3", cy: "17", r: "1.6", fill: "currentColor" }),
        /* @__PURE__ */ jsx8(
          "circle",
          {
            cx: "14",
            cy: "12",
            r: "2.7",
            fill: "var(--beam-accent, #00b3c8)"
          }
        )
      ]
    }
  );
}
function OperatorDesk() {
  const page = usePage2();
  const component = page.component;
  const pageEntry = page.props.entry ?? null;
  const entryIdFor = (slug) => pageEntry?.slug === slug && typeof pageEntry.id === "string" && pageEntry.id !== "" ? pageEntry.id : null;
  return /* @__PURE__ */ jsx8(
    Desk,
    {
      tools: TOOLS,
      inControlPanel: !!component?.startsWith("operator/"),
      orbLabel: "Edit",
      orbIcon: /* @__PURE__ */ jsx8(BeamMark, { className: "mark" }),
      brand: {
        mark: /* @__PURE__ */ jsx8(BeamMark, { className: "op-menu-brand-mark" }),
        label: "beam"
      },
      links: {
        frontend: { href: "/" },
        control: { href: "/operator" },
        signOut: () => router2.post("/logout")
      },
      pageWindow: { size: { width: 520, height: 640 } },
      renderPageProperties: ({ slug, editable, editing, close }) => /* @__PURE__ */ jsx8(
        PageProperties,
        {
          slug,
          entryId: entryIdFor(slug),
          editable,
          editing,
          onEditContent: () => {
            close();
            window.dispatchEvent(new CustomEvent("beam-ux:edit"));
          },
          onExitContent: () => window.dispatchEvent(new CustomEvent("beam-ux:exit"))
        }
      ),
      navGuard: ({ shouldSuppress, disarm }) => router2.on("before", (event) => {
        const method = (event.detail?.visit?.method ?? "get").toLowerCase();
        if (shouldSuppress() && method === "get") {
          disarm();
          return false;
        }
      })
    }
  );
}

// src/layouts/os-layout.tsx
import { Fragment, jsx as jsx9, jsxs as jsxs4 } from "react/jsx-runtime";
var OS_ENTER_KEY = "os.enter";
var DOCK_CLEARANCE = "72px";
function OsLayout({ children }) {
  const page = usePage3();
  const can = page.props.can ?? {};
  const entitled = !!can[OS_ENTER_KEY] && (page.component ?? "").startsWith("site/");
  useEffect2(() => {
    if (!entitled) return;
    const root = document.documentElement.style;
    root.setProperty("--beam-page-dock-clearance", DOCK_CLEARANCE);
    return () => {
      root.removeProperty("--beam-page-dock-clearance");
    };
  }, [entitled]);
  return /* @__PURE__ */ jsxs4(Fragment, { children: [
    children,
    entitled && /* @__PURE__ */ jsx9(OperatorDesk, {})
  ] });
}

// src/layouts/settings/layout.tsx
import { Link as Link2 } from "@inertiajs/react";
import { jsx as jsx10, jsxs as jsxs5 } from "react/jsx-runtime";
var sidebarNavItems = [
  {
    title: "Profile",
    href: { method: "get", url: "/settings/profile" },
    icon: null
  },
  {
    title: "Security",
    href: { method: "get", url: "/settings/security" },
    icon: null
  },
  {
    title: "Appearance",
    href: { method: "get", url: "/settings/appearance" },
    icon: null
  }
];
function SettingsLayout({ children }) {
  const { isCurrentOrParentUrl } = useCurrentUrl();
  return /* @__PURE__ */ jsxs5("div", { className: "px-4 py-6", children: [
    /* @__PURE__ */ jsx10(
      Heading,
      {
        title: "Settings",
        description: "Manage your profile and account settings"
      }
    ),
    /* @__PURE__ */ jsxs5("div", { className: "flex flex-col lg:flex-row lg:space-x-12", children: [
      /* @__PURE__ */ jsx10("aside", { className: "w-full max-w-xl lg:w-48", children: /* @__PURE__ */ jsx10(
        "nav",
        {
          className: "flex flex-col space-y-1 space-x-0",
          "aria-label": "Settings",
          children: sidebarNavItems.map((item, index) => /* @__PURE__ */ jsx10(
            Button,
            {
              size: "sm",
              variant: "ghost",
              asChild: true,
              className: cn("w-full justify-start", {
                "bg-muted": isCurrentOrParentUrl(item.href)
              }),
              children: /* @__PURE__ */ jsxs5(Link2, { href: item.href, children: [
                item.icon && /* @__PURE__ */ jsx10(item.icon, { className: "h-4 w-4" }),
                item.title
              ] })
            },
            `${toUrl(item.href)}-${index}`
          ))
        }
      ) }),
      /* @__PURE__ */ jsx10(Separator, { className: "my-6 lg:hidden" }),
      /* @__PURE__ */ jsx10("div", { className: "flex-1 md:max-w-2xl", children: /* @__PURE__ */ jsx10("section", { className: "max-w-xl space-y-12", children }) })
    ] })
  ] });
}

// src/os/default-desktop.tsx
import { MainframeOutlet, MainframeProvider } from "@schemastud/mainframe";
import { Link as Link3, router as router3, usePage as usePage4 } from "@inertiajs/react";
import {
  buildAppsFromManifest,
  buildDesktopChrome,
  defaultGenericBinding,
  defaultSurfaceInjection
} from "@splicewire/beam-ux/shell";
import "@schemastud/mainframe/os/shell.css";
import { jsx as jsx11 } from "react/jsx-runtime";
function DefaultBrand() {
  return /* @__PURE__ */ jsx11("span", { style: { fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }, children: "beam" });
}
function DefaultOsDesktop({ surfaceMap = {}, exclude, brand, status, backdrop, onNavigate, chrome }) {
  const manifest = usePage4().props.realmManifest ?? [];
  const apps = buildAppsFromManifest(manifest, {
    surfaceMap,
    exclude,
    genericBinding: defaultGenericBinding,
    surfaceInjection: (title, route, render) => defaultSurfaceInjection(title, route, render, Link3)
  });
  const osInjection = buildDesktopChrome({
    apps,
    brand: brand ?? /* @__PURE__ */ jsx11(DefaultBrand, {}),
    status,
    backdrop,
    launcherHeading: "Realms",
    onNavigate: onNavigate ?? ((app) => router3.visit(app.route ?? "/")),
    ...chrome
  });
  const initialOpen = apps.filter((a) => !a.locked).slice(0, 3).map((a) => a.key);
  return /* @__PURE__ */ jsx11(MainframeProvider, { injection: osInjection, children: /* @__PURE__ */ jsx11("div", { style: { position: "fixed", inset: 0, overflow: "hidden" }, children: /* @__PURE__ */ jsx11(MainframeOutlet, { mode: "os", ctx: { os: { apps, initialOpen } } }) }) });
}

// src/index.tsx
import { jsx as jsx12, jsxs as jsxs6 } from "react/jsx-runtime";
var queryClient = new QueryClient();
function beamInertiaOptions(config = {}) {
  configureBeamInertia(config);
  const initialBrand = () => {
    const page = typeof document !== "undefined" ? document.querySelector('script[data-page="app"]')?.textContent ?? document.getElementById("app")?.dataset.page : void 0;
    try {
      const shared = page ? JSON.parse(page).props : {};
      return shared.brand ?? { name: config.name ?? shared.name ?? "", titleTemplate: null };
    } catch {
      return { name: config.name ?? "", titleTemplate: null };
    }
  };
  if (typeof window !== "undefined") initializeTheme();
  configureEntryPage({
    linkComponent: Link4,
    wrap: (node) => /* @__PURE__ */ jsx12(SiteLayout, { children: node }),
    // "Edit content" on a rendered entry opens the in-place editor WHERE THE BODY IS, inside the
    // entry's layout and template — not beside the page (beam.test `/about`, 2026-09-24). The
    // MainframeHost treats `site/entry` as self-managed accordingly (layouts/beam-ux/mainframe-host).
    editableBody: EditableEntryBody
  });
  return {
    title: (title) => brandTitle(title, initialBrand()),
    /**
     * Own glob first, the package's page map second (ADR-0213 §3). Written out rather than left to
     * `@inertiajs/vite`'s injected resolver, because the injected one throws on a name it cannot find
     * in `./pages` and a package-contributed page is by definition not there.
     */
    resolve: resolveBeamPage,
    // No prototype case here. The dev-only prototype host page declares its own empty `layout`,
    // which Inertia prefers over this callback. Naming that page here put its marker into every
    // production bundle and tripped `beam-verify-prototype-boundary` (prototype-boundary.test.ts).
    layout: (name) => {
      switch (true) {
        // The OS-shell desktop is fully self-chromed (menu bar + dock + windows) — no wrapping layout,
        // never (re-)wrapped by the persistent OsLayout overlay either (it mounts its OWN operator
        // chrome — see os/shell-config.tsx).
        case name === "os":
          return null;
        // Site-realm pages carry their own <SiteLayout> internally (the OOTB site chrome). Wrapped in
        // MainframeHost so an author (`ux.author`) can edit the page in place; a reader falls through
        // to the self-chromed page (readMode: 'page' is a no-op swap). OsLayout OUTERMOST: an
        // `os.enter` principal gets the persistent operator dock overlay on top of the real page.
        case name.startsWith("site/"):
          return [OsLayout, mainframe_host_default];
        // The OPERATOR front-end realm — the ordinary app sidebar with its rail read from the
        // operator realm's manifest (<OperatorLayout>, `/operator/frame/manifest`), framed by the
        // promoted <MainframeHost> (beam-mainframe). Until otb-ui-frontier-sidebar DESIGN-01 "Want 2"
        // this was `[OsLayout, MainframeHost]`: the only realm with no chrome of any kind.
        //
        // ⚠️ INVARIANT: operator chrome belongs in THIS switch and never inside a page component.
        //
        // It is what makes "a surface opened from the operator dock as a floating window carries
        // no page chrome" true, and it is true BY CONSTRUCTION rather than by any check — which is
        // why it is written down. Chrome is applied here, at the Inertia `layout:` boundary; a
        // float never crosses that boundary, because `os/operator-desk.tsx` opens its tools via
        // `lazy(async () => ({ default: await resolveBeamPage('operator/dashboard') }))` — resolving
        // the page MODULE, never this `layout` callback — and `os/shell-config.tsx`'s SURFACE_MAP
        // does the same. So <OperatorLayout> here cannot leak into a float, and a layout moved INTO
        // the page silently would.
        //
        // `site/` deliberately breaks the shape (its pages carry <SiteLayout> internally), which is
        // correct for site and would be a bug copied here: a self-chroming operator page renders its
        // nav INSIDE the float. `/os` is the third case and is already right — `return null`,
        // self-chromed, never double-wrapped.
        //
        // Not overstating it: the rule is not uniform today. `shell-config.tsx`'s
        // `SURFACE_MAP.operator.render` mounts <OperatorDashboard/> BARE while `user` wraps in
        // <BeamAccountLayout> — a per-surface choice already made twice, differently. Decide those
        // two together if either moves.
        case name.startsWith("operator/"):
          return [OsLayout, OperatorLayout, mainframe_host_default];
        // Account-realm pages mount the OOTB <AccountShell> via BeamAccountLayout, MainframeHost
        // INNERMOST (wraps just the page content, inside the AccountShell chrome) so every account
        // page is editable too — matches rushing/audiostud's own layout switch, which includes
        // MainframeHost in every case but the null `/os` one.
        case name.startsWith("account/"):
          return [OsLayout, BeamAccountLayout, mainframe_host_default];
        case name.startsWith("auth/"):
          return AuthLayout;
        case name.startsWith("settings/"):
          return [OsLayout, AppLayout, SettingsLayout, mainframe_host_default];
        default:
          return [OsLayout, AppLayout, mainframe_host_default];
      }
    },
    strictMode: true,
    withApp(app) {
      return /* @__PURE__ */ jsx12(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs6(TooltipProvider, { delayDuration: 0, children: [
        app,
        /* @__PURE__ */ jsx12(Toaster, {})
      ] }) });
    },
    progress: {
      color: "#4B5563"
    }
  };
}
export {
  Button,
  DefaultOsDesktop,
  PlatformConnectionPanel,
  authFeaturesFrom,
  beamInertiaOptions,
  bodyClient,
  configureBeamInertia,
  createPlatformConnectionClient,
  featureEnabled,
  resolveBeamPage
};
//# sourceMappingURL=index.js.map