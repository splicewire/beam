import {
  proseRole,
  proseRuns,
  toProse
} from "./chunk-RVN3TANY.js";
import {
  ReleasePanel
} from "./chunk-K76H6RPL.js";
import {
  VOID_TAGS,
  assertReferenceName,
  blockId,
  duplicateAt,
  freshBlockIds,
  getAt,
  indexOf,
  insertInto,
  isJsonBlock,
  isJsonOpaque,
  isJsonText,
  isLeafText,
  joinStyle,
  moveAfter,
  moveBefore,
  parentOf,
  parseStyle,
  propValue,
  removeAt,
  removeProp,
  setProp,
  styleRows,
  updateAt
} from "./chunk-E4PK2WXT.js";
import {
  bindingRuntime,
  richFieldComponents
} from "./chunk-APOUWOY4.js";
import {
  DEFAULT_STYLE_REGISTRY,
  compileBlockStyle,
  compileEntryStyles,
  stylesIn
} from "./chunk-RNDA3EP6.js";
import {
  assertBlockStyle,
  legacyStyle
} from "./chunk-2NOVFPER.js";

// src/canvas/context.tsx
import { createContext as createContext3, useContext as useContext3 } from "react";

// src/canvas/props.ts
var VIEW_GATE_ATTR = "data-view-gate";
var EDIT_GATE_ATTR = "data-edit-gate";
var RESERVED_ATTRS = /* @__PURE__ */ new Set(["className", "style", "md", VIEW_GATE_ATTR, EDIT_GATE_ATTR]);
var editGateOf = (block2) => {
  const v = propValue(block2, EDIT_GATE_ATTR);
  return typeof v === "string" && v !== "" ? v : null;
};
var viewGateOf = (block2) => {
  const v = propValue(block2, VIEW_GATE_ATTR);
  return typeof v === "string" && v !== "" ? v : null;
};
function blockToProps(block2, registry) {
  const out = {};
  for (const p of block2.props) {
    if (p.kind === "expression") continue;
    if (p.name === "className") out.className = String(p.value ?? "");
    else if (p.name === "style" && p.kind === "string") out.style = parseStyle(String(p.value ?? ""));
    else out[p.name] = p.value;
  }
  if (block2.style) out.className = [out.className, compileBlockStyle(block2.style, registry).className].filter(Boolean).join(" ");
  return out;
}
function islandProps(block2, registry) {
  const out = {};
  for (const p of block2.props) {
    if (p.kind === "expression") continue;
    out[p.name] = p.value;
  }
  if (block2.style) out.className = [out.className, compileBlockStyle(block2.style, registry).className].filter(Boolean).join(" ");
  return out;
}
function attrsView(block2) {
  const out = {};
  for (const p of block2.props) {
    if (p.kind === "string" || p.kind === "number" || p.kind === "boolean") {
      out[p.name] = String(p.value ?? "");
    }
  }
  return out;
}
var blockText = (block2) => block2.children.filter(isJsonText).map((c) => c.value).join("");
function applyAttrs(block2, patch) {
  let next = block2;
  const current = attrsView(block2);
  const keys = /* @__PURE__ */ new Set([...Object.keys(current), ...Object.keys(patch)]);
  for (const k of keys) {
    const has = Object.prototype.hasOwnProperty.call(patch, k);
    const v = patch[k];
    if (has && v === void 0) {
      next = removeProp(next, k);
    } else if (has) {
      next = setProp(next, k, v, "string");
    }
  }
  return next;
}
function setAttrs(block2, attrs) {
  const kept = block2.props.filter(
    (p) => p.kind !== "string" && !(p.name in attrs)
  );
  const rebuilt = Object.entries(attrs).map(([name, value]) => ({
    name,
    kind: "string",
    value
  }));
  return { ...block2, props: [...kept, ...rebuilt] };
}

// src/canvas/profile.ts
function assertProfileRegistry(profile, registry) {
  const missing = profile.nodes.filter((node) => /^[A-Z]/.test(node.name) && !Object.hasOwn(registry, node.name)).map((node) => node.name);
  if (missing.length) throw new Error(`Manifest Profile components missing from the JS registry: ${missing.join(", ")}`);
}
function profileTemplates(templates, profile, doc, selected) {
  const target = selected && getAt(doc, selected) ? selected : "0";
  const node = getAt(doc, target);
  const parentPath = node && isJsonBlock(node) && !isLeafText(node) && target === "0" ? target : parentOf(target);
  return profileTemplatesAtParent(templates, profile, doc, parentPath);
}
function profileParentDeclaration(profile, doc, parentPath) {
  const parent = parentPath ? getAt(doc, parentPath) : null;
  const slot = parentPath.match(/^(.*)\.slots\.([A-Za-z_$][A-Za-z0-9_$]*)$/);
  const owner = slot ? getAt(doc, slot[1]) : null;
  return slot && owner && isJsonBlock(owner) ? profile.nodes.find((node) => node.name === owner.name)?.slots?.find((entry) => entry.name === slot[2]) : parent && isJsonBlock(parent) ? profile.nodes.find((n) => n.name === parent.name) : profile.doc;
}
function profileTemplatesAtParent(templates, profile, doc, parentPath) {
  const declaration = profileParentDeclaration(profile, doc, parentPath);
  const categories = declaration?.admitsChildCategories;
  return templates.filter((template) => {
    const block2 = template.make();
    const candidate = profile.nodes.find((n) => n.name === block2.name);
    if ("x-admits-code" in profile && profile["x-admits-code"] === false && block2.props.some((prop) => prop.kind === "expression")) return false;
    return candidate !== void 0 && declaration !== void 0 && (categories === null || candidate.category !== null && categories?.includes(candidate.category) === true);
  });
}
function profileAttrs(block2, profile) {
  const declaration = profile.nodes.find((n) => n.name === block2.name);
  const source = declaration?.attrsSchema ?? { type: "object", properties: {}, additionalProperties: false };
  const properties = { ...source.properties };
  if (source.additionalProperties !== false) {
    for (const prop of block2.props) {
      if (prop.kind !== "expression" && !Object.hasOwn(properties, prop.name)) properties[prop.name] = { type: prop.kind };
    }
  }
  const noCode = "x-admits-code" in profile && profile["x-admits-code"] === false;
  if (noCode) {
    for (const prop of block2.props) if (prop.kind === "expression") delete properties[prop.name];
    for (const key of Object.keys(properties)) if (/^on[A-Z]/.test(key)) delete properties[key];
  }
  const attrs = Object.fromEntries(block2.props.filter((prop) => prop.kind !== "expression" && Object.hasOwn(properties, prop.name)).map((prop) => [prop.name, prop.value]));
  return { schema: {
    ...source,
    properties,
    ...Array.isArray(source.required) ? { required: source.required.filter((key) => typeof key === "string" && Object.hasOwn(properties, key)) } : {},
    ...noCode ? { additionalProperties: false } : {}
  }, attrs };
}
function setProfileAttrs(block2, attrs, profile) {
  const { schema } = profileAttrs(block2, profile);
  const properties = schema.properties;
  let next = block2;
  for (const key of Object.keys(properties)) {
    if (!Object.hasOwn(attrs, key)) {
      next = removeProp(next, key);
      continue;
    }
    const value = attrs[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      next = setProp(next, key, value, typeof value);
    }
  }
  return next;
}

// src/canvas/StyleSelection.tsx
import { createContext, useContext, useState } from "react";
import { jsx } from "react/jsx-runtime";
var Context = createContext({ selection: { breakpoint: null, state: null }, select: () => {
} });
function StyleSelectionProvider({ children }) {
  const [selection, select] = useState({ breakpoint: null, state: null });
  return /* @__PURE__ */ jsx(Context.Provider, { value: { selection, select }, children });
}
var useStyleSelection = () => useContext(Context);

// src/canvas/CanvasSelection.tsx
import { createContext as createContext2, useCallback, useContext as useContext2, useState as useState2 } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var Context2 = createContext2({ paths: [], setPaths: () => {
}, commands: null, register: () => {
} });
function CanvasSelectionProvider({ children }) {
  const [paths, setPaths] = useState2([]);
  const [commands, setCommands] = useState2(null);
  const register = useCallback((next) => setCommands(next), []);
  return /* @__PURE__ */ jsx2(Context2.Provider, { value: { paths, setPaths, commands, register }, children });
}
var useCanvasSelection = () => useContext2(Context2);

// src/canvas/context.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var CanvasContext = createContext3(null);
function CanvasProvider({ config, children }) {
  config = { ...config, registry: { ...config.registry, ...richFieldComponents } };
  if (config.profile) assertProfileRegistry(config.profile, config.registry);
  return /* @__PURE__ */ jsx3(CanvasContext.Provider, { value: config, children: /* @__PURE__ */ jsx3(StyleSelectionProvider, { children: /* @__PURE__ */ jsx3(CanvasSelectionProvider, { children }) }) });
}
function useCanvas() {
  const ctx = useContext3(CanvasContext);
  if (!ctx) throw new Error("useCanvas() must be used within a <CanvasProvider>.");
  return ctx;
}
var isIsland = (config, name) => name !== null && Object.prototype.hasOwnProperty.call(config.registry, name);
var isEditGated = (config, block2) => {
  const key = editGateOf(block2);
  return key !== null && config.can !== void 0 && !config.can[key];
};

// src/canvas/CanvasNode.tsx
import React from "react";

// src/canvas/CanvasSiblings.tsx
import { createElement, lazy, Suspense } from "react";
import { Fragment, jsx as jsx4 } from "react/jsx-runtime";
var ProseRun = lazy(() => import("./ProseRun-RXMI5TLK.js"));
function CanvasSiblings({ nodes, parent, editing, onEditProse, ...props }) {
  const config = useCanvas();
  const path = (index) => parent ? `${parent}.${index}` : String(index);
  const profile = config.profile;
  let run;
  if (profile && editing && onEditProse) {
    run = proseRuns(nodes, profile).find((r) => Array.from({ length: r.end - r.start }, (_, i) => path(r.start + i)).some((p) => editing === p || editing.startsWith(`${p}.`)));
    if (run) {
      const body = nodes.slice(run.start, run.end);
      const gated = (doc) => doc.some((n) => n.kind === "block" && (isEditGated(config, n) || gated(n.children)));
      try {
        if (gated(body)) run = void 0;
        else toProse(body, profile);
      } catch {
        run = void 0;
      }
    }
  }
  return /* @__PURE__ */ jsx4(Fragment, { children: nodes.map((node, index) => {
    if (run && index >= run.start && index < run.end) {
      if (index !== run.start) return null;
      const { start, end } = run;
      const cell = node.kind === "block" && proseRole(node.name, profile) === "cell";
      const tag = cell && node.name ? node.name : "div";
      return createElement(tag, { key: path(index), "data-bd-path": path(index), ...cell ? blockToProps(node, config.styleRegistry) : {} }, /* @__PURE__ */ jsx4(Suspense, { fallback: /* @__PURE__ */ jsx4("span", { role: "status", children: "Loading text editor\u2026" }), children: /* @__PURE__ */ jsx4(ProseRun, { value: nodes.slice(start, end), profile, onChange: (body) => onEditProse(parent, start, end, body) }) }));
    }
    return /* @__PURE__ */ jsx4(CanvasNode, { node, path: path(index), editing, onEditProse, ...props }, path(index));
  }) });
}

// src/canvas/TreeRender.tsx
import { createElement as createElement2 } from "react";
import { Fragment as Fragment2, jsx as jsx5, jsxs } from "react/jsx-runtime";
function renderNode(node, path, config, record) {
  if (isJsonText(node)) return node.field == null ? node.value : bindingRuntime.text(record, node.field, node.value);
  if (isJsonOpaque(node)) {
    return createElement2("pre", { key: path, className: "ve-opaque-src" }, node.source);
  }
  const block2 = node;
  if (block2.repeat) {
    const template = { ...block2, repeat: void 0 };
    return bindingRuntime.repeat(
      config.bindings?.[block2.id ?? ""],
      (item) => renderNode(template, path, { ...config, bindings: item.bindings }, item),
      () => (block2.repeat?.empty ?? []).map((child, index) => renderNode(child, `${path}.empty.${index}`, config, record))
    );
  }
  if (block2.when && !bindingRuntime.when(block2.when, record)) return null;
  const fields = Object.fromEntries(block2.props.filter((prop) => prop.kind === "field").map((prop) => [prop.name, bindingRuntime.attribute(record, String(prop.value), prop.name)]));
  if (block2.name === "Mdx") {
    const file = propValue(block2, "file");
    const md = propValue(block2, "md");
    return /* @__PURE__ */ jsx5(
      config.MdxView,
      {
        file: file !== void 0 ? String(file) : void 0,
        md: md !== void 0 ? String(md) : void 0
      },
      path
    );
  }
  if (isIsland(config, block2.name)) {
    const slots = Object.fromEntries(Object.entries(block2.slots ?? {}).map(([name, children]) => [name, children.map((child, index) => renderNode(child, `${path}.slots.${name}.${index}`, config, record))]));
    return createElement2(config.registry[block2.name], {
      key: path,
      ...islandProps(block2, config.styleRegistry),
      ...fields,
      ...slots
    }, ...block2.children.map((child, index) => renderNode(child, `${path}.${index}`, config, record)));
  }
  const tag = block2.name ?? "div";
  const props = { key: path, ...blockToProps(block2, config.styleRegistry), ...fields };
  if (VOID_TAGS.has(tag)) return createElement2(tag, props);
  return createElement2(
    tag,
    props,
    block2.children.map((c, i) => renderNode(c, `${path}.${i}`, config, record))
  );
}
function TreeRender({ tree }) {
  const config = useCanvas();
  const roots = Array.isArray(tree) ? tree : [tree];
  return /* @__PURE__ */ jsxs(Fragment2, { children: [
    /* @__PURE__ */ jsx5("style", { "data-beam-block-style": "", children: compileEntryStyles(stylesIn(roots), config.styleRegistry).css }),
    roots.map((n, i) => renderNode(n, String(i), config))
  ] });
}

