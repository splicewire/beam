// src/blockdoc/style.ts
function legacyStyle(css) {
  const declarations = {};
  for (const part of css.split(";")) {
    const at = part.indexOf(":");
    if (at > 0)
      declarations[part.slice(0, at).trim()] = part.slice(at + 1).trim();
  }
  return { layers: [{ declarations }] };
}
function assertBlockStyle(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some((k) => k !== "layers") || !Array.isArray(value.layers)) {
    throw new Error("bdStyle must be a literal Block Style layers object");
  }
  for (const layer of value.layers) {
    if (!layer || typeof layer !== "object" || Array.isArray(layer) || Object.keys(layer).some(
      (k) => !["breakpoint", "state", "declarations"].includes(k)
    ) || !layer.declarations || typeof layer.declarations !== "object" || Array.isArray(layer.declarations) && layer.declarations.length !== 0 || Object.values(layer.declarations).some((v) => typeof v !== "string") || [layer.breakpoint, layer.state].some(
      (v) => v != null && typeof v !== "string"
    )) {
      throw new Error(
        "bdStyle requires literal layers and string declarations"
      );
    }
  }
}

export {
  legacyStyle,
  assertBlockStyle
};
//# sourceMappingURL=chunk-2NOVFPER.js.map