import {
  assertCondition,
  assertFieldPath,
  assertRepeat
} from "./chunk-PZNSQ73I.js";
import {
  assertBlockStyle
} from "./chunk-2NOVFPER.js";

// src/blockdoc/identity.ts
function blockId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let time = Date.now();
  for (let i = 5; i >= 0; i--) {
    bytes[i] = time % 256;
    time = Math.floor(time / 256);
  }
  bytes[6] = bytes[6] & 15 | 112;
  bytes[8] = bytes[8] & 63 | 128;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function freshBlockIds(node) {
  const copy = structuredClone(node);
  const visit = (value) => {
    if (value.kind !== "block") return;
    value.id = blockId();
    value.children?.forEach(visit);
    Object.values(value.slots ?? {}).forEach((nodes) => nodes.forEach(visit));
    value.repeat?.empty?.forEach(visit);
  };
  visit(copy);
  return copy;
}

// src/blockdoc/component-interface.ts
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function readComponentDefinition(value) {
  if (!object(value) || value.name != null && (typeof value.name !== "string" || !/^[A-Z][A-Za-z0-9]*$/.test(value.name) || value.name === "Slot")) {
    throw new Error("A component definition requires a PascalCase name");
  }
  const rawProps = value.props ?? [];
  if (!Array.isArray(rawProps)) throw new Error("Component props must be a list");
  const seen = /* @__PURE__ */ new Set();
  const props = rawProps.map((raw) => {
    if (!object(raw)) throw new Error("A component prop must be declared");
    assertReferenceName(raw.name);
    if (["children", "components", "bindings", "bindingRuntime", "styleRegistry", "className", "key", "ref"].includes(raw.name)) throw new Error("This prop name belongs to the component runtime or a Slot");
    if (seen.has(raw.name)) throw new Error("Component prop names must be unique");
    seen.add(raw.name);
    const types = ["text", "number", "toggle", "choice", "link", "image"];
    const type = types.find((type2) => type2 === raw.type);
    if (!type) throw new Error("Unknown component prop type");
    const choices = raw.choices ?? [];
    if (!Array.isArray(choices) || !choices.every((choice) => typeof choice === "string")) throw new Error("Choices must be text");
    if (raw.required != null && typeof raw.required !== "boolean") throw new Error("Required must be boolean");
    const fallback = raw.default ?? null;
    if (type === "choice" && choices.length === 0) throw new Error("A choice prop requires literal text choices");
    if (fallback !== null && !(type === "number" ? typeof fallback === "number" && Number.isFinite(fallback) : type === "toggle" ? typeof fallback === "boolean" : type === "choice" ? typeof fallback === "string" && choices.includes(fallback) : typeof fallback === "string")) throw new Error("A component default must fit its declared prop type");
    const defaultValue = typeof fallback === "string" || typeof fallback === "number" || typeof fallback === "boolean" ? fallback : null;
    return { name: raw.name, type, choices, required: raw.required === true, default: defaultValue };
  });
  return { name: typeof value.name === "string" ? value.name : null, props };
}
function componentLensContext(definition, context) {
  if (!definition.name) throw new Error("A component name must be saved with its body");
  const properties = Object.fromEntries((definition.props ?? []).map((prop) => [prop.name, {
    type: prop.type === "number" ? "number" : prop.type === "toggle" ? "boolean" : "string"
  }]));
  return { ...context, component: definition.name, profile: { nodes: [
    ...context.profile?.nodes.filter((node) => node.name !== definition.name) ?? [],
    { name: definition.name, attrsSchema: { properties }, admitsChildCategories: [] }
  ] } };
}
function assertReferenceName(value) {
  if (typeof value !== "string" || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) || ["__proto__", "prototype", "constructor", "this", "super", "null", "true", "false"].includes(value)) {
    throw new Error("A component reference must be a declared identifier");
  }
}
function declaredProp(context, name) {
  const entry = context.profile?.nodes.find((node) => node.name === context.component);
  return !!entry?.attrsSchema?.properties && Object.hasOwn(entry.attrsSchema.properties, name);
}
function declaredSlot(context, name) {
  const entry = context.profile?.nodes.find((node) => node.name === context.component);
  return !!entry && (name === "children" ? entry.admitsChildCategories === null || entry.admitsChildCategories.length > 0 : !!entry.slots?.some((slot) => slot.name === name));
}

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
  if (child.type === "text") return { kind: "text", value: child.value, ...child.field != null ? { field: child.field } : {}, ...child.prop != null ? { prop: child.prop } : {} };
  if (child.type === "opaque") {
    return { kind: "opaque", reason: child.reason, source: child.source };
  }
  return {
    kind: "block",
    name: child.name,
    isComponent: child.isComponent,
    props: child.props.map((p) => ({ name: p.name, kind: p.kind, value: p.value })),
    children: child.children.map(childToJson),
    ...child.slots ? { slots: Object.fromEntries(Object.entries(child.slots).map(([name, nodes]) => [name, nodes.map(childToJson)])) } : {},
    dynamic: child.dynamic,
    ...child.style ? { style: child.style } : {},
    ...child.repeat ? { repeat: child.repeat } : {},
    ...child.when ? { when: child.when } : {},
    ...child.clickEvent ? { clickEvent: child.clickEvent } : {},
    ...child.component ? { component: child.component } : {}
  };
}
var INDENT = "  ";
function jsonToTsx(doc, depth = 0) {
  const componentBody = doc.length === 1 && isJsonBlock(doc[0]) && !!doc[0].component;
  return doc.map((n) => printNode(n, depth, componentBody) + ";").join("\n");
}
function printNode(node, depth, componentBody = false) {
  const pad = INDENT.repeat(depth);
  if (isJsonText(node)) {
    if (node.prop != null) {
      assertReferenceName(node.prop);
      return pad + `{${node.prop}}`;
    }
    if (node.field != null) {
      assertFieldPath(node.field);
      return pad + `{bdText(${JSON.stringify(node.field)}, ${JSON.stringify(node.value)})}`;
    }
    const [lead, run, trail] = textRun(node.value);
    return [lead ? pad + SPACE : "", run !== "" ? pad + escapeText(run) : "", trail ? pad + SPACE : ""].filter((line) => line !== "").join("\n");
  }
  if (isJsonOpaque(node)) return pad + node.source;
  if (node.name === "Slot" && !componentBody) {
    const name = node.props.find((prop) => prop.name === "name")?.value ?? "children";
    assertReferenceName(name);
    const fallback = node.children.length === 0 ? "" : ` ?? ${printSlotValue(node.children, depth)}`;
    return pad + `{${name}${fallback}}`;
  }
  const tag = node.name ?? "";
  const attrs = jsxAttributes(node, depth, componentBody);
  const open = node.name === null ? "<>" : `<${tag}${attrs}>`;
  const close = node.name === null ? "</>" : `</${tag}>`;
  if (node.children.length === 0) {
    return node.name === null ? pad + "<></>" : pad + `<${tag}${attrs} />`;
  }
  if (isLeafText(node) && node.children.every((child) => !("field" in child) && !("prop" in child))) {
    const [lead, run, trail] = textRun(node.children.map((c) => c.value).join(""));
    return `${pad}${open}${lead ? SPACE : ""}${escapeText(run)}${trail ? SPACE : ""}${close}`;
  }
  const kids = node.children.map((c) => printNode(c, depth + 1, componentBody)).filter((part) => part !== "").join("\n");
  return `${pad}${open}
${kids}
${pad}${close}`;
}
var SPACE = '{" "}';
function textRun(value) {
  const [, edgeLead, run, edgeTrail] = /^([ \t\r\n]*)([\s\S]*?)([ \t\r\n]*)$/.exec(value);
  const lead = edgeLead !== "" && !/[\r\n]/.test(edgeLead);
  const trail = edgeTrail !== "" && !/[\r\n]/.test(edgeTrail);
  return run === "" ? [lead, "", false] : [lead, run, trail];
}
function jsxAttributes(node, depth = 0, componentBody = false) {
  if (node.style) assertBlockStyle(node.style);
  if (node.repeat) assertRepeat(node.repeat);
  if (node.when) assertCondition(node.when);
  const attrs = node.props.map(printProp).join("") + (node.style ? ` bdStyle={${JSON.stringify(node.style)}}` : "") + (node.repeat ? ` bdRepeat={${JSON.stringify(node.repeat)}}` : "") + (node.when ? ` bdWhen={${JSON.stringify(node.when)}}` : "") + (node.clickEvent ? ` bdEvent={${JSON.stringify(node.clickEvent)}}` : "") + (node.component ? ` bdComponent={${JSON.stringify(node.component)}}` : "");
  const slotAttrs = Object.entries(node.slots ?? {}).map(([name, children]) => {
    assertReferenceName(name);
    return ` ${name}={${printSlotValue(children, depth, componentBody)}}`;
  }).join("");
  return attrs + slotAttrs;
}
function printProp(p) {
  switch (p.kind) {
    case "prop":
      assertReferenceName(p.value);
      return ` ${p.name}={${p.value}}`;
    case "field":
      assertFieldPath(p.value);
      return ` ${p.name}={bdField(${JSON.stringify(p.value)})}`;
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
function printSlotValue(children, depth, componentBody = false) {
  if (children.length === 1 && isJsonBlock(children[0]) && children[0].name !== "Slot") return printNode(children[0], depth, componentBody).trimStart();
  return `<>${children.map((child) => printNode(child, depth + 1, componentBody)).filter((part) => part !== "").join("\n")}</>`;
}
function escapeText(s) {
  return s.replace(/[{}<>]/g, (c) => `{'${c}'}`);
}
var parentOf = (path) => path.split(".").slice(0, -1).join(".");
var indexOf = (path) => Number(path.split(".").pop());
function getAt(doc, path) {
  const parts = path.split(".");
  if (!/^\d+$/.test(parts[0])) return null;
  let node = doc[Number(parts[0])];
  for (let i = 1; i < parts.length; i++) {
    if (!node || !isJsonBlock(node)) return null;
    if (parts[i] === "slots") {
      const name = parts[++i];
      try {
        assertReferenceName(name);
      } catch {
        return null;
      }
      node = slotContainer(node.slots?.[name] ?? []);
    } else {
      if (!/^\d+$/.test(parts[i])) return null;
      node = node.children[Number(parts[i])];
    }
  }
  return node ?? null;
}
function slotContainer(children) {
  return { kind: "block", name: null, isComponent: false, dynamic: false, props: [], children };
}
function updateAt(doc, path, fn) {
  if (!getAt(doc, path)) return doc;
  const parts = path.split(".");
  const recur = (node, offset) => {
    if (offset === parts.length) return fn(node);
    if (!isJsonBlock(node)) return node;
    if (parts[offset] === "slots") {
      const name = parts[offset + 1];
      const changed = recur(slotContainer(node.slots?.[name] ?? []), offset + 2);
      return isJsonBlock(changed) ? { ...node, slots: { ...node.slots, [name]: changed.children } } : node;
    }
    const index = Number(parts[offset]);
    return { ...node, children: node.children.map((child, i) => i === index ? recur(child, offset + 1) : child) };
  };
  return doc.map((node, i) => i === Number(parts[0]) ? recur(node, 1) : node);
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
  return insertInto(doc, parentOf(path), indexOf(path) + 1, freshBlockIds(node));
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
  readComponentDefinition,
  componentLensContext,
  assertReferenceName,
  declaredProp,
  declaredSlot,
  blockId,
  freshBlockIds,
  isJsonBlock,
  isJsonText,
  isJsonOpaque,
  isLeafText,
  VOID_TAGS,
  toJson,
  jsonToTsx,
  jsxAttributes,
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
//# sourceMappingURL=chunk-RIE4CLKO.js.map