import {
  kitFor,
  useFrameRealm
} from "./chunk-5U7O6EO4.js";

// src/frame/provider.tsx
import { jsx } from "react/jsx-runtime";
function TenantFrameProvider({ children }) {
  const { Provider } = kitFor(useFrameRealm().manifestUrl);
  return /* @__PURE__ */ jsx(Provider, { children });
}

export {
  TenantFrameProvider
};
//# sourceMappingURL=chunk-7JORC5LA.js.map