// src/canvas/CanvasNode.tsx
import { Fragment as Fragment3, jsx as jsx6, jsxs as jsxs2 } from "react/jsx-runtime";
function edgeAt(el, clientY) {
  const rect = el.getBoundingClientRect();
  return clientY - rect.top < rect.height / 2 ? "before" : "after";
}
function CanvasNode({ node, path, editing, onEditText, onEditMd, onEditProse, dnd }) {
  const config = useCanvas();
  const { MdxEdit, registry } = config;
  const isEditingThis = editing === path;
  if (isJsonText(node)) return /* @__PURE__ */ jsx6(Fragment3, { children: node.value });
  if (isJsonOpaque(node)) {
    return /* @__PURE__ */ jsx6(
      "div",
      {
        "data-bd-path": path,
        className: "ve-opaque",
        draggable: true,
        onDragStart: (e) => {
          e.stopPropagation();
          dnd.onDragStart(path);
        },
        onDragOver: (e) => {
          e.preventDefault();
          e.stopPropagation();
          dnd.onDragOverNode(path, edgeAt(e.currentTarget, e.clientY));
        },
        onDrop: (e) => {
          e.preventDefault();
          e.stopPropagation();
          dnd.onDrop(e.dataTransfer);
        },
        onDragEnd: dnd.onDragEnd,
        title: `Sealed ${node.reason} island`,
        children: /* @__PURE__ */ jsx6("pre", { className: "ve-opaque-src", style: { pointerEvents: "none" }, children: node.source })
      }
    );
  }
  const block2 = node;
  if (block2.name === "Mdx") {
    const file = propValue(block2, "file");
    const md = propValue(block2, "md");
    return /* @__PURE__ */ jsxs2("div", { "data-bd-path": path, className: "ve-mdx-block", children: [
      /* @__PURE__ */ jsxs2(
        "div",
        {
          className: "ve-mdx-handle",
          draggable: true,
          onDragStart: (e) => {
            e.stopPropagation();
            dnd.onDragStart(path);
          },
          onDragOver: (e) => {
            e.preventDefault();
            e.stopPropagation();
            dnd.onDragOverNode(path, edgeAt(e.currentTarget, e.clientY));
          },
          onDrop: (e) => {
            e.preventDefault();
            e.stopPropagation();
            dnd.onDrop(e.dataTransfer);
          },
          onDragEnd: dnd.onDragEnd,
          title: "Select this content block",
          children: [
            "\u25C6 content",
            file ? ` \xB7 ${String(file)}` : ""
          ]
        }
      ),
      /* @__PURE__ */ jsx6("div", { "data-mdx-edit": true, children: /* @__PURE__ */ jsx6(
        MdxEdit,
        {
          file: file !== void 0 ? String(file) : void 0,
          md: md !== void 0 ? String(md) : void 0,
          onChange: (next) => onEditMd?.(path, next)
        }
      ) })
    ] });
  }
  if (isEditGated(config, block2) || block2.repeat) {
    return /* @__PURE__ */ jsx6(
      "div",
      {
        "data-bd-path": path,
        className: block2.repeat ? "ve-island ve-repeat" : "ve-island ve-gated",
        draggable: true,
        onDragStart: (e) => {
          e.stopPropagation();
          dnd.onDragStart(path);
        },
        onDragOver: (e) => {
          e.preventDefault();
          e.stopPropagation();
          dnd.onDragOverNode(path, edgeAt(e.currentTarget, e.clientY));
        },
        onDrop: (e) => {
          e.preventDefault();
          e.stopPropagation();
          dnd.onDrop(e.dataTransfer);
        },
        onDragEnd: dnd.onDragEnd,
        title: isEditGated(config, block2) ? `Sealed \u2014 editing requires "${editGateOf(block2)}"` : "Repeat \u2014 Records from your current read",
        children: /* @__PURE__ */ jsx6("div", { style: { pointerEvents: "none" }, children: renderNode(block2, path, config) })
      }
    );
  }
  const props = {
    "data-bd-path": path,
    // Set whenever the LENS parsed this as a PascalCase component tag (`block.isComponent`) —
    // regardless of whether it's currently registered as a sealed island (below) or falls through
    // to render/drill in as a plain tag. Before this, an unregistered (or drill-in-able) component
    // was visually IDENTICAL to a bare `<div>` — the only nodes with any distinct treatment were
    // ones already `isIsland` (registered), via `.ve-island`. A plain data attribute (not a class)
    // so CSS can target it with `[data-bd-component]` without a JS-side class-name concat.
    ...block2.isComponent ? { "data-bd-component": "true" } : {},
    // A node mid text-edit isn't draggable — HTML5 drag and contentEditable's own click-drag text
    // selection fight over the same mousedown-then-move gesture, so a drag start here would hijack
    // what the user meant as "select this word" and the caret would never land.
    draggable: !isEditingThis,
    onDragStart: (e) => {
      if (e.target.closest("[data-mdx-edit]")) {
        e.preventDefault();
        return;
      }
      e.stopPropagation();
      dnd.onDragStart(path);
    },
    onDragOver: (e) => {
      e.preventDefault();
      e.stopPropagation();
      dnd.onDragOverNode(path, edgeAt(e.currentTarget, e.clientY));
    },
    onDrop: (e) => {
      e.preventDefault();
      e.stopPropagation();
      dnd.onDrop(e.dataTransfer);
    },
    onDragEnd: dnd.onDragEnd,
    ...blockToProps(block2, config.styleRegistry)
  };
  if (isIsland(config, block2.name)) {
    const Comp = registry[block2.name];
    const subtree = (nodes, parent) => /* @__PURE__ */ jsx6(
      "div",
      {
        style: { pointerEvents: "auto", minHeight: nodes.length ? void 0 : 24 },
        "data-bd-slot": parent,
        onDragOver: (event) => {
          event.preventDefault();
          event.stopPropagation();
          dnd.onDragOverNode(`${parent}.${nodes.length}`, "before");
        },
        onDrop: (event) => {
          event.preventDefault();
          event.stopPropagation();
          dnd.onDrop(event.dataTransfer);
        },
        children: /* @__PURE__ */ jsx6(CanvasSiblings, { nodes, parent, editing, onEditText, onEditMd, onEditProse, dnd })
      }
    );
    const declaration = config.profile?.nodes.find((entry) => entry.name === block2.name);
    const names = /* @__PURE__ */ new Set([...(declaration?.slots ?? []).map((slot) => slot.name), ...Object.keys(block2.slots ?? {})]);
    const slots = Object.fromEntries([...names].map((name) => [name, subtree(block2.slots?.[name] ?? [], `${path}.slots.${name}`)]));
    return /* @__PURE__ */ jsx6("div", { ...props, className: "ve-island", children: /* @__PURE__ */ jsx6("div", { style: { pointerEvents: "none" }, children: /* @__PURE__ */ jsx6(Comp, { ...islandProps(block2, config.styleRegistry), ...slots, children: block2.children.length || declaration?.admitsChildCategories === null || (declaration?.admitsChildCategories?.length ?? 0) > 0 ? subtree(block2.children, path) : void 0 }) }) });
  }
  const tag = block2.name ?? "div";
  if (VOID_TAGS.has(tag)) {
    return React.createElement(tag, props);
  }
  return React.createElement(
    tag,
    props,
    /* @__PURE__ */ jsx6(
      CanvasSiblings,
      {
        nodes: block2.children,
        parent: path,
        editing,
        onEditText,
        onEditMd,
        onEditProse,
        dnd
      }
    )
  );
}

// src/canvas/Breadcrumb.tsx
import { jsx as jsx7, jsxs as jsxs3 } from "react/jsx-runtime";
function labelFor(doc, path) {
  const node = getAt(doc, path);
  if (!node) return "?";
  if (isJsonBlock(node)) return node.name ?? "fragment";
  return node.kind;
}
function Breadcrumb({ doc, path, onSelect }) {
  const segments = path.split(".").map((_, i, arr) => arr.slice(0, i + 1).join("."));
  return /* @__PURE__ */ jsx7("nav", { className: "ve-crumbs", "aria-label": "Selection path", children: segments.map((p, i) => /* @__PURE__ */ jsxs3("span", { className: "ve-crumb-seg", children: [
    i > 0 && /* @__PURE__ */ jsx7("span", { className: "ve-crumb-sep", children: "/" }),
    /* @__PURE__ */ jsx7(
      "button",
      {
        className: "ve-crumb",
        disabled: p === path,
        onClick: () => onSelect(p),
        title: p === path ? void 0 : `Select ${labelFor(doc, p)}`,
        children: labelFor(doc, p)
      }
    )
  ] }, p)) });
}

// src/canvas/ContextMenu.tsx
import { useEffect, useRef, useState as useState3 } from "react";
import { jsx as jsx8, jsxs as jsxs4 } from "react/jsx-runtime";
function ContextMenu({ state, actions, onClose }) {
  const [openSubmenu, setOpenSubmenu] = useState3(null);
  const rootRef = useRef(null);
  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) onClose();
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("click", onDocClick, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", onDocClick, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);
  return /* @__PURE__ */ jsx8(
    "div",
    {
      ref: rootRef,
      className: "ve-menu",
      style: { position: "fixed", left: state.x, top: state.y },
      children: actions.map((a) => /* @__PURE__ */ jsxs4(
        "div",
        {
          style: { position: "relative" },
          onMouseEnter: () => a.children && setOpenSubmenu(a.label),
          onMouseLeave: () => a.children && setOpenSubmenu((cur) => cur === a.label ? null : cur),
          children: [
            /* @__PURE__ */ jsxs4(
              "button",
              {
                className: `ve-menu-item${a.danger ? " danger" : ""}`,
                disabled: a.disabled,
                onClick: () => {
                  if (a.children) return;
                  a.onSelect?.();
                  onClose();
                },
                children: [
                  a.label,
                  a.children ? " \u25B8" : ""
                ]
              }
            ),
            a.children && openSubmenu === a.label && /* @__PURE__ */ jsx8("div", { className: "ve-menu", style: { position: "absolute", left: "100%", top: 0 }, children: a.children.map((c) => /* @__PURE__ */ jsx8(
              "button",
              {
                className: `ve-menu-item${c.danger ? " danger" : ""}`,
                disabled: c.disabled,
                onClick: () => {
                  c.onSelect?.();
                  onClose();
                },
                children: c.label
              },
              c.label
            )) })
          ]
        },
        a.label
      ))
    }
  );
}

// src/canvas/VisualEditor.tsx
import { useMemo as useMemo2, useRef as useRef3 } from "react";
import { FiveRegionEditShell, useEditShellMount as useEditShellMount3 } from "@schemastud/frame";

// src/canvas/CanvasPalette.tsx
import { useEditShellMount } from "@schemastud/frame";

// src/canvas/block-style.ts
function blockStyleFields(block2, input, registry = DEFAULT_STYLE_REGISTRY) {
  const properties = {
    ...input.schema.properties
  };
  const attrs = { ...input.attrs };
  delete properties.style;
  delete attrs.style;
  const legacy = block2.props.find(
    (p) => p.name === "style" && p.kind === "string"
  );
  properties.bdStyle = {
    type: "object",
    title: "Block style",
    "x-tab": "Style",
    additionalProperties: false,
    required: ["layers"],
    properties: {
      layers: {
        type: "array",
        title: "Layers",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["declarations"],
          properties: {
            breakpoint: {
              type: ["string", "null"],
              title: "Breakpoint",
              enum: [null, ...Object.keys(registry.breakpoints)]
            },
            state: {
              type: ["string", "null"],
              title: "State",
              enum: [null, ...Object.keys(registry.states)]
            },
            declarations: {
              type: "object",
              title: "Properties",
              additionalProperties: { type: "string" }
            }
          }
        }
      }
    }
  };
  const bdStyle = block2.style ?? (legacy ? legacyStyle(String(legacy.value ?? "")) : { layers: [] });
  return { schema: { ...input.schema, properties }, attrs: { ...attrs, bdStyle } };
}
function applyBlockStyle(block2, value) {
  assertBlockStyle(value);
  return {
    ...block2,
    style: value,
    props: block2.props.filter(
      (p) => !(p.name === "style" && p.kind === "string")
    )
  };
}

// src/canvas/CanvasOutline.tsx
import { useState as useState4 } from "react";

// src/canvas/inspector-style.ts
var matches = (layer, selected) => (layer.breakpoint ?? null) === selected.breakpoint && (layer.state ?? null) === selected.state;
var width = (value) => parseFloat(value) * (value.endsWith("px") ? 1 : 16);
function effectiveDeclaration(style, property, selected, registry) {
  let found;
  const max = selected.breakpoint ? width(registry.breakpoints[selected.breakpoint]) : 0;
  for (const layer of style.layers) {
    if (layer.breakpoint && width(registry.breakpoints[layer.breakpoint]) > max) continue;
    if (layer.state && layer.state !== selected.state) continue;
    if (Object.hasOwn(layer.declarations, property)) found = { value: layer.declarations[property], layer: [layer.breakpoint ?? "Base", layer.state].filter(Boolean).join(" / ") };
  }
  return found;
}
function editDeclaration(style, selected, property, value) {
  const layers = style.layers.map((layer) => {
    const declarations = { ...layer.declarations };
    if (matches({ breakpoint: layer.breakpoint ?? null, state: layer.state ?? null }, selected)) delete declarations[property];
    return { ...layer, declarations };
  }).filter((layer) => Object.keys(layer.declarations).length);
  if (value !== null && value !== "") {
    const found = [...layers].reverse().find((layer) => matches({ breakpoint: layer.breakpoint ?? null, state: layer.state ?? null }, selected));
    if (found) found.declarations[property] = value;
    else layers.push({ ...selected, declarations: { [property]: value } });
  }
  return { layers };
}
function validatedEdit(style, selected, property, value, registry) {
  const next = editDeclaration(style, selected, property, value);
  compileBlockStyle(next, registry);
  return next;
}
function rgb(value) {
  const hex = /^#([a-f\d]{3}|[a-f\d]{6})$/i.exec(value.trim());
  if (hex) {
    const full = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  }
  const match = /^rgb\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)\s*\)$/i.exec(value.trim());
  return match && match.slice(1).every((v) => +v <= 255) ? match.slice(1).map(Number) : null;
}
var luminance = (channels) => channels.map((x) => {
  const c = x / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}).reduce((v, c, i) => v + c * [0.2126, 0.7152, 0.0722][i], 0);
function contrastRatio(foreground, background) {
  const a = rgb(foreground), b = rgb(background);
  if (!a || !b) return null;
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function readableShade(foreground, background) {
  const start = rgb(foreground);
  if (!start || !rgb(background)) return null;
  if ((contrastRatio(foreground, background) ?? 0) >= 4.5) return foreground;
  const target = (contrastRatio("#000000", background) ?? 0) > (contrastRatio("#ffffff", background) ?? 0) ? 0 : 255;
  for (let step = 1; step <= 100; step++) {
    const shade = "#" + start.map((c) => Math.round(c + (target - c) * step / 100).toString(16).padStart(2, "0")).join("");
    if ((contrastRatio(shade, background) ?? 0) >= 4.5) return shade;
  }
  return null;
}

// src/canvas/CanvasOutline.tsx
import { jsx as jsx9, jsxs as jsxs5 } from "react/jsx-runtime";
function CanvasOutline({ doc, onSelect, onHide }) {
  const [collapsed, setCollapsed] = useState4(/* @__PURE__ */ new Set());
  const selection = useCanvasSelection();
  const { selection: layer } = useStyleSelection();
  const config = useCanvas();
  const registry = config.styleRegistry ?? DEFAULT_STYLE_REGISTRY;
  const toggle = (path) => setCollapsed((previous) => {
    const next = new Set(previous);
    next.has(path) ? next.delete(path) : next.add(path);
    return next;
  });
  const rows = [];
  const walk = (nodes, parent, depth) => nodes.forEach((node, i) => {
    if (!isJsonBlock(node)) return;
    const path = parent ? `${parent}.${i}` : String(i);
    const style = blockStyleFields(node, { schema: {}, attrs: {} }).attrs.bdStyle;
    const selectedLayer = { breakpoint: layer.breakpoint, state: null };
    const own = style.layers.some((l) => (l.breakpoint ?? null) === layer.breakpoint && !l.state && l.declarations.display === "none");
    const sealed = node.dynamic || isEditGated(config, node);
    rows.push({ path, depth, name: node.name ?? "Fragment", hasChildren: !sealed && [...node.children, ...Object.values(node.slots ?? {}).flat()].some(isJsonBlock), own, hidden: effectiveDeclaration(style, "display", selectedLayer, registry)?.value === "none" });
    if (!sealed && !collapsed.has(path)) {
      walk(node.children, path, depth + 1);
      for (const [name, children] of Object.entries(node.slots ?? {})) walk(children, `${path}.slots.${name}`, depth + 1);
    }
  });
  walk(doc, "", 1);
  const focus = (index, root) => root.querySelectorAll("[data-outline-select]")[index]?.focus();
  return /* @__PURE__ */ jsxs5("section", { className: "ve-outline", "aria-label": "Block outline", children: [
    /* @__PURE__ */ jsx9("h3", { children: "Outline" }),
    /* @__PURE__ */ jsxs5("p", { children: [
      "Hide changes visitor styles after publish (",
      layer.breakpoint ? `${layer.breakpoint}+` : "all widths",
      ")."
    ] }),
    /* @__PURE__ */ jsx9("div", { role: "tree", "aria-label": "Page blocks", "aria-multiselectable": "true", children: rows.map((row, index) => /* @__PURE__ */ jsxs5(
      "div",
      {
        className: "ve-outline-row",
        role: "treeitem",
        "aria-level": row.depth,
        "aria-selected": selection.paths.includes(row.path),
        "aria-expanded": row.hasChildren ? !collapsed.has(row.path) : void 0,
        style: { paddingInlineStart: (row.depth - 1) * 12 },
        onKeyDown: (event) => {
          const root = event.currentTarget.parentElement;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            focus(Math.min(rows.length - 1, index + 1), root);
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            focus(Math.max(0, index - 1), root);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (row.hasChildren && !collapsed.has(row.path)) toggle(row.path);
            else {
              const parent = row.path.slice(0, row.path.lastIndexOf("."));
              const at = rows.findIndex((r) => r.path === parent);
              if (at >= 0) focus(at, root);
            }
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            if (row.hasChildren && collapsed.has(row.path)) toggle(row.path);
            else if (row.hasChildren) focus(index + 1, root);
          }
          if (event.key === "Home") {
            event.preventDefault();
            focus(0, root);
          }
          if (event.key === "End") {
            event.preventDefault();
            focus(rows.length - 1, root);
          }
        },
        children: [
          row.hasChildren && /* @__PURE__ */ jsx9("button", { type: "button", "aria-label": `${collapsed.has(row.path) ? "Expand" : "Collapse"} ${row.name} ${row.path}`, onClick: () => toggle(row.path), children: collapsed.has(row.path) ? "\u25B8" : "\u25BE" }),
          /* @__PURE__ */ jsxs5("button", { type: "button", "data-outline-select": "", onClick: (event) => onSelect(row.path, event.ctrlKey || event.metaKey || event.shiftKey), children: [
            row.name,
            " ",
            row.path
          ] }),
          /* @__PURE__ */ jsxs5("button", { type: "button", disabled: selection.commands?.readOnly, onClick: () => onHide(row.path, !row.own), children: [
            row.own ? "Show" : "Hide",
            " ",
            row.name,
            " ",
            row.path
          ] }),
          row.hidden && /* @__PURE__ */ jsxs5("small", { children: [
            "Hidden for visitors at ",
            layer.breakpoint ? `${layer.breakpoint}+` : "all widths",
            " after publish",
            !row.own ? " (inherited; edit the earlier layer)" : ""
          ] })
        ]
      },
      row.path
    )) })
  ] });
}

