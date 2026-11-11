import {
  page_editor_default
} from "./chunk-WBRUBIZZ.js";
import {
  SiteLayout
} from "./chunk-ILPC7IPL.js";
import {
  IntakeFormsFromPage,
  canvasConfig
} from "./chunk-DBRXAIQK.js";
import "./chunk-FSMZMXZU.js";
import "./chunk-OW5S7K7F.js";
import "./chunk-IHHHPJVP.js";
import "./chunk-EOJIG22E.js";
import "./chunk-N5WTRHC3.js";
import "./chunk-O7ZKQDZR.js";
import "./chunk-MUHE33WK.js";
import "./chunk-FADCRF7N.js";
import "./chunk-6C5PVJOV.js";
import "./chunk-XP5YRUDH.js";
import "./chunk-563T736C.js";
import "./chunk-UZPKVCAK.js";
import "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";

// src/pages/site/home.tsx
import { Head } from "@inertiajs/react";
import { useEditMode } from "@splicewire/beam-ux/canvas";
import { entryPageConfig } from "@splicewire/beam-ux/docs";
import { EntryBody, PreviewBoundary, SiteClickEventListener } from "@splicewire/beam-ux/site";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function SiteHome({
  entry = null,
  head = null,
  preview = null
}) {
  const editing = useEditMode();
  const artifact = entry?.artifact ?? null;
  const serverHead = entryPageConfig().serverHead === true && (head?.length ?? 0) > 0;
  const page = /* @__PURE__ */ jsxs(SiteLayout, { children: [
    !serverHead && /* @__PURE__ */ jsx(Head, { title: "Home" }),
    /* @__PURE__ */ jsx(IntakeFormsFromPage, { children: /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          maxWidth: 900,
          margin: "0 auto",
          padding: "clamp(24px,5vw,48px) clamp(18px,5vw,40px)"
        },
        children: !editing && artifact ? (
          // The reader's path: the compiled body at its version-pinned address, the same one
          // every rendered entry takes. No client-side compile fallback (ADR-0209 §7).
          /* @__PURE__ */ jsx(
            EntryBody,
            {
              artifact,
              components: canvasConfig.registry
            }
          )
        ) : (
          /* The editable page body, and the no-artifact default. slug `home` → its default
             JsonDoc (editor/defaults.ts) until a save persists a real body. `entryId` is the
             ADDRESS the save goes to (ADR-0214 §2), shared server-side by
             `App\Support\PageEntryRef`; the slug is only the seed key and the editor label. */
          /* @__PURE__ */ jsx(
            page_editor_default,
            {
              slug: "home",
              body: null,
              entryId: entry?.id ?? null
            }
          )
        )
      }
    ) })
  ] });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SiteClickEventListener, { enabled: !preview }),
    preview ? /* @__PURE__ */ jsx(PreviewBoundary, { preview, children: page }) : page
  ] });
}
export {
  SiteHome as default
};
//# sourceMappingURL=home-KA4AVMLF.js.map