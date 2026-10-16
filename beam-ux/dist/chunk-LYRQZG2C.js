// src/blockdoc/json.ts
var isJsonBlock = (n) => n.kind === "block";
var isJsonText = (n) => n.kind === "text";
var isJsonOpaque = (n) => n.kind === "opaque";
var isLeafText = (b) => b.children.length > 0 && b.children.every((c) => isJsonText(c));
var VOID_TAGS = /* @__PURE__ */ new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
function toJson(input) {
  const roots = Array.isArray(input) ? input : "roots" in input ? input.roots : [input];
  return roots.map(childToJson);
}
function childToJson(child) {
  if (child.type === "text") return { kind: "text", value: child.value };
  if (child.type === "opaque") {
    return { kind: "opaque", reason: child.reason, source: child.source };
  }
  return {
    kind: "block",
    name: child.name,
    isComponent: child.isComponent,
    props: child.props.map((p) => ({ name: p.name, kind: p.kind, value: p.value })),
    children: child.children.map(childToJson),
    dynamic: child.dynamic
  };
}
var INDENT = "  ";
function jsonToTsx(doc, depth = 0) {
  return doc.map((n) => printNode(n, depth) + ";").join("\n");
}
function printNode(node, depth) {
  const pad = INDENT.repeat(depth);
  if (isJsonText(node)) return pad + escapeText(node.value.trim());
  if (isJsonOpaque(node)) return pad + node.source;
  const tag = node.name ?? "";
  const attrs = node.props.map(printProp).join("");
  const open = node.name === null ? "<>" : `<${tag}${attrs}>`;
  const close = node.name === null ? "</>" : `</${tag}>`;
  if (node.children.length === 0) {
    return node.name === null ? pad + "<></>" : pad + `<${tag}${attrs} />`;
  }
  if (isLeafText(node)) {
    const inner = node.children.map((c) => escapeText(c.value.trim())).join("");
    return `${pad}${open}${inner}${close}`;
  }
  const kids = node.children.map((c) => printNode(c, depth + 1)).join("\n");
  return `${pad}${open}
${kids}
${pad}${close}`;
}
function printProp(p) {
  switch (p.kind) {
    case "boolean-shorthand":
      return ` ${p.name}`;
    case "string":
      return ` ${p.name}=${JSON.stringify(String(p.value ?? ""))}`;
    case "number":
      return ` ${p.name}={${p.value}}`;
    case "boolean":
      return ` ${p.name}={${p.value ? "true" : "false"}}`;
    case "expression":
    default: {
      const src = String(p.value).trim();
      return ` ${p.name}={${src}}`;
    }
  }
}
function escapeText(s) {
  return s.replace(/[{}<>]/g, (c) => `{'${c}'}`);
}
var parentOf = (path) => path.split(".").slice(0, -1).join(".");
var indexOf = (path) => Number(path.split(".").pop());
function getAt(doc, path) {
  const idx = path.split(".").map(Number);
  let node = doc[idx[0]];
  for (let i = 1; i < idx.length; i++) {
    if (!node || !isJsonBlock(node)) return null;
    node = node.children[idx[i]];
  }
  return node ?? null;
}
function updateAt(doc, path, fn) {
  const idx = path.split(".").map(Number);
  const recurChildren = (nodes, depth) => {
    const ci = idx[depth];
    const child = nodes[ci];
    if (child === void 0) return nodes;
    const next = nodes.slice();
    next[ci] = recur(child, depth);
    return next;
  };
  const recur = (node, depth) => {
    if (depth === idx.length - 1) return fn(node);
    if (!isJsonBlock(node)) return node;
    return { ...node, children: recurChildren(node.children, depth + 1) };
  };
  return recurChildren(doc, 0);
}
function insertInto(doc, parentPath, index, node) {
  if (parentPath === "") {
    const next = doc.slice();
    next.splice(index, 0, node);
    return next;
  }
  return updateAt(doc, parentPath, (p) => {
    if (!isJsonBlock(p)) return p;
    const children = p.children.slice();
    children.splice(index, 0, node);
    return { ...p, children };
  });
}
function removeAt(doc, path) {
  const parent = parentOf(path);
  const i = indexOf(path);
  if (parent === "") {
    const next = doc.slice();
    next.splice(i, 1);
    return next;
  }
  return updateAt(doc, parent, (p) => {
    if (!isJsonBlock(p)) return p;
    const children = p.children.slice();
    children.splice(i, 1);
    return { ...p, children };
  });
}
function duplicateAt(doc, path) {
  const node = getAt(doc, path);
  if (!node) return doc;
  return insertInto(doc, parentOf(path), indexOf(path) + 1, structuredClone(node));
}
function moveBefore(doc, from, target) {
  return moveTo(doc, from, target, "before");
}
function moveAfter(doc, from, target) {
  return moveTo(doc, from, target, "after");
}
function moveTo(doc, from, target, edge) {
  if (from === target || target.startsWith(`${from}.`)) return doc;
  const node = getAt(doc, from);
  if (!node) return doc;
  const removed = removeAt(doc, from);
  const tParent = parentOf(target);
  let tIndex = indexOf(target) + (edge === "after" ? 1 : 0);
  if (parentOf(from) === tParent && indexOf(from) < tIndex) tIndex -= 1;
  if (tParent !== "" && !getAt(removed, tParent)) {
    return insertInto(removed, "", removed.length, node);
  }
  return insertInto(removed, tParent, tIndex, node);
}
function setProp(block, name, value, kind = "string") {
  const props = block.props.slice();
  const at = props.findIndex((p) => p.name === name);
  const prop = { name, kind, value };
  if (at >= 0) props[at] = prop;
  else props.push(prop);
  return { ...block, props };
}
function removeProp(block, name) {
  return { ...block, props: block.props.filter((p) => p.name !== name) };
}
function setText(block, value) {
  return { ...block, children: [{ kind: "text", value }] };
}
var propValue = (block, name) => block.props.find((p) => p.name === name)?.value;
var styleRows = (s) => s.split(";").map((d) => d.trim()).filter(Boolean).map((d) => {
  const i = d.indexOf(":");
  return { k: d.slice(0, i).trim(), v: d.slice(i + 1).trim() };
});
var joinStyle = (rows) => rows.filter((r) => r.k).map((r) => `${r.k}:${r.v}`).join(";");
function parseStyle(s) {
  const out = {};
  for (const decl of s.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (prop) out[prop] = decl.slice(i + 1).trim();
  }
  return out;
}

export {
  isJsonBlock,
  isJsonText,
  isJsonOpaque,
  isLeafText,
  VOID_TAGS,
  toJson,
  jsonToTsx,
  parentOf,
  indexOf,
  getAt,
  updateAt,
  insertInto,
  removeAt,
  duplicateAt,
  moveBefore,
  moveAfter,
  setProp,
  removeProp,
  setText,
  propValue,
  styleRows,
  joinStyle,
  parseStyle
};
//# sourceMappingURL=chunk-LYRQZG2C.js.map