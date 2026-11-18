import {
  useBindingPreviewPort,
  useComponentAuthoring,
  useEditorKit
} from "./chunk-VMMHAVBO.js";
import {
  CanvasProvider,
  PageSettings,
  SourceMode,
  VisualEditor,
  canMountPublication,
  isAuthoredComponentEnvelope,
  isUnauthored,
  useLocalSession
} from "./chunk-2RX3FVVI.js";
import {
  BuiltReleaseAssembly,
  ReleasePanel,
  VersionRecordingReferences
} from "./chunk-E33ACEYB.js";
import {
  NoticeError,
  notice,
  noticeOf,
  say
} from "./chunk-2G4AXCDS.js";
import {
  useBeamUxMessages
} from "./chunk-YBGMJB3T.js";

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
  if (!Array.isArray(read.body)) throw new NoticeError(missing);
  return { mediaLibrary: read.mediaLibrary === true, authoredComponents: read.authoredComponents, bindings: read.bindings, body: read.body, pageSettings: read.pageSettings, pageFields: read.pageFields ?? null, fileLanguages: read.fileLanguages ?? [], redirects: read.redirects ?? null, styleRegistry: read.styleRegistry, profile: read.profile };
}
function AddressedVisualEditor({ entryRef }) {
  const { transport, theme, canvasConfig, userId, canAuthor, notify, brand } = useEditorKit();
  const [loaded, setLoaded] = useState(null);
  const m = useBeamUxMessages();
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(false);
  const id = entryRef.id;
  const componentAuthoring = useComponentAuthoring(id, true, async () => {
    if (!id) return;
    const fresh = readEnvelope(await transport.loadBody(id), notice("splicewire-beam-ux::messages.mount_body_unavailable"));
    setLoaded((previous) => previous ? { ...previous, profile: fresh.profile, authoredComponents: fresh.authoredComponents } : previous);
  });
  const local = useLocalSession(id ?? "", userId, loaded?.state.headVersion, loaded?.body ?? [], !!loaded && !!id, loaded?.pageSettings ?? null);
  useEffect(() => {
    if (!id || !userId || !canAuthor || !transport.listVersions || !transport.saveDraft || !transport.publish || !transport.restoreVersion) {
      setError(notice("splicewire-beam-ux::messages.mount_requires_transport"));
      return;
    }
    let live = true;
    Promise.all([transport.loadBody(id), transport.listVersions(id)]).then(([envelope, state]) => {
      if (!live) return;
      if (!canMountPublication(state, isAuthoredComponentEnvelope(envelope))) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_no_publication_pin"));
      setLoaded({ ...readEnvelope(envelope, notice("splicewire-beam-ux::messages.mount_no_editable_document")), state });
    }).catch((reason) => live && setError(noticeOf(reason, notice("splicewire-beam-ux::messages.mount_history_load_failed"))));
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
      else notify.error(say(m, noticeOf(reason, notice("splicewire-beam-ux::messages.mount_action_failed"))));
    } finally {
      setBusy(false);
    }
  };
  const save = () => run(async () => {
    if (!id || !local.session || !transport.saveDraft) return;
    if (local.session.source) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_source_before_save"));
    const sent = local.session.body;
    const sentSettings = local.session.pageSettings;
    const state = sentSettings ? await transport.saveDraft(id, sent, local.session.identity.base, void 0, sentSettings) : await transport.saveDraft(id, sent, local.session.identity.base);
    if (!state.headVersion) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_save_returned_no_version"));
    local.saved(state.headVersion, sent, sentSettings);
    setLoaded((previous) => previous && { ...previous, state });
    notify.success(m.t("splicewire-beam-ux::messages.mount_draft_saved"));
  });
  const resolveConflict = (ours) => run(async () => {
    if (local.session?.source) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_source_before_conflict"));
    if (!id || !transport.listVersions || !transport.saveDraft || !local.session) return;
    const current = await transport.listVersions(id);
    if (!current.headVersion) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_no_current_version"));
    if (ours) {
      const sent = local.session.body;
      const sentSettings = local.session.pageSettings;
      const state = await transport.saveDraft(id, sent, current.headVersion, void 0, sentSettings);
      if (!state.headVersion) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_save_returned_no_version"));
      local.saved(state.headVersion, sent, sentSettings);
      setLoaded((previous) => previous && { ...previous, state });
    } else {
      const envelope = readEnvelope(await transport.loadBody(id), notice("splicewire-beam-ux::messages.mount_no_current_body"));
      local.reset(current.headVersion, envelope.body, envelope.pageSettings);
      setLoaded({ ...envelope, state: current });
    }
    setConflict(false);
  });
  if (error || local.error) return /* @__PURE__ */ jsx("div", { role: "alert", children: say(m, error ?? local.error) });
  if (local.pending) return /* @__PURE__ */ jsxs("div", { role: "alertdialog", "aria-label": m.t("splicewire-beam-ux::messages.mount_session_base_moved"), children: [
    /* @__PURE__ */ jsx("p", { children: m.t("splicewire-beam-ux::messages.mount_base_changed", { base: local.pending.identity.base }) }),
    /* @__PURE__ */ jsx("button", { onClick: () => void local.recover(true), children: m.t("splicewire-beam-ux::messages.mount_restore_unsaved") }),
    /* @__PURE__ */ jsx("button", { onClick: () => void local.recover(false), children: m.t("splicewire-beam-ux::messages.mount_discard") })
  ] });
  if (!loaded || !local.session) return /* @__PURE__ */ jsx("div", { role: "status", children: m.t("splicewire-beam-ux::messages.mount_loading_session") });
  const publish = () => run(async () => {
    if (!id || !transport.publish || !local.session) return;
    if (local.session.source) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_source_before_publish"));
    let ref = local.session.identity.base;
    if (isUnauthored(loaded.state)) {
      if (!transport.saveDraft) return;
      const sent = local.session.body;
      const settings = local.session.pageSettings;
      const draft = await transport.saveDraft(id, sent, null, void 0, settings);
      if (!draft.headVersion) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_save_returned_no_version"));
      ref = draft.headVersion;
      local.saved(ref, sent, settings);
      setLoaded((previous) => previous && { ...previous, state: draft });
    } else if (local.session.dirty) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_save_before_publish"));
    if (!ref) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_requires_saved_version"));
    const state = await transport.publish(id, ref);
    setLoaded((previous) => previous && { ...previous, state });
    if (state.compileError) notify.error(state.compileError);
    else notify.success(state.release && state.release.status !== "published" ? m.t("splicewire-beam-ux::messages.mount_release_submitted") : m.t("splicewire-beam-ux::messages.mount_published"));
  });
  const restore = (ref) => run(async () => {
    if (local.session.dirty) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_save_before_restore"));
    if (!id || !transport.restoreVersion) return;
    const state = await transport.restoreVersion(id, ref);
    const envelope = readEnvelope(await transport.loadBody(id), notice("splicewire-beam-ux::messages.mount_restored_load_failed"));
    if (!state.headVersion) throw new NoticeError(notice("splicewire-beam-ux::messages.mount_restored_load_failed"));
    local.reset(state.headVersion, envelope.body, envelope.pageSettings);
    setLoaded({ ...envelope, state });
    notify.success(m.t("splicewire-beam-ux::messages.mount_restored"));
  });
  const openPreview = async (versionId) => {
    if (!id || !transport.previewVersion) return;
    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      notify.error(m.t("splicewire-beam-ux::messages.mount_allow_popups"));
      return;
    }
    popup.opener = null;
    try {
      const preview = await transport.previewVersion(id, versionId);
      const target = new URL(preview.url, window.location.href);
      if (target.origin !== window.location.origin) {
        throw new NoticeError(notice("splicewire-beam-ux::messages.mount_preview_same_host"));
      }
      popup.location.href = target.href;
    } catch (reason) {
      popup.close();
      notify.error(say(m, noticeOf(reason, notice("splicewire-beam-ux::messages.mount_preview_failed"))));
    }
  };
  const dependencies = componentDependencies(local.session.body, loaded.authoredComponents ?? []);
  const pendingComponents = dependencies.filter((entry) => entry.headVersion && entry.headVersion !== entry.publishedVersion);
  const componentChoices = pendingComponents.map((entry) => ({
    id: entry.id,
    title: entry.definition.name ?? m.t("splicewire-beam-ux::messages.mount_component"),
    versions: [{ id: entry.headVersion, label: m.t("splicewire-beam-ux::messages.mount_pending_component_draft") }]
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
    conflict && /* @__PURE__ */ jsxs("div", { role: "alertdialog", "aria-label": m.t("splicewire-beam-ux::messages.mount_save_conflict"), children: [
      /* @__PURE__ */ jsx("p", { children: m.t("splicewire-beam-ux::messages.mount_save_conflict_prompt") }),
      /* @__PURE__ */ jsx("button", { disabled: busy, onClick: () => void resolveConflict(false), children: m.t("splicewire-beam-ux::messages.mount_reload_theirs") }),
      /* @__PURE__ */ jsx("button", { disabled: busy, onClick: () => void resolveConflict(true), children: m.t("splicewire-beam-ux::messages.mount_save_ours") })
    ] }),
    !!loaded.state.diagnostics?.length && /* @__PURE__ */ jsx("aside", { role: "status", "aria-label": m.t("splicewire-beam-ux::messages.mount_diagnostics"), children: /* @__PURE__ */ jsx("ul", { children: loaded.state.diagnostics.map((message) => /* @__PURE__ */ jsx("li", { children: message }, message)) }) }),
    pendingComponents.length > 0 && /* @__PURE__ */ jsx("aside", { "aria-label": m.t("splicewire-beam-ux::messages.mount_component_drafts"), children: /* @__PURE__ */ jsx("p", { children: m.t("splicewire-beam-ux::messages.mount_component_drafts_prompt", { names: pendingComponents.map((entry) => entry.definition.name).join(", ") }) }) }),
    /* @__PURE__ */ jsxs("div", { "aria-label": m.t("splicewire-beam-ux::messages.mount_publication_controls"), children: [
      /* @__PURE__ */ jsx("button", { disabled: busy || local.session.dirty && !isUnauthored(loaded.state), onClick: () => void publish(), children: m.t("splicewire-beam-ux::messages.mount_publish") }),
      /* @__PURE__ */ jsx("button", { onClick: () => setHistory(!history), children: m.t("splicewire-beam-ux::messages.mount_history") }),
      /* @__PURE__ */ jsx("span", { children: local.session.dirty ? m.t("splicewire-beam-ux::messages.mount_unsaved_changes") : m.t("splicewire-beam-ux::messages.mount_draft_saved") })
    ] }),
    loaded.state.release && transport.releaseCommand && /* @__PURE__ */ jsx(
      ReleasePanel,
      {
        release: loaded.state.release,
        entries: [{ id, title: entryRef.slug ?? m.t("splicewire-beam-ux::messages.mount_this_entry"), versions: loaded.state.versions.map((version) => ({ id: version.id, label: version.readable ?? version.id })) }],
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
        entryTitle: entryRef.slug ?? m.t("splicewire-beam-ux::messages.mount_this_entry"),
        versions: loaded.state.versions.map((version) => ({ id: version.id, label: version.readable ?? version.id })),
        canTakeDown: loaded.state.publishedVersion !== null,
        relatedEntries: componentChoices,
        listReleases: () => transport.listReleases(),
        createRelease: (entryId, title) => transport.createRelease(entryId, title),
        releaseCommand: (releaseId, command) => transport.releaseCommand(releaseId, command),
        removeRedirect: transport.removeRedirect && ((redirectId) => transport.removeRedirect(redirectId))
      }
    ),
    history && /* @__PURE__ */ jsx("aside", { "aria-label": m.t("splicewire-beam-ux::messages.mount_history"), children: loaded.state.versions.map((version) => /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("span", { children: [
        version.readable,
        " ",
        version.label
      ] }),
      /* @__PURE__ */ jsx(VersionRecordingReferences, { recordings: version.recordings }),
      transport.previewVersion && /* @__PURE__ */ jsx("button", { disabled: busy, onClick: () => void openPreview(version.id), children: m.t("splicewire-beam-ux::messages.mount_open") }),
      /* @__PURE__ */ jsx("button", { disabled: busy || local.session.dirty, onClick: () => void restore(version.id), children: m.t("splicewire-beam-ux::messages.mount_restore_version", { version: version.readable }) })
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
            brand: brand ? m.t("splicewire-beam-ux::messages.mount_brand_editor", { brand }) : m.t("splicewire-beam-ux::messages.mount_entry_editor"),
            nodeAction: id && transport.refineNode ? { slug: entryRef.slug ?? id, entry: id, refine: (_slug, request) => transport.refineNode(id, request) } : void 0
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
//# sourceMappingURL=chunk-F4FDF6BK.js.map