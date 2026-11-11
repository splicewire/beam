import {
  TenantFrameProvider
} from "./chunk-QOYG2D4P.js";
import {
  FrameRoutes
} from "./chunk-QH63ZIRH.js";
import {
  DefaultFrameRealm,
  FrameRealmProvider,
  useFrameManifest,
  useFrameRealm
} from "./chunk-N5WTRHC3.js";
import "./chunk-O7ZKQDZR.js";
import "./chunk-MUHE33WK.js";
import "./chunk-FADCRF7N.js";
import "./chunk-XP5YRUDH.js";
import "./chunk-563T736C.js";
import "./chunk-UZPKVCAK.js";
import "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";

// src/pages/frame/console.tsx
import { Head } from "@inertiajs/react";
import { BrowserRouter } from "react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function FrameConsole(props) {
  const realm = props.realm ?? DefaultFrameRealm.realm;
  const basename = props.basename ?? DefaultFrameRealm.basename;
  const manifestUrl = props.manifestUrl ?? DefaultFrameRealm.manifestUrl;
  return /* @__PURE__ */ jsx(FrameRealmProvider, { realm, basename, manifestUrl, children: /* @__PURE__ */ jsx(TenantFrameProvider, { children: /* @__PURE__ */ jsx(BrowserRouter, { basename, children: /* @__PURE__ */ jsx(ConsoleBody, {}) }) }) });
}
function ConsoleBody() {
  const { manifestUrl } = useFrameRealm();
  const { data: manifest, isLoading, error } = useFrameManifest();
  if (isLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "px-6 py-8 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(Head, { title: "Console" }),
      "Loading the console\u2026"
    ] });
  }
  if (error || !manifest) {
    return /* @__PURE__ */ jsxs("div", { className: "px-6 py-8", children: [
      /* @__PURE__ */ jsx(Head, { title: "Console" }),
      /* @__PURE__ */ jsx("h1", { className: "mb-1 text-2xl font-semibold", children: "The frame manifest did not load" }),
      /* @__PURE__ */ jsx("p", { className: "max-w-prose text-sm text-muted-foreground", children: error instanceof Error ? error.cause instanceof Error ? error.cause.message : error.message : `GET ${manifestUrl} failed.` })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: "Console" }),
    /* @__PURE__ */ jsx(FrameRoutes, { manifest })
  ] });
}
export {
  FrameConsole as default
};
//# sourceMappingURL=console-OZ4PXATS.js.map