// src/canvas/commands.ts
import validator from "@rjsf/validator-ajv8";
var compare = (a, b) => {
  const x = a.split("."), y = b.split(".");
  for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return /^\d+$/.test(x[i]) && /^\d+$/.test(y[i]) ? Number(x[i]) - Number(y[i]) : x[i].localeCompare(y[i]);
  return x.length - y.length;
};
function selectionRoots(paths) {
  const sorted = [...new Set(paths)].sort(compare);
  return sorted.filter((path) => !sorted.some((other) => path.startsWith(other + ".")));
}
function clipboardText(doc, paths) {
  const nodes = selectionRoots(paths).map((path) => getAt(doc, path));
  if (!nodes.length || nodes.some((node) => !node || !isJsonBlock(node))) throw Error("Select blocks to copy");
  return JSON.stringify({ format: "beam-blocks", version: 1, nodes });
}
function parseClipboard(text) {
  if (text.length > 1e6) throw Error("Block clipboard is too large");
  const input = JSON.parse(text);
  let count = 0;
  const visit = (node, depth) => {
    if (++count > 5e3 || depth > 100 || !node || typeof node !== "object") throw Error("Invalid block clipboard");
    if (node.kind === "text") {
      if (typeof node.value !== "string") throw Error("Invalid text");
      if (node.prop !== void 0) assertReferenceName(node.prop);
      return;
    }
    if (node.kind === "opaque") {
      if (typeof node.source !== "string" || !["map", "conditional", "ternary", "expression", "spread"].includes(node.reason)) throw Error("Invalid opaque node");
      return;
    }
    if (node.kind !== "block" || typeof node.name !== "string" && node.name !== null || typeof node.dynamic !== "boolean" || typeof node.isComponent !== "boolean" || !Array.isArray(node.props) || !Array.isArray(node.children)) throw Error("Invalid block");
    for (const prop of node.props) if (!prop || typeof prop.name !== "string" || !["string", "number", "boolean", "boolean-shorthand", "expression", "field", "prop"].includes(prop.kind) || !["string", "number", "boolean"].includes(typeof prop.value) && prop.value !== null) throw Error("Invalid prop");
    for (const prop of node.props) if (prop.kind === "prop") assertReferenceName(prop.value);
    if (node.style) assertBlockStyle(node.style);
    node.children.forEach((child) => visit(child, depth + 1));
    if (node.slots !== void 0 && (!node.slots || typeof node.slots !== "object" || Array.isArray(node.slots))) throw Error("Invalid slots");
    Object.entries(node.slots ?? {}).forEach(([name, nodes]) => {
      assertReferenceName(name);
      if (!Array.isArray(nodes)) throw Error("Invalid slot");
      nodes.forEach((child) => visit(child, depth + 1));
    });
    node.repeat?.empty?.forEach((child) => visit(child, depth + 1));
  };
  if (input?.format !== "beam-blocks" || input.version !== 1 || !Array.isArray(input.nodes) || !input.nodes.length) throw Error("Not a Beam block clipboard");
  input.nodes.forEach((node) => {
    visit(node, 0);
    if (!isJsonBlock(node)) throw Error("Select blocks");
  });
  return input.nodes;
}
function assertPasteProfile(nodes, profile, parent, registry = DEFAULT_STYLE_REGISTRY, containerDeclaration) {
  const noCode = profile && "x-admits-code" in profile && profile["x-admits-code"] === false;
  const visit = (node, container) => {
    if (node.kind === "text") {
      if (noCode && node.prop !== void 0) throw Error("A page has no enclosing component reference declaration");
      return;
    }
    if (node.kind === "opaque") {
      if (noCode) throw Error("Target profile does not admit code");
      return;
    }
    if (noCode && node.props.some((p) => p.kind === "prop")) throw Error("A page has no enclosing component reference declaration");
    if (node.style) compileBlockStyle(node.style, registry);
    if (!profile) {
      [...node.children, ...Object.values(node.slots ?? {}).flat()].forEach((child) => visit(child, void 0));
      return;
    }
    const declaration2 = profile.nodes.find((n) => n.name === node.name);
    if (!declaration2 || !container) throw Error(`Target profile does not admit ${node.name}`);
    if (container.admitsChildCategories !== null && (!declaration2.category || !container.admitsChildCategories?.includes(declaration2.category))) throw Error(`Target parent does not admit ${node.name}`);
    if (noCode && (node.dynamic || node.props.some((p) => p.kind === "expression" || /^on[A-Z]/.test(p.name)))) throw Error("Target profile does not admit code");
    if (!node.props.some((p) => p.kind === "expression")) {
      const attrs = Object.fromEntries(node.props.map((p) => [p.name, p.value]));
      const result = validator.validateFormData(attrs, declaration2.attrsSchema ?? { type: "object", properties: {}, additionalProperties: false });
      if (result.errors.length) throw Error(`Invalid attributes for ${node.name}: ${result.errors[0].message}`);
    }
    node.children.forEach((child) => visit(child, declaration2));
    for (const [name, children] of Object.entries(node.slots ?? {})) {
      const slot = declaration2.slots?.find((slot2) => slot2.name === name);
      if (!slot) throw Error("Undeclared slot " + name);
      children.forEach((child) => visit(child, slot));
    }
    node.repeat?.empty?.forEach((child) => visit(child, container));
  };
  const declaration = containerDeclaration === void 0 ? parent ? profile?.nodes.find((n) => n.name === parent.name) : profile?.doc : containerDeclaration ?? void 0;
  nodes.forEach((node) => visit(node, declaration));
}
function pasteBlocks(doc, parentPath, nodes, profile, registry) {
  const parent = parentPath ? getAt(doc, parentPath) : null;
  if (parentPath && (!parent || !isJsonBlock(parent))) throw Error("Paste destination no longer exists");
  if (parent && isJsonBlock(parent) && (parent.dynamic || VOID_TAGS.has(parent.name ?? ""))) throw Error("Paste into an editable container");
  assertPasteProfile(nodes, profile, parent, registry, profile ? profileParentDeclaration(profile, doc, parentPath) ?? null : void 0);
  let next = doc;
  let at = parent && isJsonBlock(parent) ? parent.children.length : doc.length;
  for (const node of nodes) next = insertInto(next, parentPath, at++, freshBlockIds(node));
  return next;
}
function removeBlocks(doc, paths) {
  return selectionRoots(paths).sort(compare).reverse().reduce((next, path) => removeAt(next, path), doc);
}
function wrapBlocks(doc, paths, layout, profile) {
  const roots = selectionRoots(paths);
  const parent = parentOf(roots[0] ?? "");
  if (!roots.length || roots.some((path, i) => parentOf(path) !== parent || indexOf(path) !== indexOf(roots[0]) + i)) throw Error("Wrap requires contiguous sibling blocks");
  const children = roots.map((path) => getAt(doc, path));
  if (children.some((node) => !node || !isJsonBlock(node))) throw Error("Select blocks to wrap");
  const wrapper = { kind: "block", id: blockId(), name: "div", isComponent: false, dynamic: false, props: [], children, style: { layers: [{ declarations: { display: layout } }] } };
  const container = parent ? getAt(doc, parent) : null;
  assertPasteProfile([wrapper], profile, container, void 0, profile ? profileParentDeclaration(profile, doc, parent) ?? null : void 0);
  return insertInto(removeBlocks(doc, roots), parent, indexOf(roots[0]), wrapper);
}
function unwrapBlock(doc, path, profile) {
  const node = getAt(doc, path);
  if (!node || !isJsonBlock(node) || node.isComponent || node.dynamic) throw Error("Select a container to unwrap");
  const parent = parentOf(path), container = parent ? getAt(doc, parent) : null;
  assertPasteProfile(node.children, profile, container, void 0, profile ? profileParentDeclaration(profile, doc, parent) ?? null : void 0);
  let next = removeAt(doc, path);
  let at = indexOf(path);
  for (const child of node.children) next = insertInto(next, parent, at++, child);
  return next;
}
function editStyles(doc, paths, selection, property, value, registry) {
  let next = doc;
  for (const path of [...new Set(paths)]) {
    const node = getAt(doc, path);
    if (!node || !isJsonBlock(node)) throw Error("Selection no longer exists");
    if (node.isComponent || /^[A-Z]/.test(node.name ?? "")) throw Error("Component does not declare root-style forwarding");
    const style = blockStyleFields(node, { schema: {}, attrs: {} }).attrs.bdStyle;
    const changed = applyBlockStyle(node, validatedEdit(style, selection, property, value, registry));
    next = updateAt(next, path, () => changed);
  }
  return next;
}

// src/canvas/CanvasWidget.tsx
import { useEffect as useEffect2, useMemo, useRef as useRef2, useState as useState5 } from "react";

// src/canvas/attrsSchema.ts
function gateEnum(entitlementKeys, current) {
  const set = new Set(entitlementKeys);
  if (current) set.add(current);
  return ["", ...Array.from(set)];
}
function attrsSchemaFor(block2, entitlementKeys = []) {
  const view = attrsView(block2);
  const otherKeys = Object.keys(view).filter((k) => !RESERVED_ATTRS.has(k));
  const properties = {
    className: {
      type: "string",
      title: "Classes",
      "x-widget": "class-chips",
      "x-group": "Classes",
      "x-tab": "Style",
      // The "Classes" x-group fieldset legend already labels this — a single-property
      // group repeating its own title as the field label too was pure duplication.
      "x-widget-options": { label: false }
    },
    style: {
      type: "string",
      title: "Style \xB7 CSS + vars",
      "x-widget": "style-rows",
      "x-group": "Style",
      "x-tab": "Style",
      "x-widget-options": { label: false }
    },
    [VIEW_GATE_ATTR]: {
      type: "string",
      title: "View gate",
      "x-widget": "select",
      "x-group": "Access",
      "x-tab": "Advanced",
      enum: gateEnum(entitlementKeys, view[VIEW_GATE_ATTR])
    },
    [EDIT_GATE_ATTR]: {
      type: "string",
      title: "Edit gate",
      "x-widget": "select",
      "x-group": "Access",
      "x-tab": "Advanced",
      enum: gateEnum(entitlementKeys, view[EDIT_GATE_ATTR])
    }
  };
  for (const k of otherKeys) {
    properties[k] = { type: "string", title: k, "x-group": "Attributes", "x-tab": "Advanced" };
  }
  const attrs = {
    className: view.className ?? "",
    style: view.style ?? "",
    [VIEW_GATE_ATTR]: view[VIEW_GATE_ATTR] ?? "",
    [EDIT_GATE_ATTR]: view[EDIT_GATE_ATTR] ?? ""
  };
  for (const k of otherKeys) attrs[k] = view[k];
  return {
    schema: {
      type: "object",
      properties,
      additionalProperties: { type: "string", "x-group": "Attributes", "x-tab": "Advanced" }
    },
    attrs
  };
}

