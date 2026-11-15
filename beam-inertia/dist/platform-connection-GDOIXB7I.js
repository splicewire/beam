import {
  PlatformConnectionPanel
} from "./chunk-B4NTS22S.js";
import "./chunk-VXVLZYD3.js";
import "./chunk-O7ZKQDZR.js";
import "./chunk-3GD6IGMJ.js";
import "./chunk-563T736C.js";
import "./chunk-UZPKVCAK.js";
import "./chunk-SXSE375U.js";
import "./chunk-GBIJGQ7E.js";
import {
  useBeamMessages
} from "./chunk-SZXGGLHY.js";

// src/pages/operator/platform-connection.tsx
import { Head } from "@inertiajs/react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function OperatorPlatformConnection({ connection, endpoints }) {
  const m = useBeamMessages();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Head, { title: m.t("splicewire-beam-inertia::messages.surfaces_connection_title") }),
    /* @__PURE__ */ jsx(PlatformConnectionPanel, { connection, endpoints })
  ] });
}
export {
  OperatorPlatformConnection as default
};
//# sourceMappingURL=platform-connection-GDOIXB7I.js.map