import {
  assertBlockStyle
} from "./chunk-2NOVFPER.js";

// src/generated/style-registry.json
var style_registry_default = {
  breakpoints: {
    sm: "40rem",
    md: "48rem",
    lg: "64rem",
    xl: "80rem",
    "2xl": "96rem"
  },
  states: {
    hover: ":hover",
    "focus-visible": ":focus-visible",
    active: ":active"
  }
};

// src/blockdoc/style-runtime.ts
var DEFAULT_STYLE_REGISTRY = style_registry_default;
function styleRegistry(theme = {}) {
  const breakpoints = {
    ...style_registry_default.breakpoints,
    ...theme.responsive?.breakpoints
  };
  for (const [name, width] of Object.entries(breakpoints)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(name) || !/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:px|rem|em)$/.test(width)) {
      throw new Error(
        "Breakpoints require a name and a literal non-negative CSS length"
      );
    }
  }
  return { breakpoints, states: style_registry_default.states };
}
function hash(text) {
  let h = 14695981039346656037n;
  for (const byte of new TextEncoder().encode(text))
    h = BigInt.asUintN(64, (h ^ BigInt(byte)) * 1099511628211n);
  return h.toString(16).padStart(16, "0");
}
function compileBlockStyle(style, registry = DEFAULT_STYLE_REGISTRY) {
  assertBlockStyle(style);
  const rules = style.layers.map((layer) => {
    if (layer.breakpoint != null && !Object.hasOwn(registry.breakpoints, layer.breakpoint) || layer.state != null && !Object.hasOwn(registry.states, layer.state))
      throw new Error("Unknown Block Style breakpoint or state");
    const width = layer.breakpoint == null ? null : registry.breakpoints[layer.breakpoint];
    const selector = layer.state == null ? "" : registry.states[layer.state];
    if (width === void 0 || selector === void 0)
      throw new Error("Unknown Block Style breakpoint or state");
    const css2 = Object.entries(layer.declarations).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([property, value]) => {
      if (!/^(?:--[a-zA-Z0-9-]+|[a-z][a-z0-9-]*)$/.test(property) || /[{}<>;\\]|\/\*|@|expression\s*\(/i.test(value))
        throw new Error("Invalid Block Style declaration");
      return `${property}:${value}`;
    }).join(";");
    return { width, selector, css: css2 };
  });
  const className = `bs-${hash(JSON.stringify(rules))}`;
  const css = rules.map((r) => {
    const text = `.${className}${r.selector}{${r.css}}`;
    return r.width === null ? text : `@media (min-width: ${r.width}){${text}}`;
  }).join("");
  return { className, css };
}
function compileEntryStyles(styles, registry = DEFAULT_STYLE_REGISTRY) {
  const compiled = styles.map((style) => compileBlockStyle(style, registry));
  return {
    classes: compiled.map((style) => style.className),
    css: compiled.length ? `@layer theme,base,components,utilities,beam-block-style;@layer beam-block-style{${[
      ...new Map(compiled.map((s) => [s.className, s.css])).values()
    ].join("")}}` : ""
  };
}
function stylesIn(doc) {
  return doc.flatMap(
    (node) => node.kind === "block" ? [...node.style ? [node.style] : [], ...stylesIn(node.children), ...Object.values(node.slots ?? {}).flatMap(stylesIn), ...stylesIn(node.repeat?.empty ?? [])] : []
  );
}

export {
  DEFAULT_STYLE_REGISTRY,
  styleRegistry,
  compileBlockStyle,
  compileEntryStyles,
  stylesIn
};
//# sourceMappingURL=chunk-RNDA3EP6.js.map