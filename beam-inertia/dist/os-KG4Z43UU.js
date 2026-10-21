import {
  BeamAccountLayout
} from "./chunk-DKZRPX6S.js";
import "./chunk-44FAKLSM.js";
import {
  resolveBeamPage
} from "./chunk-5CZFBGMC.js";
import "./chunk-WB76RVEA.js";
import "./chunk-QMLU62K5.js";
import {
  getBeamInertiaConfig
} from "./chunk-MTKP2AW3.js";
import "./chunk-GBIJGQ7E.js";

// src/pages/os.tsx
import { Head } from "@inertiajs/react";

// src/os/shell-config.tsx
import { Link, router, usePage } from "@inertiajs/react";
import "@schemastud/mainframe/os/shell.css";
import {
  MainframeOutlet,
  MainframeProvider,
  createMainframeRegistry,
  createSlotRegistry
} from "@schemastud/mainframe";
import {
  buildAppsFromManifest,
  buildDesktopChrome,
  Clock
} from "@splicewire/beam-ux/shell";
import { Component, Suspense, lazy } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var AccountHome = lazy(async () => ({ default: await resolveBeamPage("account/home") }));
var OperatorDashboard = lazy(async () => ({ default: await resolveBeamPage("operator/dashboard") }));
var SiteHome = lazy(async () => ({ default: await resolveBeamPage("site/home") }));
function ThemeShellStyle() {
  const page = usePage();
  const shell = page.props.theme?.shell;
  if (!shell) {
    return null;
  }
  return /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: shellThemeCss(shell) } });
}
function shellThemeCss(shell) {
  return `.st-os-root [data-shell-root]{
  --shell-surface:${shell.surface};
  --shell-surface-raised:${shell.surfaceRaised};
  --shell-fg:${shell.fg};
  --shell-fg-muted:${shell.fgMuted};
  --shell-accent:${shell.accent};
  --shell-edge:${shell.edge};
  --shell-radius:${shell.radius};
  --shell-shadow:${shell.shadow};
  --shell-font:${shell.font};
  --shell-font-mono:${shell.fontMono};
}`;
}
var OS_SHELL_CSS = `
.st-os-root{position:fixed;inset:0;overflow:hidden}
.st-os-root [data-shell-root]{
  --shell-surface:#0f172a;
  --shell-surface-raised:rgba(15,23,42,.88);
  --shell-fg:#f1f5f9;
  --shell-fg-muted:#94a3b8;
  --shell-accent:#3b82f6;
  --shell-edge:#334155;
  --shell-radius:14px;
  --shell-shadow:0 40px 90px -40px rgba(0,0,0,.7);
  --shell-font:system-ui,sans-serif;
  --shell-font-mono:ui-monospace,monospace;
  -webkit-font-smoothing:antialiased;
  background:
    radial-gradient(1100px 640px at 80% -10%, rgba(59,130,246,.12), transparent 60%),
    #020617;
}
.st-os-root .os-menubar{backdrop-filter:blur(14px);height:34px}
.st-os-root .os-brand{display:flex;align-items:center;gap:9px}
.st-os-root .osname{font-family:var(--shell-font-mono);font-size:12px;letter-spacing:.02em;color:var(--shell-fg)}
.st-os-root .osname b{color:var(--shell-accent)}
.st-os-root .clock{font-family:var(--shell-font-mono);font-size:11.5px;color:var(--shell-fg);letter-spacing:.06em;min-width:66px;text-align:right}
.st-os-root .wallmark{position:absolute;right:5vw;top:16vh;width:min(46vw,560px);opacity:.05;pointer-events:none;font-family:system-ui,sans-serif;font-weight:700;font-size:clamp(56px,11vw,140px);line-height:.9;color:var(--shell-fg)}
.st-os-root .hint{position:absolute;left:22px;top:16px;max-width:260px;color:var(--shell-fg-muted);font-size:11px;line-height:1.6;font-family:var(--shell-font-mono);letter-spacing:.04em}
.st-os-root .hint b{color:var(--shell-accent)}
.st-os-root .os-window .os-window-body{animation:st-winopen .4s cubic-bezier(.16,1,.3,1)}
@keyframes st-winopen{from{opacity:0;transform:scale(.98) translateY(6px)}to{opacity:1;transform:none}}
.st-os-root .os-window-titlebar{background:linear-gradient(#f8fafc,#eef2f7);color:#475569;font-family:var(--shell-font-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.st-os-root .os-dock{backdrop-filter:blur(16px);left:auto;right:14px;bottom:14px;transform:none;padding:8px 12px;gap:8px}
.st-os-root .dock-launch{display:flex;align-items:center;gap:9px;padding:9px 15px;border-radius:11px;background:var(--shell-accent);color:#fff;border:none;cursor:pointer;font-family:var(--shell-font-mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:500}
.st-os-root .dock-app{display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:10px;color:#cbd5e1;background:none;border:1px solid transparent;cursor:pointer;font:inherit;font-size:12px}
.st-os-root .dock-app:hover{background:rgba(255,255,255,.06);color:var(--shell-fg)}
.st-os-root .dock-app.open{background:rgba(255,255,255,.05);border-color:var(--shell-edge);color:var(--shell-fg)}
.st-os-root .dock-app .glyph{width:16px;height:16px;border-radius:20%;flex:none}
.st-os-root .launcher-scrim{position:absolute;inset:0;background:rgba(2,6,23,.42);backdrop-filter:blur(2px)}
.st-os-root .launcher-pop{position:absolute;right:14px;bottom:70px;width:360px;max-height:70vh;overflow:auto;background:rgba(15,23,42,.96);backdrop-filter:blur(20px);border:1px solid var(--shell-edge);border-radius:16px;box-shadow:var(--shell-shadow);padding:16px}
.st-os-root .launcher-heading{font-family:var(--shell-font-mono);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#64748b;margin:6px 4px 8px}
.st-os-root .launcher-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.st-os-root .launcher-app{display:flex;align-items:center;gap:11px;padding:11px;border-radius:12px;border:1px solid transparent;text-align:left;width:100%;background:none;cursor:pointer;font:inherit}
.st-os-root .launcher-app:hover{background:rgba(255,255,255,.05);border-color:var(--shell-edge)}
.st-os-root .launcher-app .glyph{width:34px;height:34px;border-radius:22%;flex:none}
.st-os-root .launcher-app .name{display:block;font-family:var(--shell-font);font-size:13px;color:var(--shell-fg);font-weight:500}
.st-os-root .launcher-app .realm{display:block;font-family:var(--shell-font-mono);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;margin-top:2px}
.st-os-root .os-statusbus{backdrop-filter:blur(14px)}
.st-app-root{position:fixed;inset:0;overflow:auto;background:#f8fafc}
`;
var Mark = ({ className }) => /* @__PURE__ */ jsxs("svg", { className, viewBox: "0 0 64 64", width: 16, height: 16, children: [
  /* @__PURE__ */ jsx("rect", { width: "64", height: "64", rx: "15", fill: "#3b82f6" }),
  /* @__PURE__ */ jsxs("g", { fill: "#0f172a", children: [
    /* @__PURE__ */ jsx("rect", { x: "14", y: "20", width: "5", height: "24", rx: "2.5" }),
    /* @__PURE__ */ jsx("rect", { x: "24", y: "14", width: "5", height: "36", rx: "2.5" }),
    /* @__PURE__ */ jsx("rect", { x: "34", y: "24", width: "5", height: "16", rx: "2.5" }),
    /* @__PURE__ */ jsx("rect", { x: "44", y: "18", width: "5", height: "28", rx: "2.5" })
  ] })
] });
var SurfaceBoundary = class extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error(`[os] surface "${this.props.title}" threw`, error, info);
  }
  render() {
    if (this.state.error) {
      return /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            padding: 28,
            fontFamily: "ui-monospace,monospace",
            fontSize: 12,
            lineHeight: 1.6,
            color: "#475569",
            background: "#f8fafc",
            height: "100%"
          },
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  color: "#dc2626",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  marginBottom: 10
                },
                children: "Surface needs its page props"
              }
            ),
            /* @__PURE__ */ jsxs("p", { style: { maxWidth: "46ch" }, children: [
              "The real ",
              /* @__PURE__ */ jsx("b", { children: this.props.title }),
              " component crashed without its page-specific Inertia props. Open the live route:"
            ] }),
            /* @__PURE__ */ jsxs(Link, { href: this.props.route, style: { color: "#2563eb" }, children: [
              "open ",
              this.props.route,
              " \u2197"
            ] }),
            /* @__PURE__ */ jsx(
              "pre",
              {
                style: {
                  marginTop: 14,
                  whiteSpace: "pre-wrap",
                  color: "#b91c1c"
                },
                children: String(this.state.error.message)
              }
            )
          ]
        }
      );
    }
    return this.props.children;
  }
};
var surfaceMainframe = ({ slots }) => /* @__PURE__ */ jsx(
  "div",
  {
    style: {
      height: "100%",
      minHeight: 0,
      display: "flex",
      flexDirection: "column"
    },
    children: slots.main()
  }
);
function surfaceInjection(title, route, render) {
  const slots = createSlotRegistry();
  const mainframes = createMainframeRegistry();
  mainframes.register("surface", surfaceMainframe);
  slots.contribute({
    slot: "main",
    key: `surface:${title}`,
    render: () => /* @__PURE__ */ jsx(SurfaceBoundary, { title, route, children: render() })
  });
  return { slots, mainframes };
}
var SURFACE_MAP = {
  site: {
    label: "Site",
    route: "/",
    subtitle: "Public \xB7 marketing",
    accent: "#3b82f6",
    geometry: { x: 60, y: 70, width: 640, height: 540 },
    render: () => /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(SiteHome, {}) })
  },
  user: {
    label: "Account",
    // `/account-home` until 2026-09-05 — a route that has never existed. `binding.route` is
    // copied to `DesktopApp.route` (beam-ux shell/realm.ts:109) and dispatched by the launcher's
    // `router.visit(a.route)` below, so the Account dock tile navigated to a 404. The authed
    // home is `dashboard` (routes/web.php:53).
    route: "/dashboard",
    subtitle: "Authed \xB7 account",
    accent: "#10b981",
    geometry: { x: 180, y: 150, width: 760, height: 500 },
    render: () => /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(BeamAccountLayout, { children: /* @__PURE__ */ jsx(AccountHome, {}) }) })
  },
  operator: {
    label: "Operator",
    route: "/operator",
    subtitle: "Frame \xB7 back-office",
    accent: "#f59e0b",
    geometry: { x: 220, y: 90, width: 720, height: 540 },
    render: () => /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(OperatorDashboard, {}) })
  }
};
var COMPONENT_REALM = {
  "site/home": "site",
  welcome: "site",
  "account/home": "user",
  dashboard: "user",
  "operator/dashboard": "operator"
};
function realmForComponent(name) {
  return COMPONENT_REALM[name];
}
function genericSurface(entry) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        padding: 28,
        fontFamily: "ui-monospace,monospace",
        fontSize: 12,
        lineHeight: 1.6,
        color: "#475569",
        background: "#f8fafc",
        height: "100%"
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              color: "#2563eb",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              marginBottom: 10
            },
            children: "Realm auto-surfaced"
          }
        ),
        /* @__PURE__ */ jsxs("p", { style: { maxWidth: "46ch" }, children: [
          "The ",
          /* @__PURE__ */ jsx("b", { children: entry.title }),
          " realm (",
          /* @__PURE__ */ jsx("code", { children: entry.key }),
          ") is registered PHP-side and appears in the manifest, but no /os surface is bound to its key yet. Bind one by adding a",
          " ",
          /* @__PURE__ */ jsxs("code", { children: [
            "SURFACE_MAP['",
            entry.key,
            "']"
          ] }),
          " row."
        ] }),
        /* @__PURE__ */ jsxs(Link, { href: entry.routeBase || "/", style: { color: "#2563eb" }, children: [
          "open ",
          entry.routeBase || "/",
          " \u2197"
        ] })
      ]
    }
  );
}
var GENERIC_BINDING = (entry) => ({
  label: entry.title,
  route: entry.routeBase || "/",
  subtitle: "Realm \xB7 unbound surface",
  accent: "#64748b",
  geometry: { x: 240, y: 130, width: 640, height: 480 },
  render: () => genericSurface(entry)
});
var OS_REALM_EXCLUDE = /* @__PURE__ */ new Set(["tenant"]);
function osAppsFromManifest(manifest) {
  return buildAppsFromManifest(manifest, {
    surfaceMap: SURFACE_MAP,
    exclude: OS_REALM_EXCLUDE,
    genericBinding: GENERIC_BINDING,
    surfaceInjection
  });
}
function OsBrand() {
  return /* @__PURE__ */ jsxs("span", { className: "os-brand", children: [
    /* @__PURE__ */ jsx(Mark, { className: "mark" }),
    /* @__PURE__ */ jsxs("span", { className: "osname", children: [
      /* @__PURE__ */ jsx("b", { children: "beam" }),
      "\xB7os"
    ] })
  ] });
}
function OsStatus() {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
    /* @__PURE__ */ jsx(
      "span",
      {
        style: {
          fontFamily: "ui-monospace,monospace",
          fontSize: 10,
          color: "#94a3b8",
          letterSpacing: ".12em",
          textTransform: "uppercase"
        },
        children: "Window mode"
      }
    ),
    /* @__PURE__ */ jsx(Clock, {})
  ] });
}
var OS_BACKDROP = /* @__PURE__ */ jsxs(Fragment, { children: [
  /* @__PURE__ */ jsxs("div", { className: "wallmark", children: [
    "beam",
    /* @__PURE__ */ jsx("br", {}),
    "os"
  ] }),
  /* @__PURE__ */ jsxs("div", { className: "hint", children: [
    "beam\xB7",
    /* @__PURE__ */ jsx("b", { children: "os" }),
    " \u2014 the front-end CMS as an operating system. Each realm is a launchable app; a window frames its ",
    /* @__PURE__ */ jsx("b", { children: "real" }),
    " surface (its actual page component)."
  ] })
] });
var WORKSPACE_KEY = "beam-starter.os.workspace.v1";
function readPersistedWorkspace() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(WORKSPACE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writePersistedWorkspace(workspace) {
  try {
    window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
  } catch {
  }
}
var OS_ENTER_KEY = "os.enter";
function AppFirstSurface({ apps }) {
  const primary = apps.find((a) => a.key === "user" && !a.locked) ?? apps.find((a) => !a.locked) ?? apps[0] ?? null;
  const binding = primary ? SURFACE_MAP[primary.key] ?? GENERIC_BINDING({
    key: primary.key,
    title: primary.title,
    routeBase: primary.route ?? "/",
    locked: !!primary.locked,
    upsell: primary.upsell
  }) : null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: OS_SHELL_CSS } }),
    /* @__PURE__ */ jsx(ThemeShellStyle, {}),
    /* @__PURE__ */ jsx("div", { className: "st-app-root", children: primary && binding ? /* @__PURE__ */ jsx(
      SurfaceBoundary,
      {
        title: primary.title,
        route: primary.route ?? "/",
        children: binding.render()
      }
    ) : /* @__PURE__ */ jsx("div", { style: { padding: 40, color: "#64748b" }, children: "No surface available." }) })
  ] });
}
function OsShellDesktop() {
  const page = usePage();
  const manifest = page.props.realmManifest ?? [];
  const canEnterOs = !!page.props.can?.[OS_ENTER_KEY];
  const currentComponent = page.component;
  const apps = osAppsFromManifest(manifest);
  const devForceAppFirst = getBeamInertiaConfig().development && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("os") === "off";
  if (!canEnterOs && !getBeamInertiaConfig().development || devForceAppFirst) {
    return /* @__PURE__ */ jsx(AppFirstSurface, { apps });
  }
  const activeKey = realmForComponent(currentComponent ?? "") ?? void 0;
  const osInjection = buildDesktopChrome({
    apps,
    brand: /* @__PURE__ */ jsx(OsBrand, {}),
    status: /* @__PURE__ */ jsx(OsStatus, {}),
    backdrop: OS_BACKDROP,
    statusLine: /* @__PURE__ */ jsxs(
      "span",
      {
        style: { fontFamily: "ui-monospace,monospace", fontSize: 10 },
        children: [
          apps.length,
          " realms \xB7 window manager live \xB7 layout persists per session"
        ]
      }
    ),
    activeKey,
    launcherHeading: "Realms",
    onNavigate: (a) => router.visit(a.route ?? "/"),
    persist: writePersistedWorkspace
  });
  const persisted = readPersistedWorkspace();
  const hasPersisted = !!persisted && (persisted.windows?.length ?? 0) > 0;
  const initialOpen = apps.filter((a) => !a.locked).slice(0, 3).map((a) => a.key);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: OS_SHELL_CSS } }),
    /* @__PURE__ */ jsx(ThemeShellStyle, {}),
    /* @__PURE__ */ jsx(MainframeProvider, { injection: osInjection, children: /* @__PURE__ */ jsx(
      "div",
      {
        className: "st-os-root",
        style: { position: "fixed", inset: 0, overflow: "hidden" },
        children: /* @__PURE__ */ jsx(
          MainframeOutlet,
          {
            mode: "os",
            ctx: {
              os: {
                apps,
                persisted,
                initialOpen: hasPersisted ? [] : initialOpen
              }
            }
          }
        )
      }
    ) })
  ] });
}

// src/pages/os.tsx
import { Fragment as Fragment2, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function Os() {
  return /* @__PURE__ */ jsxs2(Fragment2, { children: [
    /* @__PURE__ */ jsx2(Head, { title: "beam\xB7os" }),
    /* @__PURE__ */ jsx2(OsShellDesktop, {})
  ] });
}
export {
  Os as default
};
//# sourceMappingURL=os-KG4Z43UU.js.map