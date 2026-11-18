// src/lens/read.ts
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmTableFromMarkdown } from "mdast-util-gfm-table";
import { mdxFromMarkdown } from "mdast-util-mdx";
import { gfmTable } from "micromark-extension-gfm-table";
import { mdxjs } from "micromark-extension-mdxjs";
import { parse as parseTsx, toJson } from "@splicewire/beam-ux/tsx-lens";
var MdxLensError = class extends Error {
  name = "MdxLensError";
};
function readMdx(mdx, context = {}) {
  let tree;
  try {
    tree = fromMarkdown(mdx, {
      extensions: [mdxjs(), gfmTable()],
      mdastExtensions: [mdxFromMarkdown(), gfmTableFromMarkdown()]
    });
  } catch (error) {
    throw new MdxLensError(`The MDX does not parse: ${error.message}`);
  }
  const reader = new Reader(mdx, context, definitionsOf(tree));
  const doc = [];
  let meta = null;
  let metaData = null;
  for (const node of tree.children) {
    if (node.type === "mdxjsEsm") {
      if (meta === null && isMetaExport(node)) {
        meta = reader.source(node);
        metaData = metaValue(node);
        continue;
      }
      throw new MdxLensError("An MDX page holds no code outside its JSX: only `export const meta = {\u2026}` is read (ux-0233 d2).");
    }
    doc.push(...reader.flow(node));
  }
  return { doc, meta, metaData };
}
function definitionsOf(tree) {
  const found = /* @__PURE__ */ new Map();
  const visit = (node) => {
    if (node.type === "definition") found.set(node.identifier, { url: node.url, title: node.title ?? null });
    if ("children" in node) for (const child of node.children) visit(child);
  };
  visit(tree);
  return found;
}
function isMetaExport(node) {
  const program = node.data?.estree;
  if (!program || program.body.length !== 1) return false;
  const statement = program.body[0];
  if (statement.type !== "ExportNamedDeclaration" || !statement.declaration) return false;
  const declaration = statement.declaration;
  return declaration.type === "VariableDeclaration" && declaration.kind === "const" && declaration.declarations.length === 1 && declaration.declarations[0].id.type === "Identifier" && declaration.declarations[0].id.name === "meta" && declaration.declarations[0].init?.type === "ObjectExpression";
}
function metaValue(node) {
  const statement = node.data.estree.body[0];
  const value = staticValue(statement.declaration.declarations[0].init);
  return value === NOT_STATIC ? null : value;
}
var NOT_STATIC = /* @__PURE__ */ Symbol("not static");
function staticValue(expression) {
  const node = expression;
  switch (node?.type) {
    case "Literal": {
      const value = node.value;
      return value === null || ["string", "number", "boolean"].includes(typeof value) ? value : NOT_STATIC;
    }
    case "TemplateLiteral": {
      const quasis = node.quasis;
      return node.expressions.length === 0 && quasis[0].value.cooked !== null ? quasis[0].value.cooked : NOT_STATIC;
    }
    case "UnaryExpression": {
      const operand = staticValue(node.argument);
      return node.operator === "-" && typeof operand === "number" ? -operand : NOT_STATIC;
    }
    case "ArrayExpression": {
      const values = node.elements.map((element) => element === null ? NOT_STATIC : staticValue(element));
      return values.includes(NOT_STATIC) ? NOT_STATIC : values;
    }
    case "ObjectExpression": {
      const out = {};
      for (const property of node.properties) {
        if (property.type !== "Property" || property.computed || property.method || property.kind !== "init") return NOT_STATIC;
        const key = property.key.type === "Identifier" ? property.key.name : property.key.type === "Literal" ? property.key.value : void 0;
        if (typeof key !== "string" && typeof key !== "number" || key === "__proto__") return NOT_STATIC;
        const value = staticValue(property.value);
        if (value === NOT_STATIC) return NOT_STATIC;
        Object.defineProperty(out, String(key), { value, enumerable: true, writable: true, configurable: true });
      }
      return out;
    }
    default:
      return NOT_STATIC;
  }
}
var block = (name, children, props = []) => ({ kind: "block", name, isComponent: false, props, children, dynamic: false });
var text = (value) => ({ kind: "text", value });
var string = (name, value) => ({ name, kind: "string", value });
var Reader = class {
  constructor(mdx, context, definitions) {
    this.mdx = mdx;
    this.context = context;
    this.definitions = definitions;
  }
  mdx;
  context;
  definitions;
  source(node) {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if (start === void 0 || end === void 0) throw new MdxLensError("The MDX parser gave a node no position.");
    return this.mdx.slice(start, end);
  }
  flow(node) {
    switch (node.type) {
      case "paragraph":
        if (node.children.length === 1 && node.children[0].type === "mdxJsxTextElement") {
          return [this.jsx(node.children[0])];
        }
        return [block("p", this.phrasing(node.children))];
      case "heading":
        return [block(`h${node.depth}`, this.phrasing(node.children))];
      case "thematicBreak":
        return [block("hr", [])];
      case "blockquote":
        return [block("blockquote", node.children.flatMap((child) => this.flow(child)))];
      case "list": {
        const tight = node.spread !== true && node.children.every((item) => item.spread !== true);
        const props = node.ordered && node.start != null && node.start !== 1 ? [{ name: "start", kind: "number", value: node.start }] : [];
        return [block(node.ordered ? "ol" : "ul", node.children.map((item) => {
          const [first, ...rest] = item.children;
          const children = tight && first?.type === "paragraph" && rest.every((child) => child.type === "list") ? [...this.phrasing(first.children), ...rest.flatMap((child) => this.flow(child))] : item.children.flatMap((child) => this.flow(child));
          return block("li", children);
        }), props)];
      }
      case "code": {
        const props = [
          ...node.lang ? [string("className", `language-${node.lang}`)] : [],
          ...node.meta ? [string("data-meta", node.meta)] : []
        ];
        return [block("pre", [block("code", [text(node.value)], props)])];
      }
      case "table":
        return [this.table(node)];
      case "definition":
        return [];
      case "html":
        return [{ kind: "opaque", reason: "expression", source: this.source(node) }];
      case "mdxJsxFlowElement":
        return [this.jsx(node)];
      case "mdxFlowExpression":
        return [this.expression(node)];
      case "mdxjsEsm":
        throw new MdxLensError("An MDX page holds no code outside its JSX (ux-0233 d2).");
      default:
        throw new MdxLensError(`The MDX Lens can't read a \`${node.type}\` here.`);
    }
  }
  phrasing(nodes) {
    const out = [];
    for (const node of nodes) {
      const read = this.inline(node);
      for (const child of read) {
        const last = out[out.length - 1];
        if (child.kind === "text" && last?.kind === "text" && last.prop == null && last.field == null && child.prop == null && child.field == null) {
          out[out.length - 1] = text(last.value + child.value);
        } else out.push(child);
      }
    }
    return out;
  }
  inline(node) {
    switch (node.type) {
      case "text":
        return [text(node.value.replace(/[ \t]*\r?\n[ \t]*/g, " "))];
      case "strong":
        return [block("strong", this.phrasing(node.children))];
      case "emphasis":
        return [block("em", this.phrasing(node.children))];
      case "inlineCode":
        return [block("code", [text(node.value)])];
      case "break":
        return [block("br", [])];
      case "link":
        return [block("a", this.phrasing(node.children), linkProps(node.url, node.title))];
      case "linkReference": {
        const target = this.definitions.get(node.identifier);
        if (!target) return [text(this.source(node))];
        return [block("a", this.phrasing(node.children), linkProps(target.url, target.title))];
      }
      case "image":
        return [block("img", [], imageProps(node.url, node.alt, node.title))];
      case "imageReference": {
        const target = this.definitions.get(node.identifier);
        if (!target) return [text(this.source(node))];
        return [block("img", [], imageProps(target.url, node.alt, target.title))];
      }
      case "html":
        return [{ kind: "opaque", reason: "expression", source: this.source(node) }];
      case "mdxJsxTextElement":
        return [this.jsx(node)];
      case "mdxTextExpression":
        return [this.expression(node)];
      default:
        throw new MdxLensError(`The MDX Lens can't read an inline \`${node.type}\`.`);
    }
  }
  table(node) {
    const rows = node.children.map((row, rowIndex) => block("tr", row.children.map((cell, column) => {
      const align = node.align?.[column];
      return block(rowIndex === 0 ? "th" : "td", this.phrasing(cell.children), align ? [string("align", align)] : []);
    })));
    const [head, ...body] = rows;
    return block("table", [block("thead", head ? [head] : []), ...body.length ? [block("tbody", body)] : []]);
  }
  /**
   * A JSX tag. Its attributes go through the TSX Lens, rebuilt as a self-closing tag from their own source, so
   * every attribute reads as it does in a `.tsx` page. Its children are Markdown and read here.
   */
  jsx(node) {
    if (node.attributes.some((attribute) => attribute.type === "mdxJsxExpressionAttribute")) {
      return { kind: "opaque", reason: "spread", source: this.source(node) };
    }
    const name = node.name;
    let element;
    if (name === null) {
      element = { kind: "block", name: null, isComponent: false, props: [], children: [], dynamic: false };
    } else {
      const attributes = node.attributes.map((attribute) => this.source(attribute)).join(" ");
      const tag = `<${name}${attributes ? ` ${attributes}` : ""} />`;
      const roots = toJson(parseTsx(tag, this.context));
      const root = roots[0];
      if (roots.length !== 1 || root?.kind !== "block") throw new MdxLensError(`The tag \`${name}\` does not read as one element.`);
      element = root;
    }
    let children;
    if (node.type === "mdxJsxTextElement") {
      children = this.phrasing(node.children);
    } else {
      const flow = node.children;
      const only = flow.length === 1 && flow[0].type === "paragraph" ? flow[0] : null;
      children = only && only.position?.start.line === node.position?.start.line ? this.phrasing(only.children) : flow.flatMap((child) => this.flow(child));
    }
    return { ...element, children };
  }
  /** `{…}`: a comment or any other expression is an Opaque Island; a string literal or `bdText` is text. */
  expression(node) {
    const source = this.source(node);
    const program = node.data?.estree;
    if (!program || program.body.length === 0) return { kind: "opaque", reason: "expression", source };
    const read = toJson(parseTsx(`<>${source}</>`, this.context))[0];
    const child = read?.kind === "block" && read.children.length === 1 ? read.children[0] : null;
    if (child?.kind === "text") return child;
    if (child?.kind === "opaque") return { kind: "opaque", reason: child.reason, source };
    return { kind: "opaque", reason: "expression", source };
  }
};
function linkProps(url, title) {
  return [string("href", url), ...title ? [string("title", title)] : []];
}
function imageProps(url, alt, title) {
  return [string("src", url), string("alt", alt ?? ""), ...title ? [string("title", title)] : []];
}

