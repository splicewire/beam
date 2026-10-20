import {
  DocsPublishingPanel,
  createDocsPublicationsClient,
  docsConfiguration,
  fetchDocs,
  fetchRegistryLink,
  scalarRegistryUrl,
  setDocsConfiguration
} from "./chunk-IUVX4TYA.js";

// src/ApiReference.tsx
import { useAppearance } from "@splicewire/beam-ux/appearance";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var SCALAR_VERSION = "1.65.1";
var SCALAR_SRI = {
  "1.65.1": "sha384-G6dkutu2k5IYVyNESLoFIpgaHx38IJTZ/HhrwN0fecTle9te75y8Kru3rJEJ0ZJV"
};
var SCALAR_CDN_URL = `https://cdn.jsdelivr.net/npm/@scalar/api-reference@${SCALAR_VERSION}/dist/browser/standalone.js`;
var SCALAR_CDN_INTEGRITY = SCALAR_SRI[SCALAR_VERSION];
var BEAM_SCALAR_CSS = `.scalar-app {
  --scalar-background-1: var(--beam-paper-raised, var(--beam-paper));
  --scalar-background-2: var(--beam-surface-2, var(--beam-muted));
  --scalar-background-3: var(--beam-surface-2, var(--beam-muted));
  --scalar-color-1: var(--beam-fg, var(--beam-ink));
  --scalar-color-2: var(--beam-fg-muted, var(--beam-ink-muted));
  --scalar-color-3: var(--beam-fg-muted, var(--beam-ink-muted));
  --scalar-color-accent: var(--beam-accent, var(--beam-green));
  --scalar-border-color: var(--beam-border, var(--beam-line));
  --scalar-font: var(--beam-font-sans, inherit);
  --scalar-font-code: var(--beam-font-mono, ui-monospace, monospace);
  --scalar-sidebar-background-1: var(--beam-paper, var(--beam-paper-raised));
  --scalar-sidebar-color-1: var(--beam-fg, var(--beam-ink));
  --scalar-sidebar-color-2: var(--beam-fg-muted, var(--beam-ink-muted));
  --scalar-sidebar-border-color: var(--beam-border, var(--beam-line));
  --scalar-sidebar-item-hover-background: var(--beam-surface-2, var(--beam-muted));
  --scalar-sidebar-item-active-background: var(--beam-surface-2, var(--beam-muted));
  --scalar-sidebar-color-active: var(--beam-accent, var(--beam-green));
  --scalar-sidebar-search-background: var(--beam-paper-raised, var(--beam-paper));
  --scalar-sidebar-search-border-color: var(--beam-border, var(--beam-line));
}

/* Scalar forces every descendant of a property description onto color-2 with !important. Enum prose
   contains inline code such as "fixed" and "to_target"; Beam's translucent muted ink falls below AA
   on those chips in light mode. Keep the prose muted, but put only its inline code on primary ink. */
.scalar-app .property-description :not(pre) > code {
  color: var(--scalar-color-1) !important;
}`;
var HIDE_MCP_LAYER_CSS = ".scalar-mcp-layer { display: none !important; }";
var HIDE_SCALAR_VENDOR_CHROME_CSS = '.scalar-app aside a[href="https://www.scalar.com"] { display: none !important; }';
var scriptLoads = /* @__PURE__ */ new Map();
function loadScript(url) {
  const existing = scriptLoads.get(url);
  if (existing) return existing;
  const load = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    if (url === SCALAR_CDN_URL) {
      script.setAttribute("integrity", SCALAR_CDN_INTEGRITY);
      script.setAttribute("crossorigin", "anonymous");
    }
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => {
      scriptLoads.delete(url);
      reject(new Error(`beam-docs ApiReference: failed to load the spec renderer from ${url}.`));
    });
    document.head.appendChild(script);
  });
  scriptLoads.set(url, load);
  return load;
}
function globalFactory() {
  const scalar = globalThis.Scalar;
  return scalar?.createApiReference;
}
function ApiReference({
  specUrl,
  createApiReference,
  scriptUrl = SCALAR_CDN_URL,
  theme = "default",
  customCss,
  hideMcpLayer = true,
  configuration,
  onError,
  registryUrl,
  registryLinkEndpoint,
  transport,
  className,
  style
}) {
  const mount = useRef(null);
  const docs = docsConfiguration();
  const { resolvedAppearance } = useAppearance();
  const endpoint = registryLinkEndpoint === void 0 ? docs.registryLinkEndpoint : registryLinkEndpoint;
  const fetcher = transport ?? docs.transport ?? fetchDocs;
  const [loadedLink, setLoadedLink] = useState(null);
  const link = registryUrl !== void 0 ? scalarRegistryUrl(registryUrl) : loadedLink?.endpoint === endpoint && loadedLink.transport === fetcher ? loadedLink.url : null;
  useEffect(() => {
    if (registryUrl !== void 0 || !endpoint) return;
    const controller = new AbortController();
    setLoadedLink(null);
    fetchRegistryLink(endpoint, fetcher, controller.signal).then((url) => {
      if (!controller.signal.aborted) setLoadedLink({ endpoint, transport: fetcher, url });
    }).catch(() => {
      if (!controller.signal.aborted) setLoadedLink(null);
    });
    return () => controller.abort();
  }, [endpoint, fetcher, registryUrl]);
  useEffect(() => {
    let cancelled = false;
    const element = mount.current;
    if (!element) return;
    const css = [BEAM_SCALAR_CSS, HIDE_SCALAR_VENDOR_CHROME_CSS, hideMcpLayer ? HIDE_MCP_LAYER_CSS : null, customCss].filter(Boolean).join("\n");
    const render = (factory) => {
      if (cancelled) return;
      factory(element, {
        url: specUrl,
        theme,
        ...css ? { customCss: css } : {},
        // The appearance is OURS (forcing it also hides Scalar's own toggle), and Scalar's Ask AI and developer
        // toolbar stay off unless a host opts in through `configuration` (DM5; Scalar turns both on for any
        // `.test`/`localhost` host by itself).
        forceDarkModeState: resolvedAppearance,
        agent: { disabled: true },
        showDeveloperTools: "never",
        ...configuration
      });
    };
    const loader = createApiReference ? void 0 : docs.loadApiReference;
    if (loader) {
      loader().then(render).catch((error) => {
        if (!cancelled) onError?.(error);
      });
      return () => {
        cancelled = true;
        element.replaceChildren();
      };
    }
    const injected = createApiReference ?? docs.createApiReference ?? globalFactory();
    if (injected) {
      render(injected);
    } else {
      loadScript(scriptUrl).then(() => {
        const factory = globalFactory();
        if (!factory) {
          throw new Error(
            "beam-docs ApiReference: the renderer script loaded but exposed no factory."
          );
        }
        render(factory);
      }).catch((error) => {
        if (!cancelled) onError?.(error);
      });
    }
    return () => {
      cancelled = true;
      element.replaceChildren();
    };
  }, [
    specUrl,
    createApiReference,
    scriptUrl,
    theme,
    customCss,
    hideMcpLayer,
    configuration,
    onError,
    resolvedAppearance,
    docs.createApiReference,
    docs.loadApiReference
  ]);
  return /* @__PURE__ */ jsxs("div", { "data-beam-full-bleed": "", children: [
    link && /* @__PURE__ */ jsx("p", { "data-beam-docs-registry-link": "", style: { margin: 0, padding: "0.75rem 1rem" }, children: /* @__PURE__ */ jsx("a", { href: link, target: "_blank", rel: "noopener noreferrer", children: "View published API in Scalar Registry" }) }),
    /* @__PURE__ */ jsx("div", { ref: mount, className, style, "data-beam-ux-api-reference": specUrl })
  ] });
}

