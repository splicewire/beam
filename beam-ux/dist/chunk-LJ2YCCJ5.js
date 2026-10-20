import {
  bindingRuntime,
  richFieldComponents
} from "./chunk-APOUWOY4.js";
import {
  compileEntryStyles
} from "./chunk-RNDA3EP6.js";

// src/site/Prose.tsx
import { useId } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var PROSE_CSS = `
[data-beam-prose] {
  color: var(--beam-fg, inherit);
  font-family: var(--beam-font-sans, inherit);
  font-size: var(--beam-prose-size, 1rem);
  line-height: var(--beam-prose-leading, 1.7);
}

/* Rhythm: space comes from the element ABOVE, so the first child never pushes the block down. */
[data-beam-prose] > * { margin-block: 0; }
[data-beam-prose] > * + * { margin-block-start: var(--beam-prose-gap, 1.25em); }

[data-beam-prose] h1,
[data-beam-prose] h2,
[data-beam-prose] h3,
[data-beam-prose] h4 {
  color: var(--beam-heading, var(--beam-fg, inherit));
  font-family: var(--beam-font-display, var(--beam-font-sans, inherit));
  font-weight: var(--beam-heading-weight, 600);
  line-height: 1.25;
  text-wrap: balance;
}

[data-beam-prose] > h1 { font-size: 2.25em; }
[data-beam-prose] > h2 { font-size: 1.5em; }
[data-beam-prose] > h3 { font-size: 1.25em; }
[data-beam-prose] > h4 { font-size: 1.05em; }

/* A heading belongs to what follows it, so it gets more space above than below. */
[data-beam-prose] > * + :is(h1, h2, h3, h4) { margin-block-start: var(--beam-prose-heading-gap, 2em); }
[data-beam-prose] > :is(h1, h2, h3, h4) + * { margin-block-start: var(--beam-prose-gap, 0.75em); }

[data-beam-prose] a {
  color: var(--beam-accent, currentColor);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

[data-beam-prose] strong { color: var(--beam-heading, var(--beam-fg, inherit)); font-weight: 650; }

[data-beam-prose] :is(ul, ol) { padding-inline-start: 1.5em; }
[data-beam-prose] ul { list-style: disc; }
[data-beam-prose] ol { list-style: decimal; }
[data-beam-prose] li + li { margin-block-start: 0.4em; }
[data-beam-prose] li::marker { color: var(--beam-fg-muted, currentColor); }

[data-beam-prose] :not(pre) > code {
  background: var(--beam-surface-2, color-mix(in srgb, currentColor 8%, transparent));
  border-radius: 0.3em;
  font-family: var(--beam-font-mono, ui-monospace, monospace);
  font-size: 0.9em;
  padding: 0.15em 0.4em;
}

[data-beam-prose] pre {
  background: var(--beam-surface-2, color-mix(in srgb, currentColor 8%, transparent));
  border: 1px solid var(--beam-border, transparent);
  border-radius: var(--beam-radius, 0.5rem);
  font-family: var(--beam-font-mono, ui-monospace, monospace);
  font-size: 0.875em;
  line-height: 1.6;
  overflow-x: auto;
  padding: 1em 1.15em;
}
[data-beam-prose] pre code { background: none; font-size: inherit; padding: 0; }

[data-beam-prose] blockquote {
  border-inline-start: 2px solid var(--beam-accent, currentColor);
  color: var(--beam-fg-muted, inherit);
  padding-inline-start: 1em;
}

[data-beam-prose] hr { border: 0; border-block-start: 1px solid var(--beam-border, currentColor); opacity: 0.6; }

/* Tables scroll inside their own box rather than widening the page. */
[data-beam-prose] table { border-collapse: collapse; display: block; overflow-x: auto; width: 100%; }
[data-beam-prose] :is(th, td) {
  border-block-end: 1px solid var(--beam-border, currentColor);
  padding: 0.5em 0.75em;
  text-align: start;
}
[data-beam-prose] th { color: var(--beam-heading, var(--beam-fg, inherit)); font-weight: 600; }

[data-beam-prose] :is(img, video) { border-radius: var(--beam-radius, 0.5rem); height: auto; max-width: 100%; }

/* A full-bleed child (an embedded reference surface) opts out of the measure entirely. */
[data-beam-prose] > [data-beam-full-bleed] { margin-inline: 0; max-width: none; }
`;
function Prose({ children, css = PROSE_CSS, className, style, as: Tag = "article" }) {
  const id = useId();
  return /* @__PURE__ */ jsxs(Tag, { "data-beam-prose": "", "data-prose-id": id, className, style, children: [
    css === "" ? null : /* @__PURE__ */ jsx("style", { children: css }),
    children
  ] });
}