// src/canvas/css.ts
var DEFAULT_CANVAS_THEME = {
  accent: "#14803f",
  // --beam-green
  accentHover: "#0f5f2e",
  // --beam-green-deep
  editAccent: "#35d07a",
  // --beam-signal (inline-edit outline)
  canvas: "#ffffff",
  // --beam-paper-raised
  ink: "#2e2c26",
  // --beam-ink
  panelBg: "#11201a",
  // --beam-rail
  rootBg: "#0d1a14",
  // --beam-rail-deep
  panelFg: "#eaf6ee",
  // --beam-rail-active
  muted: "#83998c",
  // --beam-rail-fg (60% over the rail), as an opaque colour
  fontBody: "system-ui, sans-serif",
  fontMono: "ui-monospace, monospace"
};
var theme = (t) => ({ ...DEFAULT_CANVAS_THEME, ...t });
var selectionCss = (path, accent, isComponent = false) => `[data-bd-path="${path}"]{outline:${isComponent ? `2px dotted ${accent}` : "none"} !important;outline-offset:5px;box-shadow:0 0 0 1px #fff,0 0 0 3px ${accent} !important}`;
var dropIndicatorCss = (path, edge, accent) => `[data-bd-path="${path}"]{box-shadow:inset 0 ${edge === "before" ? "2px" : "-2px"} 0 0 ${accent},inset 0 ${edge === "before" ? "4px" : "-4px"} 0 0 #fff !important;outline:none !important}`;
function veCss(t) {
  const c = theme(t);
  return `
.ve-root{position:fixed;inset:0;z-index:2147483100;display:flex;flex-direction:column;background:${c.rootBg};font-family:${c.fontBody}}
.ve-bar{display:flex;align-items:center;gap:16px;height:40px;flex:none;padding:0 16px;background:${c.panelBg};color:${c.panelFg};border-bottom:1px solid rgba(255,255,255,.08);font-family:${c.fontBody};font-size:11px;letter-spacing:.06em}
.ve-brand{display:flex;align-items:center;gap:8px;color:#fff}
.ve-mark{width:15px;height:15px;border-radius:23%;background:${c.accent}}
.ve-hint{color:${c.muted}}
.ve-spacer{flex:1}
.ve-toggle{background:none;border:1px solid rgba(255,255,255,.14);border-radius:8px;color:${c.panelFg};cursor:pointer;font:inherit;font-size:11px;padding:5px 11px}
.ve-toggle:disabled{opacity:.35;cursor:not-allowed}
.ve-toggle.on{color:#fff;background:${c.accent}28;border-color:${c.accent}66}
.ve-toggle.ve-save{color:#fff;background:${c.accent};border-color:${c.accent}}
.ve-toggle.ve-save:hover{background:${c.accentHover}}
.ve-body{flex:1;min-height:0;display:flex}
.ve-palette{width:190px;flex:none;background:${c.panelBg};color:${c.panelFg};border-right:1px solid rgba(255,255,255,.08);padding:14px 12px;display:flex;flex-direction:column;gap:7px;overflow:auto}
.ve-pal-item{text-align:left;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:${c.panelFg};cursor:pointer;font:inherit;font-size:12px;padding:8px 11px}
.ve-pal-item:hover{color:#fff;background:${c.accent}24;border-color:${c.accent}66}
.ve-pal-note{margin-top:6px;color:${c.muted};font-size:10px;line-height:1.4}
.ve-canvas-layout{display:grid;grid-template-columns:minmax(140px,220px) minmax(0,1fr);gap:12px}
@container beam-canvas (max-width:480px){.ve-canvas-layout{grid-template-columns:minmax(0,1fr)}}
.ve-command-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px;background:${c.panelBg};color:${c.panelFg};font-family:${c.fontBody};font-size:12px;border-radius:8px;margin-bottom:12px}
.ve-command-button{display:inline-flex;align-items:center;padding:6px 10px;border:1px solid ${c.muted};border-radius:6px;background:transparent;color:inherit;font:inherit;line-height:1.4;cursor:pointer}
.ve-command-button:hover:not(:disabled){border-color:${c.accent}}
.ve-command-button:focus-visible{outline:2px solid ${c.accent};outline-offset:2px}
.ve-command-button:disabled{opacity:.45;cursor:not-allowed}
.ve-canvas-widget{min-width:0}
.ve-outline{font-family:${c.fontBody};font-size:12px;color:${c.ink}}
.ve-outline h3{font-weight:600;margin:0 0 8px}
.ve-outline p{margin:0 0 12px}
.ve-outline-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0}
.ve-outline-row button{padding:4px 7px;border:1px solid currentColor;border-radius:5px;background:transparent;color:inherit;font:inherit;cursor:pointer}
.ve-outline-row button:disabled{opacity:.45;cursor:not-allowed}
.ve-outline-row[aria-selected="true"]{outline:2px solid ${c.accent};outline-offset:2px;border-radius:5px}
.ve-canvas{flex:1;overflow:auto;background:${c.canvas};color:${c.ink}}
.ve-canvas [data-bd-path]:hover{outline:1.5px dashed ${c.accent}80;outline-offset:1px}
.ve-canvas [data-bd-component]:hover{outline:1.5px dotted ${c.accent};outline-offset:1px}
.ve-canvas [contenteditable="true"]{outline:2px solid ${c.editAccent} !important;cursor:text}
.ve-canvas .ve-island{position:relative}
.ve-canvas .ve-opaque{position:relative}
.ve-opaque-src{margin:0;padding:10px 12px;background:rgba(0,0,0,.05);border:1px dashed rgba(0,0,0,.18);border-radius:8px;font-family:${c.fontMono};font-size:11px;white-space:pre-wrap;color:color-mix(in srgb, ${c.ink} 70%, ${c.canvas});overflow:auto}
.ve-mdx-block{position:relative}
.ve-mdx-handle{display:inline-flex;align-items:center;gap:6px;cursor:pointer;font:10px ${c.fontMono};letter-spacing:.1em;text-transform:uppercase;color:color-mix(in srgb, ${c.ink} 70%, ${c.canvas});background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.14);border-radius:6px;padding:3px 9px;margin-bottom:8px;user-select:none}
.ve-mdx-handle:hover{color:${c.accentHover};border-color:${c.accent}80}
.beam-content-ref{border:1px solid rgba(0,0,0,.14);border-radius:10px;overflow:hidden;margin:12px 0;background:#fff}
.beam-content-ref-bar{display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(0,0,0,.04);border-bottom:1px solid rgba(0,0,0,.1)}
.beam-content-ref-tag{font:10px ${c.fontMono};letter-spacing:.1em;text-transform:uppercase;color:color-mix(in srgb, ${c.ink} 70%, ${c.canvas})}
.beam-content-ref-pick{margin-left:auto;font:11px ${c.fontMono};color:${c.ink};background:${c.canvas};border:1px solid rgba(0,0,0,.16);border-radius:6px;padding:3px 6px;max-width:220px}
.beam-content-ref-body{padding:12px 14px;color:${c.ink}}
/* mdxeditor popups (link dialog, selects) must sit ABOVE the fixed editor panels. */
.mdxeditor-popup-container{z-index:2147483600 !important}
.ve-canvas .ve-island::before,.pe-canvas .ve-island::before{content:"\u25C6 component";position:absolute;top:0;left:0;z-index:5;background:${c.panelBg};color:${c.muted};font:10px ${c.fontMono};letter-spacing:.1em;padding:2px 6px;border-radius:0 0 6px 0;opacity:0;pointer-events:none}
.ve-canvas .ve-island:hover::before,.pe-canvas .ve-island:hover::before{opacity:.9}
.ve-canvas .ve-gated::before,.pe-canvas .ve-gated::before{content:"sealed"}
.ve-canvas .ve-gated::after,.pe-canvas .ve-gated::after{content:"";position:absolute;inset:0;z-index:4;outline:1.5px dashed #E0A030;outline-offset:-1px;pointer-events:none}
.ve-crumbs{display:flex;flex-wrap:wrap;align-items:center;gap:2px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.08);font-family:${c.fontBody};font-size:11px}
.ve-crumb-seg{display:inline-flex;align-items:center;gap:2px}
.ve-crumb-sep{color:${c.muted};margin:0 2px}
.ve-crumb{background:none;border:none;color:${c.muted};cursor:pointer;font:inherit;padding:2px 4px;border-radius:4px}
.ve-crumb:hover:not(:disabled){color:#fff;background:rgba(255,255,255,.08)}
.ve-crumb:disabled{color:${c.panelFg};cursor:default}
.ve-menu{position:fixed;z-index:2147483500;background:${c.panelBg};border:1px solid rgba(255,255,255,.14);border-radius:8px;box-shadow:0 12px 32px -10px rgba(0,0,0,.6);padding:4px;min-width:150px;font-family:${c.fontBody};font-size:12px}
.ve-menu-item{display:block;width:100%;text-align:left;background:none;border:none;color:${c.panelFg};cursor:pointer;padding:7px 10px;border-radius:5px;font:inherit;white-space:nowrap}
.ve-menu-item:not(:disabled):hover{background:${c.accent}28;color:#fff}
.ve-menu-item.danger:not(:disabled):hover{background:#e0433033;color:#ff8a7a}
.ve-menu-item:disabled{opacity:.35;cursor:not-allowed}
.ve-insp-h{font-family:${c.fontBody};font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:${c.muted}}
.ve-src{margin-top:auto;border-top:1px solid rgba(255,255,255,.08);padding:12px 16px}
.ve-src pre{margin:6px 0 0;font-family:${c.fontMono};font-size:10px;line-height:1.5;color:${c.muted};white-space:pre-wrap;max-height:180px;overflow:auto}
${inspectorCss(c)}
`;
}
var inspectorPalette = (c) => {
  const tokens = {
    background: c.panelBg,
    foreground: c.panelFg,
    card: c.panelBg,
    "card-foreground": c.panelFg,
    muted: "rgba(255,255,255,.06)",
    "muted-foreground": c.muted,
    accent: "rgba(255,255,255,.08)",
    "accent-foreground": c.panelFg,
    secondary: "rgba(255,255,255,.08)",
    "secondary-foreground": c.panelFg,
    border: "rgba(255,255,255,.14)",
    input: "rgba(255,255,255,.18)",
    ring: c.accent
  };
  const vars = Object.entries(tokens).map(([name, value]) => `--${name}:${value};--color-${name}:${value}`).join(";");
  return `[data-frame-region="inspector"]{${vars};color:${c.panelFg}}`;
};
var inspectorCss = (c) => `
${inspectorPalette(c)}
[data-frame-region="inspector"]{padding:16px}
[data-frame-region="inspector"][data-frame-inspector-empty]{padding:0}
.ve-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.ve-chip{display:inline-flex;align-items:center;gap:6px;height:28px;background:var(--muted);border:1px solid var(--border);border-radius:6px;padding:0 4px 0 10px;font-size:13px;color:var(--foreground)}
.ve-chip button{background:none;border:none;color:var(--muted-foreground);cursor:pointer;font-size:15px;line-height:1;padding:0 4px}
.ve-chip button:hover{color:var(--foreground)}
.ve-chip-in{background:transparent;border:1px dashed var(--border);border-radius:6px;color:var(--foreground);font:inherit;font-size:13px;height:28px;padding:0 10px;width:104px}
.ve-chip-in:focus{outline:none;border-style:solid;border-color:var(--ring)}
.ve-kv{display:flex;gap:6px;align-items:center;margin-bottom:6px}
.ve-kv input{flex:1;min-width:0;height:36px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--foreground);font-size:13px;padding:0 12px}
.ve-kv input:focus{outline:none;border-color:var(--ring)}
.ve-kv input[readonly]{color:var(--muted-foreground);background:var(--muted)}
.ve-kv button{background:none;border:none;color:var(--muted-foreground);cursor:pointer;font-size:15px;padding:0 6px}
.ve-kv button:hover{color:var(--foreground)}
.ve-add{align-self:flex-start;background:none;border:1px dashed var(--border);border-radius:8px;color:var(--muted-foreground);cursor:pointer;font:inherit;font-size:13px;height:32px;padding:0 12px}
.ve-add:hover{color:var(--foreground);border-color:var(--ring)}
`;
function peCss(t) {
  const c = theme(t);
  return `
.pe-canvas{position:relative;box-sizing:border-box;min-width:0;padding-top:40px}
.pe-canvas [data-bd-path]:hover{outline:1.5px dashed ${c.accent}80;outline-offset:1px}
.pe-canvas [data-bd-component]:hover{outline:1.5px dotted ${c.accent};outline-offset:1px}
.pe-canvas [contenteditable="true"]{outline:2px solid ${c.editAccent} !important;cursor:text}
.pe-canvas .ve-island{position:relative}
.pe-bar{position:fixed;top:0;left:0;right:0;z-index:2147483200;display:flex;align-items:center;gap:8px;height:40px;padding:0 14px;background:${c.panelBg};color:${c.panelFg};border-bottom:1px solid rgba(255,255,255,.1);font-family:${c.fontBody};font-size:11px}
.pe-brand{display:flex;align-items:center;gap:8px;color:#fff}
.pe-mark{width:14px;height:14px;border-radius:23%;background:${c.accent}}
.pe-btn{background:none;border:1px solid rgba(255,255,255,.16);border-radius:8px;color:${c.panelFg};cursor:pointer;font:inherit;font-size:11px;padding:5px 12px}
.pe-btn:hover{color:#fff;border-color:${c.accent}80}
.pe-btn:disabled{opacity:.35;cursor:not-allowed}
.pe-btn.primary{background:${c.accent};border-color:${c.accent};color:#fff}
.pe-panel{position:fixed;top:40px;bottom:14px;width:300px;z-index:2147483200;background:${c.panelBg};border:1px solid rgba(255,255,255,.1);border-top:none;overflow:auto;box-shadow:0 24px 60px -18px rgba(0,0,0,.6)}
.pe-panel::after{content:"";display:block;flex:none;position:sticky;bottom:0;height:28px;margin-top:auto;pointer-events:none;background:linear-gradient(to bottom,transparent,${c.panelBg})}
.pe-left{left:0;width:200px;padding:14px 12px;display:flex;flex-direction:column;gap:7px;border-left:none;border-radius:0 0 12px 0}
.pe-right{right:0;border-right:none;border-radius:0 0 0 12px}
.pe-comp-badge{margin:-6px 16px 6px;font-family:${c.fontBody};font-size:10px;letter-spacing:.08em;color:${c.editAccent}}
.pe-draft{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;border:1px solid ${c.editAccent};color:${c.editAccent};font-size:10px;letter-spacing:.06em;text-transform:uppercase}
.pe-versions{right:0;width:320px;padding:14px 14px 20px;border-right:none;border-radius:0 0 0 12px;display:flex;flex-direction:column;gap:10px}
.pe-versions h3{margin:0;font-family:${c.fontBody};font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${c.panelFg}}
.pe-version{display:flex;align-items:baseline;gap:8px;padding:8px 0;border-top:1px solid rgba(255,255,255,.08);font-family:${c.fontBody};font-size:11px;color:${c.panelFg}}
.pe-version-text{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}
.pe-version-ref{color:#fff;min-width:0;overflow-wrap:anywhere}
.pe-version-label{min-width:0;opacity:.75;overflow-wrap:anywhere}
.pe-version>.pe-btn{flex:none}
.pe-version-tag{flex:none;white-space:nowrap;font-size:9px;letter-spacing:.06em;text-transform:uppercase;padding:2px 6px;border-radius:6px;border:1px solid rgba(255,255,255,.2)}
.pe-version-tag.published{border-color:${c.accent};color:${c.editAccent}}
.pe-version-tag.head{border-color:${c.editAccent};color:${c.editAccent}}
.pe-confirm{display:flex;flex-direction:column;gap:8px;padding:10px;border:1px solid ${c.editAccent};border-radius:10px;font-family:${c.fontBody};font-size:11px;color:${c.panelFg}}
.pe-confirm-actions{display:flex;gap:8px}
.pe-clear{right:0;bottom:auto;width:320px;padding:14px;border-right:none;border-radius:0 0 0 12px}
${inspectorCss(c)}
`;
}

// src/canvas/insert.ts
function insertRelativeTo(doc, selectedPath, make) {
  const target = selectedPath && getAt(doc, selectedPath) ? selectedPath : "0";
  const node = getAt(doc, target);
  if (doc.length === 0) {
    return insertInto(doc, "", 0, make());
  }
  if (!node || !isJsonBlock(node)) return doc;
  if (isLeafText(node) || target !== "0") {
    return insertInto(doc, parentOf(target) || "", indexOf(target) + 1, make());
  }
  return insertInto(doc, target, node.children.length, make());
}

// src/canvas/templates.ts
var block = (name, props = {}, text) => ({
  kind: "block",
  name,
  isComponent: false,
  props: [
    ...props.className !== void 0 ? [{ name: "className", kind: "string", value: props.className }] : [],
    ...props.style !== void 0 ? [{ name: "style", kind: "string", value: props.style }] : []
  ],
  children: text !== void 0 ? [{ kind: "text", value: text }] : [],
  dynamic: false
});
var mdxBlock = () => ({
  kind: "block",
  name: "Mdx",
  isComponent: true,
  props: [],
  children: [],
  dynamic: false
});
var DEFAULT_BLOCK_TEMPLATES = [
  { label: "Section", make: () => block("section", { className: "section", style: "padding:40px" }, "New section") },
  { label: "Heading", make: () => block("h2", { className: "heading", style: "font-size:32px" }, "New heading") },
  { label: "Text", make: () => block("p", { className: "body" }, "New paragraph.") },
  // Rich MDX content — renders the injected MdxView/MdxEdit island.
  { label: "Content", make: mdxBlock },
  { label: "Button", make: () => block("button", { className: "btn", style: "padding:12px 20px;cursor:pointer" }, "Button") },
  { label: "Row", make: () => block("div", { className: "row", style: "display:flex;gap:12px" }) },
  { label: "Divider", make: () => block("hr", { style: "border:none;border-top:1px solid rgba(0,0,0,.12);margin:24px 0" }) }
];
var DEFAULT_CLASS_SUGGESTIONS = [
  "flex",
  "grid",
  "block",
  "hidden",
  "items-center",
  "justify-between",
  "gap-4",
  "p-4",
  "p-8",
  "px-6",
  "py-3",
  "mt-4",
  "mb-6",
  "text-center",
  "text-lg",
  "text-2xl",
  "font-semibold",
  "rounded-lg",
  "rounded-xl",
  "shadow",
  "w-full",
  "max-w-2xl"
];
var DEFAULT_VAR_SUGGESTIONS = [
  "var(--fg)",
  "var(--bg)",
  "var(--surface)",
  "var(--accent)",
  "var(--muted)",
  "var(--border)"
];

