import {
  VOID_TAGS,
  duplicateAt,
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
  setText,
  styleRows,
  updateAt
} from "./chunk-LYRQZG2C.js";

// src/canvas/context.tsx
import { createContext, useContext } from "react";

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
function blockToProps(block2) {
  const out = {};
  for (const p of block2.props) {
    if (p.kind === "expression") continue;
    if (p.name === "className") out.className = String(p.value ?? "");
    else if (p.name === "style" && p.kind === "string") out.style = parseStyle(String(p.value ?? ""));
    else out[p.name] = p.value;
  }
  return out;
}
function islandProps(block2) {
  const out = {};
  for (const p of block2.props) {
    if (p.kind === "expression") continue;
    out[p.name] = p.value;
  }
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

// src/canvas/context.tsx
import { jsx } from "react/jsx-runtime";
var CanvasContext = createContext(null);
function CanvasProvider({ config, children }) {
  return /* @__PURE__ */ jsx(CanvasContext.Provider, { value: config, children });
}
function useCanvas() {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("useCanvas() must be used within a <CanvasProvider>.");
  return ctx;
}
var isIsland = (config, name) => name !== null && Object.prototype.hasOwnProperty.call(config.registry, name);
var isEditGated = (config, block2) => {
  const key = editGateOf(block2);
  return key !== null && config.can !== void 0 && !config.can[key];
};

// src/canvas/CanvasNode.tsx
import React, { useEffect, useRef } from "react";

// src/canvas/TreeRender.tsx
import { createElement } from "react";
import { Fragment, jsx as jsx2 } from "react/jsx-runtime";
function renderNode(node, path, config) {
  if (isJsonText(node)) return node.value;
  if (isJsonOpaque(node)) {
    return createElement("pre", { key: path, className: "ve-opaque-src" }, node.source);
  }
  const block2 = node;
  if (block2.name === "Mdx") {
    const file = propValue(block2, "file");
    const md = propValue(block2, "md");
    return /* @__PURE__ */ jsx2(
      config.MdxView,
      {
        file: file !== void 0 ? String(file) : void 0,
        md: md !== void 0 ? String(md) : void 0
      },
      path
    );
  }
  if (isIsland(config, block2.name)) {
    return createElement(config.registry[block2.name], {
      key: path,
      ...islandProps(block2)
    });
  }
  const tag = block2.name ?? "div";
  const props = { key: path, ...blockToProps(block2) };
  if (VOID_TAGS.has(tag)) return createElement(tag, props);
  return createElement(
    tag,
    props,
    block2.children.map((c, i) => renderNode(c, `${path}.${i}`, config))
  );
}
function TreeRender({ tree }) {
  const config = useCanvas();
  const roots = Array.isArray(tree) ? tree : [tree];
  return /* @__PURE__ */ jsx2(Fragment, { children: roots.map((n, i) => renderNode(n, String(i), config)) });
}

// src/canvas/CanvasNode.tsx
import { Fragment as Fragment2, jsx as jsx3, jsxs } from "react/jsx-runtime";
function edgeAt(el, clientY) {
  const rect = el.getBoundingClientRect();
  return clientY - rect.top < rect.height / 2 ? "before" : "after";
}
function CanvasNode({ node, path, editing, onEditText, onEditMd, dnd }) {
  const config = useCanvas();
  const { MdxEdit, registry } = config;
  const hostRef = useRef(null);
  const isEditingThis = node.kind === "block" && editing === path && isLeafText(node);
  useEffect(() => {
    if (!isEditingThis || !hostRef.current) return;
    const el = hostRef.current;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [isEditingThis]);
  if (isJsonText(node)) return /* @__PURE__ */ jsx3(Fragment2, { children: node.value });
  if (isJsonOpaque(node)) {
    return /* @__PURE__ */ jsx3(
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
        children: /* @__PURE__ */ jsx3("pre", { className: "ve-opaque-src", style: { pointerEvents: "none" }, children: node.source })
      }
    );
  }
  const block2 = node;
  if (block2.name === "Mdx") {
    const file = propValue(block2, "file");
    const md = propValue(block2, "md");
    return /* @__PURE__ */ jsxs("div", { "data-bd-path": path, className: "ve-mdx-block", children: [
      /* @__PURE__ */ jsxs(
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
      /* @__PURE__ */ jsx3("div", { "data-mdx-edit": true, children: /* @__PURE__ */ jsx3(
        MdxEdit,
        {
          file: file !== void 0 ? String(file) : void 0,
          md: md !== void 0 ? String(md) : void 0,
          onChange: (next) => onEditMd?.(path, next)
        }
      ) })
    ] });
  }
  if (isEditGated(config, block2)) {
    return /* @__PURE__ */ jsx3(
      "div",
      {
        "data-bd-path": path,
        className: "ve-island ve-gated",
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
        title: `Sealed \u2014 editing requires "${editGateOf(block2)}"`,
        children: /* @__PURE__ */ jsx3("div", { style: { pointerEvents: "none" }, children: renderNode(block2, path, config) })
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
    ...blockToProps(block2)
  };
  if (isIsland(config, block2.name)) {
    const Comp = registry[block2.name];
    return /* @__PURE__ */ jsx3("div", { ...props, className: "ve-island", children: /* @__PURE__ */ jsx3("div", { style: { pointerEvents: "none" }, children: /* @__PURE__ */ jsx3(Comp, { ...islandProps(block2) }) }) });
  }
  const tag = block2.name ?? "div";
  if (VOID_TAGS.has(tag)) {
    return React.createElement(tag, props);
  }
  if (isEditingThis) {
    return React.createElement(
      tag,
      {
        ...props,
        ref: hostRef,
        contentEditable: true,
        suppressContentEditableWarning: true,
        onBlur: (e) => onEditText(path, e.currentTarget.textContent ?? ""),
        onKeyDown: (e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.currentTarget.textContent = childText(block2);
            e.currentTarget.blur();
          }
        }
      },
      childText(block2)
    );
  }
  return React.createElement(
    tag,
    props,
    block2.children.map((c, i) => /* @__PURE__ */ jsx3(
      CanvasNode,
      {
        node: c,
        path: `${path}.${i}`,
        editing,
        onEditText,
        onEditMd,
        dnd
      },
      `${path}.${i}`
    ))
  );
}
function childText(block2) {
  return block2.children.map((c) => isJsonText(c) ? c.value : "").join("");
}

// src/canvas/Breadcrumb.tsx
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function labelFor(doc, path) {
  const node = getAt(doc, path);
  if (!node) return "?";
  if (isJsonBlock(node)) return node.name ?? "fragment";
  return node.kind;
}
function Breadcrumb({ doc, path, onSelect }) {
  const segments = path.split(".").map((_, i, arr) => arr.slice(0, i + 1).join("."));
  return /* @__PURE__ */ jsx4("nav", { className: "ve-crumbs", "aria-label": "Selection path", children: segments.map((p, i) => /* @__PURE__ */ jsxs2("span", { className: "ve-crumb-seg", children: [
    i > 0 && /* @__PURE__ */ jsx4("span", { className: "ve-crumb-sep", children: "/" }),
    /* @__PURE__ */ jsx4(
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
import { useEffect as useEffect2, useRef as useRef2, useState } from "react";
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function ContextMenu({ state, actions, onClose }) {
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const rootRef = useRef2(null);
  useEffect2(() => {
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
  return /* @__PURE__ */ jsx5(
    "div",
    {
      ref: rootRef,
      className: "ve-menu",
      style: { position: "fixed", left: state.x, top: state.y },
      children: actions.map((a) => /* @__PURE__ */ jsxs3(
        "div",
        {
          style: { position: "relative" },
          onMouseEnter: () => a.children && setOpenSubmenu(a.label),
          onMouseLeave: () => a.children && setOpenSubmenu((cur) => cur === a.label ? null : cur),
          children: [
            /* @__PURE__ */ jsxs3(
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
            a.children && openSubmenu === a.label && /* @__PURE__ */ jsx5("div", { className: "ve-menu", style: { position: "absolute", left: "100%", top: 0 }, children: a.children.map((c) => /* @__PURE__ */ jsx5(
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
import { useMemo, useRef as useRef4 } from "react";
import { FiveRegionEditShell, useEditShellMount as useEditShellMount2 } from "@schemastud/frame";

// src/canvas/CanvasPalette.tsx
import { useEditShellMount } from "@schemastud/frame";

// src/canvas/CanvasWidget.tsx
import { useEffect as useEffect3, useRef as useRef3, useState as useState2 } from "react";

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
.pe-canvas{position:relative}
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
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
var TEMPLATE_DATA_KEY = "application/x-beam-ux-template";
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
    if (isJsonBlock(node)) n += countNodes(node.children);
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
  const doc = value ?? formData ?? [];
  const templates = config.blockTemplates ?? DEFAULT_BLOCK_TEMPLATES;
  const accent = theme2?.accent ?? DEFAULT_CANVAS_THEME.accent;
  const [editing, setEditing] = useState2(null);
  const [dragPath, setDragPath] = useState2(null);
  const [dropTarget, setDropTarget] = useState2(null);
  const [menu, setMenu] = useState2(null);
  const sel = mount?.selectedNodeId ?? null;
  const setSel = (path) => mount?.selectNode(path);
  const emit = (next) => {
    if (readOnly || next === doc) return;
    onChange?.(next);
    mount?.markDirty(true);
  };
  const docRef = useRef3(doc);
  docRef.current = doc;
  const emitFromRef = (next) => {
    if (readOnly || next === docRef.current) return;
    onChange?.(next);
    mount?.markDirty(true);
  };
  useEffect3(() => {
    if (!mount) return;
    return mount.registerNodeAccess({
      getNode: (nodeId) => {
        const node = getAt(docRef.current, nodeId);
        if (!node || !isJsonBlock(node)) return null;
        const { schema, attrs } = attrsSchemaFor(node, config.entitlementKeys ?? []);
        return { type: node.name ?? "fragment", attrsSchema: schema, attrs };
      },
      setNodeAttrs: (nodeId, attrs) => {
        const node = getAt(docRef.current, nodeId);
        if (!node || !isJsonBlock(node)) return;
        const next = setAttrs(node, attrs);
        if (samePropList(node.props, next.props)) return;
        emitFromRef(updateAt(docRef.current, nodeId, () => next));
      }
    });
  }, [doc, config.entitlementKeys]);
  useEffect3(() => {
    if (!mount) return;
    mount.publishCandidates(templates.map((t) => ({ nodeType: t.label, label: t.label })));
    return mount.registerInsertHandler((candidate) => {
      const nodeType = candidate?.nodeType;
      const template = templates.find((t) => t.label === nodeType);
      if (template) emitFromRef(insertRelativeTo(docRef.current, sel, template.make));
    });
  }, [doc, sel, templates]);
  useEffect3(() => {
    if (!mount) return;
    return mount.registerFlush(async () => {
      const active = document.activeElement;
      const editing2 = active?.isContentEditable || active?.getAttribute("contenteditable") === "true";
      if (active && editing2 && active.closest("[data-bd-path]")) active.blur();
    });
  }, [mount]);
  useEffect3(() => {
    mount?.publishConformance({
      nodes: countNodes(doc),
      requiredTotal: 0,
      requiredFilled: 0,
      grammarValid: true,
      incompleteNodeIds: []
    });
  }, [doc]);
  const onCanvasClick = (e) => {
    const el = e.target.closest("[data-bd-path]");
    const path = el ? el.getAttribute("data-bd-path") : null;
    if (editing && path === editing) return;
    e.preventDefault();
    setSel(path);
    setEditing(null);
  };
  const onCanvasDbl = (e) => {
    const p = e.target.closest("[data-bd-path]")?.getAttribute("data-bd-path");
    const node = p ? getAt(doc, p) : null;
    if (!readOnly && p && node && isJsonBlock(node) && isLeafText(node)) setEditing(p);
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
        const template = templates.find((t) => t.label === templateNodeType);
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
      { label: "Duplicate", onSelect: () => emit(duplicateAt(doc, path)) },
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
        children: templates.map((t) => ({
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
  return /* @__PURE__ */ jsxs4("div", { className: "ve-canvas-widget", children: [
    sel && (() => {
      const selNode = getAt(doc, sel);
      const selIsComponent = !!selNode && isJsonBlock(selNode) && selNode.isComponent;
      return /* @__PURE__ */ jsx6("style", { dangerouslySetInnerHTML: { __html: selectionCss(sel, accent, selIsComponent) } });
    })(),
    dropTarget && /* @__PURE__ */ jsx6(
      "style",
      {
        dangerouslySetInnerHTML: {
          __html: dropIndicatorCss(dropTarget.path, dropTarget.edge, accent)
        }
      }
    ),
    !hideBreadcrumb && sel && /* @__PURE__ */ jsx6(Breadcrumb, { doc, path: sel, onSelect: setSel }),
    /* @__PURE__ */ jsx6(
      "div",
      {
        className: "ve-canvas",
        onClickCapture: onCanvasClick,
        onDoubleClick: onCanvasDbl,
        onContextMenu: onCanvasContextMenu,
        children: doc.map((n, i) => /* @__PURE__ */ jsx6(
          CanvasNode,
          {
            node: n,
            path: String(i),
            editing,
            onEditText: (p, text) => {
              emit(updateAt(doc, p, (el) => isJsonBlock(el) ? setText(el, text) : el));
              setEditing(null);
            },
            onEditMd: (p, md) => emit(
              updateAt(
                doc,
                p,
                (el) => isJsonBlock(el) ? setProp(el, "md", md, "string") : el
              )
            ),
            dnd
          },
          i
        ))
      }
    ),
    menu && /* @__PURE__ */ jsx6(
      ContextMenu,
      {
        state: menu,
        onClose: () => setMenu(null),
        actions: contextMenuActions(menu.path)
      }
    )
  ] });
}

// src/canvas/CanvasPalette.tsx
import { Fragment as Fragment3, jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
function CanvasPalette() {
  const mount = useEditShellMount();
  const candidates = mount.candidates;
  if (candidates.length === 0) {
    return /* @__PURE__ */ jsx7("div", { className: "ve-pal-note", children: "Nothing insertable here" });
  }
  return /* @__PURE__ */ jsxs5(Fragment3, { children: [
    /* @__PURE__ */ jsx7("div", { className: "ve-insp-h", children: "Insert block" }),
    candidates.map((c) => /* @__PURE__ */ jsxs5(
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
    /* @__PURE__ */ jsx7("div", { className: "ve-pal-note", children: "click inserts into / after the selection \xB7 drag to drop at a specific position" })
  ] });
}

// src/canvas/widgetRegistry.ts
import { createWidgetRegistry } from "@schemastud/seam";

// src/canvas/widgets.tsx
import { useState as useState3 } from "react";
import { jsx as jsx8, jsxs as jsxs6 } from "react/jsx-runtime";
function ClassChipsWidget({ id, value, disabled, readonly, onChange }) {
  const config = useCanvas();
  const suggestions = config.classSuggestions ?? DEFAULT_CLASS_SUGGESTIONS;
  const classes = String(value ?? "").split(/\s+/).filter(Boolean);
  const [draft, setDraft] = useState3("");
  const locked = Boolean(disabled || readonly);
  return /* @__PURE__ */ jsxs6("div", { id, className: "ve-chips", "data-widget": "class-chips", children: [
    classes.map((c) => /* @__PURE__ */ jsxs6("span", { className: "ve-chip", children: [
      c,
      !locked && /* @__PURE__ */ jsx8(
        "button",
        {
          type: "button",
          onClick: () => onChange(classes.filter((x) => x !== c).join(" ")),
          children: "\xD7"
        }
      )
    ] }, c)),
    !locked && /* @__PURE__ */ jsx8(
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
    /* @__PURE__ */ jsx8("datalist", { id: `${id}-suggest`, children: suggestions.map((c) => /* @__PURE__ */ jsx8("option", { value: c }, c)) })
  ] });
}
function StyleRowsWidget({ id, value, disabled, readonly, onChange }) {
  const config = useCanvas();
  const suggestions = config.varSuggestions ?? DEFAULT_VAR_SUGGESTIONS;
  const rows = styleRows(String(value ?? ""));
  const locked = Boolean(disabled || readonly);
  return /* @__PURE__ */ jsxs6("div", { id, "data-widget": "style-rows", children: [
    rows.map((r, i) => /* @__PURE__ */ jsxs6("div", { className: "ve-kv", children: [
      /* @__PURE__ */ jsx8(
        "input",
        {
          value: r.k,
          disabled: locked,
          onChange: (e) => onChange(joinStyle(rows.map((x, j) => j === i ? { ...x, k: e.target.value } : x))),
          placeholder: "prop"
        }
      ),
      /* @__PURE__ */ jsx8(
        "input",
        {
          list: `${id}-suggest`,
          value: r.v,
          disabled: locked,
          onChange: (e) => onChange(joinStyle(rows.map((x, j) => j === i ? { ...x, v: e.target.value } : x))),
          placeholder: "value / var(--\u2026)"
        }
      ),
      !locked && /* @__PURE__ */ jsx8("button", { type: "button", onClick: () => onChange(joinStyle(rows.filter((_, j) => j !== i))), children: "\xD7" })
    ] }, i)),
    /* @__PURE__ */ jsx8("datalist", { id: `${id}-suggest`, children: suggestions.map((v) => /* @__PURE__ */ jsx8("option", { value: v }, v)) }),
    !locked && /* @__PURE__ */ jsx8(
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
import { Fragment as Fragment4, jsx as jsx9, jsxs as jsxs7 } from "react/jsx-runtime";
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
  const onChangeRef = useRef4(onChange);
  onChangeRef.current = onChange;
  const themeRef = useRef4(theme2);
  themeRef.current = theme2;
  const registry = useMemo(
    () => createCanvasWidgetRegistry((props) => /* @__PURE__ */ jsx9(CanvasWidget, { ...props, onChange: (doc) => onChangeRef.current(doc), theme: themeRef.current })),
    []
  );
  return /* @__PURE__ */ jsxs7(Fragment4, { children: [
    /* @__PURE__ */ jsx9("style", { dangerouslySetInnerHTML: { __html: veCss(theme2) } }),
    /* @__PURE__ */ jsx9(
      FiveRegionEditShell,
      {
        schema: INERT_SCHEMA,
        record: value,
        widget: CANVAS_WIDGET_NAME,
        registry,
        autosave: true,
        topBar: /* @__PURE__ */ jsx9(
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
        palette: /* @__PURE__ */ jsx9(CanvasPalette, {})
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
  const mount = useEditShellMount2();
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
  return /* @__PURE__ */ jsxs7(Fragment4, { children: [
    /* @__PURE__ */ jsxs7("span", { className: "ve-brand", children: [
      /* @__PURE__ */ jsx9("span", { className: "ve-mark" }),
      brand
    ] }),
    /* @__PURE__ */ jsx9("span", { className: "ve-hint", children: "click = select \xB7 double-click text = edit \xB7 drag = reorder \xB7 right-click = actions" }),
    /* @__PURE__ */ jsx9("span", { className: "ve-spacer" }),
    (onUndo || onRedo) && /* @__PURE__ */ jsxs7(Fragment4, { children: [
      /* @__PURE__ */ jsx9("button", { type: "button", className: "ve-toggle", onClick: onUndo, disabled: !canUndo, title: "Undo", children: "\u21B6 Undo" }),
      /* @__PURE__ */ jsx9("button", { type: "button", className: "ve-toggle", onClick: onRedo, disabled: !canRedo, title: "Redo", children: "\u21B7 Redo" })
    ] }),
    onSave && /* @__PURE__ */ jsx9("button", { type: "button", className: "ve-toggle ve-save", onClick: save, children: "Save" })
  ] });
}

// src/canvas/PageEditor.tsx
import { useEffect as useEffect4, useMemo as useMemo2, useRef as useRef5, useState as useState4, useSyncExternalStore } from "react";
import { EditShellMountProvider, Inspector as FrameInspector, useEditShellMountController } from "@schemastud/frame";
import { WidgetRegistryContext } from "@schemastud/seam";
import { Fragment as Fragment5, jsx as jsx10, jsxs as jsxs8 } from "react/jsx-runtime";
var EMPTY_DOC = [
  { kind: "block", name: "div", isComponent: false, props: [], children: [], dynamic: false }
];
var isDoc = (b) => Array.isArray(b) && b.length > 0 && b.every((n) => !!n && typeof n === "object" && "kind" in n);
var compileErrorOf = (response) => {
  if (!response || typeof response !== "object") return null;
  const value = response.compileError;
  return typeof value === "string" && value !== "" ? value : null;
};
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
  transport,
  notify,
  theme: theme2,
  fallbackDoc,
  brand,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  reloadToken
}) {
  const editing = useEditMode();
  const initial = isDoc(body) ? body : fallbackDoc?.(slug) ?? EMPTY_DOC;
  const [doc, setDoc] = useState4(initial);
  const docRef = useRef5(doc);
  docRef.current = doc;
  const editedRef = useRef5(false);
  const onCanvasChange = (next) => {
    docRef.current = next;
    editedRef.current = true;
    setDoc(next);
  };
  useEffect4(() => {
    if (reloadToken === void 0) return;
    setDoc(isDoc(body) ? body : fallbackDoc?.(slug) ?? EMPTY_DOC);
  }, [reloadToken]);
  const mount = useEditShellMountController();
  const registry = useMemo2(() => createCanvasWidgetRegistry(), []);
  const [leftOpen, setLeftOpen] = useState4(true);
  const [rightOpen, setRightOpen] = useState4(false);
  useEffect4(() => {
    if (mount.selectedNodeId) setRightOpen(true);
  }, [mount.selectedNodeId]);
  const publishable = !!(transport.saveDraft && transport.publish && transport.listVersions && transport.restoreVersion);
  const [publication, setPublication] = useState4(null);
  const [versionsOpen, setVersionsOpen] = useState4(false);
  const [pendingRestore, setPendingRestore] = useState4(null);
  const [confirmClear, setConfirmClear] = useState4(false);
  const [busy, setBusy] = useState4(false);
  const askedForPublication = useRef5(false);
  useEffect4(() => {
    if (!editing || !publishable || askedForPublication.current) return;
    askedForPublication.current = true;
    let live = true;
    transport.listVersions?.(slug).then((state) => live && setPublication(state)).catch(() => {
    });
    return () => {
      live = false;
    };
  }, [editing, publishable, slug]);
  if (!editing) {
    return /* @__PURE__ */ jsx10(TreeRender, { tree: doc });
  }
  const save = async () => {
    mount.markSaving(true);
    try {
      await mount.flush();
      const compileError = compileErrorOf(await transport.saveBody(slug, docRef.current));
      mount.markDirty(false);
      editedRef.current = false;
      if (compileError) notify?.error(compileError);
      else notify?.success("Published");
      if (publishable && transport.listVersions) setPublication(await transport.listVersions(slug));
    } catch {
      notify?.error("Publish failed");
    } finally {
      mount.markSaving(false);
    }
  };
  const exit = () => window.dispatchEvent(new CustomEvent("beam-ux:exit"));
  const saveDraft = async () => {
    if (!transport.saveDraft) return;
    setBusy(true);
    try {
      await mount.flush();
      setPublication(await transport.saveDraft(slug, docRef.current));
      mount.markDirty(false);
      editedRef.current = false;
      notify?.success("Draft saved");
    } catch {
      notify?.error("Draft save failed");
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    if (!transport.publish) return;
    setBusy(true);
    try {
      const next = await transport.publish(slug);
      setPublication(next);
      if (next.compileError) notify?.error(next.compileError);
      else notify?.success("Published");
    } catch {
      notify?.error("Publish failed");
    } finally {
      setBusy(false);
    }
  };
  const publishNow = async () => {
    await mount.flush();
    return publishable && !mount.dirty && !editedRef.current ? publish() : save();
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
    if (!transport.restoreVersion) return;
    setBusy(true);
    try {
      setPublication(await transport.restoreVersion(slug, version.readable));
      setPendingRestore(null);
      if (transport.loadBody) {
        const restored = await transport.loadBody(slug);
        if (isDoc(restored?.body)) setDoc(restored.body);
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
    if (!transport.clearBody) return;
    setBusy(true);
    try {
      const next = await transport.clearBody(slug);
      if (next && typeof next === "object" && "versions" in next) {
        setPublication(next);
      }
      setDoc(fallbackDoc?.(slug) ?? EMPTY_DOC);
      mount.markDirty(false);
      setConfirmClear(false);
      notify?.success("Content removed");
    } catch {
      notify?.error("Could not remove the content");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsx10(WidgetRegistryContext.Provider, { value: registry, children: /* @__PURE__ */ jsxs8(EditShellMountProvider, { value: mount, children: [
    /* @__PURE__ */ jsx10("style", { dangerouslySetInnerHTML: { __html: veCss(theme2) + peCss(theme2) } }),
    /* @__PURE__ */ jsx10(CanvasWidget, { value: doc, onChange: onCanvasChange, editShellMount: mount, theme: theme2, hideBreadcrumb: true }),
    /* @__PURE__ */ jsxs8("div", { className: "pe-bar", children: [
      /* @__PURE__ */ jsxs8("span", { className: "pe-brand", children: [
        /* @__PURE__ */ jsx10("span", { className: "pe-mark" }),
        brand ?? `editing \xB7 ${slug}`
      ] }),
      /* @__PURE__ */ jsx10("span", { style: { flex: 1 } }),
      (onUndo || onRedo) && /* @__PURE__ */ jsxs8(Fragment5, { children: [
        /* @__PURE__ */ jsx10("button", { className: "pe-btn", onClick: onUndo, disabled: !canUndo, title: "Undo", children: "\u21B6 Undo" }),
        /* @__PURE__ */ jsx10("button", { className: "pe-btn", onClick: onRedo, disabled: !canRedo, title: "Redo", children: "\u21B7 Redo" })
      ] }),
      /* @__PURE__ */ jsx10("button", { className: "pe-btn", onClick: () => setLeftOpen((v) => !v), children: "Insert" }),
      /* @__PURE__ */ jsx10("button", { className: "pe-btn", onClick: () => setRightOpen((v) => !v), children: "Inspector" }),
      publishable && /* @__PURE__ */ jsxs8(Fragment5, { children: [
        publication?.draftPending && /* @__PURE__ */ jsxs8("span", { className: "pe-draft", children: [
          "Draft pending",
          publication.publishedReadable ? ` \xB7 readers see ${publication.publishedReadable}` : ""
        ] }),
        /* @__PURE__ */ jsx10(
          "button",
          {
            className: "pe-btn",
            onClick: saveDraft,
            disabled: busy,
            title: "Save a version that readers do not see yet",
            children: "Save draft"
          }
        ),
        /* @__PURE__ */ jsx10("button", { className: "pe-btn", onClick: toggleVersions, disabled: busy, children: "Versions" })
      ] }),
      transport.clearBody && /* @__PURE__ */ jsx10(
        "button",
        {
          className: "pe-btn",
          onClick: () => setConfirmClear(true),
          disabled: busy,
          children: "Remove content"
        }
      ),
      /* @__PURE__ */ jsx10(
        "button",
        {
          className: "pe-btn primary",
          onClick: publishNow,
          disabled: busy,
          title: "Publish what is on the canvas: readers see it now",
          children: "Publish"
        }
      ),
      /* @__PURE__ */ jsx10("button", { className: "pe-btn", onClick: exit, children: "Exit" })
    ] }),
    confirmClear && /* @__PURE__ */ jsx10("div", { className: "pe-panel pe-clear", children: /* @__PURE__ */ jsxs8("div", { className: "pe-confirm", role: "alertdialog", "aria-label": "Confirm remove content", children: [
      /* @__PURE__ */ jsx10("span", { children: "Remove this page\u2019s content? The stored body, its file and its compiled page are deleted and readers see the page as never authored. The removed body stays in the version history." }),
      /* @__PURE__ */ jsxs8("div", { className: "pe-confirm-actions", children: [
        /* @__PURE__ */ jsx10("button", { className: "pe-btn primary", onClick: clearContent, disabled: busy, children: "Confirm remove" }),
        /* @__PURE__ */ jsx10("button", { className: "pe-btn", onClick: () => setConfirmClear(false), children: "Cancel" })
      ] })
    ] }) }),
    leftOpen && /* @__PURE__ */ jsx10("aside", { className: "pe-panel pe-left", children: /* @__PURE__ */ jsx10(CanvasPalette, {}) }),
    versionsOpen && /* @__PURE__ */ jsxs8("aside", { className: "pe-panel pe-versions", "aria-label": "Versions", children: [
      /* @__PURE__ */ jsx10("h3", { children: "Versions" }),
      pendingRestore && /* @__PURE__ */ jsxs8("div", { className: "pe-confirm", role: "alertdialog", "aria-label": "Confirm restore", children: [
        /* @__PURE__ */ jsxs8("span", { children: [
          "Restore ",
          pendingRestore.readable,
          "? It becomes the published body every reader is served."
        ] }),
        /* @__PURE__ */ jsxs8("div", { className: "pe-confirm-actions", children: [
          /* @__PURE__ */ jsx10(
            "button",
            {
              className: "pe-btn primary",
              onClick: () => restore(pendingRestore),
              disabled: busy,
              children: "Confirm restore"
            }
          ),
          /* @__PURE__ */ jsx10("button", { className: "pe-btn", onClick: () => setPendingRestore(null), children: "Cancel" })
        ] })
      ] }),
      publication === null && /* @__PURE__ */ jsx10("div", { className: "pe-version", children: "Loading\u2026" }),
      publication !== null && publication.versions.length === 0 && /* @__PURE__ */ jsx10("div", { className: "pe-version", children: "Nothing recorded yet \u2014 a draft, a publish or a save records the first version." }),
      publication?.versions.map((version) => /* @__PURE__ */ jsxs8("div", { className: "pe-version", children: [
        /* @__PURE__ */ jsxs8("span", { className: "pe-version-text", children: [
          /* @__PURE__ */ jsx10("span", { className: "pe-version-ref", title: version.readable, children: version.readable }),
          version.label && /* @__PURE__ */ jsx10("span", { className: "pe-version-label", title: version.label, children: version.label })
        ] }),
        version.isPublished && /* @__PURE__ */ jsx10("span", { className: "pe-version-tag published", children: "published" }),
        version.isHead && !version.isPublished && /* @__PURE__ */ jsx10("span", { className: "pe-version-tag head", children: "draft" }),
        !version.isPublished && /* @__PURE__ */ jsx10(
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
    rightOpen && !versionsOpen && /* @__PURE__ */ jsxs8("aside", { className: "pe-panel pe-right", children: [
      mount.selectedNodeId && /* @__PURE__ */ jsxs8(Fragment5, { children: [
        /* @__PURE__ */ jsx10(Breadcrumb, { doc, path: mount.selectedNodeId, onSelect: mount.selectNode }),
        isSelectedNodeComponent(doc, mount.selectedNodeId) && /* @__PURE__ */ jsx10("div", { className: "pe-comp-badge", children: "\u25C6 component" })
      ] }),
      /* @__PURE__ */ jsx10(FrameInspector, {})
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
  Breadcrumb,
  CANVAS_FORMATS,
  CANVAS_WIDGET_NAME,
  CanvasNode,
  CanvasPalette,
  CanvasProvider,
  CanvasWidget,
  ClassChipsWidget,
  ContextMenu,
  DEFAULT_BLOCK_TEMPLATES,
  DEFAULT_CANVAS_THEME,
  DEFAULT_CLASS_SUGGESTIONS,
  DEFAULT_VAR_SUGGESTIONS,
  EDIT_GATE_ATTR,
  PageEditor,
  RESERVED_ATTRS,
  StyleRowsWidget,
  TEMPLATE_DATA_KEY,
  TreeRender,
  VIEW_GATE_ATTR,
  VisualEditor,
  __resetEditMode,
  applyAttrs,
  attrsSchemaFor,
  attrsView,
  blockText,
  blockToProps,
  canvasAcceptsFormat,
  canvasRefusalFor,
  createCanvasWidgetRegistry,
  dropIndicatorCss,
  edgeAt,
  editGateOf,
  insertRelativeTo,
  isEditGated,
  isIsland,
  islandProps,
  peCss,
  renderNode,
  selectionCss,
  setAttrs,
  useCanvas,
  useEditMode,
  veCss,
  viewGateOf
};
//# sourceMappingURL=canvas.js.map