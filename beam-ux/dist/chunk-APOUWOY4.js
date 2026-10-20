import {
  assertCondition,
  assertFieldPath
} from "./chunk-EMFVKUTK.js";

// src/bindings/rich-field.tsx
import { createElement, Fragment } from "react";
import { fromMarkdown } from "mdast-util-from-markdown";
function safeUrl(value) {
  if (typeof value !== "string") return void 0;
  try {
    const url = new URL(value, "https://binding.invalid");
    return ["https:", "http:", "mailto:", "tel:"].includes(url.protocol) ? value : void 0;
  } catch {
    return void 0;
  }
}
function RichMarkdown({ content }) {
  if (typeof content !== "string") return null;
  const root = fromMarkdown(content);
  const definitions = /* @__PURE__ */ new Map();
  const collect = (node) => {
    if (node.type === "definition" && node.identifier) definitions.set(node.identifier, node);
    node.children?.forEach(collect);
  };
  collect(root);
  const render = (node, key) => {
    const children = node.children?.map(render);
    const element = (tag, props = {}, body = children) => createElement(tag, { key, ...props }, body);
    switch (node.type) {
      case "root":
        return createElement(Fragment, { key }, children);
      case "text":
        return node.value;
      case "paragraph":
        return element("p");
      case "heading":
        return element(`h${Math.min(6, Math.max(1, node.depth ?? 1))}`);
      case "strong":
        return element("strong");
      case "emphasis":
        return element("em");
      case "inlineCode":
        return element("code", {}, node.value);
      case "code":
        return element("pre", {}, createElement("code", null, node.value));
      case "blockquote":
        return element("blockquote");
      case "list":
        return element(node.ordered ? "ol" : "ul", node.ordered ? { start: node.start ?? 1 } : {});
      case "listItem":
        return element("li");
      case "break":
        return createElement("br", { key });
      case "thematicBreak":
        return createElement("hr", { key });
      case "link":
      case "linkReference": {
        const target = node.type === "link" ? node : definitions.get(node.identifier ?? "");
        const href = safeUrl(target?.url);
        return href ? element("a", { href, title: target?.title ?? void 0 }) : createElement(Fragment, { key }, children);
      }
      case "image":
      case "imageReference": {
        const target = node.type === "image" ? node : definitions.get(node.identifier ?? "");
        const src = safeUrl(target?.url);
        return src ? createElement("img", { key, src, alt: node.alt ?? "", title: target?.title ?? void 0 }) : null;
      }
      // Raw HTML is deliberately omitted. Unknown syntax is never interpreted as a component.
      case "html":
      case "definition":
        return null;
      default:
        return createElement(Fragment, { key }, children);
    }
  };
  return render(root, 0);
}
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function RichBlockdoc({ content }) {
  const render = (value, key, depth = 0) => {
    const node = object(value);
    if (!node || depth > 100) return null;
    const attrs = object(node.attrs) ?? {};
    const children = Array.isArray(node.content) ? node.content.map((child, index) => render(child, index, depth + 1)) : [];
    if (node.type === "text") {
      let text2 = typeof node.text === "string" ? node.text : "";
      for (const mark of Array.isArray(node.marks) ? node.marks : []) {
        const data = object(mark);
        const tag2 = { strong: "strong", bold: "strong", em: "em", italic: "em", code: "code", strike: "s", underline: "u" }[String(data?.type)];
        if (typeof tag2 === "string") text2 = createElement(tag2, null, text2);
        else if (data?.type === "link") {
          const href = safeUrl(object(data.attrs)?.href);
          if (href) text2 = createElement("a", { href }, text2);
        }
      }
      return createElement(Fragment, { key }, text2);
    }
    if (node.type === "doc") return createElement(Fragment, { key }, children);
    if (node.type === "heading") {
      const level = Number.isInteger(attrs.level) ? Math.min(6, Math.max(1, attrs.level)) : 1;
      return createElement(`h${level}`, { key }, children);
    }
    const tag = {
      paragraph: "p",
      p: "p",
      blockquote: "blockquote",
      bullet_list: "ul",
      bulletList: "ul",
      ordered_list: "ol",
      orderedList: "ol",
      list_item: "li",
      listItem: "li",
      code_block: "pre",
      codeBlock: "pre"
    }[String(node.type)];
    if (typeof tag === "string") return createElement(tag, { key }, children);
    if (node.type === "hard_break" || node.type === "hardBreak") return createElement("br", { key });
    if (node.type === "horizontal_rule" || node.type === "horizontalRule") return createElement("hr", { key });
    return createElement(Fragment, { key }, children);
  };
  return render(content, 0);
}
var richFieldComponents = { RichMarkdown, RichBlockdoc };

// src/bindings/runtime.tsx
import { createElement as createElement2, Fragment as Fragment2 } from "react";
function field(record, path) {
  assertFieldPath(path);
  let value = record;
  for (const part of path.split(".")) {
    if (value === null || typeof value !== "object" || !Object.hasOwn(value, part)) return void 0;
    value = value[part];
  }
  return value;
}
function text(record, path, fallback) {
  const value = field(record, path);
  return value == null || value === "" || !["string", "number", "boolean"].includes(typeof value) ? fallback : String(value);
}
function attribute(record, path, name) {
  if (/^on/i.test(name) || ["dangerouslysetinnerhtml", "srcdoc"].includes(name.toLowerCase())) return void 0;
  const value = field(record, path);
  if (["href", "src", "action", "formaction", "poster", "xlinkhref"].includes(name.toLowerCase())) {
    if (typeof value !== "string") return void 0;
    try {
      if (!["https:", "http:", "mailto:", "tel:"].includes(new URL(value, "https://binding.invalid").protocol)) return void 0;
    } catch {
      return void 0;
    }
  }
  return value;
}
function comparable(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return null;
  const date = Date.parse(value);
  return Number.isFinite(date) ? date : null;
}
function matches(rule, record) {
  const actual = field(record, rule.field);
  const empty = actual == null || actual === "" || Array.isArray(actual) && actual.length === 0;
  switch (rule.operator) {
    case "is set":
      return !empty;
    case "is empty":
      return empty;
    case "equals":
      return actual === rule.value;
    case "does not equal":
      return actual !== rule.value;
    case "contains":
      return typeof actual === "string" && typeof rule.value === "string" ? actual.includes(rule.value) : Array.isArray(actual) && actual.includes(rule.value);
    case "greater than":
    case "less than": {
      const left = comparable(actual), right = comparable(rule.value);
      if (left === null || right === null || typeof actual !== typeof rule.value) return false;
      return rule.operator === "greater than" ? left > right : left < right;
    }
  }
}
function when(condition, record) {
  assertCondition(condition);
  return condition.all != null ? condition.all.every((rule) => matches(rule, record)) : condition.any.some((rule) => matches(rule, record));
}
function repeat(payload, render, empty) {
  const records = payload?.records ?? [];
  return createElement2(Fragment2, null, records.length === 0 ? empty() : records.map((record, index) => createElement2(Fragment2, { key: index }, render(record))));
}
var bindingRuntime = { field, attribute, text, when, repeat };

export {
  RichMarkdown,
  RichBlockdoc,
  richFieldComponents,
  bindingRuntime
};
//# sourceMappingURL=chunk-APOUWOY4.js.map