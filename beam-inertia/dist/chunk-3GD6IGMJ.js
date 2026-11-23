// src/rich-message.tsx
import { Fragment } from "react";
import { jsx } from "react/jsx-runtime";
function RichMessage({ text, parts, wrapText, emphasis }) {
  if (emphasis) {
    return text.split(/(\uFFFC0:\uFFFC[\s\S]*?\uFFFC0\/\uFFFC)/u).map((section, index) => {
      const marked = /^\uFFFC0:\uFFFC([\s\S]*?)\uFFFC0\/\uFFFC$/u.exec(section);
      const content = /* @__PURE__ */ jsx(RichMessage, { text: marked ? marked[1] : section, parts, wrapText });
      return /* @__PURE__ */ jsx(Fragment, { children: marked ? emphasis(content) : content }, marked ? `emphasis-${index}` : `section-${index}`);
    });
  }
  const occurrences = /* @__PURE__ */ new Map();
  return text.split(/(\uFFFC\d+\uFFFC)/u).map((part, index) => {
    const match = /^\uFFFC(\d+)\uFFFC$/u.exec(part);
    const occurrence = match ? occurrences.get(match[1]) ?? 0 : 0;
    if (match) occurrences.set(match[1], occurrence + 1);
    return /* @__PURE__ */ jsx(Fragment, { children: match ? parts[Number(match[1])] : part && wrapText ? wrapText(part) : part }, match ? `slot-${match[1]}-${occurrence}` : `text-${index}`);
  });
}

export {
  RichMessage
};
//# sourceMappingURL=chunk-3GD6IGMJ.js.map