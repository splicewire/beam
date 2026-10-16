import {
  BeamMdxProvider,
  Content,
  useBeamMdx,
  useLinks
} from "./chunk-RJIJTUAE.js";

// src/content.ts
var DEFAULT_DRAFTABLE_PREFIXES = ["essays/", "broadcasts/"];
function isDraft(name, frontmatter, draftablePrefixes = DEFAULT_DRAFTABLE_PREFIXES) {
  if (frontmatter.draft) {
    return true;
  }
  if (!draftablePrefixes.some((prefix) => name.startsWith(prefix))) {
    return false;
  }
  return !frontmatter.datePublished;
}
function createContent(modules, draftablePrefixes = DEFAULT_DRAFTABLE_PREFIXES) {
  const byName = {};
  for (const [name, mod] of Object.entries(modules)) {
    const fm = mod.frontmatter ?? {};
    byName[name] = {
      Component: mod.default,
      frontmatter: {
        title: fm.title ?? "",
        layout: fm.layout ?? "site",
        excerpt: fm.excerpt,
        navGroup: fm.navGroup,
        schemaType: fm.schemaType,
        schemaName: fm.schemaName,
        datePublished: fm.datePublished,
        draft: fm.draft,
        topic: fm.topic,
        readingTime: fm.readingTime,
        thread: fm.thread,
        stage: fm.stage,
        targetQuery: fm.targetQuery,
        audience: fm.audience,
        references: fm.references,
        platforms: fm.platforms
      }
    };
  }
  function resolveContent(name) {
    return byName[name];
  }
  function contentNames() {
    return Object.keys(byName);
  }
  function essaysList(topic) {
    const all = Object.entries(byName).filter(([name]) => name.startsWith("essays/")).map(([name, mod]) => ({
      slug: name.slice("essays/".length),
      name,
      title: mod.frontmatter.title,
      excerpt: mod.frontmatter.excerpt,
      datePublished: mod.frontmatter.datePublished,
      draft: isDraft(name, mod.frontmatter, draftablePrefixes),
      topic: mod.frontmatter.topic,
      readingTime: mod.frontmatter.readingTime,
      thread: mod.frontmatter.thread,
      stage: mod.frontmatter.stage,
      targetQuery: mod.frontmatter.targetQuery,
      audience: mod.frontmatter.audience
    })).sort(
      (a, b) => (b.datePublished ?? "").localeCompare(a.datePublished ?? "")
    );
    if (!topic) {
      return all;
    }
    const wanted = topic.toLowerCase();
    return all.filter((essay) => essay.topic?.toLowerCase() === wanted);
  }
  function essayTopics() {
    const counts = /* @__PURE__ */ new Map();
    for (const essay of essaysList()) {
      if (!essay.topic) {
        continue;
      }
      counts.set(essay.topic, (counts.get(essay.topic) ?? 0) + 1);
    }
    return [...counts.entries()].map(([topic, count]) => ({
      topic,
      slug: topic.toLowerCase(),
      count
    })).sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
  }
  function broadcastsList() {
    return Object.entries(byName).filter(([name]) => name.startsWith("broadcasts/")).map(([name, mod]) => ({
      slug: name.slice("broadcasts/".length),
      name,
      title: mod.frontmatter.title,
      excerpt: mod.frontmatter.excerpt,
      platforms: mod.frontmatter.platforms
    })).sort((a, b) => a.slug.localeCompare(b.slug));
  }
  return {
    resolveContent,
    contentNames,
    essaysList,
    essayTopics,
    broadcastsList
  };
}

// src/nav.ts
var leaf = (name) => name.split("/").pop() ?? name;
function contentNavNodes(modules, opts) {
  const { trackOf, hrefOf = (n) => `/${n}`, filter, defaultGroup } = opts;
  return Object.entries(modules).map(([name, mod]) => ({
    name,
    track: trackOf(name),
    fm: mod.frontmatter ?? {}
  })).filter(
    (e) => e.track !== void 0 && (filter ? filter(e.name) : true)
  ).map(({ name, track, fm }) => ({
    title: fm.title ?? leaf(name),
    href: hrefOf(name),
    track,
    group: fm.navGroup ?? defaultGroup,
    order: fm.navOrder,
    groupOrder: fm.navGroupOrder,
    parent: fm.navParent
  }));
}