// src/canvas/CanvasWidget.tsx
import { jsx as jsx10, jsxs as jsxs6 } from "react/jsx-runtime";
var TEMPLATE_DATA_KEY = "application/x-beam-ux-template";
var EMPTY_DOC = [];
function siblingPath(path, delta) {
  const parent = parentOf(path);
  const idx = indexOf(path) + delta;
  if (idx < 0) return null;
  return parent === "" ? String(idx) : `${parent}.${idx}`;
}
function samePropList(a, b) {
  if (a.length !== b.length) return false;
  const key = (props) => props.map((p) => JSON.stringify([p.name, p.kind, p.value])).sort().join("\0");
  return key(a) === key(b);
}
function countNodes(nodes) {
  let n = 0;
  for (const node of nodes) {
    n += 1;
    if (isJsonBlock(node)) n += countNodes([...node.children, ...Object.values(node.slots ?? {}).flat()]);
  }
  return n;
}
function CanvasWidget({
  value,
  formData,
  onChange,
  editShellMount: mount,
  readOnly = false,
  theme: theme2,
  hideBreadcrumb = false
}) {
  const config = useCanvas();
  const selection = useCanvasSelection();
  const [commandError, setCommandError] = useState5(null);
  const { selection: styleSelection } = useStyleSelection();
  const doc = value ?? formData ?? EMPTY_DOC;
  const allTemplates = config.blockTemplates ?? DEFAULT_BLOCK_TEMPLATES;
  const accent = theme2?.accent ?? DEFAULT_CANVAS_THEME.accent;
  const [editing, setEditing] = useState5(null);
  const firstClickPath = useRef2(null);
  const [dragPath, setDragPath] = useState5(null);
  const [dropTarget, setDropTarget] = useState5(null);
  const [menu, setMenu] = useState5(null);
  const sel = mount?.selectedNodeId ?? null;
  const templates = useMemo(() => config.profile ? profileTemplates(allTemplates, config.profile, doc, sel) : allTemplates, [allTemplates, config.profile, doc, sel]);
  const setSel = (path, add = false) => {
    selection.setPaths(path ? add ? selection.paths.includes(path) ? selection.paths.filter((p) => p !== path) : [...selection.paths, path] : [path] : []);
    mount?.selectNode(path);
  };
  const emit = (next) => {
    if (readOnly || next === doc) return;
    onChange?.(next);
    mount?.markDirty(true);
  };
  const docRef = useRef2(doc);
  docRef.current = doc;
  const readOnlyRef = useRef2(readOnly);
  readOnlyRef.current = readOnly;
  const alive = useRef2(true);
  useEffect2(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const emitFromRef = (next) => {
    if (readOnly || next === docRef.current) return;
    onChange?.(next);
    mount?.markDirty(true);
  };
  useEffect2(() => {
    selection.register({ doc, readOnly, editStyle: (paths, layer, property, value2) => {
      if (readOnly) return;
      emitFromRef(editStyles(docRef.current, paths, layer, property, value2, config.styleRegistry ?? DEFAULT_STYLE_REGISTRY));
    } });
    return () => selection.register(null);
  }, [doc, readOnly, config.styleRegistry, selection.register]);
  useEffect2(() => {
    if (sel && !selection.paths.includes(sel)) selection.setPaths([sel]);
    if (!sel && selection.paths.length) selection.setPaths([]);
  }, [sel]);
  const command = (run) => {
    if (readOnlyRef.current) return;
    try {
      emitFromRef(run());
      setSel(null);
      setCommandError(null);
    } catch (error) {
      setCommandError(error instanceof Error ? error.message : String(error));
    }
  };
  const copy2 = async (cut = false) => {
    if (cut && readOnly) return;
    try {
      if (!navigator.clipboard?.writeText) throw Error("Clipboard is unavailable in this browser");
      const snapshot = docRef.current, paths = [...selection.paths];
      await navigator.clipboard.writeText(clipboardText(snapshot, paths));
      if (!alive.current) return;
      if (cut) {
        if (readOnlyRef.current) throw Error("Editor became read-only; copied blocks were not cut");
        if (docRef.current !== snapshot) throw Error("Document changed while copying; copied blocks were not cut");
        command(() => removeBlocks(docRef.current, paths));
      }
      setCommandError(null);
    } catch (error) {
      setCommandError(error instanceof Error ? error.message : String(error));
    }
  };
  const paste = async () => {
    if (readOnly) return;
    try {
      if (!navigator.clipboard?.readText) throw Error("Clipboard is unavailable in this browser");
      const snapshot = docRef.current, target = sel ?? "";
      const nodes = parseClipboard(await navigator.clipboard.readText());
      if (!alive.current) return;
      if (readOnlyRef.current) throw Error("Editor is read-only");
      if (docRef.current !== snapshot) throw Error("Document changed while reading clipboard; choose the destination again");
      const parent = target ? getAt(docRef.current, target) : null;
      if (parent && isJsonBlock(parent) && (isEditGated(config, parent) || isIsland(config, parent.name))) throw Error("Paste into an editable container");
      command(() => pasteBlocks(docRef.current, target, nodes, config.profile, config.styleRegistry));
    } catch (error) {
      setCommandError(error instanceof Error ? error.message : String(error));
    }
  };
  useEffect2(() => {
    if (!mount) return;
    return mount.registerNodeAccess({
      getNode: (nodeId) => {
        const node = getAt(docRef.current, nodeId);
        if (!node || !isJsonBlock(node)) return null;
        const { schema, attrs } = blockStyleFields(node, config.profile ? profileAttrs(node, config.profile) : attrsSchemaFor(node, config.entitlementKeys ?? []), config.styleRegistry);
        return { type: node.name ?? "fragment", attrsSchema: schema, attrs };
      },
      setNodeAttrs: (nodeId, attrs) => {
        const node = getAt(docRef.current, nodeId);
        if (!node || !isJsonBlock(node)) return;
        const { bdStyle, ...props } = attrs;
        const changed = config.profile ? setProfileAttrs(node, props, config.profile) : setAttrs(node, props);
        const next = bdStyle === void 0 ? changed : applyBlockStyle(changed, bdStyle);
        if (samePropList(node.props, next.props) && JSON.stringify(node.style ?? { layers: [] }) === JSON.stringify(next.style ?? { layers: [] })) return;
        emitFromRef(updateAt(docRef.current, nodeId, () => next));
      }
    });
  }, [doc, config.entitlementKeys, config.profile]);
  useEffect2(() => {
    if (!mount) return;
    mount.publishCandidates(templates.map((t) => ({ nodeType: t.label, label: t.label })));
    return mount.registerInsertHandler((candidate) => {
      const nodeType = candidate?.nodeType;
      const template = templates.find((t) => t.label === nodeType);
      if (template) emitFromRef(insertRelativeTo(docRef.current, sel, template.make));
    });
  }, [doc, sel, templates]);
  useEffect2(() => {
    if (!mount) return;
    return mount.registerFlush(async () => {
      const active = document.activeElement;
      const editing2 = active?.isContentEditable || active?.getAttribute("contenteditable") === "true";
      if (active && editing2 && active.closest("[data-bd-path]")) active.blur();
    });
  }, [mount]);
  useEffect2(() => {
    mount?.publishConformance({
      nodes: countNodes(doc),
      requiredTotal: 0,
      requiredFilled: 0,
      grammarValid: true,
      incompleteNodeIds: []
    });
  }, [doc]);
  const onCanvasClick = (e) => {
    if (e.target.closest("[data-prose-edit]")) return;
    const el = e.target.closest("[data-bd-path]");
    const path = el ? el.getAttribute("data-bd-path") : null;
    if (e.detail === 1) firstClickPath.current = { path };
    if (editing && path === editing) return;
    e.preventDefault();
    setSel(path, e.ctrlKey || e.metaKey || e.shiftKey);
    setEditing(null);
  };
  const onCanvasDbl = (e) => {
    if (e.target.closest("[data-prose-edit]")) return;
    const p = firstClickPath.current ? firstClickPath.current.path : e.target.closest("[data-bd-path]")?.getAttribute("data-bd-path");
    firstClickPath.current = null;
    const node = p ? getAt(doc, p) : null;
    if (!readOnly && p && node && isJsonBlock(node) && config.profile && proseRole(node.name, config.profile)) setEditing(p);
  };
  const onCanvasContextMenu = (e) => {
    const p = e.target.closest("[data-bd-path]")?.getAttribute("data-bd-path");
    if (!p) return;
    e.preventDefault();
    setSel(p);
    setMenu({ x: e.clientX, y: e.clientY, path: p });
  };
  const dnd = {
    onDragStart: (path) => setDragPath(path),
    onDragOverNode: (path, edge) => setDropTarget({ path, edge }),
    onDrop: (dataTransfer) => {
      const templateNodeType = dataTransfer?.getData(TEMPLATE_DATA_KEY);
      if (dropTarget && templateNodeType) {
        const offered = config.profile ? profileTemplatesAtParent(allTemplates, config.profile, doc, parentOf(dropTarget.path)) : allTemplates;
        const template = offered.find((t) => t.label === templateNodeType);
        if (template) {
          const index = indexOf(dropTarget.path) + (dropTarget.edge === "after" ? 1 : 0);
          emit(insertInto(doc, parentOf(dropTarget.path), index, template.make()));
        }
      } else if (dropTarget && dragPath) {
        const move = dropTarget.edge === "before" ? moveBefore : moveAfter;
        emit(move(doc, dragPath, dropTarget.path));
      }
      setDragPath(null);
      setDropTarget(null);
    },
    onDragEnd: () => {
      setDragPath(null);
      setDropTarget(null);
    }
  };
  const contextMenuActions = (path) => {
    const prev = siblingPath(path, -1);
    const next = siblingPath(path, 1);
    return [
      { label: "Duplicate", onSelect: () => command(() => {
        const node = getAt(docRef.current, path), parent = parentOf(path) ? getAt(docRef.current, parentOf(path)) : null;
        if (!node) throw Error("Selection no longer exists");
        assertPasteProfile([node], config.profile, parent, config.styleRegistry);
        return duplicateAt(docRef.current, path);
      }) },
      {
        label: "Move up",
        disabled: !prev || !getAt(doc, prev),
        onSelect: () => {
          if (prev) emit(moveBefore(doc, path, prev));
        }
      },
      {
        label: "Move down",
        disabled: !next || !getAt(doc, next),
        onSelect: () => {
          if (next) emit(moveAfter(doc, path, next));
        }
      },
      {
        label: "Insert",
        children: (config.profile ? profileTemplates(allTemplates, config.profile, doc, path) : allTemplates).map((t) => ({
          label: t.label,
          onSelect: () => emit(insertRelativeTo(doc, path, t.make))
        }))
      },
      {
        label: "Delete",
        danger: true,
        disabled: path === "0",
        onSelect: () => {
          if (path === "0") return;
          emit(removeAt(doc, path));
          if (sel === path) setSel(null);
        }
      }
    ];
  };
  return /* @__PURE__ */ jsxs6("div", { className: "ve-canvas-widget", onDoubleClick: onCanvasDbl, onClickCapture: (event) => {
    if (event.detail === 1 && !event.target.closest(".ve-canvas")) firstClickPath.current = null;
  }, onKeyDown: (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.target.closest('input,textarea,[contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (["c", "x", "v"].includes(key)) {
      event.preventDefault();
      if (key === "v") void paste();
      else void copy2(key === "x");
    }
  }, style: { containerType: "inline-size", containerName: "beam-canvas", width: styleSelection.breakpoint ? (config.styleRegistry ?? DEFAULT_STYLE_REGISTRY).breakpoints[styleSelection.breakpoint] : void 0, maxWidth: "100%" }, children: [
    /* @__PURE__ */ jsxs6("div", { className: "ve-command-bar", role: "toolbar", "aria-label": "Block commands", children: [
      /* @__PURE__ */ jsx10("button", { className: "ve-command-button", type: "button", disabled: !selection.paths.length, onClick: () => void copy2(), children: "Copy blocks" }),
      /* @__PURE__ */ jsx10("button", { className: "ve-command-button", type: "button", disabled: readOnly || !selection.paths.length, onClick: () => void copy2(true), children: "Cut blocks" }),
      /* @__PURE__ */ jsxs6("button", { className: "ve-command-button", type: "button", disabled: readOnly, onClick: () => void paste(), children: [
        "Paste into ",
        sel ?? "document"
      ] }),
      /* @__PURE__ */ jsx10("button", { className: "ve-command-button", type: "button", disabled: readOnly || !selection.paths.length, onClick: () => command(() => wrapBlocks(docRef.current, selection.paths, "flex", config.profile)), children: "Wrap in flex" }),
      /* @__PURE__ */ jsx10("button", { className: "ve-command-button", type: "button", disabled: readOnly || !selection.paths.length, onClick: () => command(() => wrapBlocks(docRef.current, selection.paths, "grid", config.profile)), children: "Wrap in grid" }),
      /* @__PURE__ */ jsx10("button", { className: "ve-command-button", type: "button", disabled: readOnly || selection.paths.length !== 1, onClick: () => command(() => unwrapBlock(docRef.current, selection.paths[0], config.profile)), children: "Unwrap" }),
      /* @__PURE__ */ jsxs6("span", { children: [
        selection.paths.length,
        " blocks selected"
      ] })
    ] }),
    commandError && /* @__PURE__ */ jsx10("p", { role: "alert", children: commandError }),
    /* @__PURE__ */ jsxs6("div", { className: "ve-canvas-layout", children: [
      /* @__PURE__ */ jsx10(CanvasOutline, { doc, onSelect: setSel, onHide: (path, hidden) => command(() => editStyles(docRef.current, [path], { breakpoint: styleSelection.breakpoint, state: null }, "display", hidden ? "none" : null, config.styleRegistry ?? DEFAULT_STYLE_REGISTRY)) }),
      /* @__PURE__ */ jsxs6("div", { style: { minWidth: 0 }, children: [
        selection.paths.filter((path) => path !== sel).map((path) => {
          const node = getAt(doc, path);
          return /* @__PURE__ */ jsx10("style", { dangerouslySetInnerHTML: { __html: selectionCss(path, accent, !!node && isJsonBlock(node) && node.isComponent) } }, path);
        }),
        sel && (() => {
          const selNode = getAt(doc, sel);
          const selIsComponent = !!selNode && isJsonBlock(selNode) && selNode.isComponent;
          return /* @__PURE__ */ jsx10("style", { dangerouslySetInnerHTML: { __html: selectionCss(sel, accent, selIsComponent) } });
        })(),
        dropTarget && /* @__PURE__ */ jsx10(
          "style",
          {
            dangerouslySetInnerHTML: {
              __html: dropIndicatorCss(dropTarget.path, dropTarget.edge, accent)
            }
          }
        ),
        !hideBreadcrumb && sel && /* @__PURE__ */ jsx10(Breadcrumb, { doc, path: sel, onSelect: setSel }),
        /* @__PURE__ */ jsx10(
          "div",
          {
            className: "ve-canvas",
            onClickCapture: onCanvasClick,
            onContextMenu: onCanvasContextMenu,
            children: /* @__PURE__ */ jsx10(
              CanvasSiblings,
              {
                nodes: doc,
                parent: "",
                editing,
                onEditText: () => {
                },
                onEditProse: (parent, start, end, body) => {
                  const replace = (children) => [...children.slice(0, start), ...body, ...children.slice(end)];
                  emit(parent ? updateAt(doc, parent, (node) => isJsonBlock(node) ? { ...node, children: replace(node.children) } : node) : replace(doc));
                },
                onEditMd: (p, md) => emit(updateAt(doc, p, (node) => isJsonBlock(node) ? setProp(node, "md", md, "string") : node)),
                dnd
              }
            )
          }
        ),
        menu && /* @__PURE__ */ jsx10(
          ContextMenu,
          {
            state: menu,
            onClose: () => setMenu(null),
            actions: contextMenuActions(menu.path)
          }
        )
      ] })
    ] })
  ] });
}

// src/canvas/CanvasPalette.tsx
import { Fragment as Fragment4, jsx as jsx11, jsxs as jsxs7 } from "react/jsx-runtime";
function CanvasPalette() {
  const mount = useEditShellMount();
  const candidates = mount.candidates;
  if (candidates.length === 0) {
    return /* @__PURE__ */ jsx11("div", { className: "ve-pal-note", children: "Nothing insertable here" });
  }
  return /* @__PURE__ */ jsxs7(Fragment4, { children: [
    /* @__PURE__ */ jsx11("div", { className: "ve-insp-h", children: "Insert block" }),
    candidates.map((c) => /* @__PURE__ */ jsxs7(
      "button",
      {
        type: "button",
        className: "ve-pal-item",
        draggable: true,
        onDragStart: (e) => e.dataTransfer.setData(TEMPLATE_DATA_KEY, c.nodeType),
        onClick: () => mount.insert(c),
        children: [
          "+ ",
          c.label
        ]
      },
      c.nodeType
    )),
    /* @__PURE__ */ jsx11("div", { className: "ve-pal-note", children: "click inserts into / after the selection \xB7 drag to drop at a specific position" })
  ] });
}

// src/canvas/BlockInspector.tsx
import { useEffect as useEffect3, useId, useState as useState6 } from "react";
import { useEditShellMount as useEditShellMount2 } from "@schemastud/frame";
import { SchemaForm } from "@schemastud/seam";
import { Fragment as Fragment5, jsx as jsx12, jsxs as jsxs8 } from "react/jsx-runtime";
var PANELS = {
  Size: ["width", "height", "min-width", "max-width", "min-height", "max-height", "aspect-ratio", "object-fit"],
  Layout: ["display", "position", "top", "right", "bottom", "left", "z-index", "padding", "margin", "gap", "flex-direction", "justify-content", "align-items", "grid-template-columns"],
  Text: ["font-family", "font-size", "font-weight", "line-height", "letter-spacing", "text-align", "text-decoration", "color"],
  Appearance: ["background-color", "background-image", "border", "border-color", "border-radius", "opacity"],
  Effects: ["box-shadow", "text-shadow", "filter", "transform", "transition"]
};
function BlockInspector() {
  const mount = useEditShellMount2();
  const config = useCanvas();
  const canvasSelection = useCanvasSelection();
  const { selection, select } = useStyleSelection();
  const registry = config.styleRegistry ?? DEFAULT_STYLE_REGISTRY;
  const [error, setError] = useState6(null);
  const [rendered, setRendered] = useState6({});
  const [rawProperty, setRawProperty] = useState6("");
  const [rawValue, setRawValue] = useState6("");
  const [gradientStart, setGradientStart] = useState6("#ffffff");
  const [gradientEnd, setGradientEnd] = useState6("#000000");
  const tokenId = useId();
  const id = mount.selectedNodeId;
  const node = id !== null ? mount.getNode(id) : null;
  const attrs = node?.attrs ?? {};
  const style = attrs.bdStyle ?? { layers: [] };
  const selected = canvasSelection.commands && canvasSelection.paths.includes(id ?? "") ? canvasSelection.paths : [...id ? [id] : []];
  const styles = selected.map((path) => {
    const block2 = canvasSelection.commands ? getAt(canvasSelection.commands.doc, path) : null;
    return block2 && isJsonBlock(block2) ? blockStyleFields(block2, { schema: {}, attrs: {} }).attrs.bdStyle : style;
  });
  const tokens = config.varSuggestions ?? DEFAULT_VAR_SUGGESTIONS;
  useEffect3(() => {
    const element = [...document.querySelectorAll("[data-bd-path]")].find((el) => el.dataset.bdPath === id);
    if (!element) {
      setRendered({});
      return;
    }
    const computed = getComputedStyle(element);
    const properties2 = [...Object.values(PANELS).flat(), ...tokens.map((token) => /^var\((--[^,)]+)/.exec(token)?.[1]).filter((v) => !!v)];
    setRendered(Object.fromEntries(properties2.map((property) => [property, computed.getPropertyValue(property).trim()])));
  }, [id, JSON.stringify(attrs), tokens.join("|")]);
  if (!node || id === null) return /* @__PURE__ */ jsx12("div", { "data-frame-region": "inspector", "data-frame-inspector-empty": "", children: "Select a block to edit" });
  const write = (property, value) => {
    try {
      if (canvasSelection.commands) canvasSelection.commands.editStyle(selected, selection, property, value);
      else {
        const next = validatedEdit(style, selection, property, value, registry);
        mount.setNodeAttrs(id, { ...attrs, bdStyle: next });
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };
  const own = (property) => {
    if (styles.length > 1 && new Set(styles.map((s) => effectiveDeclaration(s, property, selection, registry)?.value ?? "")).size > 1) return "";
    let value = "";
    for (const layer of style.layers) if ((layer.breakpoint ?? null) === selection.breakpoint && (layer.state ?? null) === selection.state && Object.hasOwn(layer.declarations, property)) value = layer.declarations[property];
    return value;
  };
  const resolve = (value) => value.replace(/var\((--[a-zA-Z0-9-]+)\)/g, (expression, key) => rendered[key] || expression);
  const properties = { ...node.attrsSchema?.properties ?? {} };
  delete properties.bdStyle;
  delete properties.className;
  const props = Object.fromEntries(Object.entries(attrs).filter(([key]) => Object.hasOwn(properties, key)));
  const rootStyles = !/^[A-Z]/.test(node.type) && selected.every((path) => {
    const n = canvasSelection.commands ? getAt(canvasSelection.commands.doc, path) : null;
    return !n || !isJsonBlock(n) || !n.isComponent && !/^[A-Z]/.test(n.name ?? "");
  });
  const foreground = resolve(effectiveDeclaration(style, "color", selection, registry)?.value || rendered.color || "");
  const background = resolve(effectiveDeclaration(style, "background-color", selection, registry)?.value || rendered["background-color"] || "");
  const ratio = contrastRatio(foreground, background);
  const shade = readableShade(foreground, background);
  const field = (property) => {
    const inherited = effectiveDeclaration(style, property, selection, registry);
    const value = own(property);
    const mixed = styles.length > 1 && new Set(styles.map((s) => effectiveDeclaration(s, property, selection, registry)?.value ?? "")).size > 1;
    return /* @__PURE__ */ jsxs8("div", { style: { marginBlock: 8 }, children: [
      /* @__PURE__ */ jsxs8("label", { children: [
        property,
        " token",
        /* @__PURE__ */ jsxs8("select", { "aria-label": `${property} token`, value: tokens.includes(value) ? value : "", onChange: (event) => {
          if (event.target.value) write(property, event.target.value);
        }, children: [
          /* @__PURE__ */ jsx12("option", { value: "", children: "Custom value" }),
          tokens.map((token) => /* @__PURE__ */ jsxs8("option", { value: token, children: [
            token,
            " ",
            resolve(token) !== token ? `(${resolve(token)})` : ""
          ] }, token))
        ] })
      ] }),
      /* @__PURE__ */ jsxs8("label", { children: [
        property,
        /* @__PURE__ */ jsx12(
          "input",
          {
            "aria-label": property,
            list: tokenId,
            defaultValue: value,
            placeholder: mixed ? "Mixed values" : inherited?.value || rendered[property] || "Unset",
            onBlur: (event) => {
              if (event.target.value !== value) write(property, event.target.value || null);
            }
          },
          `${id}:${selection.breakpoint}:${selection.state}:${property}:${value}`
        )
      ] }),
      mixed && /* @__PURE__ */ jsxs8("small", { children: [
        property,
        ": Mixed values"
      ] }),
      /* @__PURE__ */ jsx12("small", { children: inherited ? `${inherited.layer}: ${resolve(inherited.value)}` : rendered[property] ? `Rendered / inherited: ${rendered[property]}` : "No value" }),
      (property === "color" || property.endsWith("-color")) && /* @__PURE__ */ jsx12(ColourControls, { property, value: value || inherited?.value || rendered[property] || "#000000", onChange: (value2) => write(property, value2), onError: setError }),
      /* @__PURE__ */ jsxs8("div", { children: [
        /* @__PURE__ */ jsxs8("button", { type: "button", onClick: () => write(property, null), children: [
          "Unset ",
          property
        ] }),
        /* @__PURE__ */ jsxs8("button", { type: "button", onClick: (event) => {
          const input = event.currentTarget.closest("div")?.parentElement?.querySelector("input");
          input?.focus();
        }, children: [
          "Edit ",
          property,
          " as text"
        ] }),
        /* @__PURE__ */ jsxs8("button", { type: "button", onClick: () => {
          void navigator.clipboard?.writeText(`${property}: ${value || inherited?.value || rendered[property] || ""};`).catch(() => setError("Could not copy declaration"));
        }, children: [
          "Copy ",
          property
        ] })
      ] })
    ] }, property);
  };
  return /* @__PURE__ */ jsxs8("div", { "data-frame-region": "inspector", "data-node-type": node.type, style: { padding: 12, overflow: "auto" }, children: [
    error && /* @__PURE__ */ jsx12("p", { role: "alert", children: error }),
    selected.length > 1 && /* @__PURE__ */ jsxs8("p", { children: [
      selected.length,
      " blocks selected \u2014 Block Style edits apply together."
    ] }),
    effectiveDeclaration(style, "display", { breakpoint: selection.breakpoint, state: null }, registry)?.value === "none" && /* @__PURE__ */ jsxs8("p", { children: [
      "Hidden for visitors at ",
      selection.breakpoint ? `${selection.breakpoint}+` : "all widths",
      " after publish. An earlier layer may still hide this block when this override is cleared."
    ] }),
    selected.length <= 1 && /* @__PURE__ */ jsxs8("section", { "aria-label": "Element properties", children: [
      /* @__PURE__ */ jsxs8("h3", { children: [
        node.type,
        " properties"
      ] }),
      /* @__PURE__ */ jsx12(
        SchemaForm,
        {
          schema: { ...node.attrsSchema, properties },
          formData: props,
          uiSchema: { "ui:submitButtonOptions": { norender: true } },
          onChange: (event) => mount.setNodeAttrs(id, { ...event.formData, ...Object.hasOwn(attrs, "className") ? { className: attrs.className } : {}, bdStyle: style })
        },
        id
      )
    ] }),
    !rootStyles ? /* @__PURE__ */ jsx12("p", { children: "Style panels are unavailable: this component does not declare root-style forwarding." }) : /* @__PURE__ */ jsxs8(Fragment5, { children: [
      /* @__PURE__ */ jsxs8("label", { children: [
        "Breakpoint",
        /* @__PURE__ */ jsxs8("select", { "aria-label": "Breakpoint", value: selection.breakpoint ?? "", onChange: (event) => select({ ...selection, breakpoint: event.target.value || null }), children: [
          /* @__PURE__ */ jsx12("option", { value: "", children: "Base" }),
          Object.entries(registry.breakpoints).map(([name, width2]) => /* @__PURE__ */ jsxs8("option", { value: name, children: [
            name,
            " (",
            width2,
            ")"
          ] }, name))
        ] })
      ] }),
      /* @__PURE__ */ jsxs8("label", { children: [
        "State",
        /* @__PURE__ */ jsxs8("select", { "aria-label": "State", value: selection.state ?? "", onChange: (event) => select({ ...selection, state: event.target.value || null }), children: [
          /* @__PURE__ */ jsx12("option", { value: "", children: "Default" }),
          Object.keys(registry.states).map((name) => /* @__PURE__ */ jsx12("option", { children: name }, name))
        ] })
      ] }),
      /* @__PURE__ */ jsx12("p", { children: "Layout-width preview only, capped by available space. Media-query styles follow the browser viewport; states are edited here, not simulated." }),
      /* @__PURE__ */ jsx12("datalist", { id: tokenId, children: tokens.map((token) => /* @__PURE__ */ jsx12("option", { value: token, children: resolve(token) }, token)) }),
      Object.entries(PANELS).map(([name, fields]) => /* @__PURE__ */ jsxs8("details", { children: [
        /* @__PURE__ */ jsx12("summary", { children: name }),
        fields.map(field)
      ] }, name)),
      /* @__PURE__ */ jsxs8("details", { children: [
        /* @__PURE__ */ jsx12("summary", { children: "Gradient stops" }),
        /* @__PURE__ */ jsxs8("label", { children: [
          "Start colour",
          /* @__PURE__ */ jsx12("input", { type: "color", value: gradientStart, onChange: (event) => setGradientStart(event.target.value) })
        ] }),
        /* @__PURE__ */ jsxs8("label", { children: [
          "End colour",
          /* @__PURE__ */ jsx12("input", { type: "color", value: gradientEnd, onChange: (event) => setGradientEnd(event.target.value) })
        ] }),
        /* @__PURE__ */ jsx12("button", { type: "button", onClick: () => write("background-image", `linear-gradient(${gradientStart}, ${gradientEnd})`), children: "Apply gradient" })
      ] }),
      /* @__PURE__ */ jsxs8("details", { children: [
        /* @__PURE__ */ jsx12("summary", { children: "Advanced" }),
        [...new Set(style.layers.flatMap((layer) => Object.keys(layer.declarations)))].filter((property) => !Object.values(PANELS).flat().includes(property)).map(field),
        /* @__PURE__ */ jsxs8("label", { children: [
          "CSS property",
          /* @__PURE__ */ jsx12("input", { value: rawProperty, onChange: (event) => setRawProperty(event.target.value) })
        ] }),
        /* @__PURE__ */ jsxs8("label", { children: [
          "CSS value",
          /* @__PURE__ */ jsx12("input", { list: tokenId, value: rawValue, onChange: (event) => setRawValue(event.target.value) })
        ] }),
        /* @__PURE__ */ jsx12("button", { type: "button", onClick: () => write(rawProperty, rawValue), children: "Set declaration" })
      ] }),
      /* @__PURE__ */ jsxs8("section", { "aria-label": "Text contrast", children: [
        /* @__PURE__ */ jsx12("h3", { children: "Text contrast" }),
        /* @__PURE__ */ jsx12("p", { children: ratio === null ? "Contrast unknown: use opaque resolved colours." : `${ratio.toFixed(2)}:1 \u2014 ${ratio >= 4.5 ? "meets" : "below"} normal-text AA` }),
        shade && ratio !== null && ratio < 4.5 && /* @__PURE__ */ jsxs8("button", { type: "button", onClick: () => write("color", shade), children: [
          "Use readable shade (",
          shade,
          ")"
        ] })
      ] })
    ] })
  ] });
}
function ColourControls({ property, value, onChange, onError }) {
  const parsed = colourInput(value);
  const alpha = parsed?.alpha ?? 1;
  const hex = parsed?.hex ?? "#000000";
  const change = (colour, opacity) => onChange(opacity === 1 ? colour : `rgb(${[1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16)).join(" ")} / ${opacity})`);
  const EyeDropper = globalThis.EyeDropper;
  return /* @__PURE__ */ jsxs8("div", { children: [
    !parsed && /* @__PURE__ */ jsx12("small", { children: "Use the text or token field for this colour format." }),
    /* @__PURE__ */ jsxs8("label", { children: [
      property,
      " colour",
      /* @__PURE__ */ jsx12("input", { type: "color", "aria-label": `${property} colour`, value: hex, disabled: !parsed, onChange: (event) => change(event.target.value, alpha) })
    ] }),
    /* @__PURE__ */ jsxs8("label", { children: [
      property,
      " alpha",
      /* @__PURE__ */ jsx12("input", { type: "number", "aria-label": `${property} alpha`, min: "0", max: "1", step: "0.05", value: alpha, disabled: !parsed, onChange: (event) => {
        const next = Number(event.target.value);
        if (Number.isFinite(next) && next >= 0 && next <= 1) {
          change(hex, next);
        }
      } })
    ] }),
    EyeDropper ? /* @__PURE__ */ jsxs8("button", { type: "button", onClick: () => {
      void new EyeDropper().open().then((result) => change(result.sRGBHex, alpha)).catch((error) => {
        if (error?.name !== "AbortError") onError("Could not sample colour");
      });
    }, children: [
      "Pick ",
      property,
      " from screen"
    ] }) : /* @__PURE__ */ jsx12("small", { children: "Screen eyedropper unavailable in this browser." })
  ] });
}
function colourInput(value) {
  const hex = /^#([a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})$/i.exec(value.trim());
  if (hex) {
    const full = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return { hex: "#" + full.slice(0, 6), alpha: full.length === 8 ? parseInt(full.slice(6), 16) / 255 : 1 };
  }
  const match = /^rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i.exec(value.trim());
  if (!match) return null;
  const channels = match.slice(1, 4).map(Number);
  const alpha = match[4] === void 0 ? 1 : Number(match[4]);
  if (channels.some((c) => c > 255) || !Number.isFinite(alpha) || alpha < 0 || alpha > 1) return null;
  return { hex: "#" + channels.map((c) => c.toString(16).padStart(2, "0")).join(""), alpha };
}

// src/canvas/widgetRegistry.ts
import { createWidgetRegistry } from "@schemastud/seam";

// src/canvas/widgets.tsx
import { useState as useState7 } from "react";
import { jsx as jsx13, jsxs as jsxs9 } from "react/jsx-runtime";
function ClassChipsWidget({ id, value, disabled, readonly, onChange }) {
  const config = useCanvas();
  const suggestions = config.classSuggestions ?? DEFAULT_CLASS_SUGGESTIONS;
  const classes = String(value ?? "").split(/\s+/).filter(Boolean);
  const [draft, setDraft] = useState7("");
  const locked = Boolean(disabled || readonly);
  return /* @__PURE__ */ jsxs9("div", { id, className: "ve-chips", "data-widget": "class-chips", children: [
    classes.map((c) => /* @__PURE__ */ jsxs9("span", { className: "ve-chip", children: [
      c,
      !locked && /* @__PURE__ */ jsx13(
        "button",
        {
          type: "button",
          onClick: () => onChange(classes.filter((x) => x !== c).join(" ")),
          children: "\xD7"
        }
      )
    ] }, c)),
    !locked && /* @__PURE__ */ jsx13(
      "input",
      {
        className: "ve-chip-in",
        list: `${id}-suggest`,
        value: draft,
        placeholder: "+ class",
        onChange: (e) => setDraft(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter" && draft.trim()) {
            e.preventDefault();
            onChange([...classes, draft.trim()].join(" "));
            setDraft("");
          }
        }
      }
    ),
    /* @__PURE__ */ jsx13("datalist", { id: `${id}-suggest`, children: suggestions.map((c) => /* @__PURE__ */ jsx13("option", { value: c }, c)) })
  ] });
}
function StyleRowsWidget({ id, value, disabled, readonly, onChange }) {
  const config = useCanvas();
  const suggestions = config.varSuggestions ?? DEFAULT_VAR_SUGGESTIONS;
  const rows = styleRows(String(value ?? ""));
  const locked = Boolean(disabled || readonly);
  return /* @__PURE__ */ jsxs9("div", { id, "data-widget": "style-rows", children: [
    rows.map((r, i) => /* @__PURE__ */ jsxs9("div", { className: "ve-kv", children: [
      /* @__PURE__ */ jsx13(
        "input",
        {
          value: r.k,
          disabled: locked,
          onChange: (e) => onChange(joinStyle(rows.map((x, j) => j === i ? { ...x, k: e.target.value } : x))),
          placeholder: "prop"
        }
      ),
      /* @__PURE__ */ jsx13(
        "input",
        {
          list: `${id}-suggest`,
          value: r.v,
          disabled: locked,
          onChange: (e) => onChange(joinStyle(rows.map((x, j) => j === i ? { ...x, v: e.target.value } : x))),
          placeholder: "value / var(--\u2026)"
        }
      ),
      !locked && /* @__PURE__ */ jsx13("button", { type: "button", onClick: () => onChange(joinStyle(rows.filter((_, j) => j !== i))), children: "\xD7" })
    ] }, i)),
    /* @__PURE__ */ jsx13("datalist", { id: `${id}-suggest`, children: suggestions.map((v) => /* @__PURE__ */ jsx13("option", { value: v }, v)) }),
    !locked && /* @__PURE__ */ jsx13(
      "button",
      {
        type: "button",
        className: "ve-add",
        onClick: () => onChange(joinStyle([...rows, { k: "color", v: "var(--fg)" }])),
        children: "+ declaration"
      }
    )
  ] });
}

// src/canvas/widgetRegistry.ts
var CANVAS_WIDGET_NAME = "beam-ux-canvas";
function createCanvasWidgetRegistry(canvasWidget = CanvasWidget) {
  const registry = createWidgetRegistry();
  registry.registerWidget("class-chips", ClassChipsWidget);
  registry.registerWidget("style-rows", StyleRowsWidget);
  registry.registerWidget(CANVAS_WIDGET_NAME, canvasWidget);
  return registry;
}

// src/canvas/VisualEditor.tsx
import { Fragment as Fragment6, jsx as jsx14, jsxs as jsxs10 } from "react/jsx-runtime";
var INERT_SCHEMA = { type: "array", items: { type: "object" } };
function VisualEditor({
  value,
  onChange,
  onSave,
  theme: theme2,
  brand = "visual editor",
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}) {
  const styleConfig = useCanvas();
  const onChangeRef = useRef3(onChange);
  onChangeRef.current = onChange;
  const themeRef = useRef3(theme2);
  themeRef.current = theme2;
  const registry = useMemo2(
    () => createCanvasWidgetRegistry((props) => /* @__PURE__ */ jsx14(CanvasWidget, { ...props, onChange: (doc) => onChangeRef.current(doc), theme: themeRef.current })),
    []
  );
  return /* @__PURE__ */ jsxs10(Fragment6, { children: [
    /* @__PURE__ */ jsx14("style", { dangerouslySetInnerHTML: { __html: veCss(theme2) } }),
    /* @__PURE__ */ jsx14("style", { "data-beam-block-style": "", children: compileEntryStyles(stylesIn(value), styleConfig.styleRegistry).css }),
    /* @__PURE__ */ jsx14(
      FiveRegionEditShell,
      {
        schema: INERT_SCHEMA,
        record: value,
        widget: CANVAS_WIDGET_NAME,
        registry,
        autosave: true,
        topBar: /* @__PURE__ */ jsx14(
          TopBarExtras,
          {
            brand,
            onSave,
            onUndo,
            onRedo,
            canUndo,
            canRedo
          }
        ),
        palette: /* @__PURE__ */ jsx14(CanvasPalette, {}),
        inspector: /* @__PURE__ */ jsx14(BlockInspector, {})
      }
    )
  ] });
}
function TopBarExtras({
  brand,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) {
  const mount = useEditShellMount3();
  const save = async () => {
    if (!onSave) return;
    mount.markSaving(true);
    try {
      await mount.flush();
      await onSave();
      mount.markDirty(false);
    } finally {
      mount.markSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs10(Fragment6, { children: [
    /* @__PURE__ */ jsxs10("span", { className: "ve-brand", children: [
      /* @__PURE__ */ jsx14("span", { className: "ve-mark" }),
      brand
    ] }),
    /* @__PURE__ */ jsx14("span", { className: "ve-hint", children: "click = select \xB7 double-click text = edit \xB7 drag = reorder \xB7 right-click = actions" }),
    /* @__PURE__ */ jsx14("span", { className: "ve-spacer" }),
    (onUndo || onRedo) && /* @__PURE__ */ jsxs10(Fragment6, { children: [
      /* @__PURE__ */ jsx14("button", { type: "button", className: "ve-toggle", onClick: onUndo, disabled: !canUndo, title: "Undo", children: "\u21B6 Undo" }),
      /* @__PURE__ */ jsx14("button", { type: "button", className: "ve-toggle", onClick: onRedo, disabled: !canRedo, title: "Redo", children: "\u21B7 Redo" })
    ] }),
    onSave && /* @__PURE__ */ jsx14("button", { type: "button", className: "ve-toggle ve-save", onClick: save, children: "Save" })
  ] });
}

// src/canvas/CanvasClearance.tsx
import { useLayoutEffect, useRef as useRef4, useState as useState8 } from "react";
import { jsx as jsx15 } from "react/jsx-runtime";
function canvasClearance(left, right, leftPanelRight, rightPanelLeft) {
  const width2 = Math.max(0, right - left);
  const l = leftPanelRight === null || leftPanelRight <= left ? 0 : Math.min(width2, leftPanelRight - left + 12);
  const r = rightPanelLeft === null || rightPanelLeft >= right ? 0 : Math.min(width2, right - rightPanelLeft + 12);
  const budget = Math.max(0, width2 - 240), scale = l + r > budget && l + r > 0 ? budget / (l + r) : 1;
  return { marginLeft: l * scale, marginRight: r * scale };
}
function CanvasClearance({ children, panels }) {
  const ref = useRef4(null);
  const [space, setSpace] = useState8({ marginLeft: 0, marginRight: 0 });
  useLayoutEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const update = () => {
      const box = parent.getBoundingClientRect(), style = getComputedStyle(parent);
      const left = box.left + parent.clientLeft + (parseFloat(style.paddingLeft) || 0);
      const right = box.left + parent.clientLeft + parent.clientWidth - (parseFloat(style.paddingRight) || 0);
      const lp = parent.querySelector(".pe-left"), rp = parent.querySelector(".pe-versions,.pe-clear,.pe-right");
      const next = canvasClearance(left, right, lp?.getBoundingClientRect().right ?? null, rp?.getBoundingClientRect().left ?? null);
      setSpace((old) => old.marginLeft === next.marginLeft && old.marginRight === next.marginRight ? old : next);
    };
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(parent);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [panels]);
  return /* @__PURE__ */ jsx15("div", { ref, className: "pe-canvas", style: space, children });
}

// src/editor/SourceMode.tsx
import { useState as useState9 } from "react";
import { Fragment as Fragment7, jsx as jsx16, jsxs as jsxs11 } from "react/jsx-runtime";
function SourceMode({ local, conversion, allowed, children }) {
  const [busy, setBusy] = useState9(false);
  const [error, setError] = useState9(null);
  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const source = local.session?.source;
  if (!allowed || !conversion) {
    if (source) return /* @__PURE__ */ jsxs11("div", { role: "alert", children: [
      "Source Mode is unavailable for this entry. Your pending text is retained.",
      /* @__PURE__ */ jsx16("button", { onClick: local.discardSource, children: "Discard pending source" })
    ] });
    return /* @__PURE__ */ jsx16(Fragment7, { children });
  }
  return /* @__PURE__ */ jsxs11(Fragment7, { children: [
    error && /* @__PURE__ */ jsx16("div", { role: "alert", children: error }),
    !source ? /* @__PURE__ */ jsxs11(Fragment7, { children: [
      /* @__PURE__ */ jsx16("button", { disabled: busy || !local.session, onClick: () => void run(async () => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        await local.flushed();
        const body = local.session.body;
        const printed = await conversion.print(body);
        local.beginSource(printed.source, body);
      }), children: "Source Mode" }),
      children
    ] }) : /* @__PURE__ */ jsxs11("section", { "aria-label": "Source Mode", children: [
      /* @__PURE__ */ jsx16("textarea", { "aria-label": "TSX source", value: source.text, disabled: busy, onChange: (event) => local.editSource(event.target.value) }),
      /* @__PURE__ */ jsx16("button", { disabled: busy, onClick: () => void run(async () => {
        const parsed = await conversion.read(source.text, source.body);
        local.applySource(parsed.body);
      }), children: "Apply source" }),
      /* @__PURE__ */ jsx16("button", { disabled: busy, onClick: local.discardSource, children: "Discard source" })
    ] })
  ] });
}

// src/editor/PageSettings.tsx
import { jsx as jsx17, jsxs as jsxs12 } from "react/jsx-runtime";
function PageSettings({ value, onChange }) {
  const fields = [
    ["title", "Title"],
    ["parentId", "Parent entry ID"],
    ["segment", "URL segment"],
    ["navGroup", "Navigation group"],
    ["layout", "Layout"],
    ["template", "Template"],
    ["description", "Description"],
    ["socialImage", "Social image"],
    ["publishedDate", "Published date"]
  ];
  return /* @__PURE__ */ jsxs12("details", { children: [
    /* @__PURE__ */ jsx17("summary", { children: "Page settings" }),
    /* @__PURE__ */ jsx17("p", { children: "Saved with your draft. Publish makes these settings visible." }),
    fields.map(([key, label]) => /* @__PURE__ */ jsxs12("label", { children: [
      label,
      /* @__PURE__ */ jsx17(
        "input",
        {
          type: key === "publishedDate" ? "date" : "text",
          value: value[key] ?? "",
          onChange: (event) => onChange({ ...value, [key]: event.target.value || (key === "title" ? "" : null) })
        }
      )
    ] }, key)),
    /* @__PURE__ */ jsxs12("label", { children: [
      "Navigation order",
      /* @__PURE__ */ jsx17("input", { type: "number", value: value.navOrder ?? "", onChange: (event) => onChange({ ...value, navOrder: event.target.value === "" ? null : Number(event.target.value) }) })
    ] }),
    /* @__PURE__ */ jsxs12("label", { children: [
      "Page type",
      /* @__PURE__ */ jsx17("select", { value: value.pageType ?? "WebPage", onChange: (event) => onChange({ ...value, pageType: event.target.value }), children: ["WebPage", "Article", "CollectionPage", "ProfilePage"].map((type) => /* @__PURE__ */ jsx17("option", { children: type }, type)) })
    ] })
  ] });
}

// src/canvas/PageEditor.tsx
import { useEffect as useEffect5, useMemo as useMemo3, useRef as useRef6, useState as useState11, useSyncExternalStore } from "react";
import { EditShellMountProvider, useEditShellMountController } from "@schemastud/frame";
import { WidgetRegistryContext } from "@schemastud/seam";

// src/editor/publication-state.ts
var isUnauthored = (state) => state.headVersion === null && state.publishedVersion === null && state.versions.length === 0;
var canMountPublication = (state) => isUnauthored(state) || !!state.headVersion && !!state.publishedVersion;

// src/editor/use-local-session.ts
import { useEffect as useEffect4, useRef as useRef5, useState as useState10 } from "react";

// src/editor/local-session.ts
var copy = (value) => JSON.parse(JSON.stringify(value));
var equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var sameOwner = (a, b) => a.entry === b.entry && a.user === b.user;
var sessionKey = (identity) => JSON.stringify([identity.entry, identity.user, identity.base]);
var LocalSession = class _LocalSession {
  state;
  constructor(identity, body, pageSettings = null) {
    if (!identity.entry || !identity.user || identity.base !== null && (typeof identity.base !== "string" || !identity.base)) throw new Error("A Local Session requires an entry/user/base identity.");
    this.state = { format: 1, identity: copy(identity), history: [copy(body)], cursor: 0, savedBody: copy(body), settingsHistory: [copy(pageSettings)], savedSettings: copy(pageSettings) };
  }
  static resume(identity, snapshot, initialSettings = null) {
    if (snapshot?.source && (typeof snapshot.source.text !== "string" || typeof snapshot.source.printed !== "string" || !Array.isArray(snapshot.source.body))) throw new Error("Invalid persisted source session.");
    if (!snapshot || snapshot.format !== 1 || !snapshot.identity || sessionKey(identity) !== sessionKey(snapshot.identity)) throw new Error("Local Session identity differs.");
    if (!Array.isArray(snapshot.history) || !snapshot.history.length || !snapshot.history.every(Array.isArray) || !Array.isArray(snapshot.savedBody) || !Number.isInteger(snapshot.cursor) || snapshot.cursor < 0 || snapshot.cursor >= snapshot.history.length) throw new Error("Invalid persisted session.");
    if (snapshot.settingsHistory !== void 0 && (!Array.isArray(snapshot.settingsHistory) || snapshot.settingsHistory.length !== snapshot.history.length || snapshot.settingsHistory.some((value) => value !== null && (typeof value !== "object" || Array.isArray(value))))) throw new Error("Invalid persisted page settings.");
    const session = new _LocalSession(identity, []);
    session.state = copy(snapshot);
    if (!session.state.settingsHistory) {
      session.state.settingsHistory = session.state.history.map(() => copy(initialSettings));
      session.state.savedSettings = copy(initialSettings);
    }
    return session;
  }
  /** Called only after the author chooses Restore unsaved changes; never a silent merge. */
  static restoreUnsaved(identity, serverBody, snapshot, serverSettings = null) {
    if (!sameOwner(identity, snapshot.identity)) throw new Error("Local Session identity differs.");
    const session = _LocalSession.resume(snapshot.identity, snapshot, serverSettings);
    session.state.identity = copy(identity);
    session.state.savedBody = copy(serverBody);
    session.state.savedSettings = copy(serverSettings);
    return session;
  }
  get identity() {
    return copy(this.state.identity);
  }
  get body() {
    return copy(this.state.history[this.state.cursor]);
  }
  get pageSettings() {
    return copy(this.state.settingsHistory?.[this.state.cursor] ?? null);
  }
  get dirty() {
    return !!this.state.source || !equal(this.body, this.state.savedBody) || !equal(this.pageSettings, this.state.savedSettings ?? null);
  }
  get source() {
    return this.state.source ? copy(this.state.source) : null;
  }
  beginSource(text, printedBody = this.body) {
    if (!equal(printedBody, this.body)) throw new Error("The Local Session changed while printing. Open Source Mode again.");
    if (!this.state.source) this.state.source = { text, printed: text, body: copy(printedBody) };
  }
  editSource(text) {
    if (!this.state.source) throw new Error("Source Mode is not open.");
    this.state.source.text = text;
  }
  applySource(body) {
    if (!this.state.source) throw new Error("Source Mode is not open.");
    delete this.state.source;
    this.change(body);
  }
  discardSource() {
    delete this.state.source;
  }
  get canUndo() {
    return this.state.cursor > 0;
  }
  get canRedo() {
    return this.state.cursor + 1 < this.state.history.length;
  }
  change(body, pageSettings = this.pageSettings) {
    if (this.state.source) throw new Error("Apply or discard Source Mode before editing blocks.");
    if (equal(body, this.body) && equal(pageSettings, this.pageSettings)) return;
    this.state.settingsHistory ??= this.state.history.map(() => null);
    this.state.settingsHistory.splice(this.state.cursor + 1);
    this.state.settingsHistory.push(copy(pageSettings));
    this.state.history.splice(this.state.cursor + 1);
    this.state.history.push(copy(body));
    this.state.cursor++;
  }
  undo() {
    if (!this.state.source && this.canUndo) this.state.cursor--;
  }
  redo() {
    if (!this.state.source && this.canRedo) this.state.cursor++;
  }
  /** Save advances the server base, but deliberately preserves undo/redo and the session. */
  saved(base, savedBody = this.body, savedSettings = this.pageSettings) {
    if (this.state.source) throw new Error("Apply or discard Source Mode before saving.");
    if (!base) throw new Error("A saved Local Session requires a base.");
    this.state.identity.base = base;
    this.state.savedBody = copy(savedBody);
    this.state.savedSettings = copy(savedSettings);
  }
  snapshot() {
    return copy(this.state);
  }
};
var IndexedDbSessions = class {
  database;
  constructor(factory = indexedDB) {
    this.database = new Promise((resolve, reject) => {
      const request = factory.open("beam-editor-local-sessions", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("sessions");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Local Session storage is blocked by another tab."));
    });
  }
  async read(identity) {
    const rows = await this.forEntry(identity.entry, identity.user);
    return rows.find((row) => row.identity.base === identity.base);
  }
  async forEntry(entry, user) {
    const database = await this.database;
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("sessions", "readonly");
      const request = transaction.objectStore("sessions").getAll();
      request.onsuccess = () => resolve(request.result.filter((row) => row.identity?.entry === entry && row.identity?.user === user));
      request.onerror = () => reject(request.error);
    });
  }
  /** Atomic replacement when Save changes the base; the old key cannot remain as a false conflict. */
  async write(snapshot, previousIdentity) {
    LocalSession.resume(snapshot.identity, snapshot);
    const database = await this.database;
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("sessions", "readwrite");
      const store = transaction.objectStore("sessions");
      if (previousIdentity) {
        if (!sameOwner(previousIdentity, snapshot.identity)) {
          transaction.abort();
          reject(new Error("Local Session identity differs."));
          return;
        }
        store.delete(sessionKey(previousIdentity));
      }
      store.put(copy(snapshot), sessionKey(snapshot.identity));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error("Local Session write aborted."));
    });
  }
  async discard(identity) {
    const database = await this.database;
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("sessions", "readwrite");
      transaction.objectStore("sessions").delete(sessionKey(identity));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
  async close() {
    (await this.database).close();
  }
};

