// src/rich-message.tsx
import { Fragment } from "react";
import { jsx } from "react/jsx-runtime";
function richMessage(messages, key, parts) {
  const values = Object.values(parts);
  const parameters = Object.fromEntries(Object.keys(parts).map((name, index) => [name, `\uFFFC${index}\uFFFC`]));
  const occurrences = /* @__PURE__ */ new Map();
  return messages.t(key, parameters).split(/(￼\d+￼)/u).map((part, index) => {
    const match = /^￼(\d+)￼$/u.exec(part);
    const occurrence = match ? occurrences.get(match[1]) ?? 0 : 0;
    if (match) occurrences.set(match[1], occurrence + 1);
    return /* @__PURE__ */ jsx(Fragment, { children: match ? values[Number(match[1])] : part }, match ? `slot-${match[1]}-${occurrence}` : `text-${index}`);
  });
}

export {
  richMessage
};
//# sourceMappingURL=chunk-5APTQIDU.js.map