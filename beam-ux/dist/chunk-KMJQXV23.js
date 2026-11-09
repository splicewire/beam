import {
  useBindingPreviewPort,
  useComponentAuthoring,
  useEditorKit
} from "./chunk-VJRTASAJ.js";
import {
  CanvasProvider,
  PageEditor
} from "./chunk-3XQ3OXSH.js";
import {
  useEditMode
} from "./chunk-X5GHTMHH.js";

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
  const { transport: bodyClient, theme, canAuthor, userId, canvasConfig, defaultTreeFor, notify: toast } = useEditorKit();
  const [created, setCreated] = useState(null);
  const [creating, setCreating] = useState(false);
  const entryId = suppliedId ?? (created?.slug === slug ? created.id : null);
  const seed = defaultTreeFor(slug);
  const makeEditable = async () => {
    if (!canAuthor || !bodyClient.makeEditable || !seed || creating) return;
    setCreating(true);
    try {
      const result = await bodyClient.makeEditable(slug, asBody(seed));
      if (!result.id) throw new Error("The server did not return an entry.");
      setCreated({ slug, id: result.id });
      if (result.compileError) toast.error(result.compileError);
      else toast.success("This page is now editable");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not make this page editable");
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
        toast.error("Could not load this page\u2019s saved content");
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
    return /* @__PURE__ */ jsx("div", { style: { padding: 24, color: "#64748b", fontSize: 13 }, children: "Loading editor\u2026" });
  }
  if (editing && current?.failed) {
    return /* @__PURE__ */ jsx("div", { role: "alert", children: "Could not load this page\u2019s saved content." });
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
    entryId === null && canAuthor && bodyClient.makeEditable && seed && /* @__PURE__ */ jsx("button", { type: "button", disabled: creating, onClick: makeEditable, children: "Make this page editable" }),
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
          success: (m) => toast.success(m),
          error: (m) => toast.error(m)
        },
        fallbackDoc: defaultTreeFor,
        theme,
        brand: "beam-starter \xB7 editor"
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
//# sourceMappingURL=chunk-KMJQXV23.js.map