import {
  kitFor,
  useFrameRealm
} from "./chunk-N5WTRHC3.js";

// src/frame/provider.tsx
import { jsx } from "react/jsx-runtime";
function TenantFrameProvider({ children }) {
  const { Provider } = kitFor(useFrameRealm().manifestUrl);
  return /* @__PURE__ */ jsx(Provider, { children });
}

export {
  TenantFrameProvider
};
//# sourceMappingURL=chunk-QOYG2D4P.js.map