// src/site/EntryBody.tsx
import { Fragment, createElement, useEffect, useState } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
import { Fragment as Fragment2, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var RUNTIME = { jsx: jsx2, jsxs: jsxs2, Fragment, createElement, compileEntryStyles };
function componentFromArtifact(mod) {
  const Component = mod?.default?.(RUNTIME)?.default;
  return typeof Component === "function" ? Component : null;
}
function useEntryArtifact(url, version) {
  const [Body, setBody] = useState(null);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let cancelled = false;
    setBody(null);
    setStatus("loading");
    if (!url) {
      setStatus("unauthored");
      return;
    }
    import(
      /* @vite-ignore */
      url
    ).then((mod) => {
      const Component = componentFromArtifact(mod);
      if (cancelled) {
        return;
      }
      if (Component === null) {
        setStatus("failed");
        return;
      }
      setBody(() => Component);
      setStatus("ready");
    }).catch(() => {
      if (!cancelled) {
        setStatus("failed");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [url, version]);
  return { Body, status, failed: status === "failed" };
}
var DEFAULT_EMPTY = /* @__PURE__ */ jsx3("p", { "data-beam-entry-unauthored": "", style: { fontSize: "0.875rem", color: "var(--beam-fg-muted, color-mix(in oklab, currentColor 62%, transparent))" }, children: "This page doesn\u2019t have any content yet." });
var DEFAULT_FALLBACK = /* @__PURE__ */ jsxs3("p", { "data-beam-entry-uncompiled": "", style: { fontSize: "0.875rem", color: "var(--beam-fg-muted, color-mix(in oklab, currentColor 62%, transparent))" }, children: [
  "This page\u2019s content has not been compiled yet. Run",
  " ",
  /* @__PURE__ */ jsx3("code", { style: { fontFamily: "var(--beam-font-mono, ui-monospace, monospace)" }, children: "php artisan splicewire:beam:ux:compile" }),
  "."
] });
function EntryBody({ artifact, components, fallback, empty, loading = null, bodyProps }) {
  const { Body, status } = useEntryArtifact(artifact.url, artifact.version);
  if (status === "unauthored") {
    return /* @__PURE__ */ jsx3(Fragment2, { children: empty ?? DEFAULT_EMPTY });
  }
  if (status === "failed") {
    return /* @__PURE__ */ jsx3(Fragment2, { children: fallback ?? DEFAULT_FALLBACK });
  }
  if (Body === null) {
    return /* @__PURE__ */ jsx3(Fragment2, { children: loading });
  }
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    artifact.responsiveCss ? /* @__PURE__ */ jsx3("style", { "data-beam-responsive-theme": "", children: artifact.responsiveCss }) : null,
    /* @__PURE__ */ jsx3(Body, { ...bodyProps ?? {}, components: { ...components, ...richFieldComponents }, styleRegistry: artifact.styleRegistry, bindingRuntime })
  ] });
}

export {
  PROSE_CSS,
  Prose,
  componentFromArtifact,
  useEntryArtifact,
  EntryBody
};
//# sourceMappingURL=chunk-LJ2YCCJ5.js.map