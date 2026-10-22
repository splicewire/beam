import {
  AppLogoIcon,
  InertiaRailLink,
  useBrand
} from "./chunk-UEQF4DVZ.js";
import {
  useAppearance
} from "./chunk-6C5PVJOV.js";

// src/layouts/site-layout.tsx
import { Link as Link2, usePage as usePage2 } from "@inertiajs/react";
import { SiteLayout as BeamSiteLayout } from "@splicewire/beam-ux/site";
import { useEffect, useState } from "react";

// src/components/site-nav.tsx
import { Link, usePage } from "@inertiajs/react";
import { SiteNav as BeamSiteNav } from "@splicewire/beam-ux/site";
import { jsx } from "react/jsx-runtime";
function SiteNav({ style }) {
  const { nav: nav2 } = usePage().props;
  return /* @__PURE__ */ jsx(
    BeamSiteNav,
    {
      nav: nav2,
      linkComponent: Link,
      itemClassName: "navlink",
      itemStyle: style
    }
  );
}

// src/layouts/site-layout.tsx
import { RealmSwitcher } from "@splicewire/beam-ux/nav";
import { Fragment, jsx as jsx2, jsxs } from "react/jsx-runtime";
var CSS = `
.st-site,.st-site .ve-canvas{
  --st-bg:var(--theme-site-background, #f8fafc);
  --st-fg:var(--theme-site-foreground, #0f172a);
  --st-muted:var(--theme-site-muted, #475569);
  --st-accent:var(--theme-site-accent, #0f172a);
  --st-accent-hover:var(--theme-site-accent-hover, #1e293b);
  --st-accent-fg:var(--theme-site-accent-foreground, #fff);
  --st-border:var(--theme-site-border, rgba(15,23,42,.08));
  --st-dim:#64748b;
  --st-card:#fff;
  --st-card-border:#e2e8f0;
  --st-hero-from:#f8fafc;
  --st-hero-to:#eef2ff;
  --st-logo:#000;
  --st-header-bg:color-mix(in srgb, var(--st-bg) 86%, transparent);
}
.st-site{background:var(--st-bg);color:var(--st-fg)}
.dark .st-site,.st-site.dark{
  --st-bg:var(--theme-site-dark-background, #0b0f17);
  --st-fg:var(--theme-site-dark-foreground, #e5e7eb);
  --st-muted:var(--theme-site-dark-muted, #9ca3af);
  --st-accent:var(--theme-site-dark-accent, #8aa4ff);
  --st-accent-hover:var(--theme-site-dark-accent-hover, #a9bdff);
  --st-accent-fg:var(--theme-site-dark-accent-foreground, #0b0f17);
  --st-border:var(--theme-site-dark-border, #262b36);
  --st-dim:var(--st-muted);
  --st-card:color-mix(in srgb, var(--st-fg) 4%, var(--st-bg));
  --st-card-border:var(--st-border);
  --st-hero-from:var(--st-bg);
  --st-hero-to:color-mix(in srgb, var(--st-accent) 14%, var(--st-bg));
  --st-logo:var(--st-fg);
  color-scheme:dark;
}
.st-site a{color:inherit;text-decoration:none}
.st-site .navlink{font-size:14px;color:var(--st-muted);text-decoration:none;transition:color .15s}
.st-site .navlink:hover{color:var(--st-accent)}
.st-site .btn-primary{display:inline-flex;align-items:center;gap:8px;background:var(--st-accent);color:var(--st-accent-fg);border:none;border-radius:10px;padding:9px 16px;font:600 14px system-ui;cursor:pointer;transition:background .15s;text-decoration:none}
.st-site .btn-primary:hover{background:var(--st-accent-hover)}
`;
var SLOT_VARS = [
  ["background", "background"],
  ["foreground", "foreground"],
  ["muted", "muted"],
  ["accent", "accent"],
  ["accentHover", "accent-hover"],
  ["accentForeground", "accent-foreground"],
  ["border", "border"],
  ["darkBackground", "dark-background"],
  ["darkForeground", "dark-foreground"],
  ["darkMuted", "dark-muted"],
  ["darkAccent", "dark-accent"],
  ["darkAccentHover", "dark-accent-hover"],
  ["darkAccentForeground", "dark-accent-foreground"],
  ["darkBorder", "dark-border"]
];
function siteThemeCss(site) {
  const lines = SLOT_VARS.filter(([key]) => typeof site[key] === "string" && site[key] !== "").map(
    ([key, name]) => `  --theme-site-${name}:${site[key]};`
  );
  return `.st-site{
${lines.join("\n")}
}`;
}
function ThemeSiteStyle() {
  const page = usePage2();
  const site = page.props.theme?.site;
  if (!site) {
    return null;
  }
  return /* @__PURE__ */ jsx2("style", { dangerouslySetInnerHTML: { __html: siteThemeCss(site) } });
}
function useSiteDark() {
  const { resolvedAppearance } = useAppearance();
  const [, rerender] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => rerender((n) => n + 1);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return resolvedAppearance === "dark";
}
function SiteBrand() {
  const { name } = useBrand();
  return /* @__PURE__ */ jsxs(Link2, { href: "/", style: { display: "flex", alignItems: "center", gap: 9 }, children: [
    /* @__PURE__ */ jsx2(
      AppLogoIcon,
      {
        style: {
          width: 22,
          height: 22,
          display: "block",
          color: "var(--st-fg, #0f172a)",
          // A host logo is typically an unfilled path (the starters' mark), which paints black.
          fill: "var(--st-logo, #000)"
        }
      }
    ),
    /* @__PURE__ */ jsx2(
      "span",
      {
        style: {
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          color: "var(--st-fg, #0f172a)"
        },
        children: name
      }
    )
  ] });
}
function appHref(realms) {
  return realms?.realms?.find((realm) => realm.key === "tenant")?.href ?? "/dashboard";
}
function AuthNavLinks() {
  const page = usePage2();
  const { auth, realms } = page.props;
  if (!auth?.user) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx2("a", { className: "navlink", href: "/login", children: "Sign in" }),
      /* @__PURE__ */ jsx2("a", { className: "btn-primary", href: "/dashboard", children: "Dashboard" })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx2(Link2, { className: "navlink", href: appHref(realms), children: "Open app" }),
    realms?.realms && /* @__PURE__ */ jsx2(
      RealmSwitcher,
      {
        realms,
        label: auth.user.name,
        signOutHref: "/logout",
        linkComponent: InertiaRailLink
      }
    )
  ] });
}
var nav = /* @__PURE__ */ jsxs(
  "div",
  {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 22,
      marginLeft: "auto",
      flexWrap: "wrap"
    },
    children: [
      /* @__PURE__ */ jsx2(SiteNav, {}),
      /* @__PURE__ */ jsx2(AuthNavLinks, {})
    ]
  }
);
function SiteLayout({ children }) {
  const dark = useSiteDark();
  const page = usePage2();
  const contentLinks = page.props.nav?.items.filter((item) => Boolean(item.href)).map(({ title, href }) => ({ title, href })) ?? [
    { title: "Home", href: "/" },
    { title: "About", href: "/about" }
  ];
  const footerLinks = [
    ...contentLinks,
    page.props.auth?.user ? { title: "Open app", href: appHref(page.props.realms) } : { title: "Sign in", href: "/login" }
  ];
  return /* @__PURE__ */ jsx2(
    BeamSiteLayout,
    {
      linkComponent: Link2,
      brand: /* @__PURE__ */ jsx2(SiteBrand, {}),
      nav,
      footerLinks,
      head: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx2("style", { dangerouslySetInnerHTML: { __html: CSS } }),
        /* @__PURE__ */ jsx2(ThemeSiteStyle, {})
      ] }),
      footerBrand: /* @__PURE__ */ jsx2(SiteBrand, {}),
      footerStyle: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        marginTop: 48,
        // The bottom pads by the Edit dock's clearance where OsLayout mounts it, so no footer link sits under it.
        padding: "28px clamp(18px,5vw,56px) calc(28px + var(--beam-page-dock-clearance, 0px))",
        borderTop: "1px solid var(--st-border)",
        color: "var(--st-dim)",
        fontSize: 13
      },
      footerLinkClassName: "navlink",
      footerLinkStyle: { marginLeft: 18 },
      className: dark ? "st-site dark" : "st-site",
      style: {
        fontFamily: "system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      },
      headerStyle: {
        position: "sticky",
        top: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        gap: 18,
        flexWrap: "wrap",
        padding: "16px clamp(18px,5vw,56px)",
        background: "var(--st-header-bg)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--st-border)"
      },
      mainStyle: { flex: 1, width: "100%" },
      children
    }
  );
}

export {
  SiteLayout
};
//# sourceMappingURL=chunk-L3DFB4QY.js.map