// src/lens/print.ts
import { gfmTableToMarkdown } from "mdast-util-gfm-table";
import { mdxToMarkdown } from "mdast-util-mdx";
import { toMarkdown } from "mdast-util-to-markdown";
import { jsxAttributes } from "@splicewire/beam-ux/jsondoc";
function printMdx(doc) {
  const root = { type: "root", children: flowOf(doc) };
  return toMarkdown(root, {
    extensions: [mdxToMarkdown(), gfmTableToMarkdown()],
    bullet: "-",
    emphasis: "_",
    strong: "*",
    fence: "`",
    fences: true,
    rule: "-",
    listItemIndent: "one",
    resourceLink: true
  });
}
var HEADINGS = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };
var INLINE_TAGS = /* @__PURE__ */ new Set(["strong", "em", "code", "a", "img", "br"]);
var raw = (value) => ({ type: "html", value });
function plain(node, allowed = []) {
  return !node.isComponent && !node.style && !node.repeat && !node.when && !node.slots && !node.dynamic && node.props.every((prop) => allowed.includes(prop.name) && prop.kind === "string");
}
var propOf = (node, name) => node.props.find((prop) => prop.name === name);
function isPhrasing(node) {
  if (node.kind !== "block") return true;
  if (node.name !== null && (INLINE_TAGS.has(node.name) || node.isComponent)) {
    return node.children.every(isPhrasing);
  }
  return false;
}
function flowOf(nodes) {
  const out = [];
  let run = [];
  const flush = () => {
    if (run.length) out.push({ type: "paragraph", children: phrasingOf(run) });
    run = [];
  };
  for (const node of nodes) {
    if (node.kind === "opaque") {
      flush();
      out.push(raw(node.source));
    } else if (node.kind === "block" && !isInlineOnly(node)) {
      flush();
      out.push(...blockOf(node));
    } else {
      run.push(node);
    }
  }
  flush();
  return out;
}
function isInlineOnly(node) {
  return node.kind === "text" || node.kind === "block" && node.name !== null && INLINE_TAGS.has(node.name) && !node.isComponent;
}
function blockOf(node) {
  const name = node.name;
  if (name !== null && Object.hasOwn(HEADINGS, name) && plain(node)) {
    return [{ type: "heading", depth: HEADINGS[name], children: phrasingOf(node.children) }];
  }
  if (name === "p" && plain(node) && !(node.children.length === 1 && printsRaw(node.children[0]))) {
    return [{ type: "paragraph", children: phrasingOf(node.children) }];
  }
  if (name === "hr" && plain(node) && node.children.length === 0) return [{ type: "thematicBreak" }];
  if (name === "blockquote" && plain(node)) {
    return [{ type: "blockquote", children: flowOf(node.children) }];
  }
  if ((name === "ul" || name === "ol") && listable(node)) return [listOf(node)];
  if (name === "pre" && fenced(node)) {
    const code = node.children[0];
    const language = propOf(code, "className")?.value;
    const meta = propOf(code, "data-meta")?.value;
    return [{
      type: "code",
      lang: typeof language === "string" ? language.replace(/^language-/, "") : null,
      meta: typeof meta === "string" ? meta : null,
      value: code.children.length ? code.children[0].value : ""
    }];
  }
  if (name === "table" && tabular(node)) return [tableOf(node)];
  return jsxFlow(node);
}
function listable(node) {
  const startOnly = node.props.every((prop) => node.name === "ol" && prop.name === "start" && prop.kind === "number");
  return startOnly && !node.isComponent && !node.style && !node.repeat && !node.when && !node.slots && !node.dynamic && node.children.length > 0 && node.children.every((item) => item.kind === "block" && item.name === "li" && plain(item));
}
var isList = (node) => node.kind === "block" && (node.name === "ul" || node.name === "ol");
function tightItem(item) {
  const text2 = item.children.findIndex(isList);
  const head = text2 < 0 ? item.children : item.children.slice(0, text2);
  return head.length > 0 && head.every(isPhrasing) && item.children.slice(head.length).every(isList);
}
function listOf(node) {
  const items = node.children;
  const tight = items.every(tightItem);
  const start = propOf(node, "start")?.value;
  return {
    type: "list",
    ordered: node.name === "ol",
    start: node.name === "ol" ? typeof start === "number" ? start : 1 : null,
    spread: !tight,
    children: items.map((item) => {
      if (!tight) return { type: "listItem", spread: true, children: flowOf(item.children) };
      const nested = item.children.findIndex(isList);
      const head = nested < 0 ? item.children : item.children.slice(0, nested);
      const lists = item.children.slice(head.length);
      return {
        type: "listItem",
        spread: false,
        children: [{ type: "paragraph", children: phrasingOf(head) }, ...lists.flatMap(blockOf)]
      };
    })
  };
}
function fenced(node) {
  const code = node.children.length === 1 ? node.children[0] : null;
  return plain(node) && code?.kind === "block" && code.name === "code" && plain(code, ["className", "data-meta"]) && (propOf(code, "className") === void 0 || /^language-\S+$/.test(String(propOf(code, "className")?.value))) && (code.children.length === 0 || code.children.length === 1 && code.children[0].kind === "text" && code.children[0].prop == null && code.children[0].field == null);
}
function tabular(node) {
  if (!plain(node)) return false;
  const [head, body, ...rest] = node.children;
  if (rest.length || head?.kind !== "block" || head.name !== "thead" || !plain(head) || head.children.length !== 1) return false;
  if (body && (body.kind !== "block" || body.name !== "tbody" || !plain(body))) return false;
  const rows = [...head.children, ...body && body.kind === "block" ? body.children : []];
  const width = head.children[0].children?.length ?? 0;
  return width > 0 && rows.every((row, index) => row.kind === "block" && row.name === "tr" && plain(row) && row.children.length === width && row.children.every((cell) => cell.kind === "block" && cell.name === (index === 0 ? "th" : "td") && plain(cell, ["align"]) && ["left", "right", "center", void 0].includes(propOf(cell, "align")?.value) && cell.children.every(isInlineOnly)));
}
function tableOf(node) {
  const head = node.children[0];
  const body = node.children[1];
  const rows = [...head.children, ...body?.children ?? []];
  const headerCells = head.children[0].children;
  return {
    type: "table",
    align: headerCells.map((cell) => propOf(cell, "align")?.value ?? null),
    children: rows.map((row) => ({
      type: "tableRow",
      children: row.children.map((cell) => ({ type: "tableCell", children: phrasingOf(cell.children) }))
    }))
  };
}
function jsxFlow(node) {
  if (node.children.length === 0) return [raw(selfClosing(node))];
  if (node.children.every(isPhrasing)) {
    return [{ type: "paragraph", children: [raw(open(node)), ...phrasingOf(node.children), raw(close(node))] }];
  }
  return [raw(open(node)), ...flowOf(node.children), raw(close(node))];
}
function printsRaw(node) {
  const [printed] = phrasingOf([node]);
  return printed?.type === "html";
}
function phrasingOf(nodes) {
  return nodes.flatMap((node) => {
    if (node.kind === "opaque") return [raw(node.source)];
    if (node.kind === "text") {
      if (node.prop != null) return [raw(`{${node.prop}}`)];
      if (node.field != null) return [raw(`{bdText(${JSON.stringify(node.field)}, ${JSON.stringify(node.value)})}`)];
      return [{ type: "text", value: node.value }];
    }
    const name = node.name;
    if (name === "strong" && plain(node)) return [{ type: "strong", children: phrasingOf(node.children) }];
    if (name === "em" && plain(node)) return [{ type: "emphasis", children: phrasingOf(node.children) }];
    if (name === "br" && plain(node) && node.children.length === 0) return [{ type: "break" }];
    if (name === "code" && plain(node) && node.children.length === 1 && node.children[0].kind === "text" && node.children[0].prop == null && node.children[0].field == null) {
      return [{ type: "inlineCode", value: node.children[0].value }];
    }
    if (name === "a" && plain(node, ["href", "title"]) && propOf(node, "href")) {
      const title = propOf(node, "title")?.value;
      return [{ type: "link", url: String(propOf(node, "href").value), title: typeof title === "string" ? title : null, children: phrasingOf(node.children) }];
    }
    if (name === "img" && plain(node, ["src", "alt", "title"]) && propOf(node, "src") && node.children.length === 0) {
      const title = propOf(node, "title")?.value;
      const alt = propOf(node, "alt")?.value;
      return [{ type: "image", url: String(propOf(node, "src").value), alt: typeof alt === "string" ? alt : "", title: typeof title === "string" ? title : null }];
    }
    if (node.children.length === 0) return [raw(selfClosing(node))];
    return [raw(open(node)), ...phrasingOf(node.children), raw(close(node))];
  });
}
var open = (node) => node.name === null ? "<>" : `<${node.name}${jsxAttributes(node)}>`;
var close = (node) => node.name === null ? "</>" : `</${node.name}>`;
var selfClosing = (node) => node.name === null ? "<></>" : `<${node.name}${jsxAttributes(node)} />`;
export {
  MdxLensError,
  printMdx,
  readMdx
};
//# sourceMappingURL=lens.js.map