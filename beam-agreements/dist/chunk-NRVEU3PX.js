// src/pages/legal-shared.ts
function effectiveDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
var PAGE_STYLE = { maxWidth: "44rem", margin: "3rem auto", padding: "0 1rem", display: "grid", gap: 16 };
var META_STYLE = { margin: 0, fontSize: "0.875rem", opacity: 0.75 };
var TEXT_STYLE = { whiteSpace: "pre-wrap", lineHeight: 1.6 };

export {
  effectiveDate,
  PAGE_STYLE,
  META_STYLE,
  TEXT_STYLE
};
//# sourceMappingURL=chunk-NRVEU3PX.js.map