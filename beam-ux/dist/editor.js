import {
  DEFAULT_TREES,
  DemoFeatureRow,
  DemoHero,
  EditorKitProvider,
  MdxEdit,
  MdxView,
  PageEditor,
  asDoc,
  canvasConfig,
  defaultTreeFor,
  useEditorKit
} from "./chunk-2SN7FLVF.js";
import {
  CanvasProvider,
  VisualEditor,
  canvasAcceptsFormat,
  canvasRefusalFor,
  useEditMode,
  useLocalSession
} from "./chunk-HIBYCO63.js";
import "./chunk-PY3YY5NJ.js";

// src/editor/mount.tsx
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function VisualEditorMount({ entryRef }) {
  const { userId, canAuthor } = useEditorKit();
  return /* @__PURE__ */ jsx(AddressedVisualEditor, { entryRef }, JSON.stringify([entryRef.id, userId, canAuthor]));
}
function AddressedVisualEditor({ entryRef }) {
  const { transport, theme, canvasConfig: canvasConfig2, userId, canAuthor, notify } = useEditorKit();
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(false);
  const id = entryRef.id;
  const local = useLocalSession(id ?? "", userId, loaded?.state.headVersion ?? void 0, loaded?.body ?? [], !!loaded && !!id);
  useEffect(() => {
    if (!id || !userId || !canAuthor || !transport.listVersions || !transport.saveDraft || !transport.publish || !transport.restoreVersion) {
      setError("The editor requires an authored entry, authenticated author, and publication transport.");
      return;
    }
    let live = true;
    Promise.all([transport.loadBody(id), transport.listVersions(id)]).then(([envelope, state]) => {
      if (!live) return;
      if (!state.publishedVersion || !state.headVersion) throw new Error("This entry has no Publication Pin. Publish its baseline before mounting the editor.");
      const body = envelope.body;
      if (!Array.isArray(body)) throw new Error("The entry has no editable document.");
      setLoaded({ body, state });
    }).catch((reason) => live && setError(reason instanceof Error ? reason.message : "Could not load editor history. Verify the versions and publication-pin migrations."));
    return () => {
      live = false;
    };
  }, [id, userId, canAuthor]);
  const run = async (action) => {
    setBusy(true);
    try {
      await action();
    } catch (reason) {
      if (reason?.status === 409) setConflict(true);
      else notify.error(reason instanceof Error ? reason.message : "Editor action failed");
    } finally {
      setBusy(false);
    }
  };
  const save = () => run(async () => {
    if (!id || !local.session || !transport.saveDraft) return;
    const sent = local.session.body;
    const state = await transport.saveDraft(id, sent, local.session.identity.base);
    if (!state.headVersion) throw new Error("Save returned no version.");
    local.saved(state.headVersion, sent);
    setLoaded((previous) => previous && { ...previous, state });
    notify.success("Draft saved");
  });
  const resolveConflict = (ours) => run(async () => {
    if (!id || !transport.listVersions || !transport.saveDraft || !local.session) return;
    const current = await transport.listVersions(id);
    if (!current.headVersion) throw new Error("No current server version.");
    if (ours) {
      const sent = local.session.body;
      const state = await transport.saveDraft(id, sent, current.headVersion);
      if (!state.headVersion) throw new Error("Save returned no version.");
      local.saved(state.headVersion, sent);
      setLoaded((previous) => previous && { ...previous, state });
    } else {
      const envelope = await transport.loadBody(id);
      if (!Array.isArray(envelope.body)) throw new Error("No current body.");
      local.reset(current.headVersion, envelope.body);
      setLoaded({ body: envelope.body, state: current });
    }
    setConflict(false);
  });
  if (error || local.error) return /* @__PURE__ */ jsx("div", { role: "alert", children: error ?? local.error });
  if (local.pending) return /* @__PURE__ */ jsxs("div", { role: "alertdialog", "aria-label": "Unsaved session base moved", children: [
    /* @__PURE__ */ jsxs("p", { children: [
      "The server base changed from ",
      local.pending.identity.base,
      "."
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: () => void local.recover(true), children: "Restore unsaved changes" }),
    /* @__PURE__ */ jsx("button", { onClick: () => void local.recover(false), children: "Discard" })
  ] });
  if (!loaded || !local.session) return /* @__PURE__ */ jsx("div", { role: "status", children: "Loading Local Session\u2026" });
  const publish = () => run(async () => {
    if (local.session.dirty) throw new Error("Save your draft before publishing it.");
    if (!id || !transport.publish || !loaded.state.headVersion) return;
    const state = await transport.publish(id, local.session.identity.base);
    setLoaded((previous) => previous && { ...previous, state });
    if (state.compileError) notify.error(state.compileError);
    else notify.success("Published");
  });
  const restore = (ref) => run(async () => {
    if (local.session.dirty) throw new Error("Save or discard unsaved changes before restoring History.");
    if (!id || !transport.restoreVersion) return;
    const state = await transport.restoreVersion(id, ref);
    const envelope = await transport.loadBody(id);
    if (!state.headVersion || !Array.isArray(envelope.body)) throw new Error("Could not load the restored draft.");
    local.reset(state.headVersion, envelope.body);
    setLoaded({ body: envelope.body, state });
    notify.success("Restored into a draft");
  });
  return /* @__PURE__ */ jsxs(CanvasProvider, { config: canvasConfig2, children: [
    conflict && /* @__PURE__ */ jsxs("div", { role: "alertdialog", "aria-label": "Save conflict", children: [
      /* @__PURE__ */ jsx("p", { children: "The server draft changed." }),
      /* @__PURE__ */ jsx("button", { disabled: busy, onClick: () => void resolveConflict(false), children: "Reload theirs" }),
      /* @__PURE__ */ jsx("button", { disabled: busy, onClick: () => void resolveConflict(true), children: "Save ours as a new version" })
    ] }),
    /* @__PURE__ */ jsxs("div", { "aria-label": "Publication controls", children: [
      /* @__PURE__ */ jsx("button", { disabled: busy || local.session.dirty, onClick: () => void publish(), children: "Publish" }),
      /* @__PURE__ */ jsx("button", { onClick: () => setHistory(!history), children: "History" }),
      /* @__PURE__ */ jsx("span", { children: local.session.dirty ? "Unsaved changes" : "Draft saved" })
    ] }),
    history && /* @__PURE__ */ jsx("aside", { "aria-label": "History", children: loaded.state.versions.map((version) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("span", { children: [
        version.readable,
        " ",
        version.label
      ] }),
      /* @__PURE__ */ jsxs("button", { disabled: busy || local.session.dirty, onClick: () => void restore(version.id), children: [
        "Restore ",
        version.readable,
        " into draft"
      ] })
    ] }, version.id)) }),
    /* @__PURE__ */ jsx(
      VisualEditor,
      {
        value: local.session.body,
        onChange: local.change,
        onSave: save,
        onUndo: local.undo,
        onRedo: local.redo,
        canUndo: local.session.canUndo,
        canRedo: local.session.canRedo,
        theme,
        brand: "Entry editor"
      }
    )
  ] });
}

