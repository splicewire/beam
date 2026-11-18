import {
  VisualEditorMount
} from "./chunk-F4FDF6BK.js";
import {
  PageEditor,
  asDoc
} from "./chunk-LICTNRXG.js";
import {
  DEFAULT_TREES,
  DemoFeatureRow,
  DemoHero,
  EditorKitProvider,
  canvasConfig,
  defaultTreeFor,
  useEditorKit
} from "./chunk-VMMHAVBO.js";
import {
  canvasAccepts,
  canvasRefusalFor
} from "./chunk-2RX3FVVI.js";
import "./chunk-6JZKXIQJ.js";
import {
  useEditMode
} from "./chunk-X5GHTMHH.js";
import {
  RichBlockdoc,
  RichMarkdown,
  richFieldComponents
} from "./chunk-YC5ZNKLO.js";
import "./chunk-RIE4CLKO.js";
import "./chunk-PZNSQ73I.js";
import "./chunk-E33ACEYB.js";
import "./chunk-J4K4YBKB.js";
import "./chunk-2NOVFPER.js";
import "./chunk-2G4AXCDS.js";
import {
  useBeamUxMessages
} from "./chunk-YBGMJB3T.js";

// src/editor/entry-body-editor.tsx
import { lazy, Suspense } from "react";

// src/editor/format.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function CanvasOrRefusal({ entry, children }) {
  const m = useBeamUxMessages();
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
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: m.t("splicewire-beam-ux::messages.editor_cannot_edit_here") }),
        /* @__PURE__ */ jsx("p", { className: "mt-2", children: canvasRefusalFor(entry.format, m) })
      ]
    }
  );
}

// src/editor/entry-body-editor.tsx
import { Fragment as Fragment2, jsx as jsx2 } from "react/jsx-runtime";
var PageEditor2 = lazy(() => import("./page-editor-WIWT6DC3.js"));
function EditableEntryBody({ entry, children }) {
  const m = useBeamUxMessages();
  const editing = useEditMode();
  if (!editing) {
    return /* @__PURE__ */ jsx2(Fragment2, { children });
  }
  const ref = { id: entry.id, slug: entry.slug, format: entry.format, bodyKind: entry.bodyKind ?? null };
  return /* @__PURE__ */ jsx2("div", { "data-beam-entry-editor": entry.slug, children: /* @__PURE__ */ jsx2(CanvasOrRefusal, { entry: ref, children: /* @__PURE__ */ jsx2(
    Suspense,
    {
      fallback: /* @__PURE__ */ jsx2("div", { style: { padding: 24, color: "#64748b", fontSize: 13 }, children: m.t("splicewire-beam-ux::messages.editor_loading_editor") }),
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