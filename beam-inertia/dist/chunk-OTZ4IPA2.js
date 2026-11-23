import {
  kitFor,
  recordPageAbilities,
  useFrameRealm
} from "./chunk-LZNX4YUE.js";

// src/frame/provider.tsx
import { usePage } from "@inertiajs/react";
import { jsx } from "react/jsx-runtime";
function BeamFrameProvider({ children }) {
  const { Provider } = kitFor(useFrameRealm().manifestUrl);
  recordPageAbilities(usePage()?.props?.can);
  return /* @__PURE__ */ jsx(Provider, { children });
}

export {
  BeamFrameProvider
};
//# sourceMappingURL=chunk-OTZ4IPA2.js.map