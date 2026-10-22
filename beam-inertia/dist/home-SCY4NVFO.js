import {
  page_editor_default
} from "./chunk-26TVCGD7.js";
import {
  SiteLayout
} from "./chunk-J5BI4QL2.js";
import {
  canvasConfig
} from "./chunk-OQXAOB6P.js";
import "./chunk-BBDY2YPP.js";
import "./chunk-44FAKLSM.js";
import "./chunk-AAQAZE3R.js";
import "./chunk-WB76RVEA.js";
import "./chunk-QMLU62K5.js";
import "./chunk-6C5PVJOV.js";
import "./chunk-MTKP2AW3.js";
import "./chunk-GBIJGQ7E.js";

// src/pages/site/home.tsx
import { Head } from "@inertiajs/react";
import { useEditMode } from "@splicewire/beam-ux/canvas";
import { EntryBody } from "@splicewire/beam-ux/site";
import { jsx, jsxs } from "react/jsx-runtime";
function SiteHome({
  entry = null
}) {
  const editing = useEditMode();
  const artifact = entry?.artifact ?? null;
  return /* @__PURE__ */ jsxs(SiteLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Home" }),
    /* @__PURE__ */ jsx(
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
    )
  ] });
}
export {
  SiteHome as default
};
//# sourceMappingURL=home-SCY4NVFO.js.map