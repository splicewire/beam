import {
  RichMessage
} from "./chunk-3GD6IGMJ.js";

// src/os/surface-message.tsx
import { jsx } from "react/jsx-runtime";
function surfaceMessage(messages, key, parts, emphasis) {
  const values = Object.values(parts);
  const parameters = Object.fromEntries(Object.keys(parts).map((name, index) => [name, `\uFFFC${index}\uFFFC`]));
  return /* @__PURE__ */ jsx(RichMessage, { text: messages.t(key, { ...parameters, ...emphasis ? { emphasis_start: "\uFFFC0:\uFFFC", emphasis_end: "\uFFFC0/\uFFFC" } : {} }), parts: values, emphasis });
}

export {
  surfaceMessage
};
//# sourceMappingURL=chunk-VXVLZYD3.js.map