import {
  useBindingPreviewPort,
  useComponentAuthoring,
  useEditorKit
} from "./chunk-RPGCDFOE.js";
import {
  CanvasProvider,
  PageSettings,
  SourceMode,
  VisualEditor,
  canMountPublication,
  isAuthoredComponentEnvelope,
  isUnauthored,
  useLocalSession
} from "./chunk-TC76NXPA.js";
import {
  BuiltReleaseAssembly,
  ReleasePanel,
  VersionRecordingReferences
} from "./chunk-SR6UINVU.js";

// src/editor/component-dependencies.ts
function componentDependencies(body, catalog) {
  const byName = new Map(catalog.filter((entry) => entry.definition.name).map((entry) => [entry.definition.name, entry]));
  const found = /* @__PURE__ */ new Map();
  function walk(nodes) {
    for (const node of nodes) {
      if (node.kind !== "block") continue;
      const entry = node.name ? byName.get(node.name) : void 0;
      if (entry && !found.has(entry.id)) {
        found.set(entry.id, entry);
        walk(entry.body);
      }
      walk(node.children);
      for (const children of Object.values(node.slots ?? {})) walk(children);
      walk(node.repeat?.empty ?? []);
    }
  }
  walk(body);
  return [...found.values()];
}

// src/editor/mount.tsx
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var SOURCE_LANGUAGES = ["tsx", "mdx"];
function VisualEditorMount({ entryRef }) {
  const { userId, canAuthor } = useEditorKit();
  return /* @__PURE__ */ jsx(AddressedVisualEditor, { entryRef }, JSON.stringify([entryRef.id, userId, canAuthor]));
}
function readEnvelope(envelope, missing) {
  const read = envelope ?? {};
  if (!Array.isArray(read.body)) throw new Error(missing);
  return { mediaLibrary: read.mediaLibrary === true, authoredComponents: read.authoredComponents, bindings: read.bindings, body: read.body, pageSettings: read.pageSettings, pageFields: read.pageFields ?? null, fileLanguages: read.fileLanguages ?? [], redirects: read.redirects ?? null, styleRegistry: read.styleRegistry, profile: read.profile };
}
function AddressedVisualEditor({ entryRef }) {
  const { transport, theme, canvasConfig, userId, canAuthor, notify } = useEditorKit();
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(false);
  const id = entryRef.id;
  const componentAuthoring = useComponentAuthoring(id, true, async () => {
    if (!id) return;
    const fresh = readEnvelope(await transport.loadBody(id), "The entry body is unavailable.");
    setLoaded((previous) => previous ? { ...previous, profile: fresh.profile, authoredComponents: fresh.authoredComponents } : previous);
  });
  const local = useLocalSession(id ?? "", userId, loaded?.state.headVersion, loaded?.body ?? [], !!loaded && !!id, loaded?.pageSettings ?? null);
  useEffect(() => {
    if (!id || !userId || !canAuthor || !transport.listVersions || !transport.saveDraft || !transport.publish || !transport.restoreVersion) {
      setError("The editor requires an authored entry, authenticated author, and publication transport.");
      return;
    }
    let live = true;
    Promise.all([transport.loadBody(id), transport.listVersions(id)]).then(([envelope, state]) => {
      if (!live) return;
      if (!canMountPublication(state, isAuthoredComponentEnvelope(envelope))) throw new Error("This entry has no Publication Pin. Publish its baseline before mounting the editor.");
      setLoaded({ ...readEnvelope(envelope, "The entry has no editable document."), state });
    }).catch((reason) => live && setError(reason instanceof Error ? reason.message : "Could not load editor history. Verify the versions and publication-pin migrations."));
    return () => {
      live = false;
    };
  }, [id, userId, canAuthor]);
  const bindingPreview = useBindingPreviewPort(transport, id, userId, canAuthor, loaded?.pageSettings?.recordPage?.collection);
  const mediaLibrary = loaded?.mediaLibrary && id && transport.listImages && transport.uploadImage ? {
    list: () => transport.listImages(id),
    upload: (file) => transport.uploadImage(id, file)
  } : void 0;
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
    if (local.session.source) throw new Error("Apply or discard Source Mode before saving.");
    const sent = local.session.body;
    const sentSettings = local.session.pageSettings;
    const state = sentSettings ? await transport.saveDraft(id, sent, local.session.identity.base, void 0, sentSettings) : await transport.saveDraft(id, sent, local.session.identity.base);
    if (!state.headVersion) throw new Error("Save returned no version.");
    local.saved(state.headVersion, sent, sentSettings);
    setLoaded((previous) => previous && { ...previous, state });
    notify.success("Draft saved");
  });
  const resolveConflict = (ours) => run(async () => {
    if (local.session?.source) throw new Error("Apply or discard Source Mode before resolving the conflict.");
    if (!id || !transport.listVersions || !transport.saveDraft || !local.session) return;
    const current = await transport.listVersions(id);
    if (!current.headVersion) throw new Error("No current server version.");
    if (ours) {
      const sent = local.session.body;
      const sentSettings = local.session.pageSettings;
      const state = await transport.saveDraft(id, sent, current.headVersion, void 0, sentSettings);
      if (!state.headVersion) throw new Error("Save returned no version.");
      local.saved(state.headVersion, sent, sentSettings);
      setLoaded((previous) => previous && { ...previous, state });
    } else {
      const envelope = readEnvelope(await transport.loadBody(id), "No current body.");
      local.reset(current.headVersion, envelope.body, envelope.pageSettings);
      setLoaded({ ...envelope, state: current });
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
    if (!id || !transport.publish || !local.session) return;
    if (local.session.source) throw new Error("Apply or discard Source Mode before publishing.");
    let ref = local.session.identity.base;
    if (isUnauthored(loaded.state)) {
      if (!transport.saveDraft) return;
      const sent = local.session.body;
      const settings = local.session.pageSettings;
      const draft = await transport.saveDraft(id, sent, null, void 0, settings);
      if (!draft.headVersion) throw new Error("Save returned no version.");
      ref = draft.headVersion;
      local.saved(ref, sent, settings);
      setLoaded((previous) => previous && { ...previous, state: draft });
    } else if (local.session.dirty) throw new Error("Save your draft before publishing it.");
    if (!ref) throw new Error("Publish requires a saved version.");
    const state = await transport.publish(id, ref);
    setLoaded((previous) => previous && { ...previous, state });
    if (state.compileError) notify.error(state.compileError);
    else notify.success(state.release && state.release.status !== "published" ? "Release submitted for review" : "Published");
  });
  const restore = (ref) => run(async () => {
    if (local.session.dirty) throw new Error("Save or discard unsaved changes before restoring History.");
    if (!id || !transport.restoreVersion) return;
    const state = await transport.restoreVersion(id, ref);
    const envelope = readEnvelope(await transport.loadBody(id), "Could not load the restored draft.");
    if (!state.headVersion) throw new Error("Could not load the restored draft.");
    local.reset(state.headVersion, envelope.body, envelope.pageSettings);
    setLoaded({ ...envelope, state });
    notify.success("Restored into a draft");
  });
  const openPreview = async (versionId) => {
    if (!id || !transport.previewVersion) return;
    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      notify.error("Allow popups to open a version preview");
      return;
    }
    popup.opener = null;
    try {
      const preview = await transport.previewVersion(id, versionId);
      const target = new URL(preview.url, window.location.href);
      if (target.origin !== window.location.origin) {
        throw new Error("Preview URL must stay on this host");
      }
      popup.location.href = target.href;
    } catch (reason) {
      popup.close();
      notify.error(reason instanceof Error ? reason.message : "Could not open the version preview");
    }
  };
  const dependencies = componentDependencies(local.session.body, loaded.authoredComponents ?? []);
  const pendingComponents = dependencies.filter((entry) => entry.headVersion && entry.headVersion !== entry.publishedVersion);
  const componentChoices = pendingComponents.map((entry) => ({
    id: entry.id,
    title: entry.definition.name ?? "Component",
    versions: [{ id: entry.headVersion, label: "Pending component draft" }]
  }));
  return /* @__PURE__ */ jsxs(CanvasProvider, { config: {
    ...canvasConfig,
    mediaLibrary,
    profile: loaded.profile,
    styleRegistry: loaded.styleRegistry,
    bindingPreview,
    bindings: loaded.bindings,
    authoredComponents: loaded.authoredComponents,
    componentAuthoring
  }, children: [
    conflict && /* @__PURE__ */ jsxs("div", { role: "alertdialog", "aria-label": "Save conflict", children: [
      /* @__PURE__ */ jsx("p", { children: "The server draft changed." }),
      /* @__PURE__ */ jsx("button", { disabled: busy, onClick: () => void resolveConflict(false), children: "Reload theirs" }),
      /* @__PURE__ */ jsx("button", { disabled: busy, onClick: () => void resolveConflict(true), children: "Save ours as a new version" })
    ] }),
    !!loaded.state.diagnostics?.length && /* @__PURE__ */ jsx("aside", { role: "status", "aria-label": "Saved interface diagnostics", children: /* @__PURE__ */ jsx("ul", { children: loaded.state.diagnostics.map((message) => /* @__PURE__ */ jsx("li", { children: message }, message)) }) }),
    pendingComponents.length > 0 && /* @__PURE__ */ jsx("aside", { "aria-label": "Component drafts", children: /* @__PURE__ */ jsxs("p", { children: [
      "These components have pending drafts: ",
      pendingComponents.map((entry) => entry.definition.name).join(", "),
      ". Add their saved drafts to the same built Release below to publish them together. Otherwise this entry uses their published versions; never-published components must be included."
    ] }) }),
    /* @__PURE__ */ jsxs("div", { "aria-label": "Publication controls", children: [
      /* @__PURE__ */ jsx("button", { disabled: busy || local.session.dirty && !isUnauthored(loaded.state), onClick: () => void publish(), children: "Publish" }),
      /* @__PURE__ */ jsx("button", { onClick: () => setHistory(!history), children: "History" }),
      /* @__PURE__ */ jsx("span", { children: local.session.dirty ? "Unsaved changes" : "Draft saved" })
    ] }),
    loaded.state.release && transport.releaseCommand && /* @__PURE__ */ jsx(
      ReleasePanel,
      {
        release: loaded.state.release,
        entries: [{ id, title: entryRef.slug ?? "This entry", versions: loaded.state.versions.map((version) => ({ id: version.id, label: version.readable ?? version.id })) }],
        onCommand: async (command) => {
          const release = await transport.releaseCommand(loaded.state.release.id, command);
          const state = await transport.listVersions(id);
          setLoaded((previous) => previous && { ...previous, state: { ...state, release } });
        },
        onRemoveRedirect: transport.removeRedirect && ((redirectId) => transport.removeRedirect(redirectId))
      }
    ),
    id && loaded.state.headVersion && loaded.state.versions.length > 0 && transport.listReleases && transport.createRelease && transport.releaseCommand && /* @__PURE__ */ jsx(
      BuiltReleaseAssembly,
      {
        entryId: id,
        entryTitle: entryRef.slug ?? "This entry",
        versions: loaded.state.versions.map((version) => ({ id: version.id, label: version.readable ?? version.id })),
        canTakeDown: loaded.state.publishedVersion !== null,
        relatedEntries: componentChoices,
        listReleases: () => transport.listReleases(),
        createRelease: (entryId, title) => transport.createRelease(entryId, title),
        releaseCommand: (releaseId, command) => transport.releaseCommand(releaseId, command),
        removeRedirect: transport.removeRedirect && ((redirectId) => transport.removeRedirect(redirectId))
      }
    ),
    history && /* @__PURE__ */ jsx("aside", { "aria-label": "History", children: loaded.state.versions.map((version) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("span", { children: [
        version.readable,
        " ",
        version.label
      ] }),
      /* @__PURE__ */ jsx(VersionRecordingReferences, { recordings: version.recordings }),
      transport.previewVersion && /* @__PURE__ */ jsx("button", { disabled: busy, onClick: () => void openPreview(version.id), children: "Open" }),
      /* @__PURE__ */ jsxs("button", { disabled: busy || local.session.dirty, onClick: () => void restore(version.id), children: [
        "Restore ",
        version.readable,
        " into draft"
      ] })
    ] }, version.id)) }),
    !local.session.source && local.session.pageSettings && /* @__PURE__ */ jsx(PageSettings, { value: local.session.pageSettings, pageFields: loaded.pageFields, fileLanguages: loaded.fileLanguages, redirects: loaded.redirects, mediaLibrary, onChange: (settings) => local.change(local.session.body, settings) }),
    /* @__PURE__ */ jsx(
      SourceMode,
      {
        local,
        allowed: (!loaded.profile || !("x-admits-code" in loaded.profile) || loaded.profile["x-admits-code"] !== false) && (!entryRef.format || SOURCE_LANGUAGES.includes(entryRef.format)),
        language: entryRef.format ?? "tsx",
        conversion: id && transport.printSource && transport.readSource ? { print: (body) => transport.printSource(id, body), read: (source, body) => transport.readSource(id, source, body) } : void 0,
        children: /* @__PURE__ */ jsx(
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
      }
    )
  ] });
}
var mount_default = VisualEditorMount;

export {
  VisualEditorMount,
  mount_default
};
//# sourceMappingURL=chunk-N2Q7ZKJF.js.map