// src/editor/use-local-session.ts
function useLocalSession(entry, user, base, body, enabled, pageSettings = null) {
  const [session, setSession] = useState10(null);
  const [pending, setPending] = useState10(null);
  const [error, setError] = useState10(null);
  const [, render] = useState10(0);
  const store = useRef5(null);
  const serial = useRef5(Promise.resolve());
  const persisted = useRef5(void 0);
  const server = useRef5({ body, base, pageSettings });
  server.current = { body, base, pageSettings };
  useEffect4(() => {
    if (!enabled || base === void 0) return;
    if (!user) {
      setError("The editor requires an authenticated user identity for its Local Session.");
      return;
    }
    let live = true;
    const identity = { entry, user, base };
    const database = new IndexedDbSessions();
    store.current = database;
    database.forEntry(entry, user).then((rows) => {
      if (!live) return;
      const exact = rows.find((row) => row.identity.base === base);
      if (exact) {
        const resumed = LocalSession.resume(identity, exact, pageSettings);
        persisted.current = identity;
        setSession(resumed);
      } else if (rows.length) {
        setPending(rows[rows.length - 1]);
      } else setSession(new LocalSession(identity, body, pageSettings));
    }).catch((reason) => live && setError(String(reason)));
    return () => {
      live = false;
      void serial.current.finally(() => database.close());
    };
  }, [entry, user, enabled]);
  const persist = (next) => {
    const snapshot = next.snapshot();
    const previous = persisted.current;
    persisted.current = snapshot.identity;
    serial.current = serial.current.then(() => store.current.write(snapshot, previous));
    void serial.current.catch((reason) => setError(String(reason)));
    render((value) => value + 1);
  };
  const recover = async (restore) => {
    if (!pending || !user || server.current.base === void 0) return;
    const identity = { entry, user, base: server.current.base };
    const next = restore ? LocalSession.restoreUnsaved(identity, server.current.body, pending, server.current.pageSettings) : new LocalSession(identity, server.current.body, server.current.pageSettings);
    persisted.current = pending.identity;
    setSession(next);
    setPending(null);
    persist(next);
  };
  return {
    session,
    pending,
    error,
    recover,
    beginSource(text, printedBody) {
      if (session) {
        session.beginSource(text, printedBody);
        persist(session);
      }
    },
    editSource(text) {
      if (session) {
        session.editSource(text);
        persist(session);
      }
    },
    applySource(body2) {
      if (session) {
        session.applySource(body2);
        persist(session);
      }
    },
    discardSource() {
      if (session) {
        session.discardSource();
        persist(session);
      }
    },
    change(next, settings) {
      if (session) {
        session.change(next, settings);
        persist(session);
      }
    },
    undo() {
      if (session) {
        session.undo();
        persist(session);
      }
    },
    redo() {
      if (session) {
        session.redo();
        persist(session);
      }
    },
    saved(nextBase, savedBody, settings) {
      if (session) {
        session.saved(nextBase, savedBody, settings);
        persist(session);
      }
    },
    reset(nextBase, nextBody, settings = null) {
      if (!user) return;
      const next = new LocalSession({ entry, user, base: nextBase }, nextBody, settings);
      setSession(next);
      persist(next);
    },
    async flushed() {
      await serial.current;
    }
  };
}