// src/references.ts
function resolveReference(key, references, links) {
  const ref = references.find((entry) => entry.key === key);
  if (!ref) {
    return void 0;
  }
  const base = links[ref.site];
  if (!base) {
    return void 0;
  }
  return { ...ref, href: `${base.replace(/\/$/, "")}${ref.path}` };
}

// src/runtime/runtime-mdx.tsx
import {
  createElement,
  useEffect,
  useState
} from "react";
import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
async function compileMdx(source, options = {}) {
  const compiled = await evaluate(source, {
    ...runtime,
    remarkPlugins: [
      remarkFrontmatter,
      remarkMdxFrontmatter,
      ...options.remarkPlugins ?? []
    ],
    rehypePlugins: [...options.rehypePlugins ?? []]
  });
  return compiled.default;
}
function RuntimeMdx({
  source,
  components,
  fallback = null,
  renderError,
  remarkPlugins,
  rehypePlugins
}) {
  const [Content2, setContent] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    setContent(null);
    setError(null);
    compileMdx(source, { remarkPlugins, rehypePlugins }).then((component) => {
      if (active) {
        setContent(() => component);
      }
    }).catch((cause) => {
      if (active) {
        setError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    });
    return () => {
      active = false;
    };
  }, [source, remarkPlugins, rehypePlugins]);
  if (error) {
    return renderError ? renderError(error) : null;
  }
  if (!Content2) {
    return fallback ?? null;
  }
  return createElement(Content2, { components });
}
async function fetchMdx(source) {
  const response = await fetch(source, {
    headers: { Accept: "text/markdown" },
    credentials: "same-origin"
  });
  if (!response.ok) {
    throw new Error(`Failed to load MDX (${response.status})`);
  }
  return response.text();
}
function RemoteMdx({
  source,
  components,
  fetcher = fetchMdx,
  fallback = null,
  renderError,
  remarkPlugins,
  rehypePlugins
}) {
  const [text, setText] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    setText(null);
    setError(null);
    fetcher(source).then((mdx) => {
      if (active) {
        setText(mdx);
      }
    }).catch((cause) => {
      if (active) {
        setError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    });
    return () => {
      active = false;
    };
  }, [source, fetcher]);
  if (error) {
    return renderError ? renderError(error) : null;
  }
  if (text === null) {
    return fallback ?? null;
  }
  return createElement(RuntimeMdx, {
    source: text,
    components,
    fallback,
    renderError,
    remarkPlugins,
    rehypePlugins
  });
}

// src/runtime/mdx-editor.tsx
import { createElement as createElement2 } from "react";
function MdxEditor({
  value,
  onChange,
  components,
  preview = true,
  fallback = null,
  renderError,
  remarkPlugins,
  rehypePlugins,
  className,
  editorClassName,
  previewClassName,
  placeholder,
  spellCheck = false,
  "aria-label": ariaLabel = "MDX source"
}) {
  const textarea = createElement2("textarea", {
    className: editorClassName,
    value,
    placeholder,
    spellCheck,
    "aria-label": ariaLabel,
    onChange: (event) => onChange(event.target.value)
  });
  const previewPane = preview ? createElement2(
    "div",
    { className: previewClassName, "aria-live": "polite" },
    createElement2(RuntimeMdx, {
      source: value,
      components,
      fallback,
      renderError,
      remarkPlugins,
      rehypePlugins
    })
  ) : null;
  return createElement2("div", { className }, textarea, previewPane);
}

