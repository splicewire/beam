import {
  jsonToTsx,
  toJson
} from "./chunk-PY3YY5NJ.js";
import {
  patchText
} from "./chunk-4FJIW3RI.js";

// src/blockdoc/lens.ts
import * as recast from "recast";
import * as babelTsParser from "recast/parsers/babel-ts.js";
import * as t from "@babel/types";
var parser = babelTsParser;
function parse2(tsx) {
  const ast = recast.parse(tsx, { parser });
  const roots = [];
  const seen = /* @__PURE__ */ new Set();
  walk(ast.program, (node) => {
    if ((t.isJSXElement(node) || t.isJSXFragment(node)) && !seen.has(node)) {
      const block = buildBlock(node, seen);
      if (block) roots.push(block);
    }
  });
  return { ast, roots };
}
function print2(input) {
  const ast = "ast" in input ? input.ast : input;
  return recast.print(ast).code;
}
function buildBlock(el, seen) {
  seen.add(el);
  const isElement = t.isJSXElement(el);
  const opening = isElement ? el.openingElement : null;
  const name = opening ? jsxName(opening.name) : null;
  const isComponent = !!name && /^[A-Z]/.test(name.replace(/^.*\./, name[0]));
  const props = [];
  let dynamic = !isElement ? false : opening.attributes.some((a) => t.isJSXSpreadAttribute(a));
  if (opening) {
    for (const attr of opening.attributes) {
      if (t.isJSXAttribute(attr)) {
        props.push(buildProp(attr));
      }
    }
  }
  const children = [];
  for (const child of el.children) {
    if (t.isJSXText(child)) {
      if (child.value.trim() === "") continue;
      children.push(textFromJSXText(child));
    } else if (t.isJSXElement(child) || t.isJSXFragment(child)) {
      children.push(buildBlock(child, seen));
    } else if (t.isJSXExpressionContainer(child)) {
      const expr = child.expression;
      if (t.isJSXEmptyExpression(expr)) {
        continue;
      }
      if (t.isStringLiteral(expr) || t.isTemplateLiteral(expr)) {
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
    dynamic,
    node: el
  };
}
function buildProp(attr) {
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

// src/blockdoc/index.ts
function fromJson(doc) {
  return parse2(jsonToTsx(doc));
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