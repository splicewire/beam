import {
  DocsPublishingPanel,
  createDocsPublicationsClient,
  docsConfiguration,
  fetchDocs,
  fetchRegistryLink,
  scalarRegistryUrl,
  setDocsConfiguration
} from "./chunk-MRFOBKE2.js";

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
import { useEffect as useEffect6, useId, useState as useState6 } from "react";
import { RealmNav } from "@splicewire/beam-ux/nav";

// src/RegistryIndexNav.tsx
import { Combobox } from "@schemastud/combobox";
import { ExpandableNav } from "@schemastud/nav";
import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect as useEffect2,
  useMemo,
  useRef as useRef2,
  useState as useState2
} from "react";

// src/registry-index-css.ts
var REGISTRY_INDEX_CSS = `
.beam-registry-index { display: flex; flex-direction: column; gap: 0.5rem; margin: 0.25rem 0 0.5rem; }
.beam-registry-index-search { position: relative; }
.beam-registry-index-trigger { display: flex; width: 100%; align-items: center; gap: 0.5rem; padding: 0.375rem 0.625rem;
  border: 1px solid var(--beam-border, var(--beam-line)); border-radius: var(--beam-radius, 0.5rem);
  background: var(--beam-paper-raised, var(--beam-paper)); color: var(--beam-ink-70); font: inherit; font-size: 12.5px; cursor: pointer; text-align: left; }
.beam-registry-index-trigger:hover { color: var(--beam-fg, var(--beam-ink)); }
.beam-registry-index-trigger:focus-visible, .beam-registry-index-header:focus-visible, .beam-registry-index-link:focus-visible,
.beam-registry-index-input:focus-visible, .beam-registry-index-root:focus { outline: 2px solid var(--beam-fg, var(--beam-ink)); outline-offset: 1px; }
.beam-registry-index-trigger > span:nth-child(2) { flex: 1; }
.beam-registry-index-count { font-size: 11px; font-variant-numeric: tabular-nums; opacity: 0.8; }
.beam-registry-index-popover { position: absolute; z-index: 40; top: calc(100% + 0.25rem); left: 0; right: 0; box-sizing: border-box;
  border: 1px solid var(--beam-border, var(--beam-line)); border-radius: var(--beam-radius, 0.5rem);
  background: var(--beam-paper-raised, var(--beam-paper)); box-shadow: 0 8px 24px rgb(0 0 0 / 0.14); }
.beam-registry-index-popover > div:first-child { padding: 0.375rem; border-bottom: 1px solid var(--beam-border, var(--beam-line)); }
.beam-registry-index-input { width: 100%; box-sizing: border-box; padding: 0.375rem 0.5rem; font: inherit; font-size: 13px;
  border: 1px solid var(--beam-border, var(--beam-line)); border-radius: calc(var(--beam-radius, 0.5rem) - 2px);
  background: var(--beam-paper); color: var(--beam-fg, var(--beam-ink)); }
.beam-registry-index-results { max-height: 20rem; overflow-y: auto; padding: 0.25rem; }
.beam-registry-index-results > div { padding: 0.5rem; font-size: 12.5px; color: var(--beam-ink-70); }
.beam-registry-index-results [role='option'] { display: flex; width: 100%; gap: 0.375rem; align-items: flex-start; padding: 0.375rem 0.5rem;
  border: 0; border-radius: calc(var(--beam-radius, 0.5rem) - 2px); background: none; color: var(--beam-fg, var(--beam-ink));
  font: inherit; font-size: 12.5px; text-align: left; cursor: pointer; }
.beam-registry-index-results [role='option'].bg-accent { background: var(--beam-line, rgb(127 127 127 / 0.16)); }
.beam-registry-index-results [role='option'] > span:first-child { width: 0.75rem; flex: none; }
.beam-registry-index-results [role='option'] > span:last-child { min-width: 0; flex: 1; }
.beam-registry-index-results [role='option'] > span:last-child > span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.beam-registry-index-results [role='option'] > span:last-child > span + span { font-size: 11px; color: var(--beam-ink-70); }
.beam-registry-index-tree { display: flex; flex-direction: column; gap: 0.5rem; }
.beam-registry-index-track-label { margin: 0.25rem 0 0.125rem; padding: 0 0.625rem; font-size: 10px; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--beam-ink-70); }
.beam-registry-index-track-label:empty { display: none; }
.beam-registry-index-header { display: flex; width: 100%; align-items: center; gap: 0.375rem; padding: 0.3rem 0.625rem; border: 0;
  border-radius: calc(var(--beam-radius, 0.5rem) - 2px); background: none; color: var(--beam-fg, var(--beam-ink));
  font: inherit; font-size: 13px; text-align: left; cursor: pointer; }
.beam-registry-index-header:hover { background: var(--beam-line, rgb(127 127 127 / 0.12)); }
.beam-registry-index-chevron { opacity: 0.7; }
.beam-registry-index-panel { padding-left: 1.4rem; }
.beam-registry-index-item { padding: 0.0625rem 0; }
.beam-registry-index-children { padding-left: 0.75rem; border-left: 1px solid var(--beam-border, var(--beam-line)); margin-left: 0.25rem; }
.beam-registry-index-link, .beam-registry-index-root { display: block; padding: 0.2rem 0.5rem; border-radius: calc(var(--beam-radius, 0.5rem) - 2px);
  font-size: 12.5px; text-decoration: none; overflow-wrap: break-word; }
.beam-registry-index-link { color: var(--beam-ink-70); }
.beam-registry-index-link:hover { color: var(--beam-fg, var(--beam-ink)); }
.beam-registry-index-link[data-active='true'] { color: var(--beam-fg, var(--beam-ink)); font-weight: 600; }
.beam-registry-index-root { color: var(--beam-ink-70); cursor: default; }
.beam-registry-index-root[data-revealed] { background: var(--beam-line, rgb(127 127 127 / 0.16)); }
.beam-registry-index-name { font-family: var(--beam-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 11.5px; }
.beam-registry-index-note { display: block; font-size: 11px; font-style: italic; }
.beam-registry-index-root[data-availability] .beam-registry-index-name { text-decoration: line-through dotted; text-decoration-thickness: 1px; }
.beam-registry-index-root[data-availability='exempt'] .beam-registry-index-name { text-decoration: none; }
`;

