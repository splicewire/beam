import {
  META_STYLE,
  PAGE_STYLE,
  TEXT_STYLE,
  effectiveDate
} from "./chunk-NRVEU3PX.js";

// src/pages/LegalVersion.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function LegalVersion({ title, version, legalUrl }) {
  return /* @__PURE__ */ jsxs("main", { "data-beam-agreements": "legal-version", style: PAGE_STYLE, children: [
    /* @__PURE__ */ jsxs("header", { style: { display: "grid", gap: 4 }, children: [
      /* @__PURE__ */ jsx("h1", { style: { fontSize: "1.5rem", margin: 0 }, children: title }),
      /* @__PURE__ */ jsxs("p", { style: META_STYLE, children: [
        "Version ",
        version.label,
        " \xB7 in effect from ",
        effectiveDate(version.effectiveAt)
      ] }),
      legalUrl ? /* @__PURE__ */ jsx("p", { style: { margin: 0 }, children: /* @__PURE__ */ jsx("a", { href: legalUrl, children: "Read the version in force" }) }) : null
    ] }),
    version.summary ? /* @__PURE__ */ jsxs("p", { "data-beam-agreements": "summary", style: { margin: 0 }, children: [
      /* @__PURE__ */ jsx("strong", { children: "What changed:" }),
      " ",
      version.summary
    ] }) : null,
    /* @__PURE__ */ jsx("article", { style: TEXT_STYLE, children: version.content })
  ] });
}

export {
  LegalVersion
};
//# sourceMappingURL=chunk-K5XRFNYE.js.map