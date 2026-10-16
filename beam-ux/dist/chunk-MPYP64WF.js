import {
  Prose,
  useEntryArtifact
} from "./chunk-TNJW77N2.js";

// src/docs/ArtifactChrome.tsx
import { Fragment, jsx } from "react/jsx-runtime";
function ArtifactChrome({ artifact, components, children, ...chrome }) {
  const { Body } = useEntryArtifact(artifact.url, artifact.version);
  if (Body === null) {
    return /* @__PURE__ */ jsx(Fragment, { children });
  }
  return /* @__PURE__ */ jsx(Body, { ...chrome, components: components ?? {}, children });
}

// src/docs/css.ts
var DOCS_TEMPLATE_CSS = `
.beam-tpl-prose { width: 100%; }
/* The child box IS the text column: the gutter comes off its width rather than going on as padding-inline, because a
   prose block's own padding (a list's indent, a code block's or blockquote's inset) is more specific and would replace
   it, leaving list markers, the quote bar and the code block outside the column (launch ticket 05 item 6). Paragraphs
   and headings sit exactly where they did. Scoped with the Prose root's attribute so it outranks a prose element rule
   that sets its own width (Prose's table rule, width 100%), which would otherwise fill the template, not the column. */
.beam-tpl-prose[data-beam-prose] > * {
  margin-inline: auto;
  width: calc(100% - 2 * var(--beam-gutter, 1.5rem));
  max-width: calc(var(--beam-measure, 48rem) - 2 * var(--beam-gutter, 1.5rem));
}
/* A full-bleed child is a whole application rather than an article \u2014 it owns its own edges. */
.beam-tpl-prose > [data-beam-full-bleed] {
  max-width: none;
  width: 100%;
}
.beam-tpl-prose > *:first-child { padding-block-start: var(--beam-page-top, 3rem); }
.beam-tpl-prose > *:last-child { padding-block-end: var(--beam-page-bottom, 4rem); }
.beam-tpl-prose > [data-beam-full-bleed]:first-child { padding-block-start: 0; }
.beam-tpl-prose > [data-beam-full-bleed]:last-child { padding-block-end: 0; }

.beam-tpl-spread { width: 100%; }
`;

// src/docs/templates.tsx
import { Fragment as Fragment2, jsx as jsx2, jsxs } from "react/jsx-runtime";
function ProseTemplate({ children, classNames }) {
  return /* @__PURE__ */ jsxs(Fragment2, { children: [
    /* @__PURE__ */ jsx2("style", { children: DOCS_TEMPLATE_CSS }),
    /* @__PURE__ */ jsx2(Prose, { className: ["beam-entry beam-tpl-prose", classNames?.template].filter(Boolean).join(" "), children })
  ] });
}
function SpreadTemplate({ children, classNames }) {
  return /* @__PURE__ */ jsxs("div", { "data-beam-full-bleed": "", children: [
    /* @__PURE__ */ jsx2("style", { children: DOCS_TEMPLATE_CSS }),
    /* @__PURE__ */ jsx2(Prose, { className: ["beam-entry beam-tpl-spread", classNames?.template].filter(Boolean).join(" "), children })
  ] });
}

// src/docs/builtins.ts
var BUILTIN_LAYOUTS = {};
var BUILTIN_TEMPLATES = { ProseTemplate, SpreadTemplate };

// src/docs/registry.ts
var layouts = /* @__PURE__ */ new Map();
var templates = /* @__PURE__ */ new Map();
function registerLayout(name, component) {
  layouts.set(name, component);
}
function registerTemplate(name, component) {
  templates.set(name, component);
}
function registerChrome(chrome) {
  for (const [name, component] of Object.entries(chrome.layouts ?? {})) {
    registerLayout(name, component);
  }
  for (const [name, component] of Object.entries(chrome.templates ?? {})) {
    registerTemplate(name, component);
  }
}
function resolveLayout(name) {
  return name ? layouts.get(name) ?? BUILTIN_LAYOUTS[name] ?? null : null;
}
function resolveTemplate(name) {
  return name ? templates.get(name) ?? BUILTIN_TEMPLATES[name] ?? null : null;
}
function registeredChromeNames() {
  return {
    layouts: [.../* @__PURE__ */ new Set([...Object.keys(BUILTIN_LAYOUTS), ...layouts.keys()])],
    templates: [.../* @__PURE__ */ new Set([...Object.keys(BUILTIN_TEMPLATES), ...templates.keys()])]
  };
}
function clearChromeRegistry() {
  layouts.clear();
  templates.clear();
}

// src/docs/config.ts
var config = {};
function configureEntryPage(next) {
  config = { ...config, ...next };
}
function entryPageConfig() {
  return config;
}
function resetEntryPageConfig() {
  config = {};
}

export {
  ArtifactChrome,
  DOCS_TEMPLATE_CSS,
  ProseTemplate,
  SpreadTemplate,
  BUILTIN_LAYOUTS,
  BUILTIN_TEMPLATES,
  registerLayout,
  registerTemplate,
  registerChrome,
  resolveLayout,
  resolveTemplate,
  registeredChromeNames,
  clearChromeRegistry,
  configureEntryPage,
  entryPageConfig,
  resetEntryPageConfig
};
//# sourceMappingURL=chunk-MPYP64WF.js.map