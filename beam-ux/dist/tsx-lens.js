import {
  declaredProp,
  declaredSlot,
  jsonToTsx,
  toJson
} from "./chunk-E4PK2WXT.js";
import {
  assertCondition,
  assertFieldPath,
  assertRepeat
} from "./chunk-EMFVKUTK.js";
import {
  assertBlockStyle,
  legacyStyle
} from "./chunk-2NOVFPER.js";

// src/blockdoc/lens.ts
import * as recast from "recast";
import * as babelTsParser from "recast/parsers/babel-ts.js";
import * as t from "@babel/types";

// src/blockdoc/patch-text.ts
function patchText(text, value) {
  const node = text.node;
  if (node.type === "JSXText") {
    node.value = value;
    node.extra = void 0;
  } else if (node.type === "StringLiteral") {
    node.value = value;
    node.extra = void 0;
  } else if (node.type === "TemplateLiteral") {
    node.expressions = [];
    node.quasis = [
      { type: "TemplateElement", value: { raw: value, cooked: value }, tail: true }
    ];
  }
  text.value = value;
}

// src/blockdoc/lens.ts
var parser = babelTsParser;
function parse2(tsx, context = {}) {
  const ast = recast.parse(tsx, { parser });
  const roots = [];
  const seen = /* @__PURE__ */ new Set();
  walk(ast.program, (node) => {
    if ((t.isJSXElement(node) || t.isJSXFragment(node)) && !seen.has(node)) {
      const block = buildBlock(node, seen, context);
      if (block) roots.push(block);
    }
  });
  return { ast, roots };
}
function print2(input) {
  const ast = "ast" in input ? input.ast : input;
  return recast.print(ast).code;
}
function buildBlock(el, seen, context) {
  seen.add(el);
  const isElement = t.isJSXElement(el);
  const opening = isElement ? el.openingElement : null;
  const name = opening ? jsxName(opening.name) : null;
  const isComponent = !!name && /^[A-Z]/.test(name.replace(/^.*\./, name[0]));
  const props = [];
  const slots = {};
  let style;
  let legacy;
  let repeat;
  let when;
  let dynamic = !isElement ? false : opening.attributes.some((a) => t.isJSXSpreadAttribute(a));
  if (opening) {
    for (const attr of opening.attributes) {
      if (t.isJSXAttribute(attr)) {
        const value = t.isJSXExpressionContainer(attr.value) ? attr.value.expression : attr.value;
        const slot = context.profile?.nodes.find((entry) => entry.name === name)?.slots?.find((slot2) => slot2.name === jsxName(attr.name));
        if (slot && (t.isJSXElement(value) || t.isJSXFragment(value))) {
          const slotBlock = buildBlock(value, seen, context);
          slots[slot.name] = t.isJSXFragment(value) ? slotBlock.children : [slotBlock];
          continue;
        }
        if (t.isJSXIdentifier(attr.name) && attr.name.name === "bdStyle") {
          if (!t.isJSXExpressionContainer(attr.value)) throw new Error("bdStyle requires a literal object");
          const value2 = styleLiteral(attr.value.expression);
          assertBlockStyle(value2);
          style = value2;
        } else if (t.isJSXIdentifier(attr.name) && ["bdRepeat", "bdWhen"].includes(attr.name.name)) {
          if (!t.isJSXExpressionContainer(attr.value)) throw new Error(`${attr.name.name} requires a literal object`);
          const value2 = styleLiteral(attr.value.expression);
          if (attr.name.name === "bdRepeat") {
            assertRepeat(value2);
            repeat = value2;
          } else {
            assertCondition(value2);
            when = value2;
          }
        } else {
          const prop = buildProp(attr, context);
          if (prop.kind === "expression") sealSubtree(attr, seen);
          if (prop.name === "style" && prop.kind === "string") {
            legacy = legacyStyle(String(prop.value));
          } else props.push(prop);
        }
      }
    }
  }
  const children = [];
  for (const child of el.children) {
    if (t.isJSXText(child)) {
      if (child.value.trim() === "") continue;
      children.push(textFromJSXText(child));
    } else if (t.isJSXElement(child) || t.isJSXFragment(child)) {
      children.push(buildBlock(child, seen, context));
    } else if (t.isJSXExpressionContainer(child)) {
      const expr = child.expression;
      if (t.isJSXEmptyExpression(expr)) {
        continue;
      }
      const slotIdentifier = t.isIdentifier(expr) ? expr : t.isLogicalExpression(expr, { operator: "??" }) && t.isIdentifier(expr.left) ? expr.left : null;
      const fallback = t.isLogicalExpression(expr, { operator: "??" }) ? expr.right : null;
      if (slotIdentifier && declaredSlot(context, slotIdentifier.name) && (fallback === null || t.isJSXElement(fallback) || t.isJSXFragment(fallback))) {
        const fallbackBlock = fallback ? buildBlock(fallback, seen, context) : null;
        children.push({ type: "block", name: "Slot", isComponent: true, props: slotIdentifier.name === "children" ? [] : [{ name: "name", kind: "string", value: slotIdentifier.name, node: child }], children: fallbackBlock ? t.isJSXFragment(fallback) ? fallbackBlock.children : [fallbackBlock] : [], dynamic: false, node: child });
      } else if (t.isIdentifier(expr) && declaredProp(context, expr.name)) {
        children.push({ type: "text", value: "", prop: expr.name, node: child });
      } else if (t.isCallExpression(expr) && t.isIdentifier(expr.callee, { name: "bdText" })) {
        const args = bindingArguments(expr, 2);
        children.push({ type: "text", field: args[0], value: args[1], node: child });
      } else if (t.isStringLiteral(expr) || t.isTemplateLiteral(expr)) {
        children.push(textFromExpression(child, expr));
      } else {
        sealSubtree(child, seen);
        children.push(opaqueFromExpression(child, expr));
        dynamic = true;
      }
    } else if (t.isJSXSpreadChild(child)) {
      sealSubtree(child, seen);
      children.push(opaqueFromSpreadChild(child));
      dynamic = true;
    }
  }
  return {
    type: "block",
    name,
    isComponent,
    props,
    children,
    ...Object.keys(slots).length ? { slots } : {},
    dynamic,
    ...style || legacy ? { style: { layers: [...legacy?.layers ?? [], ...style?.layers ?? []] } } : {},
    ...repeat ? { repeat } : {},
    ...when ? { when } : {},
    node: el
  };
}
function buildProp(attr, context) {
  const name = jsxName(attr.name);
  const value = attr.value;
  if (value == null) {
    return { name, kind: "boolean-shorthand", value: true, node: attr };
  }
  if (t.isStringLiteral(value)) {
    return { name, kind: "string", value: value.value, node: attr };
  }
  if (t.isJSXExpressionContainer(value)) {
    const expr = value.expression;
    if (t.isIdentifier(expr) && declaredProp(context, expr.name)) {
      return { name, kind: "prop", value: expr.name, node: attr };
    }
    if (t.isCallExpression(expr) && t.isIdentifier(expr.callee, { name: "bdField" })) {
      return { name, kind: "field", value: bindingArguments(expr, 1)[0], node: attr };
    }
    if (t.isStringLiteral(expr)) {
      return { name, kind: "string", value: expr.value, node: attr };
    }
    if (t.isNumericLiteral(expr)) {
      return { name, kind: "number", value: expr.value, node: attr };
    }
    if (t.isBooleanLiteral(expr)) {
      return { name, kind: "boolean", value: expr.value, node: attr };
    }
    if (t.isUnaryExpression(expr) && expr.operator === "-" && t.isNumericLiteral(expr.argument)) {
      return { name, kind: "number", value: -expr.argument.value, node: attr };
    }
    return {
      name,
      kind: "expression",
      value: exprSource(expr),
      node: attr
    };
  }
  return { name, kind: "expression", value: exprSource(value), node: attr };
}
function textFromJSXText(node) {
  return { type: "text", value: node.value, node };
}
function bindingArguments(call, count) {
  if (call.arguments.length !== count || call.arguments.some((argument) => !t.isStringLiteral(argument))) {
    throw new Error("A binding helper requires literal string arguments only");
  }
  const args = call.arguments.map((argument) => argument.value);
  assertFieldPath(args[0]);
  return args;
}
function textFromExpression(_container, expr) {
  const value = t.isStringLiteral(expr) ? expr.value : expr.quasis.map((q) => q.value.cooked ?? q.value.raw).join("");
  return { type: "text", value, node: expr };
}
function opaqueFromExpression(container, expr) {
  return {
    type: "opaque",
    reason: opaqueReason(expr),
    source: exprSource(container),
    node: container
  };
}
function opaqueFromSpreadChild(child) {
  return {
    type: "opaque",
    reason: "spread",
    source: exprSource(child),
    node: child
  };
}
function sealSubtree(root, seen) {
  walk(root, (n) => {
    if (t.isJSXElement(n) || t.isJSXFragment(n)) seen.add(n);
  });
}
function opaqueReason(expr) {
  if (t.isConditionalExpression(expr)) return "ternary";
  if (t.isLogicalExpression(expr) && (expr.operator === "&&" || expr.operator === "||")) {
    return "conditional";
  }
  if (t.isCallExpression(expr) && t.isMemberExpression(expr.callee) && t.isIdentifier(expr.callee.property) && expr.callee.property.name === "map") {
    return "map";
  }
  return "expression";
}
function patchProp(prop, value) {
  const attr = prop.node;
  const [attrValue, kind] = encodeScalar(value);
  attr.value = attrValue;
  prop.kind = kind;
  prop.value = value;
}
function encodeScalar(value) {
  if (typeof value === "string") return [t.stringLiteral(value), "string"];
  if (typeof value === "number")
    return [t.jsxExpressionContainer(t.numericLiteral(value)), "number"];
  return [t.jsxExpressionContainer(t.booleanLiteral(value)), "boolean"];
}
function addProp(block, name, value) {
  const existing = block.props.find((p) => p.name === name);
  if (existing) {
    if (typeof value === "object") patchPropExpression(existing, value.expression);
    else patchProp(existing, value);
    return existing;
  }
  const el = block.node;
  if (!t.isJSXElement(el)) {
    throw new Error("addProp: cannot add an attribute to a fragment");
  }
  let attrValue;
  let kind;
  let propValue;
  if (typeof value === "object") {
    attrValue = t.jsxExpressionContainer(parseExpression(value.expression));
    kind = "expression";
    propValue = value.expression;
  } else {
    [attrValue, kind] = encodeScalar(value);
    propValue = value;
  }
  const attr = t.jsxAttribute(t.jsxIdentifier(name), attrValue);
  el.openingElement.attributes.push(attr);
  const prop = { name, kind, value: propValue, node: attr };
  block.props.push(prop);
  return prop;
}
function removeProp(block, name) {
  const idx = block.props.findIndex((p) => p.name === name);
  if (idx === -1) return false;
  const prop = block.props[idx];
  const el = block.node;
  if (t.isJSXElement(el)) {
    const attrs = el.openingElement.attributes;
    const attrIdx = attrs.indexOf(prop.node);
    if (attrIdx !== -1) attrs.splice(attrIdx, 1);
  }
  block.props.splice(idx, 1);
  return true;
}
function patchPropExpression(prop, exprSrc) {
  const attr = prop.node;
  const expr = parseExpression(exprSrc);
  attr.value = t.jsxExpressionContainer(expr);
  prop.kind = "expression";
  prop.value = exprSrc;
}
function jsxName(name) {
  if (t.isJSXIdentifier(name)) return name.name;
  if (t.isJSXNamespacedName(name)) return `${name.namespace.name}:${name.name.name}`;
  return `${jsxName(name.object)}.${name.property.name}`;
}
function exprSource(node) {
  try {
    return recast.print(node).code;
  } catch {
    return "";
  }
}
function parseExpression(src) {
  const file = recast.parse(`(${src})`, { parser });
  const stmt = file.program.body[0];
  if (t.isExpressionStatement(stmt)) {
    const expr = stmt.expression;
    if (expr.extra) {
      delete expr.extra.parenthesized;
      delete expr.extra.parenStart;
    }
    return expr;
  }
  throw new Error(`Not an expression: ${src}`);
}
function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  const n = node;
  if (typeof n.type === "string") {
    visit(n);
  }
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "start" || key === "end" || key === "range") continue;
    if (key === "tokens" || key === "comments" || key === "original") continue;
    walk(node[key], visit);
  }
}
function styleLiteral(node) {
  if (t.isStringLiteral(node)) return node.value;
  if (t.isNullLiteral(node)) return null;
  if (t.isArrayExpression(node)) return node.elements.map((n) => {
    if (!n || t.isSpreadElement(n)) throw new Error("bdStyle requires literal array elements");
    return styleLiteral(n);
  });
  if (t.isObjectExpression(node)) {
    const result = /* @__PURE__ */ Object.create(null);
    for (const prop of node.properties) {
      if (!t.isObjectProperty(prop) || prop.computed || prop.shorthand || !(t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))) throw new Error("bdStyle requires literal object properties");
      const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;
      if (["__proto__", "prototype", "constructor"].includes(key) || Object.hasOwn(result, key)) throw new Error("bdStyle has an invalid literal key");
      result[key] = styleLiteral(prop.value);
    }
    return result;
  }
  throw new Error("bdStyle requires literal values (no executable expressions)");
}

// src/blockdoc/index.ts
function fromJson(doc, context = {}) {
  return parse2(jsonToTsx(doc), context);
}
export {
  addProp,
  fromJson,
  jsonToTsx,
  parse2 as parse,
  patchProp,
  patchPropExpression,
  patchText,
  print2 as print,
  removeProp,
  toJson
};
//# sourceMappingURL=tsx-lens.js.map