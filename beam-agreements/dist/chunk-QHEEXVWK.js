import {
  META_STYLE,
  PAGE_STYLE,
  TEXT_STYLE,
  effectiveDate
} from "./chunk-NRVEU3PX.js";

// src/pages/Legal.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function Legal({ title, current, earlier }) {
  return /* @__PURE__ */ jsxs("main", { "data-beam-agreements": "legal", style: PAGE_STYLE, children: [
    /* @__PURE__ */ jsxs("header", { style: { display: "grid", gap: 4 }, children: [
      /* @__PURE__ */ jsx("h1", { style: { fontSize: "1.5rem", margin: 0 }, children: title }),
      /* @__PURE__ */ jsxs("p", { style: META_STYLE, children: [
        "Version ",
        current.label,
        " \xB7 in effect since ",
        effectiveDate(current.effectiveAt)
      ] })
    ] }),
    current.summary ? /* @__PURE__ */ jsxs("p", { "data-beam-agreements": "summary", style: { margin: 0 }, children: [
      /* @__PURE__ */ jsx("strong", { children: "What changed:" }),
      " ",
      current.summary
    ] }) : null,
    /* @__PURE__ */ jsx("article", { style: TEXT_STYLE, children: current.content }),
    earlier.length > 0 ? /* @__PURE__ */ jsxs("section", { "aria-labelledby": "beam-agreements-earlier", style: { display: "grid", gap: 8 }, children: [
      /* @__PURE__ */ jsx("h2", { id: "beam-agreements-earlier", style: { fontSize: "1.125rem", margin: 0 }, children: "Earlier versions" }),
      /* @__PURE__ */ jsx("ul", { style: { margin: 0, paddingLeft: "1.25rem", display: "grid", gap: 4 }, children: earlier.map((version) => /* @__PURE__ */ jsxs("li", { children: [
        version.url ? /* @__PURE__ */ jsxs("a", { href: version.url, children: [
          "Version ",
          version.label
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          "Version ",
          version.label
        ] }),
        /* @__PURE__ */ jsxs("span", { style: META_STYLE, children: [
          " \xB7 in effect from ",
          effectiveDate(version.effectiveAt)
        ] })
      ] }, version.digest)) })
    ] }) : null
  ] });
}

export {
  Legal
};
//# sourceMappingURL=chunk-QHEEXVWK.js.map