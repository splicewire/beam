import {
  useBindingPreviewPort,
  useComponentAuthoring,
  useEditorKit
} from "./chunk-5BD5PXLV.js";
import {
  CanvasProvider,
  PageEditor
} from "./chunk-I2MAZQEL.js";
import {
  useEditMode
} from "./chunk-X5GHTMHH.js";
import {
  NoticeError,
  notice,
  noticeOf,
  say
} from "./chunk-YARN53FB.js";
import {
  useBeamUxMessages
} from "./chunk-B33ESE55.js";

// src/editor/page-editor.tsx
import { useEffect, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function asDoc(body) {
  return Array.isArray(body) && body.length > 0 && body.every((n) => !!n && typeof n === "object" && "kind" in n) ? body : null;
}
function addressed(entryId) {
  if (entryId === null) {
    throw new Error("no entry id \u2014 nothing to save against");
  }
  return entryId;
}
var asBody = (doc) => doc;
function PageEditor2({ slug, body = null, entryId: suppliedId = null }) {
  const m = useBeamUxMessages();
  const { transport: bodyClient, theme, canAuthor, userId, canvasConfig, defaultTreeFor, notify: toast, brand } = useEditorKit();
  const [created, setCreated] = useState(null);
  const [creating, setCreating] = useState(false);
  const entryId = suppliedId ?? (created?.slug === slug ? created.id : null);
  const seed = defaultTreeFor(slug);
  const makeEditable = async () => {
    if (!canAuthor || !bodyClient.makeEditable || !seed || creating) return;
    setCreating(true);
    try {
      const result = await bodyClient.makeEditable(slug, asBody(seed));
      if (!result.id) throw new NoticeError(notice("splicewire-beam-ux::messages.editor_no_entry_returned"));
      setCreated({ slug, id: result.id });
      if (result.compileError) toast.error(result.compileError);
      else toast.success(m.t("splicewire-beam-ux::messages.editor_now_editable"));
    } catch (error) {
      toast.error(say(m, noticeOf(error, notice("splicewire-beam-ux::messages.editor_make_editable_failed"))));
    } finally {
      setCreating(false);
    }
  };
  const editing = useEditMode();
  const [loaded, setLoaded] = useState(null);
  const current = loaded?.entryId === entryId ? loaded : null;
  useEffect(() => {
    if (!editing || entryId === null || current !== null) {
      return;
    }
    let live = true;
    bodyClient.loadBody(entryId).then(
      (env) => live && setLoaded({ mediaLibrary: env.mediaLibrary === true, entryId, authoredComponents: env.authoredComponents, body: env?.body ?? null, pageSettings: env.pageSettings, pageFields: env.pageFields ?? null, fileLanguages: env.fileLanguages ?? null, redirects: env.redirects ?? null, bindings: env.bindings, styleRegistry: env.styleRegistry, profile: env.profile })
    ).catch(() => {
      if (live) {
        toast.error(m.t("splicewire-beam-ux::messages.editor_page_load_failed_toast"));
        setLoaded({ entryId, body: null, failed: true });
      }
    });
    return () => {
      live = false;
    };
  }, [editing, entryId, current]);
  const componentAuthoring = useComponentAuthoring(entryId, editing, async () => {
    if (!entryId) return;
    const fresh = await bodyClient.loadBody(entryId);
    setLoaded((previous) => previous?.entryId === entryId ? { ...previous, profile: fresh.profile, authoredComponents: fresh.authoredComponents } : previous);
  });
  const bindingPreview = useBindingPreviewPort(bodyClient, entryId, userId, editing && canAuthor, current?.pageSettings?.recordPage?.collection);
  if (editing && entryId !== null && current === null) {
    return /* @__PURE__ */ jsx("div", { style: { padding: 24, color: "#64748b", fontSize: 13 }, children: m.t("splicewire-beam-ux::messages.editor_loading_editor") });
  }
  if (editing && current?.failed) {
    return /* @__PURE__ */ jsx("div", { role: "alert", children: m.t("splicewire-beam-ux::messages.editor_page_load_failed") });
  }
  const {
    saveDraft,
    publish,
    listVersions,
    restoreVersion,
    previewVersion,
    clearBody
  } = bodyClient;
  const canClear = entryId !== null && !!clearBody && canAuthor;
  return /* @__PURE__ */ jsxs(CanvasProvider, { config: { ...canvasConfig, mediaLibrary: current?.mediaLibrary && entryId && bodyClient.listImages && bodyClient.uploadImage ? {
    list: () => bodyClient.listImages(entryId),
    upload: (file) => bodyClient.uploadImage(entryId, file)
  } : void 0, bindingPreview: editing ? bindingPreview : void 0, profile: current?.profile, styleRegistry: current?.styleRegistry, bindings: current?.bindings, authoredComponents: current?.authoredComponents, componentAuthoring }, children: [
    entryId === null && canAuthor && bodyClient.makeEditable && seed && /* @__PURE__ */ jsx("button", { type: "button", disabled: creating, onClick: makeEditable, children: m.t("splicewire-beam-ux::messages.editor_make_editable") }),
    /* @__PURE__ */ jsx(
      PageEditor,
      {
        slug,
        entryId: entryId ?? void 0,
        userId,
        body: asDoc(current?.body) ?? asDoc(body),
        pageSettings: current?.pageSettings,
        pageFields: current?.pageFields,
        fileLanguages: current?.fileLanguages,
        redirects: current?.redirects,
        transport: {
          // CanvasPageEditor's transport seam is keyed by its `slug` prop, which stays a slug
          // — it is the editor's display label and `defaultTreeFor()` key. The BODY transport
          // underneath is addressed by the entry ID (ADR-0214 §2). So the incoming `s` is
          // deliberately unused: it names the page, not the row.
          saveBody: (_s, doc) => bodyClient.saveBody(addressed(entryId), asBody(doc)),
          ...entryId && bodyClient.printSource && bodyClient.readSource ? {
            printSource: (_s, body2) => bodyClient.printSource(entryId, body2),
            readSource: (_s, source, body2) => bodyClient.readSource(entryId, source, body2)
          } : {},
          // node-actions-and-takes 04: the Refine control, only when there is a row to address and the
          // client supplies the operation. Addressed by the entry id, like the body transport.
          ...entryId && bodyClient.refineNode ? {
            refineNode: (_s, request) => bodyClient.refineNode(entryId, request)
          } : {},
          // The publication seam (G2-BEAM-DRAFT-PUBLISH), spread in only when there is a row
          // to address and the client supplies all four operations. A page whose entry is absent
          // (a database that was never seeded) keeps
          // the plain Save dock and the honest error it already gives, rather than growing
          // buttons that cannot resolve an id.
          ...entryId === null || !saveDraft || !publish || !listVersions || !restoreVersion ? {} : {
            saveDraft: (_s, doc, baseVersion, settings) => settings ? saveDraft(entryId, asBody(doc), baseVersion, void 0, settings) : saveDraft(entryId, asBody(doc), baseVersion),
            publish: (_s, ref) => publish(entryId, ref),
            releaseCommand: bodyClient.releaseCommand?.bind(bodyClient),
            removeRedirect: bodyClient.removeRedirect?.bind(bodyClient),
            listReleases: bodyClient.listReleases?.bind(bodyClient),
            createRelease: bodyClient.createRelease?.bind(bodyClient),
            listVersions: () => listVersions(entryId),
            ...previewVersion ? {
              previewVersion: (_s, versionId) => previewVersion(entryId, versionId)
            } : {},
            restoreVersion: (_s, ref) => restoreVersion(entryId, ref),
            // The canvas re-seeds itself from this after a restore; without it an
            // author would keep editing the pre-restore document and Save it back
            // over the version they just restored.
            loadBody: () => bodyClient.loadBody(entryId)
          },
          ...canClear && entryId !== null ? { clearBody: () => clearBody(entryId) } : {}
        },
        notify: {
          success: (m2) => toast.success(m2),
          error: (m2) => toast.error(m2)
        },
        fallbackDoc: defaultTreeFor,
        theme,
        brand: brand ? `${brand} \xB7 editor` : void 0
      },
      entryId ?? slug
    )
  ] });
}
var page_editor_default = PageEditor2;

export {
  asDoc,
  PageEditor2 as PageEditor,
  page_editor_default
};
//# sourceMappingURL=chunk-VJXE2NSV.js.map