// src/runtime/authoring.ts
var FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?/;
function parseFrontmatter(raw) {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: {}, body: raw, hasFrontmatter: false };
  }
  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s?(.*)$/);
    if (kv) {
      frontmatter[kv[1]] = kv[2];
    }
  }
  return {
    frontmatter,
    body: raw.slice(match[0].length),
    hasFrontmatter: true
  };
}
function serializeMdx(parsed) {
  const keys = Object.keys(parsed.frontmatter);
  if (keys.length === 0 && !parsed.hasFrontmatter) {
    return parsed.body;
  }
  const block = keys.map((key) => `${key}: ${parsed.frontmatter[key]}`).join("\n");
  return `---
${block}
---
${parsed.body}`;
}
function serializeFrontmatter(frontmatter, body) {
  return serializeMdx({ frontmatter, body, hasFrontmatter: Object.keys(frontmatter).length > 0 });
}
var putMdx = async (url, body) => {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "text/markdown" },
    credentials: "same-origin",
    body
  });
  if (!response.ok) {
    throw new Error(`Failed to save MDX (${response.status})`);
  }
};
async function loadRawMdx(url, loader = fetchMdx) {
  return loader(url);
}
async function saveMdx(url, body, saver = putMdx) {
  return saver(url, body);
}

// src/components/reference.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var KIND_LABEL = {
  guide: "Guide",
  story: "Customer story",
  insight: "Insight"
};
function devWarn(message) {
  if (import.meta.env?.DEV) {
    console.warn(message);
  }
}
function Ref({ to, children }) {
  const { references } = useBeamMdx();
  const links = useLinks();
  const ref = resolveReference(to, references, links);
  if (!ref) {
    devWarn(
      `<Ref to="${to}"> \u2014 no such reference key (or its site is missing from links)`
    );
    return /* @__PURE__ */ jsx(Fragment, { children });
  }
  if (ref.status !== "live") {
    return /* @__PURE__ */ jsx(Fragment, { children });
  }
  return /* @__PURE__ */ jsx("a", { className: "sr-ref", href: ref.href, children });
}
function Receipts({ keys }) {
  const { references } = useBeamMdx();
  const links = useLinks();
  if (!keys?.length) {
    return null;
  }
  const live = keys.map((key) => resolveReference(key, references, links)).filter((ref) => ref?.status === "live");
  if (!live.length) {
    return null;
  }
  return /* @__PURE__ */ jsxs("aside", { className: "receipts", "aria-label": "Receipts", children: [
    /* @__PURE__ */ jsx("p", { className: "receipts-label", children: "Receipts" }),
    /* @__PURE__ */ jsx("ul", { children: live.map((ref) => /* @__PURE__ */ jsxs("li", { children: [
      /* @__PURE__ */ jsx("span", { className: "receipts-kind", children: KIND_LABEL[ref.kind] }),
      /* @__PURE__ */ jsx("a", { className: "receipts-link", href: ref.href, children: ref.title }),
      ref.summary ? /* @__PURE__ */ jsx("span", { className: "receipts-summary", children: ref.summary }) : null
    ] }, ref.key)) })
  ] });
}

// src/components/json-ld.tsx
import { Head } from "@inertiajs/react";
import { jsx as jsx2 } from "react/jsx-runtime";
function serialize(node) {
  return JSON.stringify(node).replace(/</g, "\\u003c");
}
function JsonLd({ data }) {
  const nodes = Array.isArray(data) ? data : [data];
  return /* @__PURE__ */ jsx2(Head, { children: nodes.map((node, i) => /* @__PURE__ */ jsx2("script", { type: "application/ld+json", children: serialize(node) }, i)) });
}
function contentJsonLd(frontmatter, url, references, links) {
  const node = {
    "@context": "https://schema.org",
    "@type": frontmatter.schemaType,
    name: frontmatter.schemaName ?? frontmatter.title,
    "@id": url,
    url
  };
  if (frontmatter.schemaType === "Article") {
    node.headline = frontmatter.title;
  }
  if (frontmatter.excerpt) {
    node.description = frontmatter.excerpt;
  }
  if (frontmatter.datePublished) {
    node.datePublished = frontmatter.datePublished;
  }
  const citation = (frontmatter.references ?? []).map((key) => resolveReference(key, references, links)).filter((ref) => ref?.status === "live").map((ref) => ({
    "@type": ref.kind === "guide" ? "TechArticle" : "Article",
    name: ref.title,
    url: ref.href
  }));
  if (citation.length) {
    node.citation = citation;
  }
  return node;
}

