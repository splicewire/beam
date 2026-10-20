// src/components/heading.tsx
import { jsx, jsxs } from "react/jsx-runtime";
function Heading({
  title,
  description,
  variant = "default"
}) {
  return /* @__PURE__ */ jsxs("header", { className: variant === "small" ? "" : "mb-8 space-y-0.5", children: [
    /* @__PURE__ */ jsx(
      "h2",
      {
        className: variant === "small" ? "mb-0.5 text-base font-medium" : "text-xl font-semibold tracking-tight",
        children: title
      }
    ),
    description && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: description })
  ] });
}

export {
  Heading
};
//# sourceMappingURL=chunk-C5OGDGGA.js.map