// src/canvas/PageEditor.tsx
import { Fragment as Fragment8, jsx as jsx18, jsxs as jsxs13 } from "react/jsx-runtime";
var EMPTY_DOC2 = [
  { kind: "block", name: "div", isComponent: false, props: [], children: [], dynamic: false }
];
var isDoc = (b) => Array.isArray(b) && b.length > 0 && b.every((n) => !!n && typeof n === "object" && "kind" in n);
var isSelectedNodeComponent = (doc, path) => {
  const node = getAt(doc, path);
  return !!node && isJsonBlock(node) && node.isComponent;
};
var editModeStore = {
  current: false,
  listeners: /* @__PURE__ */ new Set(),
  listening: false
};
function subscribeEditMode(onChange) {
  editModeStore.listeners.add(onChange);
  if (!editModeStore.listening && typeof window !== "undefined") {
    editModeStore.listening = true;
    window.addEventListener("beam-ux:mode", (e) => {
      const next = e.detail?.mode === "window";
      if (next === editModeStore.current) return;
      editModeStore.current = next;
      for (const listener of editModeStore.listeners) listener();
    });
  }
  return () => {
    editModeStore.listeners.delete(onChange);
  };
}
function useEditMode() {
  return useSyncExternalStore(
    subscribeEditMode,
    () => editModeStore.current,
    () => false
  );
}
function __resetEditMode() {
  editModeStore.current = false;
  for (const listener of editModeStore.listeners) listener();
}
function PageEditor({
  slug,
  body = null,
  pageSettings = null,
  transport,
  notify,
  theme: theme2,
  fallbackDoc,
  brand,
  entryId,
  userId,
  reloadToken
}) {
  const editing = useEditMode();
  const initial = isDoc(body) ? body : fallbackDoc?.(slug) ?? EMPTY_DOC2;
  const [doc, setDoc] = useState11(initial);
  const docRef = useRef6(doc);
  docRef.current = doc;
  const editedRef = useRef6(false);
  const onCanvasChange = (next) => {
    docRef.current = next;
    editedRef.current = true;
    local.change(next);
    setDoc(next);
  };
  useEffect5(() => {
    if (reloadToken === void 0) return;
    setDoc(isDoc(body) ? body : fallbackDoc?.(slug) ?? EMPTY_DOC2);
  }, [reloadToken]);
  const mount = useEditShellMountController();
  const registry = useMemo3(() => createCanvasWidgetRegistry(), []);
  const [leftOpen, setLeftOpen] = useState11(true);
  const [rightOpen, setRightOpen] = useState11(false);
  useEffect5(() => {
    if (mount.selectedNodeId) setRightOpen(true);
  }, [mount.selectedNodeId]);
  const publishable = !!(transport.saveDraft && transport.publish && transport.listVersions && transport.restoreVersion);
  const [publication, setPublication] = useState11(null);
  const [publicationError, setPublicationError] = useState11(null);
  const [conflict, setConflict] = useState11(false);
  const canvasConfig = useCanvas();
  const local = useLocalSession(entryId ?? slug, userId, publication?.headVersion, initial, editing && !!publication, pageSettings ?? null);
  useEffect5(() => {
    if (!local.session) return;
    const current = local.session.body;
    docRef.current = current;
    setDoc(current);
    editedRef.current = local.session.dirty;
    mount.markDirty(local.session.dirty);
  }, [local.session, local.session?.snapshot().cursor, JSON.stringify(local.session?.body), local.session?.dirty]);
  const onUndo = async () => {
    await mount.flush();
    local.undo();
  };
  const onRedo = async () => {
    await mount.flush();
    local.redo();
  };
  const canUndo = local.session?.canUndo ?? false;
  const canRedo = local.session?.canRedo ?? false;
  const [versionsOpen, setVersionsOpen] = useState11(false);
  const [pendingRestore, setPendingRestore] = useState11(null);
  const [confirmClear, setConfirmClear] = useState11(false);
  const [busy, setBusy] = useState11(false);
  const askedForPublication = useRef6(false);
  useEffect5(() => {
    if (!editing || !publishable || askedForPublication.current) return;
    askedForPublication.current = true;
    let live = true;
    transport.listVersions?.(slug).then((state) => {
      if (!live) return;
      if (!canMountPublication(state)) {
        setPublicationError("This entry has no Publication Pin. Publish its baseline before mounting the editor.");
      } else setPublication(state);
    }).catch(() => live && setPublicationError("Could not load publication history. Verify the versions and publication-pin migrations."));
    return () => {
      live = false;
    };
  }, [editing, publishable, slug]);
  if (!editing) {
    return /* @__PURE__ */ jsx18(TreeRender, { tree: doc });
  }
  const exit = () => window.dispatchEvent(new CustomEvent("beam-ux:exit"));
  const saveDraft = async () => {
    if (local.session?.source) {
      notify?.error("Apply or discard Source Mode before saving.");
      return;
    }
    if (!transport.saveDraft || !local.session) return;
    setBusy(true);
    try {
      await mount.flush();
      const sent = docRef.current;
      const sentSettings = local.session.pageSettings;
      const next = sentSettings ? await transport.saveDraft(slug, sent, local.session.identity.base, sentSettings) : await transport.saveDraft(slug, sent, local.session.identity.base);
      setPublication(next);
      if (!next.headVersion) throw new Error("Save returned no version.");
      local.saved(next.headVersion, sent, sentSettings);
      mount.markDirty(false);
      editedRef.current = false;
      notify?.success("Draft saved");
      return next;
    } catch (error) {
      if (error?.status === 409) setConflict(true);
      else notify?.error("Draft save failed");
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    if (!transport.publish || !publication || !local.session) return;
    let ref = local.session.identity.base;
    if (isUnauthored(publication)) {
      const draft = await saveDraft();
      if (!draft?.headVersion) return;
      ref = draft.headVersion;
    }
    if (!ref) return;
    setBusy(true);
    try {
      const next = await transport.publish(slug, ref);
      setPublication(next);
      if (next.compileError) notify?.error(next.compileError);
      else notify?.success(next.release && next.release.status !== "published" ? "Release submitted for review" : "Published");
    } catch {
      notify?.error("Publish failed");
    } finally {
      setBusy(false);
    }
  };
  const publishNow = async () => {
    await mount.flush();
    if ((local.session?.dirty || editedRef.current) && !(publication && isUnauthored(publication))) {
      notify?.error("Save your draft before publishing it.");
      return;
    }
    return publish();
  };
  const toggleVersions = async () => {
    const opening = !versionsOpen;
    setVersionsOpen(opening);
    setPendingRestore(null);
    if (!opening) return;
    setRightOpen(false);
    setBusy(true);
    try {
      if (transport.listVersions) setPublication(await transport.listVersions(slug));
    } catch {
      notify?.error("Could not load the version history");
    } finally {
      setBusy(false);
    }
  };
  const restore = async (version) => {
    await mount.flush();
    if (local.session?.dirty || editedRef.current) {
      notify?.error("Save or discard unsaved changes before restoring History.");
      return;
    }
    if (!transport.restoreVersion) return;
    setBusy(true);
    try {
      const next = await transport.restoreVersion(slug, version.id);
      setPublication(next);
      setPendingRestore(null);
      if (transport.loadBody) {
        const restored = await transport.loadBody(slug);
        if (Array.isArray(restored?.body) && next.headVersion) {
          local.reset(next.headVersion, restored.body, restored.pageSettings);
          setDoc(restored.body);
        }
        mount.markDirty(false);
        notify?.success(`Restored ${version.readable}`);
      } else {
        notify?.success(`Restored ${version.readable} \u2014 reload to edit it`);
      }
    } catch {
      notify?.error(`Could not restore ${version.readable}`);
    } finally {
      setBusy(false);
    }
  };
  const clearContent = async () => {
    if (local.session?.source) {
      notify?.error("Apply or discard Source Mode before clearing.");
      return;
    }
    if (!transport.clearBody) return;
    setBusy(true);
    try {
      const next = await transport.clearBody(slug);
      if (next && typeof next === "object" && "versions" in next) {
        const state = next;
        setPublication(state);
        if (state.headVersion) local.reset(state.headVersion, []);
      }
      setDoc([]);
      mount.markDirty(false);
      setConfirmClear(false);
      notify?.success("Content removed");
    } catch {
      notify?.error("Could not remove the content");
    } finally {
      setBusy(false);
    }
  };
  if (!publishable || !entryId || !userId) return /* @__PURE__ */ jsx18("div", { role: "alert", children: "The editor requires an entry, authenticated user, and publication transport." });
  if (publicationError || local.error) return /* @__PURE__ */ jsx18("div", { role: "alert", children: publicationError ?? local.error });
  if (local.pending) return /* @__PURE__ */ jsxs13("div", { role: "alertdialog", "aria-label": "Unsaved session base moved", children: [
    /* @__PURE__ */ jsxs13("p", { children: [
      "The server version changed. Restore unsaved changes from ",
      local.pending.identity.base,
      " or discard them?"
    ] }),
    /* @__PURE__ */ jsx18("button", { onClick: () => void local.recover(true), children: "Restore unsaved changes" }),
    /* @__PURE__ */ jsx18("button", { onClick: () => void local.recover(false), children: "Discard" })
  ] });
  if (!local.session) return /* @__PURE__ */ jsx18("div", { role: "status", children: "Loading Local Session\u2026" });
  const resolveConflict = async (keepOurs) => {
    if (local.session?.source) {
      notify?.error("Apply or discard Source Mode before resolving the conflict.");
      return;
    }
    if (!transport.listVersions || !transport.loadBody || !transport.saveDraft) return;
    try {
      const current = await transport.listVersions(slug);
      if (!current.headVersion) throw new Error("No current version");
      if (keepOurs) {
        const sent = docRef.current;
        const sentSettings = local.session?.pageSettings ?? null;
        const next = sentSettings ? await transport.saveDraft(slug, sent, current.headVersion, sentSettings) : await transport.saveDraft(slug, sent, current.headVersion);
        if (!next.headVersion) throw new Error("No saved version");
        local.saved(next.headVersion, sent, sentSettings);
        setPublication(next);
      } else {
        const envelope = await transport.loadBody(slug);
        if (!Array.isArray(envelope.body)) throw new Error("No current body");
        local.reset(current.headVersion, envelope.body, envelope.pageSettings);
        setPublication(current);
      }
      setConflict(false);
    } catch {
      notify?.error("The current version changed again; reload the conflict before retrying.");
    }
  };
  return /* @__PURE__ */ jsx18(WidgetRegistryContext.Provider, { value: registry, children: /* @__PURE__ */ jsxs13(EditShellMountProvider, { value: mount, children: [
    /* @__PURE__ */ jsx18("style", { dangerouslySetInnerHTML: { __html: veCss(theme2) + peCss(theme2) } }),
    conflict && /* @__PURE__ */ jsxs13("div", { role: "alertdialog", "aria-label": "Save conflict", children: [
      /* @__PURE__ */ jsx18("p", { children: "The server draft changed. Choose which work to keep." }),
      /* @__PURE__ */ jsx18("button", { onClick: () => void resolveConflict(false), children: "Reload theirs" }),
      /* @__PURE__ */ jsx18("button", { onClick: () => void resolveConflict(true), children: "Save ours as a new version" })
    ] }),
    /* @__PURE__ */ jsx18(CanvasClearance, { panels: `${leftOpen}-${rightOpen}-${versionsOpen}-${confirmClear}`, children: /* @__PURE__ */ jsx18(
      SourceMode,
      {
        local,
        allowed: !canvasConfig.profile || !("x-admits-code" in canvasConfig.profile) || canvasConfig.profile["x-admits-code"] !== false,
        conversion: transport.printSource && transport.readSource ? {
          print: (body2) => transport.printSource(slug, body2),
          read: (source, body2) => transport.readSource(slug, source, body2)
        } : void 0,
        children: /* @__PURE__ */ jsx18(CanvasWidget, { value: doc, onChange: onCanvasChange, editShellMount: mount, theme: theme2, hideBreadcrumb: true })
      }
    ) }),
    /* @__PURE__ */ jsxs13("div", { className: "pe-bar", children: [
      /* @__PURE__ */ jsxs13("span", { className: "pe-brand", children: [
        /* @__PURE__ */ jsx18("span", { className: "pe-mark" }),
        brand ?? `editing \xB7 ${slug}`
      ] }),
      !local.session.source && local.session.pageSettings && /* @__PURE__ */ jsx18(PageSettings, { value: local.session.pageSettings, onChange: (settings) => local.change(local.session.body, settings) }),
      /* @__PURE__ */ jsx18("span", { style: { flex: 1 } }),
      /* @__PURE__ */ jsxs13(Fragment8, { children: [
        /* @__PURE__ */ jsx18("button", { className: "pe-btn", onClick: onUndo, disabled: !canUndo, title: "Undo", children: "\u21B6 Undo" }),
        /* @__PURE__ */ jsx18("button", { className: "pe-btn", onClick: onRedo, disabled: !canRedo, title: "Redo", children: "\u21B7 Redo" })
      ] }),
      /* @__PURE__ */ jsx18("button", { className: "pe-btn", onClick: () => setLeftOpen((v) => !v), children: "Insert" }),
      /* @__PURE__ */ jsx18("button", { className: "pe-btn", onClick: () => setRightOpen((v) => !v), children: "Inspector" }),
      publishable && /* @__PURE__ */ jsxs13(Fragment8, { children: [
        publication?.draftPending && /* @__PURE__ */ jsxs13("span", { className: "pe-draft", children: [
          "Draft pending",
          publication.publishedReadable ? ` \xB7 readers see ${publication.publishedReadable}` : ""
        ] }),
        /* @__PURE__ */ jsx18(
          "button",
          {
            className: "pe-btn",
            onClick: saveDraft,
            disabled: busy,
            title: "Save a version that readers do not see yet",
            children: "Save draft"
          }
        ),
        /* @__PURE__ */ jsx18("button", { className: "pe-btn", onClick: toggleVersions, disabled: busy, children: "Versions" })
      ] }),
      transport.clearBody && /* @__PURE__ */ jsx18(
        "button",
        {
          className: "pe-btn",
          onClick: () => setConfirmClear(true),
          disabled: busy,
          children: "Remove content"
        }
      ),
      /* @__PURE__ */ jsx18(
        "button",
        {
          className: "pe-btn primary",
          onClick: publishNow,
          disabled: busy,
          title: "Publish what is on the canvas: readers see it now",
          children: "Publish"
        }
      ),
      /* @__PURE__ */ jsx18("button", { className: "pe-btn", onClick: exit, children: "Exit" })
    ] }),
    confirmClear && /* @__PURE__ */ jsx18("div", { className: "pe-panel pe-clear", children: /* @__PURE__ */ jsxs13("div", { className: "pe-confirm", role: "alertdialog", "aria-label": "Confirm remove content", children: [
      /* @__PURE__ */ jsx18("span", { children: "Clear this draft? The published page stays unchanged until Publish. Earlier bodies remain in History." }),
      /* @__PURE__ */ jsxs13("div", { className: "pe-confirm-actions", children: [
        /* @__PURE__ */ jsx18("button", { className: "pe-btn primary", onClick: clearContent, disabled: busy, children: "Confirm remove" }),
        /* @__PURE__ */ jsx18("button", { className: "pe-btn", onClick: () => setConfirmClear(false), children: "Cancel" })
      ] })
    ] }) }),
    leftOpen && /* @__PURE__ */ jsx18("aside", { className: "pe-panel pe-left", children: /* @__PURE__ */ jsx18(CanvasPalette, {}) }),
    publication?.release && transport.releaseCommand && /* @__PURE__ */ jsx18(
      ReleasePanel,
      {
        release: publication.release,
        entries: [{ id: publication.id, title: slug, versions: publication.versions.map((version) => ({ id: version.id, label: version.readable ?? version.id })) }],
        onCommand: async (command) => {
          const release = await transport.releaseCommand(publication.release.id, command);
          const state = await transport.listVersions(slug);
          setPublication({ ...state, release });
        }
      }
    ),
    versionsOpen && /* @__PURE__ */ jsxs13("aside", { className: "pe-panel pe-versions", "aria-label": "Versions", children: [
      /* @__PURE__ */ jsx18("h3", { children: "Versions" }),
      pendingRestore && /* @__PURE__ */ jsxs13("div", { className: "pe-confirm", role: "alertdialog", "aria-label": "Confirm restore", children: [
        /* @__PURE__ */ jsxs13("span", { children: [
          "Restore ",
          pendingRestore.readable,
          " into a new draft? Publish remains separate."
        ] }),
        /* @__PURE__ */ jsxs13("div", { className: "pe-confirm-actions", children: [
          /* @__PURE__ */ jsx18(
            "button",
            {
              className: "pe-btn primary",
              onClick: () => restore(pendingRestore),
              disabled: busy,
              children: "Confirm restore"
            }
          ),
          /* @__PURE__ */ jsx18("button", { className: "pe-btn", onClick: () => setPendingRestore(null), children: "Cancel" })
        ] })
      ] }),
      publication === null && /* @__PURE__ */ jsx18("div", { className: "pe-version", children: "Loading\u2026" }),
      publication !== null && publication.versions.length === 0 && /* @__PURE__ */ jsx18("div", { className: "pe-version", children: "Nothing recorded yet \u2014 a draft, a publish or a save records the first version." }),
      publication?.versions.map((version) => /* @__PURE__ */ jsxs13("div", { className: "pe-version", children: [
        /* @__PURE__ */ jsxs13("span", { className: "pe-version-text", children: [
          /* @__PURE__ */ jsx18("span", { className: "pe-version-ref", title: version.readable, children: version.readable }),
          version.label && /* @__PURE__ */ jsx18("span", { className: "pe-version-label", title: version.label, children: version.label })
        ] }),
        version.isPublished && /* @__PURE__ */ jsx18("span", { className: "pe-version-tag published", children: "published" }),
        version.isHead && !version.isPublished && /* @__PURE__ */ jsx18("span", { className: "pe-version-tag head", children: "draft" }),
        !version.isPublished && /* @__PURE__ */ jsx18(
          "button",
          {
            className: "pe-btn",
            "aria-label": `Restore ${version.readable}`,
            onClick: () => setPendingRestore(version),
            disabled: busy,
            children: "Restore"
          }
        )
      ] }, version.id))
    ] }),
    rightOpen && !versionsOpen && /* @__PURE__ */ jsxs13("aside", { className: "pe-panel pe-right", children: [
      mount.selectedNodeId && /* @__PURE__ */ jsxs13(Fragment8, { children: [
        /* @__PURE__ */ jsx18(Breadcrumb, { doc, path: mount.selectedNodeId, onSelect: mount.selectNode }),
        isSelectedNodeComponent(doc, mount.selectedNodeId) && /* @__PURE__ */ jsx18("div", { className: "pe-comp-badge", children: "\u25C6 component" })
      ] }),
      /* @__PURE__ */ jsx18(BlockInspector, {})
    ] })
  ] }) });
}

// src/canvas/format.ts
var CANVAS_FORMATS = ["tsx"];
function canvasAcceptsFormat(format) {
  return typeof format === "string" && CANVAS_FORMATS.includes(format);
}
function canvasRefusalFor(format) {
  return typeof format === "string" && format !== "" ? `This page is authored as ${format} source, which the visual editor cannot open \u2014 it edits a block document, and saving one here would replace the ${format} source with an empty file. Edit its source file instead.` : "This page does not say what it is authored as, so the visual editor will not open it \u2014 opening the wrong editor is how a page loses its source. Bind the entry (its id and format) to the page first.";
}

export {
  VIEW_GATE_ATTR,
  EDIT_GATE_ATTR,
  RESERVED_ATTRS,
  editGateOf,
  viewGateOf,
  blockToProps,
  islandProps,
  attrsView,
  blockText,
  applyAttrs,
  setAttrs,
  CanvasProvider,
  useCanvas,
  isIsland,
  isEditGated,
  renderNode,
  TreeRender,
  edgeAt,
  CanvasNode,
  Breadcrumb,
  ContextMenu,
  attrsSchemaFor,
  DEFAULT_CANVAS_THEME,
  selectionCss,
  dropIndicatorCss,
  veCss,
  peCss,
  insertRelativeTo,
  DEFAULT_BLOCK_TEMPLATES,
  DEFAULT_CLASS_SUGGESTIONS,
  DEFAULT_VAR_SUGGESTIONS,
  TEMPLATE_DATA_KEY,
  CanvasWidget,
  CanvasPalette,
  ClassChipsWidget,
  StyleRowsWidget,
  CANVAS_WIDGET_NAME,
  createCanvasWidgetRegistry,
  VisualEditor,
  SourceMode,
  PageSettings,
  isUnauthored,
  canMountPublication,
  useLocalSession,
  useEditMode,
  __resetEditMode,
  PageEditor,
  CANVAS_FORMATS,
  canvasAcceptsFormat,
  canvasRefusalFor
};
//# sourceMappingURL=chunk-5ZAUHANC.js.map