// src/components/content-show.tsx
import { Head as Head2, usePage } from "@inertiajs/react";
import { Fragment as Fragment2, jsx as jsx3, jsxs as jsxs2 } from "react/jsx-runtime";
function ContentShow({
  slug,
  resolve,
  layouts,
  mdxComponents,
  references = [],
  draftablePrefixes,
  renderEyebrow
}) {
  const { url: pageUrl } = usePage();
  const links = useLinks();
  const mod = resolve(slug);
  if (!mod) {
    const Fallback = layouts.site;
    return /* @__PURE__ */ jsxs2(Fallback, { children: [
      /* @__PURE__ */ jsx3(Head2, { title: "Not found" }),
      /* @__PURE__ */ jsxs2("p", { children: [
        "Content \u201C",
        slug,
        "\u201D was not found."
      ] })
    ] });
  }
  const { Component, frontmatter } = mod;
  const Layout = layouts[frontmatter.layout];
  const draft = isDraft(slug, frontmatter, draftablePrefixes);
  const canonical = `${typeof window !== "undefined" ? window.location.origin : ""}${pageUrl.split("?")[0]}`;
  return /* @__PURE__ */ jsx3(BeamMdxProvider, { references, resolve, children: /* @__PURE__ */ jsxs2(Layout, { children: [
    /* @__PURE__ */ jsx3(Head2, { title: frontmatter.title, children: frontmatter.excerpt ? /* @__PURE__ */ jsx3(
      "meta",
      {
        name: "description",
        content: frontmatter.excerpt
      }
    ) : null }),
    frontmatter.schemaType ? /* @__PURE__ */ jsx3(
      JsonLd,
      {
        data: contentJsonLd(
          frontmatter,
          canonical,
          references,
          links
        )
      }
    ) : null,
    /* @__PURE__ */ jsxs2("article", { className: "site-prose mx-auto max-w-2xl px-6 py-14 sm:px-8 sm:py-16", children: [
      draft || frontmatter.topic || frontmatter.datePublished ? /* @__PURE__ */ jsxs2("div", { className: "eyebrow mb-6 flex items-center gap-3 font-mono text-xs tracking-wide uppercase", children: [
        draft ? /* @__PURE__ */ jsx3("span", { className: "eyebrow-draft rounded-sm px-1.5 py-0.5 font-medium", children: "Draft" }) : null,
        frontmatter.datePublished ? /* @__PURE__ */ jsx3("span", { children: frontmatter.datePublished.replace(/-/g, ".").slice(0, 7) }) : null,
        frontmatter.topic ? /* @__PURE__ */ jsxs2(Fragment2, { children: [
          /* @__PURE__ */ jsx3("span", { className: "eyebrow-sep", children: "|" }),
          /* @__PURE__ */ jsx3("span", { className: "eyebrow-note", children: frontmatter.topic })
        ] }) : null,
        frontmatter.readingTime ? /* @__PURE__ */ jsxs2(Fragment2, { children: [
          /* @__PURE__ */ jsx3("span", { className: "eyebrow-sep", children: "|" }),
          /* @__PURE__ */ jsx3("span", { className: "eyebrow-note", children: frontmatter.readingTime })
        ] }) : null
      ] }) : renderEyebrow ? renderEyebrow(frontmatter) : frontmatter.navGroup ? /* @__PURE__ */ jsx3("p", { className: "eyebrow mb-5 font-mono text-xs tracking-widest uppercase", children: frontmatter.navGroup }) : null,
      /* @__PURE__ */ jsx3(Component, { components: mdxComponents }),
      /* @__PURE__ */ jsx3(Receipts, { keys: frontmatter.references })
    ] })
  ] }) });
}
export {
  BeamMdxProvider,
  Content,
  ContentShow,
  DEFAULT_DRAFTABLE_PREFIXES,
  JsonLd,
  MdxEditor,
  Receipts,
  Ref,
  RemoteMdx,
  RuntimeMdx,
  compileMdx,
  contentJsonLd,
  contentNavNodes,
  createContent,
  fetchMdx,
  isDraft,
  loadRawMdx,
  parseFrontmatter,
  putMdx,
  resolveReference,
  saveMdx,
  serializeFrontmatter,
  serializeMdx,
  useBeamMdx,
  useLinks
};
//# sourceMappingURL=index.js.map