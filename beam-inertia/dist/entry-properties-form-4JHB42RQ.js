import {
  TenantFrameProvider
} from "./chunk-K25KHYKJ.js";
import "./chunk-O7ZKQDZR.js";
import "./chunk-BBYPLYMO.js";
import "./chunk-OMCRMKUM.js";
import {
  DefaultFrameRealm,
  FrameRealmProvider,
  formFromManifest,
  useFrameManifest
} from "./chunk-WB76RVEA.js";
import "./chunk-QMLU62K5.js";
import "./chunk-FADCRF7N.js";
import "./chunk-563T736C.js";
import "./chunk-2XTQOEA4.js";
import "./chunk-UZPKVCAK.js";
import "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";

// src/os/entry-properties-form.tsx
import { router } from "@inertiajs/react";
import { EditShell } from "@schemastud/frame";
import { jsx, jsxs } from "react/jsx-runtime";
var ENTRY_RESOURCE = "beam-ux-entry";
function EntryForm({ entryId }) {
  const { data: manifest, isLoading, error } = useFrameManifest();
  if (isLoading) {
    return /* @__PURE__ */ jsx("p", { className: "p-4 text-sm text-muted-foreground", children: "Loading the entry form\u2026" });
  }
  if (error || !manifest || !manifest.resources.some((r) => r.key === ENTRY_RESOURCE)) {
    return /* @__PURE__ */ jsxs("p", { role: "note", className: "p-4 text-sm text-muted-foreground", children: [
      "The entry form is not available here (",
      ENTRY_RESOURCE,
      " is not in this realm\u2019s frame manifest)."
    ] });
  }
  return /* @__PURE__ */ jsx(
    EditShell,
    {
      resource: ENTRY_RESOURCE,
      id: entryId,
      container: "bare",
      form: formFromManifest(manifest, ENTRY_RESOURCE),
      onSaved: () => router.reload()
    }
  );
}
function EntryPropertiesForm({ entryId }) {
  return (
    // The TENANT realm's manifest, explicitly: this window floats over site pages whose own props
    // name no realm, and `beam-ux-entry` is placed in the tenant console.
    /* @__PURE__ */ jsx(FrameRealmProvider, { ...DefaultFrameRealm, children: /* @__PURE__ */ jsx(TenantFrameProvider, { children: /* @__PURE__ */ jsx(EntryForm, { entryId }) }) })
  );
}
export {
  ENTRY_RESOURCE,
  EntryPropertiesForm as default
};
//# sourceMappingURL=entry-properties-form-4JHB42RQ.js.map