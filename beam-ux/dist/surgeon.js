// src/surgeon/sdkHookMigration.ts
import * as recast2 from "recast";
import * as babelTsParser2 from "recast/parsers/babel-ts.js";
import * as t from "@babel/types";

// src/surgeon/namespaceRename.ts
import * as recast from "recast";
import * as babelTsParser from "recast/parsers/babel-ts.js";
var parser = babelTsParser;
var PIVOTS = /* @__PURE__ */ new Set(["Data", "Enums", "Models", "Spiders", "Conduits", "Routing"]);
function parseDeclaredEntries(generatedDtsSource) {
  const entries = [];
  const stack = [];
  for (const rawLine of generatedDtsSource.split("\n")) {
    const line = rawLine.trim();
    const nsOpen = line.match(/^(?:declare\s+)?namespace\s+(\w+)\s*\{$/);
    if (nsOpen) {
      stack.push(nsOpen[1]);
      continue;
    }
    if (line === "}") {
      stack.pop();
      continue;
    }
    const typeDecl = line.match(/^export\s+type\s+(\w+)\s*=/);
    if (typeDecl) {
      entries.push({ namespaceSegments: [...stack], className: typeDecl[1] });
    }
  }
  return entries;
}
function legacyPackageSegmentFor(namespaceSegments) {
  if (namespaceSegments[0] !== "Splicewire") return null;
  if (namespaceSegments[1] === "Tower") return "Tower";
  if (namespaceSegments[1] === "Beam") {
    const next = namespaceSegments[2];
    return next !== void 0 && !PIVOTS.has(next) ? next : "Beam";
  }
  return null;
}
function legacyProjectedPath(namespaceSegments, className) {
  if (namespaceSegments[0] === "App") return null;
  if (namespaceSegments[0] !== "Splicewire") return null;
  const pivotIdx = namespaceSegments.findIndex((s) => PIVOTS.has(s));
  if (pivotIdx === -1) return null;
  const pivot = namespaceSegments[pivotIdx];
  const rest = namespaceSegments.slice(pivotIdx + 1);
  const packageSegment = legacyPackageSegmentFor(namespaceSegments);
  const path = packageSegment === null ? ["App", pivot, ...rest, className] : ["App", pivot, packageSegment, ...rest, className];
  return path.join(".");
}
function buildNamespaceLookup(generatedDtsSource) {
  const map = {};
  for (const entry of parseDeclaredEntries(generatedDtsSource)) {
    const newPath = [...entry.namespaceSegments, entry.className].join(".");
    const oldPath = legacyProjectedPath(entry.namespaceSegments, entry.className);
    if (oldPath !== null && oldPath !== newPath) {
      map[oldPath] = newPath;
    }
  }
  return map;
}
function segmentsOf(node) {
  if (node.type === "Identifier") {
    return [node.name];
  }
  if (node.type === "TSQualifiedName") {
    const left = segmentsOf(node.left);
    if (left === null) return null;
    return [...left, node.right.name];
  }
  return null;
}
function qualifiedNameFromSegments(segments) {
  const bt = recast.types.builders;
  let node = bt.identifier(segments[0]);
  for (let i = 1; i < segments.length; i++) {
    node = bt.tsQualifiedName(node, bt.identifier(segments[i]));
  }
  return node;
}
function renameFile(source, lookup) {
  let ast;
  try {
    ast = recast.parse(source, { parser });
  } catch {
    return null;
  }
  let changed = false;
  const visit = (node) => {
    if (node === null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    const n = node;
    if (n.type === "TSTypeReference") {
      const ref = n;
      const segments = segmentsOf(ref.typeName);
      if (segments !== null) {
        const currentPath = segments.join(".");
        const newPath = lookup[currentPath];
        if (newPath !== void 0 && newPath !== currentPath) {
          ref.typeName = qualifiedNameFromSegments(
            newPath.split(".")
          );
          changed = true;
        }
      }
      visit(ref.typeParameters);
      return;
    }
    for (const key of Object.keys(n)) {
      if (key === "loc" || key === "range" || key === "start" || key === "end" || key === "comments") continue;
      visit(n[key]);
    }
  };
  visit(ast.program);
  if (!changed) return null;
  return recast.print(ast).code;
}
function renameNamespaceReferences(files, lookup) {
  const edits = [];
  for (const [file, source] of Object.entries(files)) {
    const rewritten = renameFile(source, lookup);
    if (rewritten !== null && rewritten !== source) {
      edits.push({ file, old: source, new: rewritten });
    }
  }
  return edits;
}

// src/surgeon/sdkHookMigration.ts
var parser2 = babelTsParser2;
var INTERPOLATION_MARKER = "\0INTERPOLATION\0";
function buildReverseRouteIndex(routeDefaults) {
  return Object.entries(routeDefaults).map(([routeName, entry]) => {
    const path = typeof entry === "string" ? entry : entry.path;
    const methods = typeof entry === "string" ? void 0 : entry.methods;
    const segments = path.split("/").map((seg) => /^\{\w+\}$/.test(seg) ? null : seg);
    return { routeName, segments, methods };
  });
}
function pathSegmentsFromNode(node) {
  if (t.isStringLiteral(node)) {
    return node.value.split("/");
  }
  if (t.isTemplateLiteral(node)) {
    let combined = "";
    node.quasis.forEach((quasi, i) => {
      combined += quasi.value.cooked ?? quasi.value.raw;
      if (i < node.expressions.length) combined += INTERPOLATION_MARKER;
    });
    return combined.split("/");
  }
  return null;
}
function resolveRouteNameFromSegments(segments, verb, reverseIndex) {
  const verbUpper = verb.toUpperCase();
  const matches = reverseIndex.filter((entry) => {
    if (entry.segments.length !== segments.length) return false;
    const segmentsMatch = entry.segments.every((templateSeg, i) => {
      const argSeg = segments[i];
      return templateSeg === null ? argSeg === INTERPOLATION_MARKER : templateSeg === argSeg;
    });
    if (!segmentsMatch) return false;
    return !entry.methods || entry.methods.length === 0 || entry.methods.some((m) => m.toUpperCase() === verbUpper);
  });
  return matches.length === 1 ? matches[0].routeName : null;
}
function extractRouteDefaultsFromSource(source, exportName = "defaults") {
  const ast = parseSource(source);
  for (const stmt of ast.program.body) {
    if (!t.isExportNamedDeclaration(stmt) || !stmt.declaration || !t.isVariableDeclaration(stmt.declaration)) continue;
    for (const decl of stmt.declaration.declarations) {
      if (!t.isIdentifier(decl.id) || decl.id.name !== exportName) continue;
      if (!decl.init || !t.isObjectExpression(decl.init)) continue;
      return objectExpressionToRouteDefaults(decl.init);
    }
  }
  return {};
}
function objectExpressionToRouteDefaults(obj) {
  const result = {};
  for (const prop of obj.properties) {
    if (!t.isObjectProperty(prop)) continue;
    const key = t.isStringLiteral(prop.key) ? prop.key.value : t.isIdentifier(prop.key) ? prop.key.name : null;
    if (key === null) continue;
    if (t.isStringLiteral(prop.value)) {
      result[key] = prop.value.value;
      continue;
    }
    if (!t.isObjectExpression(prop.value)) continue;
    const pathProp = findProp(prop.value, "path");
    if (!pathProp || !t.isStringLiteral(pathProp.value)) continue;
    const methodsProp = findProp(prop.value, "methods");
    const methods = methodsProp && t.isArrayExpression(methodsProp.value) ? methodsProp.value.elements.filter((e) => !!e && t.isStringLiteral(e)).map((e) => e.value) : void 0;
    result[key] = methods ? { path: pathProp.value.value, methods } : { path: pathProp.value.value };
  }
  return result;
}
function parseSource(source) {
  return recast2.parse(source, { parser: parser2 });
}
function findQueryWrappers(source, reverseIndex = []) {
  const ast = parseSource(source);
  const wrappers = [];
  for (const stmt of ast.program.body) {
    const decl = t.isExportNamedDeclaration(stmt) && stmt.declaration && t.isFunctionDeclaration(stmt.declaration) ? stmt.declaration : t.isFunctionDeclaration(stmt) ? stmt : null;
    if (!decl || !decl.id) continue;
    const wrapper = extractWrapper(decl, stmt, reverseIndex);
    if (wrapper) wrappers.push(wrapper);
  }
  return wrappers;
}
function extractWrapper(fn, outer, reverseIndex) {
  if (!fn.body) return null;
  const returnStmt = fn.body.body.find((s) => t.isReturnStatement(s));
  if (!returnStmt || !returnStmt.argument || !t.isCallExpression(returnStmt.argument)) return null;
  const call = returnStmt.argument;
  if (!t.isIdentifier(call.callee) || call.callee.name !== "useQuery") return null;
  const [arg] = call.arguments;
  if (!arg || !t.isObjectExpression(arg)) return null;
  const queryKeyProp = findProp(arg, "queryKey");
  if (!queryKeyProp || !t.isArrayExpression(queryKeyProp.value)) return null;
  const queryFnProp = findProp(arg, "queryFn");
  if (!queryFnProp) return null;
  const fnNode = queryFnProp.value;
  if (!t.isArrowFunctionExpression(fnNode) && !t.isFunctionExpression(fnNode)) return null;
  const apiCall = findApiCall(fnNode, reverseIndex);
  if (!apiCall || !apiCall.routeName) return null;
  const safe = apiCall.verb === "get" && !apiCall.extraArgs;
  const unsafeReason = safe ? void 0 : apiCall.verb !== "get" ? `api.${apiCall.verb}(...) is not a GET \u2014 not hook-migratable` : "queryFn passes extra request config beyond the path argument \u2014 possible query-string filtering, needs manual review";
  return {
    functionName: fn.id.name,
    routeName: apiCall.routeName,
    httpVerb: apiCall.verb,
    safe,
    unsafeReason,
    start: outer.start ?? fn.start,
    end: outer.end ?? fn.end
  };
}
function findProp(obj, name) {
  for (const p of obj.properties) {
    if (t.isObjectProperty(p) && (t.isIdentifier(p.key) && p.key.name === name || t.isStringLiteral(p.key) && p.key.value === name)) {
      return p;
    }
  }
  return null;
}
function findApiCall(fnNode, reverseIndex) {
  let result = null;
  walk(fnNode.body, (node) => {
    if (result) return;
    if (!t.isCallExpression(node) || !t.isMemberExpression(node.callee)) return;
    const { object, property } = node.callee;
    if (!t.isIdentifier(object) || object.name !== "api" || !t.isIdentifier(property)) return;
    const [routeArg, ...rest] = node.arguments;
    if (!routeArg) return;
    let routeName = null;
    if (t.isCallExpression(routeArg) && t.isIdentifier(routeArg.callee) && routeArg.callee.name === "route") {
      const [routeNameArg] = routeArg.arguments;
      routeName = routeNameArg && t.isStringLiteral(routeNameArg) ? routeNameArg.value : null;
    } else if (t.isStringLiteral(routeArg) || t.isTemplateLiteral(routeArg)) {
      const segments = pathSegmentsFromNode(routeArg);
      routeName = segments ? resolveRouteNameFromSegments(segments, property.name, reverseIndex) : null;
    }
    if (!routeName) return;
    result = { verb: property.name, routeName, extraArgs: rest.length > 0 };
  });
  return result;
}
function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  const n = node;
  if (typeof n.type === "string") visit(n);
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "start" || key === "end" || key === "range") continue;
    if (key === "tokens" || key === "comments" || key === "original") continue;
    walk(node[key], visit);
  }
}
function buildHookIndex(hookFiles, reverseIndex = []) {
  const index = [];
  for (const [path, source] of Object.entries(hookFiles)) {
    const hookModule = basenameNoExt(path);
    for (const w of findQueryWrappers(source, reverseIndex)) {
      index.push({ functionName: w.functionName, routeName: w.routeName, hookModule });
    }
  }
  return index;
}
function basenameNoExt(path) {
  const base = path.split("/").pop() ?? path;
  return base.replace(/\.[^.]+$/, "");
}
function findImportSite(source, functionName, moduleCandidates) {
  const ast = parseSource(source);
  for (const stmt of ast.program.body) {
    if (!t.isImportDeclaration(stmt)) continue;
    if (!moduleCandidates.includes(stmt.source.value)) continue;
    const names = stmt.specifiers.filter((s) => t.isImportSpecifier(s)).map((s) => t.isIdentifier(s.imported) ? s.imported.name : s.imported.value);
    if (!names.includes(functionName)) continue;
    return {
      start: stmt.start,
      end: stmt.end,
      specifiers: names,
      onlyThisName: names.length === 1
    };
  }
  return null;
}
function importSpecifierFor(fromFile, toFile) {
  const fromDir = fromFile.split("/").slice(0, -1).join("/");
  const rel = relativePosixPath(fromDir, toFile).replace(/\.tsx?$/, "");
  return rel.startsWith(".") ? rel : `./${rel}`;
}
function relativePosixPath(fromDir, toFile) {
  const fromParts = fromDir.split("/").filter(Boolean);
  const toParts = toFile.split("/").filter(Boolean);
  let i = 0;
  while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) i++;
  const up = fromParts.length - i;
  const down = toParts.slice(i);
  return [...Array(up).fill(".."), ...down].join("/");
}
function scan(hookFiles, apiFiles, importerSearchFiles, routeDefaults = {}) {
  const reverseIndex = buildReverseRouteIndex(routeDefaults);
  const hookIndex = buildHookIndex(hookFiles, reverseIndex);
  const candidates = [];
  const exceptions = [];
  for (const [apiFile, source] of Object.entries(apiFiles)) {
    for (const wrapper of findQueryWrappers(source, reverseIndex)) {
      const hookMatch = hookIndex.find((h) => h.functionName === wrapper.functionName && h.routeName === wrapper.routeName);
      if (!hookMatch) continue;
      if (!wrapper.safe) {
        exceptions.push({ functionName: wrapper.functionName, routeName: wrapper.routeName, apiFile, reason: wrapper.unsafeReason });
        continue;
      }
      const edits = [{ file: apiFile, old: source.slice(wrapper.start, wrapper.end), new: "" }];
      let blocked = false;
      for (const [consumerFile, consumerSource] of Object.entries(importerSearchFiles)) {
        if (consumerFile === apiFile) continue;
        const spec = importSpecifierFor(consumerFile, apiFile);
        const site = findImportSite(consumerSource, wrapper.functionName, [spec, `${spec}.ts`, `${spec}.tsx`]);
        if (!site) continue;
        if (!site.onlyThisName) {
          exceptions.push({
            functionName: wrapper.functionName,
            routeName: wrapper.routeName,
            apiFile,
            reason: `${consumerFile} imports ${wrapper.functionName} bundled with other names (${site.specifiers.join(", ")}) \u2014 split the import manually first`
          });
          blocked = true;
          continue;
        }
        edits.push({
          file: consumerFile,
          old: consumerSource.slice(site.start, site.end),
          new: `import { ${wrapper.functionName} } from '@/generated/hooks/${hookMatch.hookModule}';`
        });
      }
      if (blocked) continue;
      candidates.push({ functionName: wrapper.functionName, routeName: wrapper.routeName, apiFile, hookModule: hookMatch.hookModule, edits });
    }
  }
  return { candidates, exceptions };
}
export {
  buildHookIndex,
  buildNamespaceLookup,
  buildReverseRouteIndex,
  extractRouteDefaultsFromSource,
  findImportSite,
  findQueryWrappers,
  importSpecifierFor,
  pathSegmentsFromNode,
  renameFile,
  renameNamespaceReferences,
  resolveRouteNameFromSegments,
  scan
};
//# sourceMappingURL=surgeon.js.map