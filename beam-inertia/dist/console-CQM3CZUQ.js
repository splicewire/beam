import {
  BeamFrameProvider
} from "./chunk-OTZ4IPA2.js";
import {
  FrameRoutes
} from "./chunk-WCHRU4AJ.js";
import "./chunk-VXVLZYD3.js";
import {
  DefaultFrameRealm,
  FrameRealmProvider,
  useFrameManifest,
  useFrameRealm
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

// src/pages/frame/console.tsx
import { Head } from "@inertiajs/react";
import { BrowserRouter } from "react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function FrameConsole(props) {
  const realm = props.realm ?? DefaultFrameRealm.realm;
  const basename = props.basename ?? DefaultFrameRealm.basename;
  const manifestUrl = props.manifestUrl ?? DefaultFrameRealm.manifestUrl;
  return /* @__PURE__ */ jsx(FrameRealmProvider, { realm, basename, manifestUrl, children: /* @__PURE__ */ jsx(BeamFrameProvider, { children: /* @__PURE__ */ jsx(BrowserRouter, { basename, children: /* @__PURE__ */ jsx(ConsoleBody, {}) }) }) });
}
function ConsoleBody() {
  const m = useBeamMessages();
  const { manifestUrl } = useFrameRealm();
  const { data: manifest, isLoading, error } = useFrameManifest();
  if (isLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "px-6 py-8 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Head, { title: m.t("splicewire-beam-inertia::messages.surfaces_console_title") }),
      m.t("splicewire-beam-inertia::messages.surfaces_console_loading")
    ] });
  }
  if (error || !manifest) {
    return /* @__PURE__ */ jsxs("div", { className: "px-6 py-8", children: [
      /* @__PURE__ */ jsx(Head, { title: m.t("splicewire-beam-inertia::messages.surfaces_console_title") }),
      /* @__PURE__ */ jsx("h1", { className: "mb-1 text-2xl font-semibold", children: m.t("splicewire-beam-inertia::messages.surfaces_manifest_failed") }),
      /* @__PURE__ */ jsx("p", { className: "max-w-prose text-sm text-muted-foreground", children: error instanceof Error ? error.cause instanceof Error ? error.cause.message : error.message : m.t("splicewire-beam-inertia::messages.surfaces_manifest_request_failed", { url: manifestUrl }) })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: m.t("splicewire-beam-inertia::messages.surfaces_console_title") }),
    /* @__PURE__ */ jsx(FrameRoutes, { manifest })
  ] });
}
export {
  FrameConsole as default
};
//# sourceMappingURL=console-CQM3CZUQ.js.map