// src/RegistryIndexNav.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var REGISTRY_INDEX_KIND = "beam-docs/registry-index";
function RegistryIndexNav({ node, linkComponent, currentHref }) {
  const index = node.index ?? null;
  const roots = useMemo(() => index ? flatten(index.groups) : [], [index]);
  const byHref = useMemo(() => new Map(roots.filter((r) => r.href).map((r) => [r.href, r])), [roots]);
  const tree = useMemo(() => index ? toTree(index.groups) : [], [index]);
  const [revealed, setRevealed] = useState2(null);
  const rootRef = useRef2(null);
  useEffect2(() => setRevealed(null), [currentHref]);
  useEffect2(() => {
    if (!revealed) return;
    const row = rootRef.current?.querySelector(`[data-registry-root="${cssEscape(revealed)}"]`);
    row?.scrollIntoView?.({ block: "nearest" });
    row?.focus();
  }, [revealed]);
  const search = useCallback(async (query) => {
    const q = query.trim().toLowerCase();
    return roots.filter((r) => q === "" || r.root.toLowerCase().includes(q) || r.trail.some((t) => t.toLowerCase().includes(q))).map((r) => ({
      value: r.root,
      label: r.root,
      hint: [r.trail.join(" \u203A "), r.note].filter(Boolean).join(" \xB7 ")
    }));
  }, [roots]);
  if (!index) return null;
  const Link = linkComponent ?? (({ href, ...rest }) => /* @__PURE__ */ jsx2("a", { href, ...rest }));
  const current = currentHref ? byHref.get(currentHref)?.root : void 0;
  const choose = (option) => {
    const root = roots.find((r) => r.root === option.value);
    if (!root) return;
    if (navigable(root) && root.href) {
      (docsConfiguration().navigate ?? defaultNavigate)(root.href);
    } else {
      setRevealed(root.href ?? root.root);
    }
  };
  return /* @__PURE__ */ jsxs2("div", { ref: rootRef, className: "beam-registry-index", "data-registry-index": "", children: [
    /* @__PURE__ */ jsx2("style", { children: REGISTRY_INDEX_CSS }),
    /* @__PURE__ */ jsx2(
      Combobox,
      {
        primitives: PRIMITIVES,
        trigger: /* @__PURE__ */ jsxs2("button", { type: "button", className: "beam-registry-index-trigger", "aria-haspopup": "listbox", children: [
          /* @__PURE__ */ jsx2("span", { "aria-hidden": "true", children: "\u2315" }),
          /* @__PURE__ */ jsx2("span", { children: "Find a registry" }),
          /* @__PURE__ */ jsx2("span", { className: "beam-registry-index-count", children: index.total })
        ] }),
        search,
        onSelect: choose,
        currentValue: current,
        placeholder: "Jump to a registry root",
        emptyText: "No registry matches",
        debounceMs: 0,
        contentClassName: "beam-registry-index-popover",
        inputClassName: "beam-registry-index-input",
        listClassName: "beam-registry-index-results"
      }
    ),
    /* @__PURE__ */ jsx2(
      ExpandableNav,
      {
        items: tree,
        currentHref: revealed ?? currentHref,
        initialGroupState: "collapsed",
        storagePrefix: "beam-docs:registry-index",
        trackLabel: (track) => track === OTHER ? tree.some((n) => n.track !== OTHER) ? "Other registries" : "" : track,
        "aria-label": "Registry index",
        classes: {
          nav: "beam-registry-index-tree",
          track: "beam-registry-index-track",
          trackLabel: "beam-registry-index-track-label",
          group: "beam-registry-index-group",
          header: "beam-registry-index-header",
          chevron: "beam-registry-index-chevron",
          panelInner: "beam-registry-index-panel",
          item: "beam-registry-index-item",
          children: "beam-registry-index-children"
        },
        renderLink: (item, { active }) => {
          const root = item.href ? byHref.get(item.href) : void 0;
          if (root && !navigable(root)) {
            return /* @__PURE__ */ jsxs2(
              "span",
              {
                className: "beam-registry-index-root",
                "data-availability": root.availability,
                "data-registry-root": root.href ?? root.root,
                "data-revealed": active || void 0,
                tabIndex: -1,
                title: root.note ?? void 0,
                children: [
                  /* @__PURE__ */ jsx2("span", { className: "beam-registry-index-name", children: breakable(root.root) }),
                  root.note ? /* @__PURE__ */ jsx2("span", { className: "beam-registry-index-note", children: root.note }) : null
                ]
              }
            );
          }
          if (!item.href) {
            return /* @__PURE__ */ jsx2("span", { className: "beam-registry-index-root", children: item.title });
          }
          return /* @__PURE__ */ jsx2(
            Link,
            {
              href: item.href,
              className: "beam-registry-index-link",
              "data-active": active,
              "aria-current": active ? "page" : void 0,
              children: /* @__PURE__ */ jsx2(
                "span",
                {
                  className: "beam-registry-index-name",
                  "data-availability": root?.availability ?? "served",
                  "data-registry-root": item.href,
                  children: breakable(item.title)
                }
              )
            }
          );
        }
      }
    )
  ] });
}
var OTHER = "";
function breakable(name) {
  const parts = name.split(".");
  return parts.flatMap((part, i) => i < parts.length - 1 ? [`${part}.`, /* @__PURE__ */ jsx2("wbr", {}, i)] : [part]);
}
function navigable(root) {
  return root.availability === "served" || root.availability === "external";
}
function defaultNavigate(href) {
  window.location.assign(href);
}
function cssEscape(value) {
  return typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, "\\$&");
}
function flatten(groups, trail = []) {
  return groups.flatMap((group) => {
    const here = [...trail, group.title];
    return [...group.roots.map((root) => ({ ...root, trail: here })), ...flatten(group.groups, here)];
  });
}
function toTree(groups) {
  const nodes = [];
  let order = 0;
  let groupOrder = 0;
  const disclosure = (track, group) => {
    const label = group.title;
    const go = groupOrder++;
    const push = (n) => nodes.push({ ...n, track, group: label, groupOrder: go, order: order++ });
    const hrefs = new Set(group.roots.map((r) => r.href));
    if (group.href && !hrefs.has(group.href)) push({ title: "Overview", href: group.href });
    group.roots.forEach((r) => push({ title: r.root, href: r.href ?? void 0 }));
    for (const nested of group.groups) {
      const slug = nested.href ? nested.href.split("/").filter(Boolean).pop() : void 0;
      const roots = flatten([nested]);
      const pageIsARoot = roots.some((r) => r.href === nested.href);
      if (nested.href && !pageIsARoot) push({ title: nested.title, href: nested.href });
      for (const r of roots) {
        const anchor = r.href === nested.href;
        push({ title: r.root, href: r.href ?? void 0, parent: slug && !anchor ? slug : void 0 });
      }
    }
  };
  for (const group of groups) {
    if (group.roots.length === 0 && group.href === null && group.groups.length > 0) {
      group.groups.forEach((member) => disclosure(group.title, member));
    } else {
      disclosure(OTHER, group);
    }
  }
  return nodes;
}
var PopoverContext = createContext(null);
function Popover({ open, onOpenChange, children }) {
  const trigger = useRef2(null);
  const box = useRef2(null);
  const wasOpen = useRef2(open);
  const outside = useRef2(false);
  useEffect2(() => {
    if (!open) return;
    outside.current = false;
    const onDown = (e) => {
      if (box.current && !box.current.contains(e.target)) {
        outside.current = true;
        onOpenChange(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, onOpenChange]);
  useEffect2(() => {
    const lost = !document.activeElement || document.activeElement === document.body || box.current?.contains(document.activeElement);
    if (wasOpen.current && !open && !outside.current && lost) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);
  return /* @__PURE__ */ jsx2(PopoverContext.Provider, { value: { open, setOpen: onOpenChange, trigger }, children: /* @__PURE__ */ jsx2(
    "div",
    {
      ref: box,
      className: "beam-registry-index-search",
      "data-open": open || void 0,
      onKeyDown: (e) => {
        if (open && e.key === "Escape") {
          e.stopPropagation();
          onOpenChange(false);
          trigger.current?.focus();
        }
      },
      children
    }
  ) });
}
function PopoverTrigger({ children }) {
  const state = useContext(PopoverContext);
  if (!isValidElement(children)) return /* @__PURE__ */ jsx2(Fragment, { children });
  const child = children;
  return cloneElement(child, {
    ref: (el) => {
      state.trigger.current = el;
    },
    "aria-expanded": state.open,
    onClick: () => state.setOpen(!state.open)
  });
}
function PopoverContent({ className, children }) {
  const state = useContext(PopoverContext);
  return state.open ? /* @__PURE__ */ jsx2("div", { className, children }) : null;
}
var Input = forwardRef((props, ref) => /* @__PURE__ */ jsx2("input", { ref, type: "search", autoComplete: "off", spellCheck: false, ...props }));
Input.displayName = "RegistryIndexInput";
var PRIMITIVES = { Popover, PopoverTrigger, PopoverContent, Input };

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
/* tutorial-dx 09b: the group and zone labels are not links, so the rule above left them in the host's --sidebar-* ink
   at 55% and 80%: nearly invisible on a docs page. They take the same --beam-ink-70 as the rail's links. */
.beam-docs-rail .beam-nav-label, .beam-docs-rail .beam-nav-zone-label { color: var(--beam-ink-70); }
.beam-docs-appearance { background: none; border: 1px solid var(--beam-border, var(--beam-line)); border-radius: var(--beam-radius, 0.5rem); color: inherit; font: inherit; padding: 0.25rem 0.5rem; cursor: pointer; }

/* A reference on a spread page fills the viewport under the header (it was each host's wrapper's job, DOCS-13). */
.beam-tpl-spread [data-beam-ux-api-reference] { height: calc(100vh - var(--beam-docs-header-height, 3.25rem)); }
`;

// src/AppearanceToggle.tsx
import { useAppearance as useAppearance2 } from "@splicewire/beam-ux/appearance";
import { jsx as jsx3 } from "react/jsx-runtime";
var NEXT = { system: "dark", dark: "light", light: "dark" };
var LABEL = { system: "System", light: "Light", dark: "Dark" };
function AppearanceToggle() {
  const { appearance, resolvedAppearance, updateAppearance } = useAppearance2();
  const next = appearance === "system" ? resolvedAppearance === "dark" ? "light" : "dark" : NEXT[appearance];
  return /* @__PURE__ */ jsx3(
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
import { reportEvent } from "@splicewire/beam-ux/site";
import { useEffect as useEffect3, useRef as useRef3, useState as useState3 } from "react";
import { jsx as jsx4, jsxs as jsxs3 } from "react/jsx-runtime";
function DocsSearch({ root }) {
  const endpoint = docsConfiguration().searchEndpoint;
  const [q, setQ] = useState3(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") ?? "");
  const [found, setFound] = useState3(null);
  const latest = useRef3(0);
  const reported = useRef3(/* @__PURE__ */ new Set());
  const commit = (term) => {
    const searchTerm = term.trim();
    if (searchTerm === "" || reported.current.has(searchTerm)) return;
    reported.current.add(searchTerm);
    reportEvent("search", { search_term: searchTerm });
  };
  useEffect3(() => {
    if (endpoint) commit(q);
  }, []);
  useEffect3(() => {
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
  return /* @__PURE__ */ jsxs3("div", { className: "beam-docs-search", role: "search", children: [
    /* @__PURE__ */ jsx4(
      "input",
      {
        type: "search",
        "aria-label": "Search docs",
        placeholder: "Search docs",
        value: q,
        onChange: (e) => setQ(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") commit(q);
        }
      }
    ),
    found && q.trim() !== "" && /* @__PURE__ */ jsxs3("div", { className: "beam-docs-search-results", role: "listbox", "aria-label": "Search results", children: [
      found.results.map((hit) => /* @__PURE__ */ jsxs3("a", { href: hit.href, role: "option", "aria-selected": false, "data-docs-search-hit": "", "data-kind": hit.kind, onClick: () => commit(q), children: [
        /* @__PURE__ */ jsx4("strong", { children: hit.title }),
        hit.kind === "reference" && /* @__PURE__ */ jsx4("span", { children: " \xB7 API reference" }),
        hit.trail.length > 0 && /* @__PURE__ */ jsx4("small", { children: hit.trail.join(" \u203A ") }),
        hit.excerpt && /* @__PURE__ */ jsx4("p", { children: hit.excerpt })
      ] }, hit.href)),
      found.results.every((hit) => hit.kind !== "page") && /* @__PURE__ */ jsxs3("p", { children: [
        "No pages match \u201C",
        q.trim(),
        "\u201D."
      ] }),
      found.fallback && /* @__PURE__ */ jsx4("a", { href: found.fallback.href, children: found.fallback.label })
    ] })
  ] });
}

// src/ProductSwitcher.tsx
import { useEffect as useEffect4, useRef as useRef4, useState as useState4 } from "react";
import { jsx as jsx5, jsxs as jsxs4 } from "react/jsx-runtime";
function ProductSwitcher({ related, className }) {
  const [clicked, setClicked] = useState4(false);
  const [hovered, setHovered] = useState4(false);
  const root = useRef4(null);
  const open = clicked || hovered;
  useEffect4(() => {
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
  return /* @__PURE__ */ jsxs4(
    "div",
    {
      ref: root,
      className: ["beam-docs-switcher", className].filter(Boolean).join(" "),
      "data-docs-switcher": "",
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
      children: [
        /* @__PURE__ */ jsx5("button", { type: "button", "aria-expanded": open, "aria-haspopup": "dialog", onClick: () => setClicked((v) => !v), children: label }),
        open && /* @__PURE__ */ jsx5("div", { role: "dialog", "aria-label": "Other products", className: "beam-docs-switcher-panel", children: related.map((product) => /* @__PURE__ */ jsxs4("div", { className: "beam-docs-switcher-item", children: [
          /* @__PURE__ */ jsx5("strong", { children: product.name }),
          product.tagline && /* @__PURE__ */ jsx5("p", { children: product.tagline }),
          /* @__PURE__ */ jsxs4("a", { href: product.href, children: [
            "Visit ",
            product.name
          ] }),
          product.docs && /* @__PURE__ */ jsxs4("a", { href: product.docs, children: [
            product.name,
            " docs"
          ] })
        ] }, product.key)) })
      ]
    }
  );
}

// src/DocsHeader.tsx
import { jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsxs5("header", { className: "beam-docs-header", "data-docs-header": "", children: [
    /* @__PURE__ */ jsx6(
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
    /* @__PURE__ */ jsxs5(Link, { href: chrome.home, className: "beam-docs-brand", ...{ "data-docs-home": "" }, children: [
      chrome.brand.logo && /* @__PURE__ */ jsx6("img", { src: chrome.brand.logo, alt: "" }),
      /* @__PURE__ */ jsxs5("span", { children: [
        chrome.brand.name,
        " Docs"
      ] })
    ] }),
    /* @__PURE__ */ jsx6("nav", { className: "beam-docs-surfaces", "aria-label": "Docs surfaces", children: chrome.surfaces.map((surface) => /* @__PURE__ */ jsx6(
      Link,
      {
        href: surface.href,
        "aria-current": inSurface(surface.href) ? "page" : void 0,
        ...{ "data-docs-surface": "" },
        children: surface.label
      },
      surface.href
    )) }),
    /* @__PURE__ */ jsxs5("div", { className: "beam-docs-header-end", children: [
      slots?.search ?? (docsConfiguration().searchEndpoint ? /* @__PURE__ */ jsx6(DocsSearch, { root: chrome.home }) : null),
      slots?.appearance ?? /* @__PURE__ */ jsx6(AppearanceToggle, {}),
      slots?.headerActions,
      /* @__PURE__ */ jsx6(ProductSwitcher, { related: chrome.related }),
      /* @__PURE__ */ jsxs5("a", { href: chrome.back, className: "beam-docs-back", "data-docs-back": "", children: [
        "\u2190 Back to ",
        chrome.brand.name
      ] })
    ] })
  ] });
}
var PlainLink = ({ href, className, children, ...rest }) => /* @__PURE__ */ jsx6("a", { href, className, ...rest, children });

// src/ThemeDocsStyle.tsx
import { jsx as jsx7 } from "react/jsx-runtime";
function ThemeDocsStyle({ theme }) {
  if (!isRecord(theme) || !isRecord(theme.docs)) return null;
  const declarations = Object.entries(theme.docs).filter(
    ([key, value]) => /^[a-z][a-zA-Z0-9]*$/.test(key) && typeof value === "string" && !/[\u0000-\u001f<>{};]/.test(value)
  ).map(
    ([key, value]) => `--theme-docs-${key.replace(
      /[A-Z]/g,
      (letter) => `-${letter.toLowerCase()}`
    )}:${value};`
  ).join("");
  if (!declarations) return null;
  return /* @__PURE__ */ jsx7("style", { "data-beam-docs-theme": true, children: `.beam-docs{${declarations}}` });
}
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// src/HeadingAnchors.tsx
import { scanHeadings } from "@schemastud/nav";
import { useEffect as useEffect5, useRef as useRef5, useState as useState5 } from "react";
import { createPortal } from "react-dom";
import { Fragment as Fragment2, jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
function HeadingAnchors({
  main,
  routeKey,
  onScan
}) {
  const [headings, setHeadings] = useState5([]);
  const [copied, setCopied] = useState5("");
  const [status, setStatus] = useState5("");
  const timer = useRef5(void 0);
  const scanRevision = useRef5(0);
  useEffect5(() => () => clearTimeout(timer.current), []);
  useEffect5(() => {
    if (!main) return;
    const hosts = /* @__PURE__ */ new Map();
    let previous = null;
    const scan = () => {
      const items = scanHeadings({
        container: `#${main.id}`,
        doc: main.ownerDocument
      });
      const nodes = Array.from(
        main.querySelectorAll("h2[id], h3[id]")
      );
      const next = items.flatMap((item, index) => {
        const heading = nodes[index];
        if (!heading) return [];
        let host = hosts.get(heading);
        if (!host || host.parentElement !== heading) {
          host = main.ownerDocument.createElement("span");
          host.dataset.beamHeadingControls = "";
          heading.append(host);
          hosts.set(heading, host);
        }
        return [{ ...item, host }];
      });
      for (const [heading, host] of hosts) {
        if (!nodes.includes(heading)) {
          host.remove();
          hosts.delete(heading);
        }
      }
      const changed = previous === null || previous.length !== next.length || previous.some((heading, index) => {
        const replacement = next[index];
        return heading.id !== replacement?.id || heading.text !== replacement?.text || heading.level !== replacement?.level || heading.host !== replacement?.host;
      });
      if (changed) {
        previous = next;
        setHeadings(next);
        onScan(String(++scanRevision.current));
      }
    };
    const observer = new MutationObserver((records) => {
      if (records.some((record3) => {
        const element = record3.target instanceof Element ? record3.target : record3.target.parentElement;
        if (element?.closest("[data-beam-heading-controls]"))
          return false;
        const nodes = [
          ...record3.addedNodes,
          ...record3.removedNodes
        ];
        return record3.type !== "childList" || !nodes.length || nodes.some(
          (node) => !(node instanceof HTMLElement && node.hasAttribute(
            "data-beam-heading-controls"
          ))
        );
      }))
        scan();
    });
    observer.observe(main, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["id"]
    });
    scan();
    return () => {
      observer.disconnect();
      hosts.forEach((host) => host.remove());
    };
  }, [main, routeKey, onScan]);
  const copy = async (heading, markdown) => {
    clearTimeout(timer.current);
    setCopied("");
    if (!navigator.clipboard?.writeText) {
      setStatus("Copy unavailable");
      return;
    }
    const url = `${location.origin}${location.pathname}#${encodeURIComponent(heading.id)}`;
    const label = heading.text.replace(/([\\\[\]])/g, "\\$1");
    try {
      await navigator.clipboard.writeText(
        markdown ? `[${label}](${url})` : url
      );
      setCopied(`${heading.id}:${markdown}`);
      setStatus("Copied");
      timer.current = setTimeout(() => {
        setCopied("");
        setStatus("");
      }, 1500);
    } catch {
      setStatus("Copy unavailable");
    }
  };
  return /* @__PURE__ */ jsxs6(Fragment2, { children: [
    /* @__PURE__ */ jsx8("style", { children: HEADING_ANCHORS_CSS }),
    /* @__PURE__ */ jsx8("span", { className: "beam-heading-copy-status", role: "status", children: status }),
    headings.map(
      (heading) => createPortal(
        /* @__PURE__ */ jsxs6(Fragment2, { children: [
          /* @__PURE__ */ jsx8(
            "button",
            {
              type: "button",
              "aria-label": `Copy link to ${heading.text}`,
              title: "Copy link",
              "data-copy-label": copied === `${heading.id}:false` ? "Copied" : void 0,
              onClick: () => void copy(heading, false),
              children: /* @__PURE__ */ jsx8("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx8("path", { d: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2" }) })
            }
          ),
          /* @__PURE__ */ jsx8(
            "button",
            {
              type: "button",
              "aria-label": `Copy Markdown link to ${heading.text}`,
              title: "Copy Markdown link",
              "data-copy-label": copied === `${heading.id}:true` ? "Copied" : void 0,
              onClick: () => void copy(heading, true),
              children: /* @__PURE__ */ jsx8("svg", { "aria-hidden": "true", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx8("path", { d: "M3 6v12M3 6l5 6 5-6v12M17 12h5m-5 0 3-3m-3 3 3 3" }) })
            }
          )
        ] }),
        heading.host,
        heading.id
      )
    )
  ] });
}
var HEADING_ANCHORS_CSS = `
.beam-docs-main [data-beam-heading-controls]{display:inline-flex;gap:.25rem;margin-inline-start:.5rem;vertical-align:middle}
.beam-docs-main [data-beam-heading-controls] button{position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:1.75rem;min-height:1.75rem;padding:.25rem;border:0;border-radius:.25rem;background:transparent;color:inherit;cursor:pointer;opacity:0}
.beam-docs-main :is(h2,h3):hover [data-beam-heading-controls] button,.beam-docs-main [data-beam-heading-controls]:focus-within button{opacity:1}
.beam-docs-main [data-beam-heading-controls] button:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.beam-docs-main [data-beam-heading-controls] svg{width:1rem;height:1rem;fill:none;stroke:currentColor;stroke-width:1.5}
.beam-docs-main [data-copy-label]::after{content:attr(data-copy-label);position:absolute;inset-block-end:100%;padding:.25rem;font-size:.75rem;background:var(--beam-paper);color:var(--beam-ink)}
.beam-heading-copy-status{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@media(pointer:coarse){.beam-docs-main [data-beam-heading-controls] button{opacity:1;min-width:2.75rem;min-height:2.75rem}}
`;

