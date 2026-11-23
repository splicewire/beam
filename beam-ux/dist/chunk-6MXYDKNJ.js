import {
  Prose,
  useAuthoredArtifacts,
  useEntryArtifact
} from "./chunk-KNNJIX4F.js";
import {
  bindingRuntime
} from "./chunk-YC5ZNKLO.js";

// src/docs/ArtifactChrome.tsx
import { Fragment, jsx } from "react/jsx-runtime";
function ArtifactChrome({ artifact, components, children, ...chrome }) {
  const { Body } = useEntryArtifact(artifact.url, artifact.version);
  const resolvedComponents = useAuthoredArtifacts(artifact.components, components, artifact.styleRegistry);
  if (Body === null) {
    return /* @__PURE__ */ jsx(Fragment, { children });
  }
  return /* @__PURE__ */ jsx(Body, { ...chrome, components: resolvedComponents, bindingRuntime, styleRegistry: artifact.styleRegistry, children });
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
import { OnKeyDuplicate, createRegistry } from "@schemastud/registry";
var CHROME_LAYOUTS_ROOT = "beam.ux.chrome.layouts";
var CHROME_TEMPLATES_ROOT = "beam.ux.chrome.templates";
function createLayouts() {
  return createRegistry({
    root: CHROME_LAYOUTS_ROOT,
    onKeyDuplicate: OnKeyDuplicate.Supersede,
    description: "Layouts an entry names in its `layout` column."
  });
}
function createTemplates() {
  return createRegistry({
    root: CHROME_TEMPLATES_ROOT,
    onKeyDuplicate: OnKeyDuplicate.Supersede,
    description: "Templates an entry names in its `template` column."
  });
}
var layouts = createLayouts();
var templates = createTemplates();
function registered(registry, name) {
  const key = registry.keyFor(name);
  return registry.has(key) ? registry.resolve(key) : void 0;
}
function registerLayout(name, component, by) {
  layouts.register(layouts.keyFor(name), component, typeof by === "string" ? by : null);
}
function registerTemplate(name, component, by) {
  templates.register(templates.keyFor(name), component, typeof by === "string" ? by : null);
}
function registerChrome(chrome, by) {
  for (const [name, component] of Object.entries(chrome.layouts ?? {})) {
    registerLayout(name, component, by);
  }
  for (const [name, component] of Object.entries(chrome.templates ?? {})) {
    registerTemplate(name, component, by);
  }
}
function resolveLayout(name) {
  return name ? registered(layouts, name) ?? BUILTIN_LAYOUTS[name] ?? null : null;
}
function resolveTemplate(name) {
  return name ? registered(templates, name) ?? BUILTIN_TEMPLATES[name] ?? null : null;
}
function layoutRegistrant(name) {
  return layouts.registrantOf(layouts.keyFor(name));
}
function templateRegistrant(name) {
  return templates.registrantOf(templates.keyFor(name));
}
function registeredChromeNames() {
  return {
    layouts: [.../* @__PURE__ */ new Set([...Object.keys(BUILTIN_LAYOUTS), ...layouts.names()])],
    templates: [.../* @__PURE__ */ new Set([...Object.keys(BUILTIN_TEMPLATES), ...templates.names()])]
  };
}
function chromeRegistries() {
  return { layouts, templates };
}
function clearChromeRegistry() {
  layouts = createLayouts();
  templates = createTemplates();
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
  CHROME_LAYOUTS_ROOT,
  CHROME_TEMPLATES_ROOT,
  registerLayout,
  registerTemplate,
  registerChrome,
  resolveLayout,
  resolveTemplate,
  layoutRegistrant,
  templateRegistrant,
  registeredChromeNames,
  chromeRegistries,
  clearChromeRegistry,
  configureEntryPage,
  entryPageConfig,
  resetEntryPageConfig
};
//# sourceMappingURL=chunk-6MXYDKNJ.js.map