// src/editor/entry-body-editor.tsx
import { lazy, Suspense } from "react";

// src/editor/format.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function CanvasOrRefusal({ entry, children }) {
  if (canvasAcceptsFormat(entry.format)) {
    return /* @__PURE__ */ jsx2(Fragment, { children });
  }
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      "data-beam-ux-editor-refused": entry.format ?? "unknown",
      role: "note",
      className: "m-4 rounded-md border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900",
      children: [
        /* @__PURE__ */ jsx2("p", { className: "font-medium", children: "This page cannot be edited here." }),
        /* @__PURE__ */ jsx2("p", { className: "mt-2", children: canvasRefusalFor(entry.format) })
      ]
    }
  );
}

// src/editor/entry-body-editor.tsx
import { Fragment as Fragment2, jsx as jsx3 } from "react/jsx-runtime";
var PageEditor2 = lazy(() => import("./page-editor-YGMRJUHU.js"));
function EditableEntryBody({ entry, children }) {
  const editing = useEditMode();
  if (!editing) {
    return /* @__PURE__ */ jsx3(Fragment2, { children });
  }
  const ref = { id: entry.id, slug: entry.slug, format: entry.format };
  return /* @__PURE__ */ jsx3("div", { "data-beam-entry-editor": entry.slug, children: /* @__PURE__ */ jsx3(CanvasOrRefusal, { entry: ref, children: /* @__PURE__ */ jsx3(
    Suspense,
    {
      fallback: /* @__PURE__ */ jsx3("div", { style: { padding: 24, color: "#64748b", fontSize: 13 }, children: "Loading editor\u2026" }),
      children: /* @__PURE__ */ jsx3(PageEditor2, { slug: entry.slug, body: null, entryId: entry.id })
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
  MdxEdit,
  MdxView,
  NEUTRAL_THEME,
  PageEditor,
  VisualEditorMount,
  asDoc,
  canvasConfig as defaultCanvasConfig,
  defaultTreeFor,
  useEditorKit
};
//# sourceMappingURL=editor.js.map