// src/DocsLayout.tsx
import { jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
var DEFAULTS = {
  root: "beam-docs",
  body: "beam-docs-body",
  rail: "beam-docs-rail",
  main: "beam-docs-main",
  aside: "beam-docs-aside"
};
function DocsLayout({ nav, linkComponent, currentHref, slots, classNames, page, children }) {
  const items = markCurrent(railItemsFor(nav?.items ?? [], currentHref), currentHref);
  const docsChrome = page?.docsChrome ?? null;
  const [drawerOpen, setDrawerOpen] = useState6(false);
  const [main, setMain] = useState6(null);
  const [headingKey, setHeadingKey] = useState6("");
  const mainId = `beam-docs-main-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  useEffect6(() => setDrawerOpen(false), [currentHref]);
  useEffect6(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      className: [DEFAULTS.root, classNames?.root].filter(Boolean).join(" "),
      ...drawerOpen ? { "data-drawer-open": "" } : {},
      children: [
        /* @__PURE__ */ jsx9("style", { children: DOCS_LAYOUT_CSS }),
        /* @__PURE__ */ jsx9(ThemeDocsStyle, { theme: page?.theme }),
        docsChrome ? /* @__PURE__ */ jsx9(
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
        /* @__PURE__ */ jsxs7("div", { className: [DEFAULTS.body, classNames?.body].filter(Boolean).join(" "), children: [
          /* @__PURE__ */ jsxs7("aside", { className: [DEFAULTS.rail, classNames?.rail].filter(Boolean).join(" "), "aria-label": "Docs sections", children: [
            slots?.railTop,
            /* @__PURE__ */ jsx9(
              RealmNav,
              {
                items,
                variant: "flat-with-headers",
                linkComponent,
                kinds: docsNavKinds(),
                currentHref
              }
            )
          ] }),
          /* @__PURE__ */ jsxs7("main", { id: mainId, ref: setMain, className: [DEFAULTS.main, classNames?.main].filter(Boolean).join(" "), children: [
            slots?.breadcrumb,
            children
          ] }),
          /* @__PURE__ */ jsx9(HeadingAnchors, { main, routeKey: currentHref, onScan: setHeadingKey }),
          /* @__PURE__ */ jsx9("div", { className: [DEFAULTS.aside, classNames?.aside].filter(Boolean).join(" "), children: /* @__PURE__ */ jsx9(OnThisPage, { container: `#${mainId}`, routeKey: `${currentHref ?? ""}:${headingKey}` }) })
        ] }),
        slots?.footer
      ]
    }
  );
}
var PACKAGED_NAV_KINDS = { [REGISTRY_INDEX_KIND]: RegistryIndexNav };
function docsNavKinds() {
  return { ...PACKAGED_NAV_KINDS, ...docsConfiguration().navKinds };
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
function markCurrent(items, currentHref) {
  const stamped = (nodes) => nodes.some((node) => node.active || node.activeTrail || stamped(node.children ?? []));
  if (!currentHref || stamped(items)) {
    return items;
  }
  const mark = (nodes) => nodes.map((node) => ({
    ...node,
    ...node.href === currentHref ? { active: true } : {},
    ...node.children ? { children: mark(node.children) } : {}
  }));
  return mark(items);
}

// src/PhpApiReference.tsx
import { ExpandableNav as ExpandableNav2 } from "@schemastud/nav";
import { useCallback as useCallback2, useEffect as useEffect7, useMemo as useMemo2, useState as useState7 } from "react";

// src/PhpApiProse.tsx
import { Fragment as Fragment3 } from "react";
import { Fragment as Fragment4, jsx as jsx10 } from "react/jsx-runtime";
var SAFE_SCHEMES = /* @__PURE__ */ new Set(["http", "https", "mailto"]);
function safeHref(url) {
  const value = url.trim();
  if (value === "" || /[\u0000- \u007f\\]/.test(value)) return null;
  if (value.startsWith("#") || value.startsWith("?")) return value;
  if (value.startsWith("/")) return value.startsWith("//") ? null : value;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value);
  if (!scheme) return null;
  return SAFE_SCHEMES.has(scheme[1].toLowerCase()) ? value : null;
}
var INLINE = /`([^`]+)`|\{@see\s+([^\s}]+)[^}]*\}|\[([^\]]+)\]\(([^)]*)\)|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g;
function inline(text, link) {
  const out = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE)) {
    const at = match.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [whole, code, see, label, url, strong, em] = match;
    if (code !== void 0) {
      out.push(/* @__PURE__ */ jsx10("code", { children: code }, key++));
    } else if (see !== void 0) {
      const href = link(see);
      out.push(href ? /* @__PURE__ */ jsx10("a", { href, className: "beam-php-api-link", children: /* @__PURE__ */ jsx10("code", { children: see }) }, key++) : /* @__PURE__ */ jsx10("code", { children: see }, key++));
    } else if (label !== void 0) {
      const href = safeHref(url ?? "");
      out.push(href ? /* @__PURE__ */ jsx10("a", { href, rel: "noopener noreferrer", children: label }, key++) : /* @__PURE__ */ jsx10(Fragment3, { children: whole }, key++));
    } else if (strong !== void 0) {
      out.push(/* @__PURE__ */ jsx10("strong", { children: strong }, key++));
    } else if (em !== void 0) {
      out.push(/* @__PURE__ */ jsx10("em", { children: em }, key++));
    }
    last = at + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
function Paragraph({ text, link }) {
  const blocks = [];
  const lines = text.split("\n");
  let prose = [];
  let list2 = [];
  const flushProse = () => {
    if (prose.length) blocks.push(/* @__PURE__ */ jsx10("p", { children: inline(prose.join(" "), link) }, blocks.length));
    prose = [];
  };
  const flushList = () => {
    if (list2.length) {
      blocks.push(/* @__PURE__ */ jsx10("ul", { children: list2.map((item, i) => /* @__PURE__ */ jsx10("li", { children: inline(item, link) }, i)) }, blocks.length));
    }
    list2 = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      flushProse();
      flushList();
      const code = [];
      for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) code.push(lines[i]);
      blocks.push(/* @__PURE__ */ jsx10("pre", { children: /* @__PURE__ */ jsx10("code", { children: code.join("\n") }) }, blocks.length));
      continue;
    }
    const item = /^\s*[-*]\s+(.*)$/.exec(line);
    if (item) {
      flushProse();
      list2.push(item[1]);
      continue;
    }
    flushList();
    if (line.trim() !== "") prose.push(line.trim());
  }
  flushProse();
  flushList();
  return /* @__PURE__ */ jsx10(Fragment4, { children: blocks });
}

// src/PhpApiReference.tsx
import { Fragment as Fragment5, jsx as jsx11, jsxs as jsxs8 } from "react/jsx-runtime";
var PHP_API_SYMBOL_PARAM = "symbol";
var PHP_API_CSS = `
.beam-php-api { display: grid; grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr); gap: 2rem; align-items: start; }
@media (max-width: 48rem) { .beam-php-api { grid-template-columns: minmax(0, 1fr); } }
.beam-php-api-rail { position: sticky; top: 1rem; max-height: calc(100vh - 2rem); overflow: auto; font-size: 0.875rem; }
.beam-php-api-filter { width: 100%; box-sizing: border-box; margin-bottom: 0.75rem; padding: 0.375rem 0.5rem; font: inherit; border: 1px solid var(--border, currentColor); border-radius: var(--radius, 0.375rem); background: transparent; color: inherit; }
.beam-php-api-matches { margin: 0; padding: 0; list-style: none; }
.beam-php-api-matches li { padding-block: 0.125rem; }
.beam-php-api-track { margin: 0.75rem 0 0.25rem; font-weight: 650; }
.beam-php-api-group { margin: 0; }
.beam-php-api-header { display: flex; width: 100%; gap: 0.25rem; padding: 0.125rem 0; border: 0; background: none; color: inherit; font: inherit; text-align: start; cursor: pointer; }
.beam-php-api-item { display: block; padding: 0.125rem 0 0.125rem 1rem; }
.beam-php-api-item[aria-current="page"], .beam-php-api-matches a[aria-current="page"] { font-weight: 650; }
.beam-php-api-namespace { color: var(--muted-foreground, GrayText); overflow-wrap: anywhere; }
.beam-php-api-kind { display: inline-block; margin-inline-end: 0.5rem; padding: 0 0.375rem; border: 1px solid var(--border, currentColor); border-radius: 999px; font-size: 0.75rem; font-weight: 500; text-transform: lowercase; vertical-align: middle; }
.beam-php-api-symbol h2 { margin-top: 0; overflow-wrap: anywhere; }
.beam-php-api-signature { margin: 0 0 1rem; padding: 0.5rem 0.75rem; overflow-x: auto; border-radius: var(--radius, 0.375rem); background: var(--muted, rgba(127,127,127,0.08)); font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.875rem; white-space: pre-wrap; overflow-wrap: anywhere; }
.beam-php-api-section h3 { margin: 1.5rem 0 0.5rem; font-size: 1rem; }
.beam-php-api-member { margin: 0 0 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border, rgba(127,127,127,0.25)); }
.beam-php-api-member:last-child { border-bottom: 0; }
.beam-php-api-flag { margin-inline-start: 0.5rem; color: var(--muted-foreground, GrayText); font-size: 0.8125rem; }
.beam-php-api-more > summary { cursor: pointer; color: var(--muted-foreground, GrayText); font-size: 0.875rem; }
.beam-php-api-tags { margin: 0.5rem 0 0; padding-inline-start: 1.25rem; font-size: 0.875rem; }
.beam-php-api-links { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; }
.beam-php-api-note { color: var(--muted-foreground, GrayText); }
`;
function record(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
var isString = (v) => typeof v === "string";
var nullableString = (v) => v === null || typeof v === "string";
var optionalString = (v) => v === void 0 || v === null || typeof v === "string";
var stringList = (v) => Array.isArray(v) && v.every(isString);
var listOf = (v, item) => Array.isArray(v) && v.every((x) => record(x) && item(x));
var attributeOk = (a) => isString(a.name) && stringList(a.arguments);
var tagOk = (t) => isString(t.tag) && optionalString(t.type) && optionalString(t.name) && optionalString(t.description);
var templateOk = (t) => isString(t.name) && isString(t.variance) && nullableString(t.bound) && nullableString(t.default);
var linkOk = (l) => isString(l.fqn) && typeof l.published === "boolean";
var memberOk = (m) => isString(m.name) && isString(m.visibility) && listOf(m.attributes, attributeOk) && stringList(m.doc) && listOf(m.tags, tagOk) && typeof m.line === "number" && optionalString(m.signature) && optionalString(m.type) && optionalString(m.value) && optionalString(m.default) && optionalString(m.returnType) && optionalString(m.comment) && (m.params === void 0 || listOf(m.params, (p) => isString(p.name) && nullableString(p.type) && nullableString(p.default) && listOf(p.attributes, attributeOk))) && (m.templates === void 0 || listOf(m.templates, templateOk));
var inheritedOk = (i) => isString(i.kind) && isString(i.name) && isString(i.from) && nullableString(i.visibility) && (i.abstract === void 0 || typeof i.abstract === "boolean") && (i.original === void 0 || isString(i.original)) && (i.declaration === void 0 || record(i.declaration) && memberOk(i.declaration));
var unwrap = (raw) => record(raw) && record(raw.data) ? raw.data : raw;
function readPhpApiIndex(raw) {
  const value = unwrap(raw);
  if (!record(value) || !isString(value.audience) || !Array.isArray(value.packages)) return null;
  const ok = value.packages.every((p) => record(p) && isString(p.name) && nullableString(p.version) && typeof p.published === "number" && listOf(p.symbols, (s) => isString(s.fqn) && isString(s.kind) && nullableString(s.summary)));
  return ok ? value : null;
}
function readPhpApiSymbol(raw, fqn) {
  const s = unwrap(raw);
  if (!record(s) || s.fqn !== fqn || !isString(s.package) || !isString(s.kind) || !isString(s.file) || typeof s.line !== "number") return null;
  const ok = stringList(s.modifiers) && stringList(s.doc) && stringList(s.implementers) && nullableString(s.backingType) && optionalString(s.comment) && listOf(s.templates, templateOk) && listOf(s.attributes, attributeOk) && listOf(s.tags, tagOk) && listOf(s.extends, linkOk) && listOf(s.implements, linkOk) && listOf(s.traits, linkOk) && listOf(s.see, (x) => isString(x.target) && typeof x.published === "boolean") && ["constants", "cases", "properties", "methods"].every((k) => listOf(s[k], memberOk)) && listOf(s.inherited, inheritedOk);
  return ok ? s : null;
}
function phpApiIndexUrl(base) {
  return `${base.replace(/\/$/, "")}/php-api-index`;
}
function phpApiSymbolUrl(base, fqn) {
  return `${base.replace(/\/$/, "")}/php-api-symbol?${new URLSearchParams({ fqn })}`;
}
function symbolHref(fqn) {
  return `?${new URLSearchParams({ [PHP_API_SYMBOL_PARAM]: fqn })}`;
}
function currentSymbol() {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get(PHP_API_SYMBOL_PARAM);
  return value && value.trim() !== "" ? value : null;
}
var namespaceOf = (fqn) => fqn.includes("\\") ? fqn.slice(0, fqn.lastIndexOf("\\")) : "(global)";
var shortName = (fqn) => fqn.slice(fqn.lastIndexOf("\\") + 1);
function PhpApiReference({ endpoint, transport, className }) {
  const docs = docsConfiguration();
  const base = endpoint === void 0 ? docs.phpApiEndpoint ?? null : endpoint;
  const fetcher = transport ?? docs.transport ?? fetchDocs;
  const [index, setIndex] = useState7(null);
  const [selected, setSelected] = useState7(currentSymbol);
  const [filter, setFilter] = useState7("");
  useEffect7(() => {
    if (!base) return;
    const controller = new AbortController();
    fetcher(phpApiIndexUrl(base), { signal: controller.signal }).then((value) => !controller.signal.aborted && setIndex({ base, data: readPhpApiIndex(value) })).catch(() => !controller.signal.aborted && setIndex({ base, data: null }));
    return () => controller.abort();
  }, [base, fetcher]);
  useEffect7(() => {
    const follow2 = () => setSelected(currentSymbol());
    window.addEventListener("popstate", follow2);
    return () => window.removeEventListener("popstate", follow2);
  }, []);
  const data = index?.base === base ? index.data : null;
  const rows = useMemo2(() => data ? data.packages.flatMap((p) => p.symbols.map((s) => ({ ...s, package: p.name }))) : [], [data]);
  const published = useMemo2(() => new Set(rows.map((r) => r.fqn)), [rows]);
  const link = useCallback2((target) => {
    const fqn = target.replace(/^\\/, "").split("::")[0];
    return published.has(fqn) ? symbolHref(fqn) : null;
  }, [published]);
  const open = useCallback2((fqn) => {
    const url = new URL(window.location.href);
    url.searchParams.set(PHP_API_SYMBOL_PARAM, fqn);
    window.history.pushState(window.history.state, "", url);
    setSelected(fqn);
  }, []);
  const follow = useCallback2((event) => {
    const anchor = event.target.closest("a");
    const href = anchor?.getAttribute("href");
    if (!anchor || !href?.startsWith("?") || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const fqn = new URLSearchParams(href).get(PHP_API_SYMBOL_PARAM);
    if (!fqn || !published.has(fqn)) return;
    event.preventDefault();
    open(fqn);
  }, [open, published]);
  if (!base || !data) return null;
  const classes = ["beam-php-api", className].filter(Boolean).join(" ");
  const current = selected && published.has(selected) ? selected : null;
  const tree = rows.map((r, order) => ({
    title: shortName(r.fqn),
    href: symbolHref(r.fqn),
    track: r.package,
    group: namespaceOf(r.fqn),
    order
  }));
  const q = filter.trim().toLowerCase();
  const matches = q === "" ? [] : rows.filter((r) => r.fqn.toLowerCase().includes(q) || r.kind.includes(q)).slice(0, 100);
  return /* @__PURE__ */ jsxs8("div", { className: classes, "data-php-api-audience": data.audience, onClick: follow, children: [
    /* @__PURE__ */ jsx11("style", { children: PHP_API_CSS }),
    /* @__PURE__ */ jsxs8("nav", { className: "beam-php-api-rail", "aria-label": "PHP API", children: [
      /* @__PURE__ */ jsx11(
        "input",
        {
          type: "search",
          className: "beam-php-api-filter",
          "aria-label": "Filter symbols",
          placeholder: `Filter ${rows.length} symbols`,
          value: filter,
          onChange: (e) => setFilter(e.target.value)
        }
      ),
      q !== "" ? matches.length ? /* @__PURE__ */ jsx11("ul", { className: "beam-php-api-matches", "aria-label": "Matching symbols", children: matches.map((r) => /* @__PURE__ */ jsx11("li", { children: /* @__PURE__ */ jsxs8("a", { href: symbolHref(r.fqn), "aria-current": r.fqn === current ? "page" : void 0, children: [
        /* @__PURE__ */ jsx11("span", { className: "beam-php-api-kind", children: r.kind }),
        r.fqn
      ] }) }, r.fqn)) }) : /* @__PURE__ */ jsxs8("p", { className: "beam-php-api-note", children: [
        "No symbol matches \u201C",
        filter.trim(),
        "\u201D."
      ] }) : /* @__PURE__ */ jsx11(
        ExpandableNav2,
        {
          items: tree,
          currentHref: current ? symbolHref(current) : void 0,
          initialGroupState: "collapsed",
          storagePrefix: "beam-docs:php-api",
          "aria-label": "Packages and namespaces",
          classes: {
            track: "beam-php-api-track-wrap",
            trackLabel: "beam-php-api-track",
            group: "beam-php-api-group",
            header: "beam-php-api-header",
            item: "beam-php-api-item-wrap"
          },
          renderLink: (item, { active }) => /* @__PURE__ */ jsx11("a", { href: item.href, className: "beam-php-api-item", "aria-current": active ? "page" : void 0, children: item.title })
        }
      )
    ] }),
    /* @__PURE__ */ jsx11("main", { className: "beam-php-api-main", children: current ? /* @__PURE__ */ jsx11(SymbolView, { base, fqn: current, fetcher, link }, current) : selected ? /* @__PURE__ */ jsxs8("p", { className: "beam-php-api-note", role: "status", children: [
      "No published symbol is named ",
      /* @__PURE__ */ jsx11("code", { children: selected }),
      "."
    ] }) : /* @__PURE__ */ jsx11(Overview, { index: data }) })
  ] });
}
function Overview({ index }) {
  return /* @__PURE__ */ jsxs8("section", { className: "beam-php-api-overview", "aria-label": "Packages", children: [
    /* @__PURE__ */ jsx11("ul", { className: "beam-php-api-links", children: index.packages.map((p) => /* @__PURE__ */ jsxs8("li", { children: [
      /* @__PURE__ */ jsx11("code", { children: p.name }),
      p.version ? ` ${p.version}` : "",
      " \xB7 ",
      p.published,
      " symbol",
      p.published === 1 ? "" : "s"
    ] }, p.name)) }),
    /* @__PURE__ */ jsx11("p", { className: "beam-php-api-note", children: "Choose a symbol from the list, or filter it." })
  ] });
}
function SymbolView({ base, fqn, fetcher, link: linkIndex }) {
  const [loaded, setLoaded] = useState7(null);
  useEffect7(() => {
    const controller = new AbortController();
    fetcher(phpApiSymbolUrl(base, fqn), { signal: controller.signal }).then((value) => !controller.signal.aborted && setLoaded({ data: readPhpApiSymbol(value, fqn) })).catch(() => !controller.signal.aborted && setLoaded({ data: null }));
    return () => controller.abort();
  }, [base, fqn, fetcher]);
  const link = useMemo2(() => {
    const verdicts = new Map((loaded?.data?.see ?? []).map((x) => [x.target, x.published]));
    const seeClasses = [...new Set([...verdicts.keys()].map((t) => t.split("::")[0]))];
    return (target) => {
      const explicit = target.startsWith("\\");
      const raw = explicit ? target.slice(1) : target;
      const at = raw.indexOf("::");
      const written = at === -1 ? raw : raw.slice(0, at);
      const member = at === -1 ? "" : raw.slice(at);
      let cls;
      if (explicit) {
        cls = written;
      } else {
        const candidates = seeClasses.filter((c) => c === written || c.endsWith(`\\${written}`));
        if (candidates.length !== 1) return null;
        cls = candidates[0];
      }
      const verdict = verdicts.get(`${cls}${member}`);
      if (member !== "") return verdict === true ? linkIndex(cls) : null;
      if (explicit) return verdict === false ? null : linkIndex(cls);
      return verdict === true ? linkIndex(cls) : null;
    };
  }, [loaded, linkIndex]);
  if (!loaded) return /* @__PURE__ */ jsxs8("p", { className: "beam-php-api-note", role: "status", children: [
    "Loading ",
    /* @__PURE__ */ jsx11("code", { children: fqn }),
    "\u2026"
  ] });
  const s = loaded.data;
  if (!s) return /* @__PURE__ */ jsxs8("p", { className: "beam-php-api-note", role: "status", children: [
    /* @__PURE__ */ jsx11("code", { children: fqn }),
    " could not be read."
  ] });
  const named = (resolved, isPublished) => {
    const href = isPublished ? linkIndex(resolved.split("::")[0]) : null;
    return href ? /* @__PURE__ */ jsx11("a", { href, className: "beam-php-api-link", children: /* @__PURE__ */ jsx11("code", { children: resolved }) }) : /* @__PURE__ */ jsx11("code", { children: resolved });
  };
  return /* @__PURE__ */ jsxs8("article", { className: "beam-php-api-symbol", "aria-labelledby": "beam-php-api-title", "data-php-api-symbol": s.fqn, children: [
    /* @__PURE__ */ jsxs8("h2", { id: "beam-php-api-title", children: [
      /* @__PURE__ */ jsx11("span", { className: "beam-php-api-kind", children: s.kind }),
      s.fqn
    ] }),
    /* @__PURE__ */ jsx11("pre", { className: "beam-php-api-signature", "aria-label": "Declaration", children: declaration(s) }),
    /* @__PURE__ */ jsxs8("p", { className: "beam-php-api-note", children: [
      /* @__PURE__ */ jsx11("code", { children: s.package }),
      " \xB7 ",
      /* @__PURE__ */ jsxs8("code", { children: [
        s.file,
        ":",
        s.line
      ] })
    ] }),
    s.extends.length || s.implements.length || s.traits.length ? /* @__PURE__ */ jsxs8("dl", { className: "beam-php-api-relations", children: [
      s.extends.length > 0 && /* @__PURE__ */ jsxs8(Fragment5, { children: [
        /* @__PURE__ */ jsx11("dt", { children: "Extends" }),
        /* @__PURE__ */ jsx11("dd", { children: list(s.extends.map((l) => named(l.fqn, l.published))) })
      ] }),
      s.implements.length > 0 && /* @__PURE__ */ jsxs8(Fragment5, { children: [
        /* @__PURE__ */ jsx11("dt", { children: "Implements" }),
        /* @__PURE__ */ jsx11("dd", { children: list(s.implements.map((l) => named(l.fqn, l.published))) })
      ] }),
      s.traits.length > 0 && /* @__PURE__ */ jsxs8(Fragment5, { children: [
        /* @__PURE__ */ jsx11("dt", { children: "Uses" }),
        /* @__PURE__ */ jsx11("dd", { children: list(s.traits.map((l) => named(l.fqn, l.published))) })
      ] })
    ] }) : null,
    /* @__PURE__ */ jsx11(Templates, { templates: s.templates }),
    /* @__PURE__ */ jsx11(Attributes, { attributes: s.attributes }),
    /* @__PURE__ */ jsx11(Docs, { doc: s.doc, tags: s.tags, comment: s.comment, link }),
    /* @__PURE__ */ jsx11(Members, { title: "Cases", kind: "case", members: s.cases, link }),
    /* @__PURE__ */ jsx11(Members, { title: "Constants", kind: "constant", members: s.constants, link }),
    /* @__PURE__ */ jsx11(Members, { title: "Properties", kind: "property", members: s.properties, link }),
    /* @__PURE__ */ jsx11(Members, { title: "Methods", kind: "method", members: s.methods, link }),
    /* @__PURE__ */ jsx11(Inherited, { rows: s.inherited, named, link }),
    s.implementers.length > 0 && /* @__PURE__ */ jsxs8("section", { className: "beam-php-api-section", "aria-label": "Implemented by", children: [
      /* @__PURE__ */ jsx11("h3", { children: "Implemented by" }),
      list(s.implementers.map((f) => named(f, true)))
    ] }),
    s.see.length > 0 && /* @__PURE__ */ jsxs8("section", { className: "beam-php-api-section", "aria-label": "See also", children: [
      /* @__PURE__ */ jsx11("h3", { children: "See also" }),
      list(s.see.map((x) => named(x.target, x.published)))
    ] })
  ] });
}
function list(items) {
  return /* @__PURE__ */ jsx11("ul", { className: "beam-php-api-links", children: items.map((item, i) => /* @__PURE__ */ jsx11("li", { children: item }, i)) });
}
function declaration(s) {
  const parts = [...s.modifiers, s.kind, shortName(s.fqn)];
  if (s.backingType) parts[parts.length - 1] += `: ${s.backingType}`;
  if (s.extends.length) parts.push("extends", s.extends.map((l) => shortName(l.fqn)).join(", "));
  if (s.implements.length) parts.push("implements", s.implements.map((l) => shortName(l.fqn)).join(", "));
  return parts.join(" ");
}
function memberSignature(kind, m) {
  if (kind === "method") return m.signature ?? `${m.visibility} function ${m.name}()`;
  if (kind === "case") return `case ${m.name}${m.value != null ? ` = ${m.value}` : ""}`;
  if (kind === "constant") {
    return [m.visibility, m.final ? "final" : null, "const", m.type ?? null, m.name].filter(Boolean).join(" ") + (m.value != null ? ` = ${m.value}` : "");
  }
  return [m.visibility, m.static ? "static" : null, m.readonly ? "readonly" : null, m.type ?? null].filter(Boolean).join(" ") + ` $${m.name}${m.default != null ? ` = ${m.default}` : ""}`;
}
function Docs({ doc, tags, comment, link }) {
  const [first, ...rest] = doc;
  const more = rest.length > 0 || tags.length > 0;
  return /* @__PURE__ */ jsxs8("div", { className: "beam-php-api-doc", children: [
    first !== void 0 && /* @__PURE__ */ jsx11(Paragraph, { text: first, link }),
    more && /* @__PURE__ */ jsxs8("details", { className: "beam-php-api-more", children: [
      /* @__PURE__ */ jsx11("summary", { children: "More" }),
      rest.map((p, i) => /* @__PURE__ */ jsx11(Paragraph, { text: p, link }, i)),
      tags.length > 0 && /* @__PURE__ */ jsx11("ul", { className: "beam-php-api-tags", "aria-label": "Tags", children: tags.map((t, i) => /* @__PURE__ */ jsxs8("li", { children: [
        /* @__PURE__ */ jsx11("code", { children: [t.tag, t.type, t.name].filter(Boolean).join(" ") }),
        t.description ? /* @__PURE__ */ jsxs8(Fragment5, { children: [
          " ",
          inline(t.description, link)
        ] }) : null
      ] }, i)) })
    ] }),
    comment !== void 0 && /* @__PURE__ */ jsxs8("details", { className: "beam-php-api-more", children: [
      /* @__PURE__ */ jsx11("summary", { children: "Full comment" }),
      /* @__PURE__ */ jsx11("pre", { className: "beam-php-api-signature", children: comment })
    ] })
  ] });
}
function Templates({ templates }) {
  if (!templates.length) return null;
  return /* @__PURE__ */ jsxs8("p", { className: "beam-php-api-note", "aria-label": "Templates", children: [
    "Templates: ",
    templates.map((t, i) => /* @__PURE__ */ jsxs8("code", { children: [
      i > 0 ? ", " : "",
      t.variance !== "invariant" ? `${t.variance} ` : "",
      t.name,
      t.bound ? ` of ${t.bound}` : "",
      t.default ? ` = ${t.default}` : ""
    ] }, i))
  ] });
}
var attributeText = (a) => `#[${a.name}${a.arguments.length ? `(${a.arguments.join(", ")})` : ""}]`;
function Attributes({ attributes }) {
  if (!attributes.length) return null;
  return /* @__PURE__ */ jsx11("p", { className: "beam-php-api-note", "aria-label": "Attributes", children: attributes.map((a, i) => /* @__PURE__ */ jsxs8("code", { children: [
    attributeText(a),
    " "
  ] }, i)) });
}
function ParameterAttributes({ params }) {
  const attributed = params.filter((p) => p.attributes.length > 0);
  if (!attributed.length) return null;
  return /* @__PURE__ */ jsx11("ul", { className: "beam-php-api-tags", "aria-label": "Parameter attributes", children: attributed.map((p) => /* @__PURE__ */ jsxs8("li", { children: [
    /* @__PURE__ */ jsx11("code", { children: `$${p.name}` }),
    " ",
    /* @__PURE__ */ jsx11("code", { children: p.attributes.map(attributeText).join(" ") })
  ] }, p.name)) });
}
function Declaration({ kind, member, link }) {
  return /* @__PURE__ */ jsxs8(Fragment5, { children: [
    /* @__PURE__ */ jsx11("pre", { className: "beam-php-api-signature", children: memberSignature(kind, member) }),
    /* @__PURE__ */ jsx11(Templates, { templates: member.templates ?? [] }),
    /* @__PURE__ */ jsx11(Attributes, { attributes: member.attributes }),
    /* @__PURE__ */ jsx11(ParameterAttributes, { params: member.params ?? [] }),
    /* @__PURE__ */ jsx11(Docs, { doc: member.doc, tags: member.tags, comment: member.comment, link })
  ] });
}
function Members({ title, kind, members, link }) {
  if (!members.length) return null;
  return /* @__PURE__ */ jsxs8("section", { className: "beam-php-api-section", "aria-label": title, children: [
    /* @__PURE__ */ jsx11("h3", { children: title }),
    members.map((m) => /* @__PURE__ */ jsx11("div", { className: "beam-php-api-member", "data-php-api-member": m.name, children: /* @__PURE__ */ jsx11(Declaration, { kind, member: m, link }) }, m.name))
  ] });
}
function Inherited({ rows, named, link }) {
  if (!rows.length) return null;
  return /* @__PURE__ */ jsxs8("section", { className: "beam-php-api-section", "aria-label": "Inherited members", children: [
    /* @__PURE__ */ jsx11("h3", { children: "Inherited" }),
    rows.map((r) => /* @__PURE__ */ jsxs8("div", { className: "beam-php-api-member", "data-php-api-inherited": r.name, children: [
      /* @__PURE__ */ jsxs8("div", { children: [
        /* @__PURE__ */ jsx11("code", { children: r.kind === "method" ? `${r.name}()` : r.kind === "property" ? `$${r.name}` : r.name }),
        r.visibility ? /* @__PURE__ */ jsx11("span", { className: "beam-php-api-flag", children: r.visibility }) : null,
        r.abstract === true ? /* @__PURE__ */ jsx11("span", { className: "beam-php-api-flag", children: "abstract requirement" }) : null,
        r.original !== void 0 ? /* @__PURE__ */ jsxs8("span", { className: "beam-php-api-flag", children: [
          "alias of ",
          /* @__PURE__ */ jsxs8("code", { children: [
            r.original,
            "()"
          ] })
        ] }) : null,
        /* @__PURE__ */ jsxs8("span", { className: "beam-php-api-flag", children: [
          "from ",
          named(r.from, true)
        ] })
      ] }),
      r.declaration && /* @__PURE__ */ jsx11(Declaration, { kind: "method", member: r.declaration, link })
    ] }, `${r.kind} ${r.name}`))
  ] });
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

// src/DataExample.tsx
import { Children, isValidElement as isValidElement2 } from "react";
import { jsx as jsx12, jsxs as jsxs9 } from "react/jsx-runtime";
var DATA_EXAMPLE_CSS = `
.beam-docs-data-example { margin-block: 1.5rem; border: 1px solid var(--border, currentColor); border-radius: var(--radius, 0.5rem); overflow: hidden; container-type: inline-size; }
.beam-docs-data-example-panes { display: grid; grid-template-columns: minmax(0, 1fr); }
@container (min-width: 60rem) { .beam-docs-data-example-panes { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .beam-docs-data-example-pane + .beam-docs-data-example-pane { border-left: 1px solid var(--border, currentColor); border-top: 0; } }
.beam-docs-data-example-pane { min-width: 0; display: flex; flex-direction: column; }
.beam-docs-data-example-pane + .beam-docs-data-example-pane { border-top: 1px solid var(--border, currentColor); }
.beam-docs-data-example-label { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.25rem 0.75rem; padding: 0.5rem 0.875rem; border-bottom: 1px solid var(--border, currentColor); background: var(--muted, transparent); font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.01em; }
.beam-docs-data-example-label code { font-weight: 400; color: var(--muted-foreground, GrayText); overflow-wrap: anywhere; background: none; padding: 0; }
.beam-docs-data-example-body { min-width: 0; max-height: 32rem; overflow: auto; }
.beam-docs-data-example-body pre { margin: 0 !important; border: 0 !important; border-radius: 0 !important; min-height: 100%; }
.beam-docs-data-example-note { margin: 0; padding: 0.5rem 0.875rem; border-top: 1px solid var(--border, currentColor); color: var(--muted-foreground, GrayText); font-size: 0.8125rem; }
`;
function panes(children) {
  return Children.toArray(children).filter((child) => isValidElement2(child) || typeof child === "string" && child.trim() !== "");
}
function DataExample({ source, children, className }) {
  const [code, result, ...rest] = panes(children);
  const classes = ["beam-docs-data-example", className].filter(Boolean).join(" ");
  if (code === void 0 || result === void 0 || rest.length > 0) {
    return /* @__PURE__ */ jsxs9("figure", { className: classes, "data-source": source, children: [
      /* @__PURE__ */ jsx12("style", { children: DATA_EXAMPLE_CSS }),
      children
    ] });
  }
  return /* @__PURE__ */ jsxs9("figure", { className: classes, "data-source": source, "aria-label": "Data example", children: [
    /* @__PURE__ */ jsx12("style", { children: DATA_EXAMPLE_CSS }),
    /* @__PURE__ */ jsxs9("div", { className: "beam-docs-data-example-panes", children: [
      /* @__PURE__ */ jsxs9("section", { className: "beam-docs-data-example-pane", "aria-label": "PHP", children: [
        /* @__PURE__ */ jsxs9("div", { className: "beam-docs-data-example-label", children: [
          /* @__PURE__ */ jsx12("span", { children: "PHP" }),
          source && /* @__PURE__ */ jsx12("code", { children: source })
        ] }),
        /* @__PURE__ */ jsx12("div", { className: "beam-docs-data-example-body", children: code })
      ] }),
      /* @__PURE__ */ jsxs9("section", { className: "beam-docs-data-example-pane", "aria-label": "Captured output", children: [
        /* @__PURE__ */ jsxs9("div", { className: "beam-docs-data-example-label", children: [
          /* @__PURE__ */ jsx12("span", { children: "Captured output" }),
          /* @__PURE__ */ jsx12("code", { children: "JSON" })
        ] }),
        /* @__PURE__ */ jsx12("div", { className: "beam-docs-data-example-body", children: result })
      ] })
    ] }),
    /* @__PURE__ */ jsx12("figcaption", { className: "beam-docs-data-example-note", children: "Captured from the PHP beside it, and re-checked by the package's test suite." })
  ] });
}

// src/RegistryRegistrants.tsx
import { useEffect as useEffect8, useState as useState8 } from "react";
import { Fragment as Fragment6, jsx as jsx13, jsxs as jsxs10 } from "react/jsx-runtime";
var REGISTRANTS_CSS = `
.beam-docs-registrants { margin-block: 1.5rem; padding: 1rem 1.25rem; border: 1px solid var(--border, currentColor); border-radius: var(--radius, 0.5rem); font-size: 0.9375rem; line-height: 1.5; }
.beam-docs-registrants h2 { margin: 0 0 0.75rem; font-size: 1rem; font-weight: 650; }
.beam-docs-registrants dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 0.25rem 1rem; margin: 0; }
.beam-docs-registrants dt { color: var(--muted-foreground, GrayText); }
.beam-docs-registrants dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.beam-docs-registrants ul { margin: 0.75rem 0 0; padding: 0; list-style: none; }
.beam-docs-registrants li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.25rem 1rem; padding-block: 0.375rem; border-top: 1px solid var(--border, currentColor); }
.beam-docs-registrants li > code:last-child { color: var(--muted-foreground, GrayText); }
.beam-docs-registrants-note { margin: 0.75rem 0 0; color: var(--muted-foreground, GrayText); }
`;
function record2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
var optionalString2 = (value) => value === null || typeof value === "string";
function readRegistrants(value) {
  if (!record2(value) || typeof value.root !== "string" || typeof value.recordsRegistrants !== "boolean") return null;
  if (!(value.describedHere === null || typeof value.describedHere === "boolean")) return null;
  if (!optionalString2(value.owner) || !optionalString2(value.describedBy) || !optionalString2(value.note)) return null;
  if (!(value.unattributed === null || typeof value.unattributed === "number")) return null;
  let entries = null;
  if (value.entries !== null) {
    if (!Array.isArray(value.entries)) return null;
    entries = [];
    for (const entry of value.entries) {
      if (!record2(entry) || typeof entry.key !== "string" || typeof entry.registrant !== "string") return null;
      entries.push({ key: entry.key, registrant: entry.registrant });
    }
  }
  return {
    root: value.root,
    describedHere: value.describedHere,
    owner: value.owner,
    describedBy: value.describedBy,
    recordsRegistrants: value.recordsRegistrants,
    entries,
    unattributed: value.unattributed,
    note: value.note
  };
}
function registrantsUrl(endpoint, root) {
  return `${endpoint.replace(/\/$/, "")}/${encodeURIComponent(root)}/registrants`;
}
function RegistryRegistrants({ root, endpoint, transport, className }) {
  const docs = docsConfiguration();
  const base = endpoint === void 0 ? docs.registriesEndpoint ?? null : endpoint;
  const fetcher = transport ?? docs.transport ?? fetchDocs;
  const url = base && root ? registrantsUrl(base, root) : null;
  const [loaded, setLoaded] = useState8(null);
  useEffect8(() => {
    if (!url) return;
    const controller = new AbortController();
    fetcher(url, { signal: controller.signal }).then((value) => {
      if (!controller.signal.aborted) setLoaded({ url, data: readRegistrants(value) });
    }).catch(() => {
      if (!controller.signal.aborted) setLoaded({ url, data: null });
    });
    return () => controller.abort();
  }, [url, fetcher]);
  const data = loaded?.url === url ? loaded.data : null;
  if (!data || data.root !== root || data.describedHere === null) return null;
  const classes = ["beam-docs-registrants", className].filter(Boolean).join(" ");
  if (data.describedHere === false) {
    return /* @__PURE__ */ jsxs10("aside", { className: classes, "aria-label": "Registrants on this site", "data-registry-root": root, children: [
      /* @__PURE__ */ jsx13("style", { children: REGISTRANTS_CSS }),
      /* @__PURE__ */ jsx13("p", { className: "beam-docs-registrants-note", children: data.note ?? "not available on this host" })
    ] });
  }
  const entries = data.recordsRegistrants ? data.entries : null;
  return /* @__PURE__ */ jsxs10("aside", { className: classes, "aria-label": "Registrants on this site", "data-registry-root": root, children: [
    /* @__PURE__ */ jsx13("style", { children: REGISTRANTS_CSS }),
    /* @__PURE__ */ jsx13("h2", { children: "On this site" }),
    /* @__PURE__ */ jsxs10("dl", { children: [
      data.owner && /* @__PURE__ */ jsxs10(Fragment6, { children: [
        /* @__PURE__ */ jsx13("dt", { children: "Owner" }),
        /* @__PURE__ */ jsx13("dd", { children: /* @__PURE__ */ jsx13("code", { children: data.owner }) })
      ] }),
      data.describedBy && /* @__PURE__ */ jsxs10(Fragment6, { children: [
        /* @__PURE__ */ jsx13("dt", { children: "Described by" }),
        /* @__PURE__ */ jsx13("dd", { children: /* @__PURE__ */ jsx13("code", { children: data.describedBy }) })
      ] })
    ] }),
    entries ? /* @__PURE__ */ jsxs10(Fragment6, { children: [
      entries.length > 0 && /* @__PURE__ */ jsx13("ul", { "aria-label": "Entries and who registered them", children: entries.map((entry) => /* @__PURE__ */ jsxs10("li", { children: [
        /* @__PURE__ */ jsx13("code", { children: entry.key }),
        /* @__PURE__ */ jsx13("code", { children: entry.registrant })
      ] }, entry.key)) }),
      entries.length === 0 && !data.unattributed && /* @__PURE__ */ jsx13("p", { className: "beam-docs-registrants-note", children: "Nothing is registered here on this site." }),
      data.unattributed ? /* @__PURE__ */ jsx13("p", { className: "beam-docs-registrants-note", children: data.unattributed === 1 ? "1 entry does not name who registered it." : `${data.unattributed} entries do not name who registered them.` }) : null
    ] }) : data.note && /* @__PURE__ */ jsx13("p", { className: "beam-docs-registrants-note", children: data.note })
  ] });
}

// src/configure.ts
function configureDocs(options = {}) {
  initializeTheme();
  setDocsConfiguration({
    registryLinkEndpoint: options.registryLinkEndpoint === void 0 ? "/beam/docs/registry-link" : options.registryLinkEndpoint,
    searchEndpoint: options.searchEndpoint === void 0 ? "/beam/docs/search" : options.searchEndpoint,
    registriesEndpoint: options.registriesEndpoint === void 0 ? "/beam/docs/registries" : options.registriesEndpoint,
    phpApiEndpoint: options.phpApiEndpoint === void 0 ? "/beam/docs" : options.phpApiEndpoint,
    createApiReference: options.createApiReference,
    loadApiReference: options.loadApiReference,
    transport: options.transport,
    navKinds: options.navKinds,
    navigate: options.navigate
  });
  if (options.layout || !resolveLayout("DocsLayout")) {
    registerLayout("DocsLayout", options.layout ?? DocsLayout);
  }
  const kit = { Figure, FileTree, Terminal, Callout, Steps, Step, DoctorOutput, SectionLanding, CardGrid, Card };
  configureEntryPage({ components: { ApiReference, PhpApiReference, RegistryRegistrants, DataExample, ...kit, ...entryPageConfig().components } });
}
export {
  ApiReference,
  DATA_EXAMPLE_CSS,
  DOCS_LAYOUT_CSS,
  DataExample,
  DocsHeader,
  DocsLayout,
  DocsPublishingPanel,
  PHP_API_CSS,
  PHP_API_SYMBOL_PARAM,
  PhpApiReference,
  ProductSwitcher,
  REGISTRY_INDEX_CSS,
  REGISTRY_INDEX_KIND,
  RegistryIndexNav,
  RegistryRegistrants,
  SCALAR_CDN_URL,
  configureDocs,
  createDocsPublicationsClient,
  docsNavKinds,
  fetchDocs,
  phpApiIndexUrl,
  phpApiSymbolUrl,
  readPhpApiIndex,
  readPhpApiSymbol,
  safeHref,
  scalarRegistryUrl,
  symbolHref
};
//# sourceMappingURL=index.js.map