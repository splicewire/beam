import {
  NEUTRAL_THEME,
  asDoc,
  canvasConfig,
  defaultTreeFor
} from "./chunk-H55VFXNL.js";
import {
  bodyClient
} from "./chunk-AHQQKX5V.js";
import "./chunk-LKOW3LLQ.js";
import "./chunk-MTKP2AW3.js";

// src/editor/mount.tsx
import { usePage } from "@inertiajs/react";
import { CanvasProvider, VisualEditor } from "@splicewire/beam-ux/canvas";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { jsx } from "react/jsx-runtime";
var EMPTY = [
  {
    kind: "block",
    name: "div",
    isComponent: false,
    dynamic: false,
    props: [{ name: "className", kind: "string", value: "page" }],
    children: []
  }
];
function seedFor(slug) {
  return slug === null ? EMPTY : defaultTreeFor(slug) ?? EMPTY;
}
function VisualEditorMount({ entryRef }) {
  const entryId = entryRef.id;
  const slug = entryRef.slug;
  const [loaded, setLoaded] = useState(null);
  const current = loaded?.entryId === entryId && loaded.slug === slug ? loaded : null;
  const doc = current?.doc ?? (entryId === null ? seedFor(slug) : null);
  const page = usePage();
  const theme = page.props.theme?.canvas ?? NEUTRAL_THEME;
  useEffect(() => {
    if (entryId === null) {
      return;
    }
    let live = true;
    const fallback = () => seedFor(slug);
    bodyClient.loadBody(entryId).then((env) => {
      const body = env?.body;
      if (live) {
        setLoaded({ entryId, slug, doc: asDoc(body) ?? fallback() });
      }
    }).catch(() => live && setLoaded({ entryId, slug, doc: null, failed: true }));
    return () => {
      live = false;
    };
  }, [entryId, slug]);
  if (current?.failed) {
    return /* @__PURE__ */ jsx("div", { role: "alert", children: "Could not load this page\u2019s saved content." });
  }
  if (!doc) {
    return /* @__PURE__ */ jsx("div", { style: { padding: 24, color: "#64748b", fontSize: 13 }, children: "Loading editor\u2026" });
  }
  const save = async () => {
    if (entryId === null) {
      toast.error("This page is not bound to an entry");
      return;
    }
    try {
      await bodyClient.saveBody(entryId, doc);
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    }
  };
  return /* @__PURE__ */ jsx(CanvasProvider, { config: canvasConfig, children: /* @__PURE__ */ jsx(
    VisualEditor,
    {
      value: doc,
      onChange: (doc2) => setLoaded({ entryId, slug, doc: doc2 }),
      onSave: save,
      theme,
      brand: "beam-starter \xB7 visual editor"
    },
    entryId ?? slug
  ) });
}
var mount_default = VisualEditorMount;
export {
  VisualEditorMount,
  mount_default as default
};
//# sourceMappingURL=mount-4PZJI4EB.js.map