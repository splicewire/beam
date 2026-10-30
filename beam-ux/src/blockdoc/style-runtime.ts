import { assertBlockStyle, type BlockStyle } from "./style.js";
import defaults from "../generated/style-registry.json";

export type StyleRegistry = {
  breakpoints: Record<string, string>;
  states: Record<string, string>;
};
export const DEFAULT_STYLE_REGISTRY: StyleRegistry = defaults;

/** Theme responsive configuration is the binding; no runtime Tailwind configuration reader. */
export function styleRegistry(
  theme: { responsive?: { breakpoints?: Record<string, string> } } = {}
): StyleRegistry {
  const breakpoints = {
    ...defaults.breakpoints,
    ...theme.responsive?.breakpoints,
  };
  for (const [name, width] of Object.entries(breakpoints)) {
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(name) ||
      !/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:px|rem|em)$/.test(width)
    ) {
      throw new Error(
        "Breakpoints require a name and a literal non-negative CSS length"
      );
    }
  }
  return { breakpoints, states: defaults.states };
}

/** Same FNV-1a 64-bit address as the PHP compiler; the hash identifies content, not a security claim. */
function hash(text: string): string {
  let h = 14695981039346656037n;
  for (const byte of new TextEncoder().encode(text))
    h = BigInt.asUintN(64, (h ^ BigInt(byte)) * 1099511628211n);
  return h.toString(16).padStart(16, "0");
}

/**
 * How the editor canvas previews a Block Style. The published artifact answers breakpoints with `@media`
 * (the visitor's viewport) and states with their pseudo-selector; the canvas has its own width and no real
 * pointer, so it asks for breakpoints against a named container and for one state applied as if active.
 * The class name is unchanged, so the canvas styles the same nodes the artifact does.
 */
export type StylePreview = { container: string; state: string | null };

export function compileBlockStyle(
  style: BlockStyle,
  registry = DEFAULT_STYLE_REGISTRY,
  preview?: StylePreview
) {
  assertBlockStyle(style);
  const rules = style.layers.map((layer) => {
    if (
      (layer.breakpoint != null &&
        !Object.hasOwn(registry.breakpoints, layer.breakpoint)) ||
      (layer.state != null && !Object.hasOwn(registry.states, layer.state))
    )
      throw new Error("Unknown Block Style breakpoint or state");
    const width =
      layer.breakpoint == null ? null : registry.breakpoints[layer.breakpoint];
    const selector = layer.state == null ? "" : registry.states[layer.state];
    if (width === undefined || selector === undefined)
      throw new Error("Unknown Block Style breakpoint or state");
    const css = Object.entries(layer.declarations)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([property, value]) => {
        if (
          !/^(?:--[a-zA-Z0-9-]+|[a-z][a-z0-9-]*)$/.test(property) ||
          /[{}<>;\\]|\/\*|@|expression\s*\(/i.test(value)
        )
          throw new Error("Invalid Block Style declaration");
        return `${property}:${value}`;
      })
      .join(";");
    return { width, selector, css, state: layer.state ?? null };
  });
  // The class hashes only what the published artifact emits, so a preview never renames a node's class.
  const className = `bs-${hash(JSON.stringify(rules.map(({ width, selector, css }) => ({ width, selector, css }))))}`;
  const css = rules
    .map((r) => {
      const selector = preview && r.state !== null && r.state === preview.state ? "" : r.selector;
      const text = `.${className}${selector}{${r.css}}`;
      if (r.width === null) return text;
      return preview
        ? `@container ${preview.container} (min-width: ${r.width}){${text}}`
        : `@media (min-width: ${r.width}){${text}}`;
    })
    .join("");
  return { className, css };
}

/** Called at render time by the compiled artifact, and by the canvas preview. */
export function compileEntryStyles(
  styles: BlockStyle[],
  registry = DEFAULT_STYLE_REGISTRY,
  preview?: StylePreview
) {
  const compiled = styles.map((style) => compileBlockStyle(style, registry, preview));
  return {
    classes: compiled.map((style) => style.className),
    css: compiled.length
      ? `@layer theme,base,components,utilities,beam-block-style;@layer beam-block-style{${[
          ...new Map(compiled.map((s) => [s.className, s.css])).values(),
        ].join("")}}`
      : "",
  };
}

export function stylesIn(doc: import("./json.js").JsonNode[]): BlockStyle[] {
  return doc.flatMap((node) =>
    node.kind === "block"
      ? [...(node.style ? [node.style] : []), ...stylesIn(node.children), ...Object.values(node.slots ?? {}).flatMap(stylesIn), ...stylesIn(node.repeat?.empty ?? [])]
      : []
  );
}