// src/DocsLayout.tsx
import { OnThisPage } from "@schemastud/nav";
import { useEffect as useEffect4, useState as useState4 } from "react";
import { RealmNav } from "@splicewire/beam-ux/nav";

// src/layout-css.ts
var DOCS_LAYOUT_CSS = `
.beam-docs { display: flex; min-height: 100vh; flex-direction: column; }
.beam-docs-body {
  margin-inline: auto;
  display: flex;
  width: 100%;
  max-width: var(--beam-docs-width, 80rem);
  flex: 1 1 auto;
  gap: var(--beam-docs-gap, 2.5rem);
  padding-inline: var(--beam-gutter, 1.5rem);
  padding-block: var(--beam-docs-pad, 2.5rem);
}
.beam-docs-rail { width: var(--beam-docs-rail, 14rem); flex: none; }
.beam-docs-main { min-width: 0; flex: 1 1 auto; overflow-wrap: break-word; }

/* The page never scrolls sideways (integrator 08:33Z, DOCS-13): a long URL or identifier in inline code breaks, and a
   code block or table that cannot fit scrolls inside itself, at desktop and at 390px. */
.beam-docs-main :not(pre) > code { overflow-wrap: anywhere; }
.beam-docs-main pre { max-width: 100%; overflow-x: auto; }
.beam-docs-main table { display: block; max-width: 100%; overflow-x: auto; }
.beam-docs-aside { width: var(--beam-docs-aside, 14rem); flex: none; }

/* The two side columns are the first thing to go on a narrow viewport: a rail and an on-this-page
   column beside a reading measure is three columns in the width of one. The rail's content is still
   reachable \u2014 it is the same projection the site nav renders from (ADR-0210 \xA75, one payload). */
@media (max-width: 80rem) { .beam-docs-aside { display: none; } }
@media (max-width: 60rem) { .beam-docs-rail { display: none; } }

/* A SpreadTemplate entry is a whole application rather than an article (the API reference, the MCP
   catalogue) and brings its own sidebar and search, so the layout gives it the viewport instead of a
   main column between the rail and the on-this-page column. \`data-beam-full-bleed\` only escapes the
   reading measure; without this, Scalar rendered into ~41rem on every host but the flagship, which
   carried the rule itself (beam-docs-satellite ticket 54 \xA73). */
.beam-docs:has(.beam-tpl-spread) .beam-docs-body {
  max-width: none;
  padding-inline: 0;
  padding-block: 0;
  gap: 0;
}
.beam-docs:has(.beam-tpl-spread) .beam-docs-rail,
.beam-docs:has(.beam-tpl-spread) .beam-docs-aside { display: none; }

/* The packaged header (DOCS-12, DM4). Structure only; colours come from the defined --beam-* tokens or the host hooks,
   so DOCS-13's theme values reach it without a second rule. It wraps rather than scrolls at 390px (DOC-8). */
.beam-docs-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--beam-docs-header-gap, 0.75rem 1.5rem);
  padding: var(--beam-docs-header-pad, 0.75rem var(--beam-gutter, 1.5rem));
  border-bottom: 1px solid var(--beam-border, var(--beam-line));
}
.beam-docs-brand { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; text-decoration: none; color: inherit; }
.beam-docs-brand img { height: 1.375rem; width: auto; }
.beam-docs-surfaces { display: flex; flex-wrap: wrap; gap: 1rem; }
.beam-docs-surfaces a { text-decoration: none; color: inherit; opacity: 0.75; }
.beam-docs-surfaces a[aria-current='page'] { opacity: 1; font-weight: 600; }
.beam-docs-header-end { margin-left: auto; display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
.beam-docs-back { text-decoration: none; color: inherit; opacity: 0.75; white-space: nowrap; }
.beam-docs-drawer-toggle { display: none; background: none; border: 0; color: inherit; font: inherit; cursor: pointer; }

/* The product switcher (DOC-16): a panel under its trigger, above the page. */
.beam-docs-switcher { position: relative; }
.beam-docs-switcher > button { background: none; border: 1px solid var(--beam-border, var(--beam-line)); border-radius: var(--beam-radius, 0.5rem); color: inherit; font: inherit; padding: 0.25rem 0.75rem; cursor: pointer; }
.beam-docs-switcher-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 30;
  width: min(18rem, calc(100vw - 2rem));
  padding: 0.75rem;
  border: 1px solid var(--beam-border, var(--beam-line));
  border-radius: var(--beam-radius, 0.5rem);
  background: var(--beam-paper-raised, Canvas);
}
.beam-docs-switcher-item { display: flex; flex-direction: column; gap: 0.25rem; }
.beam-docs-switcher-item p { margin: 0; opacity: 0.75; }

/* Under 60rem the rail is a drawer the header's menu button opens (DOC-8), not a vanished column. */
@media (max-width: 60rem) {
  .beam-docs-drawer-toggle { display: inline-flex; }
  .beam-docs[data-drawer-open] .beam-docs-rail {
    display: block;
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 40;
    width: min(20rem, 85vw);
    overflow-y: auto;
    padding: 1rem;
    background: var(--beam-paper, Canvas);
    border-right: 1px solid var(--beam-border, var(--beam-line));
  }
}

/* The packaged search box (DOCS-14): a field in the header and a results panel under it. Colours are tokens. */
.beam-docs-search { position: relative; }
.beam-docs-search input {
  width: min(16rem, 60vw);
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--beam-border, var(--beam-line));
  border-radius: var(--beam-radius, 0.5rem);
  background: transparent;
  color: inherit;
  font: inherit;
}
.beam-docs-search-results {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 30;
  width: min(26rem, calc(100vw - 2rem));
  max-height: 70vh;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid var(--beam-border, var(--beam-line));
  border-radius: var(--beam-radius, 0.5rem);
  background: var(--beam-paper-raised, Canvas);
}
.beam-docs-search-results a { display: block; padding: 0.5rem; text-decoration: none; color: inherit; border-radius: var(--beam-radius, 0.5rem); }
.beam-docs-search-results a small { display: block; opacity: 0.65; }
.beam-docs-search-results a p { margin: 0.25rem 0 0; opacity: 0.75; }

/* DOCS-13 (DM5): the docs read ONE token family. The rail, header and body take their ink from --beam-* (which flips
   under .dark), never a host's dark-rail --sidebar-* ink, which drew the invisible rail of shots 23/35. */
.beam-docs { color: var(--beam-fg, var(--beam-ink)); background: var(--beam-paper); }
/* --beam-ink-70, not --beam-ink-muted: 5.87:1 on --beam-paper in light and 7.69:1 in dark (ink-muted is 3.19 in light),
   so rail links clear DOC-8's 4.5:1 in both schemes; no host hook sits in front of it. */
.beam-docs-rail a { color: var(--beam-ink-70); }
.beam-docs-rail a:hover { color: var(--beam-fg, var(--beam-ink)); }
.beam-docs-rail a[aria-current='page'], .beam-docs-rail a[data-active='true'] { color: var(--beam-fg, var(--beam-ink)); font-weight: 600; }
.beam-docs-appearance { background: none; border: 1px solid var(--beam-border, var(--beam-line)); border-radius: var(--beam-radius, 0.5rem); color: inherit; font: inherit; padding: 0.25rem 0.5rem; cursor: pointer; }

/* A reference on a spread page fills the viewport under the header (it was each host's wrapper's job, DOCS-13). */
.beam-tpl-spread [data-beam-ux-api-reference] { height: calc(100vh - var(--beam-docs-header-height, 3.25rem)); }
`;

