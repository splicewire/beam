import {
  BeamFrameProvider
} from "./chunk-OTZ4IPA2.js";
import {
  surfaceMessage
} from "./chunk-VXVLZYD3.js";
import {
  DefaultFrameRealm,
  FrameRealmProvider,
  formFromManifest,
  useFrameManifest
} from "./chunk-LZNX4YUE.js";
import "./chunk-O7ZKQDZR.js";
import "./chunk-YAINAZ7K.js";
import "./chunk-5A4XHNWR.js";
import "./chunk-3GD6IGMJ.js";
import "./chunk-PGZP7A2Q.js";
import "./chunk-563T736C.js";
import "./chunk-UZPKVCAK.js";
import "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";
import {
  useBeamMessages
} from "./chunk-V63CP4G5.js";

// src/os/entry-properties-form.tsx
import { router } from "@inertiajs/react";
import { EditShell } from "@schemastud/frame";
import { jsx } from "react/jsx-runtime";
var ENTRY_RESOURCE = "beam-ux-entry";
function EntryForm({ entryId }) {
  const m = useBeamMessages();
  const { data: manifest, isLoading, error } = useFrameManifest();
  if (isLoading) {
    return /* @__PURE__ */ jsx("p", { className: "p-4 text-sm text-muted-foreground", children: m.t("splicewire-beam-inertia::messages.surfaces_entry_loading") });
  }
  if (error || !manifest || !manifest.resources.some((r) => r.key === ENTRY_RESOURCE)) {
    return /* @__PURE__ */ jsx("p", { role: "note", className: "p-4 text-sm text-muted-foreground", children: surfaceMessage(m, "splicewire-beam-inertia::messages.surfaces_entry_unavailable", { resource: ENTRY_RESOURCE }) });
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
    /* @__PURE__ */ jsx(FrameRealmProvider, { ...DefaultFrameRealm, children: /* @__PURE__ */ jsx(BeamFrameProvider, { children: /* @__PURE__ */ jsx(EntryForm, { entryId }) }) })
  );
}
export {
  ENTRY_RESOURCE,
  EntryPropertiesForm as default
};
//# sourceMappingURL=entry-properties-form-KHU4EUB6.js.map