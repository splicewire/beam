import {
  VisualEditorMount
} from "./chunk-N2Q7ZKJF.js";
import {
  PageEditor,
  asDoc
} from "./chunk-GKI7VJOG.js";
import {
  DEFAULT_TREES,
  DemoFeatureRow,
  DemoHero,
  EditorKitProvider,
  canvasConfig,
  defaultTreeFor,
  useEditorKit
} from "./chunk-RPGCDFOE.js";
import {
  canvasAccepts,
  canvasRefusalFor
} from "./chunk-TC76NXPA.js";
import "./chunk-RVN3TANY.js";
import "./chunk-7YJ6POGH.js";
import "./chunk-SR6UINVU.js";
import {
  useEditMode
} from "./chunk-X5GHTMHH.js";
import {
  RichBlockdoc,
  RichMarkdown,
  richFieldComponents
} from "./chunk-FWRFSTBG.js";
import "./chunk-EMFVKUTK.js";
import "./chunk-J4K4YBKB.js";
import "./chunk-2NOVFPER.js";

// src/editor/entry-body-editor.tsx
import { lazy, Suspense } from "react";

// src/editor/format.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function CanvasOrRefusal({ entry, children }) {
  if (canvasAccepts(entry)) {
    return /* @__PURE__ */ jsx(Fragment, { children });
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-beam-ux-editor-refused": entry.format ?? "unknown",
      role: "note",
      className: "m-4 rounded-md border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900",
      children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "This page cannot be edited here." }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: canvasRefusalFor(entry.format) })
      ]
    }
  );
}

// src/editor/entry-body-editor.tsx
import { Fragment as Fragment2, jsx as jsx2 } from "react/jsx-runtime";
var PageEditor2 = lazy(() => import("./page-editor-OEHXSI3M.js"));
function EditableEntryBody({ entry, children }) {
  const editing = useEditMode();
  if (!editing) {
    return /* @__PURE__ */ jsx2(Fragment2, { children });
  }
  const ref = { id: entry.id, slug: entry.slug, format: entry.format, bodyKind: entry.bodyKind ?? null };
  return /* @__PURE__ */ jsx2("div", { "data-beam-entry-editor": entry.slug, children: /* @__PURE__ */ jsx2(CanvasOrRefusal, { entry: ref, children: /* @__PURE__ */ jsx2(
    Suspense,
    {
      fallback: /* @__PURE__ */ jsx2("div", { style: { padding: 24, color: "#64748b", fontSize: 13 }, children: "Loading editor\u2026" }),
      children: /* @__PURE__ */ jsx2(PageEditor2, { slug: entry.slug, body: null, entryId: entry.id })
    }
  ) }) });
}

// src/editor/theme.ts
var NEUTRAL_THEME = {};
export {
  CanvasOrRefusal,
  DEFAULT_TREES,
  DemoFeatureRow,
  DemoHero,
  EditableEntryBody,
  EditorKitProvider,
  NEUTRAL_THEME,
  PageEditor,
  RichBlockdoc,
  RichMarkdown,
  VisualEditorMount,
  asDoc,
  canvasConfig as defaultCanvasConfig,
  defaultTreeFor,
  richFieldComponents,
  useEditorKit
};
//# sourceMappingURL=editor.js.map