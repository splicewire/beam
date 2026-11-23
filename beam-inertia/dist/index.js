import {
  PlatformConnectionPanel,
  createPlatformConnectionClient
} from "./chunk-2ORJXUEJ.js";
import {
  AppSidebarLayout,
  OperatorLayout,
  TooltipProvider
} from "./chunk-NMV4AJX2.js";
import {
  BeamFrameProvider
} from "./chunk-OTZ4IPA2.js";
import {
  SiteLayout
} from "./chunk-RWQQDTZ5.js";
import {
  InertiaEditorKit,
  IntakeFormsFromPage,
  defaultComponents
} from "./chunk-PKANFFG2.js";
import {
  BeamAccountLayout
} from "./chunk-QRADWOWP.js";
import {
  AppLogoIcon
} from "./chunk-KUXBZNAJ.js";
import {
  resolveBeamPage
} from "./chunk-AT67YUOW.js";
import {
  brandTitle
} from "./chunk-IHHHPJVP.js";
import {
  surfaceMessage
} from "./chunk-VXVLZYD3.js";
import {
  useCurrentUrl
} from "./chunk-73MHV75H.js";
import {
  FrameRealmProvider,
  useFrameRealm
} from "./chunk-LZNX4YUE.js";
import "./chunk-O7ZKQDZR.js";
import {
  bodyClient
} from "./chunk-YAINAZ7K.js";
import "./chunk-5A4XHNWR.js";
import {
  initializeTheme,
  useAppearance
} from "./chunk-6C5PVJOV.js";
import {
  Heading
} from "./chunk-C5OGDGGA.js";
import "./chunk-3GD6IGMJ.js";
import {
  Separator
} from "./chunk-L5EIPFNI.js";
import {
  authFeaturesFrom,
  configureBeamInertia,
  featureEnabled
} from "./chunk-PGZP7A2Q.js";
import "./chunk-563T736C.js";
import "./chunk-UZPKVCAK.js";
import {
  Button
} from "./chunk-SXSE375U.js";
import {
  cn,
  toUrl
} from "./chunk-GBIJGQ7E.js";
import {
  useBeamMessages
} from "./chunk-V63CP4G5.js";

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
var DEFAULT_HOTKEY = ["altKey", "KeyT"];
function hotkeyLabel(hotkey) {
  return hotkey.join("+").replace(/Key/g, "").replace(/Digit/g, "");
}
function Toaster({ ...props }) {
  const { appearance } = useAppearance();
  const messages = useBeamMessages();
  useFlashToast();
  const label = messages.t("splicewire-beam-inertia::messages.chrome_notifications_region", { hotkey: hotkeyLabel(props.hotkey ?? DEFAULT_HOTKEY) });
  return /* @__PURE__ */ jsx(
    Sonner,
    {
      theme: appearance,
      className: "toaster group",
      position: "bottom-right",
      customAriaLabel: props.containerAriaLabel !== void 0 ? void 0 : label,
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
  () => import("./mount-6FWYEZCT.js").then((m) => ({ default: m.VisualEditorMount }))
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
function LoadingEditor() {
  const messages = useBeamMessages();
  return /* @__PURE__ */ jsx5("div", { className: "p-6 text-sm text-slate-500", children: messages.t("splicewire-beam-inertia::messages.chrome_loading_editor") });
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
      entryFormat: typeof entry?.format === "string" && entry.format !== "" ? entry.format : null,
      // The BODY KIND half (beam JS ADR-0006 d1): it, not the format, chooses the surface. A host that
      // holds MDX as blocks (ux-0233 d1) opens its MDX pages in the canvas; null leaves the format gate.
      entryBodyKind: typeof entry?.bodyKind === "string" && entry.bodyKind !== "" ? entry.bodyKind : null
    };
  },
  loadEntryBody,
  ribbon,
  renderEditor: ({ ref }) => SELF_MANAGED_COMPONENTS.has(currentComponent) || ref.id === null ? null : /* @__PURE__ */ jsx5(CanvasOrRefusal, { entry: ref, children: /* @__PURE__ */ jsx5(
    Suspense,
    {
      fallback: /* @__PURE__ */ jsx5(LoadingEditor, {}),
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
var EntryPropertiesForm = lazy2(() => import("./entry-properties-form-KHU4EUB6.js"));
function PageProperties({
  slug,
  entryId = null,
  editable,
  editing,
  onEditContent,
  onExitContent
}) {
  const m = useBeamMessages();
  return /* @__PURE__ */ jsxs2("div", { className: "pp", children: [
    /* @__PURE__ */ jsx7("style", { dangerouslySetInnerHTML: { __html: PP_CSS } }),
    /* @__PURE__ */ jsxs2("div", { className: "pp-head", children: [
      /* @__PURE__ */ jsxs2("div", { className: "pp-row pp-meta", children: [
        /* @__PURE__ */ jsx7("span", { children: surfaceMessage(m, "splicewire-beam-inertia::messages.surfaces_slug", { slug: /* @__PURE__ */ jsx7("b", { children: slug }) }) }),
        /* @__PURE__ */ jsx7("span", { className: editable ? "pp-pub on" : "pp-pub", children: editable ? m.t("splicewire-beam-inertia::messages.surfaces_editable") : m.t("splicewire-beam-inertia::messages.surfaces_read_only") })
      ] }),
      /* @__PURE__ */ jsx7("div", { className: "pp-actions", children: editing ? /* @__PURE__ */ jsx7(
        "button",
        {
          type: "button",
          className: "pp-btn",
          onClick: onExitContent,
          children: m.t("splicewire-beam-inertia::messages.surfaces_exit_editing")
        }
      ) : /* @__PURE__ */ jsx7(
        "button",
        {
          type: "button",
          className: "pp-btn primary",
          disabled: !editable,
          onClick: onEditContent,
          children: m.t("splicewire-beam-inertia::messages.surfaces_edit_content")
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx7("div", { className: "pp-form", "data-beam-entry-properties": slug, children: entryId ? /* @__PURE__ */ jsx7(
      Suspense2,
      {
        fallback: /* @__PURE__ */ jsx7("p", { className: "p-4 text-sm text-muted-foreground", children: m.t("splicewire-beam-inertia::messages.surfaces_entry_loading") }),
        children: /* @__PURE__ */ jsx7(EntryPropertiesForm, { entryId })
      }
    ) : /* @__PURE__ */ jsx7("p", { role: "note", className: "p-4 text-sm text-muted-foreground", children: m.t("splicewire-beam-inertia::messages.surfaces_open_entry", { slug }) }) })
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
function ToolLoading() {
  const m = useBeamMessages();
  return /* @__PURE__ */ jsx8("div", { className: "p-6 text-sm text-slate-500", children: m.t("splicewire-beam-inertia::messages.surfaces_loading") });
}
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
  const m = useBeamMessages();
  const TOOLS = [
    {
      key: "dashboard",
      title: m.t("splicewire-beam-inertia::messages.surfaces_dashboard"),
      accent: "#4B5563",
      render: () => /* @__PURE__ */ jsx8(
        Suspense3,
        {
          fallback: /* @__PURE__ */ jsx8(ToolLoading, {}),
          children: /* @__PURE__ */ jsx8(OperatorDashboard, {})
        }
      ),
      size: { width: 720, height: 560 }
    }
  ];
  const page = usePage2();
  const component = page.component;
  const pageEntry = page.props.entry ?? null;
  const entryIdFor = (slug) => pageEntry?.slug === slug && typeof pageEntry.id === "string" && pageEntry.id !== "" ? pageEntry.id : null;
  return /* @__PURE__ */ jsx8(
    Desk,
    {
      tools: TOOLS,
      inControlPanel: !!component?.startsWith("operator/"),
      orbLabel: m.t("splicewire-beam-inertia::messages.surfaces_edit"),
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
  const entitled = page.props.preview == null && !!can[OS_ENTER_KEY] && (page.component ?? "").startsWith("site/");
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
function SettingsLayout({ children }) {
  const messages = useBeamMessages();
  const sidebarNavItems = [
    {
      title: messages.t("splicewire-beam-inertia::messages.chrome_profile"),
      href: { method: "get", url: "/settings/profile" },
      icon: null
    },
    {
      title: messages.t("splicewire-beam-inertia::messages.chrome_security"),
      href: { method: "get", url: "/settings/security" },
      icon: null
    },
    {
      title: messages.t("splicewire-beam-inertia::messages.chrome_appearance"),
      href: { method: "get", url: "/settings/appearance" },
      icon: null
    }
  ];
  const { isCurrentOrParentUrl } = useCurrentUrl();
  return /* @__PURE__ */ jsxs5("div", { className: "px-4 py-6", children: [
    /* @__PURE__ */ jsx10(
      Heading,
      {
        title: messages.t("splicewire-beam-inertia::messages.chrome_settings"),
        description: messages.t("splicewire-beam-inertia::messages.chrome_settings_description")
      }
    ),
    /* @__PURE__ */ jsxs5("div", { className: "flex flex-col lg:flex-row lg:space-x-12", children: [
      /* @__PURE__ */ jsx10("aside", { className: "w-full max-w-xl lg:w-48", children: /* @__PURE__ */ jsx10(
        "nav",
        {
          className: "flex flex-col space-y-1 space-x-0",
          "aria-label": messages.t("splicewire-beam-inertia::messages.chrome_settings"),
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

// src/localization/beam-messages.tsx
import { usePage as usePage4 } from "@inertiajs/react";
import { MessageProvider } from "@schemastud/messages/react";
import { useRef } from "react";
import { Fragment as Fragment2, jsx as jsx11 } from "react/jsx-runtime";
function BeamMessages({ children }) {
  const localization = usePage4().props.localization ?? null;
  const catalog = useServedCatalog(localization);
  if (catalog === null) {
    return /* @__PURE__ */ jsx11(Fragment2, { children });
  }
  return /* @__PURE__ */ jsx11(MessageProvider, { value: catalog, pseudo: false, children });
}
function useServedCatalog(localization) {
  const last = useRef(null);
  const served = localization?.initial ?? null;
  const hash = localization?.address?.hash ?? null;
  if (served !== null && hash !== null) {
    last.current = { hash, catalog: served };
  }
  return served ?? (last.current !== null && last.current.hash === hash ? last.current.catalog : null);
}
function withBeamMessages(chrome) {
  if (chrome === null) return [BeamMessages];
  return Array.isArray(chrome) ? [BeamMessages, ...chrome] : [BeamMessages, chrome];
}

// src/localization/chrome-messages.tsx
import { router as router3 } from "@inertiajs/react";
import { MessageProvider as MessageProvider2 } from "@schemastud/messages/react";
import { useEffect as useEffect3, useState } from "react";
import { jsx as jsx12 } from "react/jsx-runtime";
var NONE = Object.freeze({ version: 1, locale: "en-US", realm: null, direction: "ltr", messages: Object.freeze({}) });
function ChromeMessages({ initialPage, children }) {
  const [localization, setLocalization] = useState(() => localizationOf(initialPage));
  useEffect3(() => {
    const take = (event) => setLocalization(localizationOf(event.detail.page));
    const offSuccess = router3.on("success", take);
    const offNavigate = router3.on("navigate", take);
    return () => {
      offSuccess();
      offNavigate();
    };
  }, []);
  const catalog = useServedCatalog(localization);
  return /* @__PURE__ */ jsx12(MessageProvider2, { value: catalog ?? NONE, pseudo: false, children });
}
function localizationOf(page) {
  return (page?.props ?? {}).localization ?? null;
}

// src/editor/registry-snapshot.ts
function registrySnapshot(registry = defaultComponents()) {
  return Object.keys(registry).sort();
}

// src/os/default-desktop.tsx
import { MainframeOutlet, MainframeProvider } from "@schemastud/mainframe";
import { Link as Link3, router as router4, usePage as usePage5 } from "@inertiajs/react";
import {
  buildAppsFromManifest,
  buildDesktopChrome,
  defaultGenericBinding,
  defaultSurfaceInjection
} from "@splicewire/beam-ux/shell";
import "@schemastud/mainframe/os/shell.css";
import { jsx as jsx13 } from "react/jsx-runtime";
function DefaultBrand() {
  return /* @__PURE__ */ jsx13("span", { style: { fontWeight: 600, fontSize: 14, letterSpacing: "-0.01em" }, children: "beam" });
}
function DefaultOsDesktop({ surfaceMap = {}, exclude, brand, status, backdrop, onNavigate, chrome }) {
  const m = useBeamMessages();
  const manifest = usePage5().props.realmManifest ?? [];
  const apps = buildAppsFromManifest(manifest, {
    surfaceMap,
    exclude,
    genericBinding: defaultGenericBinding,
    surfaceInjection: (title, route, render) => defaultSurfaceInjection(title, route, render, Link3)
  });
  const osInjection = buildDesktopChrome({
    apps,
    brand: brand ?? /* @__PURE__ */ jsx13(DefaultBrand, {}),
    status,
    backdrop,
    launcherHeading: m.t("splicewire-beam-inertia::messages.surfaces_realms"),
    onNavigate: onNavigate ?? ((app) => router4.visit(app.route ?? "/")),
    ...chrome
  });
  const initialOpen = apps.filter((a) => !a.locked).slice(0, 3).map((a) => a.key);
  return /* @__PURE__ */ jsx13(MainframeProvider, { injection: osInjection, children: /* @__PURE__ */ jsx13("div", { style: { position: "fixed", inset: 0, overflow: "hidden" }, children: /* @__PURE__ */ jsx13(MainframeOutlet, { mode: "os", ctx: { os: { apps, initialOpen } } }) }) });
}

// src/index.tsx
import { jsx as jsx14, jsxs as jsxs6 } from "react/jsx-runtime";
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
    // EP-07d: the page's forms read the schemas and honeypot field the server put on it.
    // localization 16-d: an entry rendered through this wrap reads the served catalog too (outermost; a passthrough
    // where nothing is served, and the same value as the layout's provider where one is).
    wrap: (node) => /* @__PURE__ */ jsx14(BeamMessages, { children: /* @__PURE__ */ jsx14(SiteLayout, { children: /* @__PURE__ */ jsx14(IntakeFormsFromPage, { children: node }) }) }),
    // "Edit content" on a rendered entry opens the in-place editor WHERE THE BODY IS, inside the
    // entry's layout and template — not beside the page (beam.test `/about`, 2026-09-24). The
    // MainframeHost treats `site/entry` as self-managed accordingly (layouts/beam-ux/mainframe-host).
    editableBody: EditableEntryBody,
    // ADR-0234 d1: the server's Page Head is this app's head, so the packaged pages set none of their own over it.
    serverHead: true
  });
  let serverTitled = false;
  const serverHead = (page) => {
    const head = page.props.head;
    const elements = Array.isArray(head) ? head.filter((element) => typeof element === "string") : [];
    serverTitled = elements.some((element) => element.trimStart().startsWith("<title"));
    return elements;
  };
  return {
    title: (title) => serverTitled ? title : brandTitle(title, initialBrand()),
    serverHead,
    /**
     * Own glob first, the package's page map second (ADR-0213 §3). Written out rather than left to
     * `@inertiajs/vite`'s injected resolver, because the injected one throws on a name it cannot find
     * in `./pages` and a package-contributed page is by definition not there.
     */
    resolve: resolveBeamPage,
    // No prototype case here. The dev-only prototype host page declares its own empty `layout`,
    // which Inertia prefers over this callback. Naming that page here put its marker into every
    // production bundle and tripped `beam-verify-prototype-boundary` (prototype-boundary.test.ts).
    // localization 16-d: every layout array starts with <BeamMessages> (the served catalog's provider; persistent, so a
    // navigation keeps it, and a passthrough where nothing is served). It is not chrome, so the self-chromed `/os` page
    // gets it too: as its ONLY layout, wrapping no chrome. The chrome per page name is unchanged below.
    layout: (name) => withBeamMessages((() => {
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
    })()),
    strictMode: true,
    // localization 28b: the toaster sits BESIDE the page (one mount, never remounted), so <ChromeMessages> gives it the served
    // catalog from the initial page and every navigate event; without it the region's name was provider-free English.
    withApp(app, options) {
      return /* @__PURE__ */ jsx14(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs6(TooltipProvider, { delayDuration: 0, children: [
        app,
        /* @__PURE__ */ jsx14(ChromeMessages, { initialPage: options?.page, children: /* @__PURE__ */ jsx14(Toaster, {}) })
      ] }) });
    },
    progress: {
      color: "#4B5563"
    }
  };
}
export {
  BeamFrameProvider,
  Button,
  DefaultOsDesktop,
  FrameRealmProvider,
  PlatformConnectionPanel,
  authFeaturesFrom,
  beamInertiaOptions,
  bodyClient,
  configureBeamInertia,
  createPlatformConnectionClient,
  featureEnabled,
  registrySnapshot,
  resolveBeamPage,
  useFrameRealm
};
//# sourceMappingURL=index.js.map