// src/AppearanceToggle.tsx
import { useAppearance as useAppearance2 } from "@splicewire/beam-ux/appearance";
import { jsx as jsx2 } from "react/jsx-runtime";
var NEXT = { system: "dark", dark: "light", light: "dark" };
var LABEL = { system: "System", light: "Light", dark: "Dark" };
function AppearanceToggle() {
  const { appearance, resolvedAppearance, updateAppearance } = useAppearance2();
  const next = appearance === "system" ? resolvedAppearance === "dark" ? "light" : "dark" : NEXT[appearance];
  return /* @__PURE__ */ jsx2(
    "button",
    {
      type: "button",
      className: "beam-docs-appearance",
      "aria-label": `Appearance: ${LABEL[appearance]} (switch to ${LABEL[next]})`,
      onClick: () => updateAppearance(next),
      children: resolvedAppearance === "dark" ? "\u263E" : "\u2600"
    }
  );
}

// src/DocsSearch.tsx
import { useEffect as useEffect2, useRef as useRef2, useState as useState2 } from "react";
import { jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function DocsSearch({ root }) {
  const endpoint = docsConfiguration().searchEndpoint;
  const [q, setQ] = useState2(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? "");
  const [found, setFound] = useState2(null);
  const latest = useRef2(0);
  useEffect2(() => {
    const query = q.trim();
    if (!endpoint || query === "") {
      setFound(null);
      return;
    }
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      const transport = docsConfiguration().transport ?? fetchDocs;
      try {
        const raw = await transport(`${endpoint}?${new URLSearchParams({ q: query, root })}`);
        if (ticket === latest.current) setFound(raw.data ?? raw);
      } catch {
        if (ticket === latest.current) setFound({ results: [], fallback: null });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [q, root, endpoint]);
  if (!endpoint) {
    return null;
  }
  return /* @__PURE__ */ jsxs2("div", { className: "beam-docs-search", role: "search", children: [
    /* @__PURE__ */ jsx3("input", { type: "search", "aria-label": "Search docs", placeholder: "Search docs", value: q, onChange: (e) => setQ(e.target.value) }),
    found && q.trim() !== "" && /* @__PURE__ */ jsxs2("div", { className: "beam-docs-search-results", role: "listbox", "aria-label": "Search results", children: [
      found.results.map((hit) => /* @__PURE__ */ jsxs2("a", { href: hit.href, role: "option", "aria-selected": false, "data-docs-search-hit": "", "data-kind": hit.kind, children: [
        /* @__PURE__ */ jsx3("strong", { children: hit.title }),
        hit.kind === "reference" && /* @__PURE__ */ jsx3("span", { children: " \xB7 API reference" }),
        hit.trail.length > 0 && /* @__PURE__ */ jsx3("small", { children: hit.trail.join(" \u203A ") }),
        hit.excerpt && /* @__PURE__ */ jsx3("p", { children: hit.excerpt })
      ] }, hit.href)),
      found.results.every((hit) => hit.kind !== "page") && /* @__PURE__ */ jsxs2("p", { children: [
        "No pages match \u201C",
        q.trim(),
        "\u201D."
      ] }),
      found.fallback && /* @__PURE__ */ jsx3("a", { href: found.fallback.href, children: found.fallback.label })
    ] })
  ] });
}

// src/ProductSwitcher.tsx
import { useEffect as useEffect3, useRef as useRef3, useState as useState3 } from "react";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function ProductSwitcher({ related, className }) {
  const [clicked, setClicked] = useState3(false);
  const [hovered, setHovered] = useState3(false);
  const root = useRef3(null);
  const open = clicked || hovered;
  useEffect3(() => {
    if (!open) return;
    const close = () => {
      setClicked(false);
      setHovered(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e) => {
      if (!root.current?.contains(e.target)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);
  if (related.length === 0) {
    return null;
  }
  const label = related.length === 1 ? related[0].name : "Products";
  return /* @__PURE__ */ jsxs3(
    "div",
    {
      ref: root,
      className: ["beam-docs-switcher", className].filter(Boolean).join(" "),
      "data-docs-switcher": "",
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
      children: [
        /* @__PURE__ */ jsx4("button", { type: "button", "aria-expanded": open, "aria-haspopup": "dialog", onClick: () => setClicked((v) => !v), children: label }),
        open && /* @__PURE__ */ jsx4("div", { role: "dialog", "aria-label": "Other products", className: "beam-docs-switcher-panel", children: related.map((product) => /* @__PURE__ */ jsxs3("div", { className: "beam-docs-switcher-item", children: [
          /* @__PURE__ */ jsx4("strong", { children: product.name }),
          product.tagline && /* @__PURE__ */ jsx4("p", { children: product.tagline }),
          /* @__PURE__ */ jsxs3("a", { href: product.href, children: [
            "Visit ",
            product.name
          ] }),
          product.docs && /* @__PURE__ */ jsxs3("a", { href: product.docs, children: [
            product.name,
            " docs"
          ] })
        ] }, product.key)) })
      ]
    }
  );
}

// src/DocsHeader.tsx
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function DocsHeader({
  chrome,
  currentHref,
  slots,
  linkComponent,
  drawerOpen,
  onToggleDrawer
}) {
  const Link = linkComponent ?? PlainLink;
  const inSurface = (href) => !!currentHref && (currentHref === href || currentHref.startsWith(`${href}/`));
  return /* @__PURE__ */ jsxs4("header", { className: "beam-docs-header", "data-docs-header": "", children: [
    /* @__PURE__ */ jsx5(
      "button",
      {
        type: "button",
        className: "beam-docs-drawer-toggle",
        "data-docs-drawer-toggle": "",
        "aria-label": "Docs sections",
        "aria-expanded": drawerOpen,
        onClick: onToggleDrawer,
        children: "\u2630"
      }
    ),
    /* @__PURE__ */ jsxs4(Link, { href: chrome.home, className: "beam-docs-brand", ...{ "data-docs-home": "" }, children: [
      chrome.brand.logo && /* @__PURE__ */ jsx5("img", { src: chrome.brand.logo, alt: "" }),
      /* @__PURE__ */ jsxs4("span", { children: [
        chrome.brand.name,
        " Docs"
      ] })
    ] }),
    /* @__PURE__ */ jsx5("nav", { className: "beam-docs-surfaces", "aria-label": "Docs surfaces", children: chrome.surfaces.map((surface) => /* @__PURE__ */ jsx5(
      Link,
      {
        href: surface.href,
        "aria-current": inSurface(surface.href) ? "page" : void 0,
        ...{ "data-docs-surface": "" },
        children: surface.label
      },
      surface.href
    )) }),
    /* @__PURE__ */ jsxs4("div", { className: "beam-docs-header-end", children: [
      slots?.search ?? (docsConfiguration().searchEndpoint ? /* @__PURE__ */ jsx5(DocsSearch, { root: chrome.home }) : null),
      slots?.appearance ?? /* @__PURE__ */ jsx5(AppearanceToggle, {}),
      slots?.headerActions,
      /* @__PURE__ */ jsx5(ProductSwitcher, { related: chrome.related }),
      /* @__PURE__ */ jsxs4("a", { href: chrome.back, className: "beam-docs-back", "data-docs-back": "", children: [
        "\u2190 Back to ",
        chrome.brand.name
      ] })
    ] })
  ] });
}
var PlainLink = ({ href, className, children, ...rest }) => /* @__PURE__ */ jsx5("a", { href, className, ...rest, children });

// src/DocsLayout.tsx
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
var DEFAULTS = {
  root: "beam-docs",
  body: "beam-docs-body",
  rail: "beam-docs-rail",
  main: "beam-docs-main",
  aside: "beam-docs-aside"
};
function DocsLayout({ nav, linkComponent, currentHref, slots, classNames, page, children }) {
  const items = railItemsFor(nav?.items ?? [], currentHref);
  const docsChrome = page?.docsChrome ?? null;
  const [drawerOpen, setDrawerOpen] = useState4(false);
  useEffect4(() => setDrawerOpen(false), [currentHref]);
  useEffect4(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);
  return /* @__PURE__ */ jsxs5(
    "div",
    {
      className: [DEFAULTS.root, classNames?.root].filter(Boolean).join(" "),
      ...drawerOpen ? { "data-drawer-open": "" } : {},
      children: [
        /* @__PURE__ */ jsx6("style", { children: DOCS_LAYOUT_CSS }),
        docsChrome ? /* @__PURE__ */ jsx6(
          DocsHeader,
          {
            chrome: docsChrome,
            currentHref,
            slots,
            linkComponent,
            drawerOpen,
            onToggleDrawer: () => setDrawerOpen((v) => !v)
          }
        ) : slots?.header,
        /* @__PURE__ */ jsxs5("div", { className: [DEFAULTS.body, classNames?.body].filter(Boolean).join(" "), children: [
          /* @__PURE__ */ jsxs5("aside", { className: [DEFAULTS.rail, classNames?.rail].filter(Boolean).join(" "), "aria-label": "Docs sections", children: [
            slots?.railTop,
            /* @__PURE__ */ jsx6(RealmNav, { items, variant: "flat-with-headers", linkComponent })
          ] }),
          /* @__PURE__ */ jsxs5("main", { className: [DEFAULTS.main, classNames?.main].filter(Boolean).join(" "), children: [
            slots?.breadcrumb,
            children
          ] }),
          /* @__PURE__ */ jsx6("div", { className: [DEFAULTS.aside, classNames?.aside].filter(Boolean).join(" "), children: /* @__PURE__ */ jsx6(OnThisPage, { routeKey: currentHref }) })
        ] }),
        slots?.footer
      ]
    }
  );
}
function railItemsFor(items, currentHref) {
  if (!currentHref) {
    return items;
  }
  let best = null;
  const visit = (nodes) => {
    for (const node of nodes) {
      const href = node.href;
      if (href && href !== "/" && (currentHref === href || currentHref.startsWith(`${href}/`)) && (node.children?.length ?? 0) > 0 && (best === null || href.length > (best.href?.length ?? 0))) {
        best = node;
      }
      if (node.children?.length) {
        visit(node.children);
      }
    }
  };
  visit(items);
  return best === null ? items : best.children ?? [];
}

// src/configure.ts
import {
  configureEntryPage,
  entryPageConfig,
  registerLayout,
  resolveLayout
} from "@splicewire/beam-ux/docs";
import { initializeTheme } from "@splicewire/beam-ux/appearance";
import {
  Callout,
  Card,
  CardGrid,
  DoctorOutput,
  Figure,
  FileTree,
  SectionLanding,
  Step,
  Steps,
  Terminal
} from "@splicewire/beam-mdx/kit";
function configureDocs(options = {}) {
  initializeTheme();
  setDocsConfiguration({
    registryLinkEndpoint: options.registryLinkEndpoint === void 0 ? "/beam/docs/registry-link" : options.registryLinkEndpoint,
    searchEndpoint: options.searchEndpoint === void 0 ? "/beam/docs/search" : options.searchEndpoint,
    createApiReference: options.createApiReference,
    loadApiReference: options.loadApiReference,
    transport: options.transport
  });
  if (options.layout || !resolveLayout("DocsLayout")) {
    registerLayout("DocsLayout", options.layout ?? DocsLayout);
  }
  const kit = { Figure, FileTree, Terminal, Callout, Steps, Step, DoctorOutput, SectionLanding, CardGrid, Card };
  configureEntryPage({ components: { ApiReference, ...kit, ...entryPageConfig().components } });
}
export {
  ApiReference,
  DOCS_LAYOUT_CSS,
  DocsHeader,
  DocsLayout,
  DocsPublishingPanel,
  ProductSwitcher,
  SCALAR_CDN_URL,
  configureDocs,
  createDocsPublicationsClient,
  fetchDocs,
  scalarRegistryUrl
};
//# sourceMappingURL=index.js.map