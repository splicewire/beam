import type { JsonBlock } from "../blockdoc/json.js";
import { legacyStyle, assertBlockStyle } from "../blockdoc/style.js";
import {
  DEFAULT_STYLE_REGISTRY,
  type StyleRegistry,
} from "../blockdoc/style-runtime.js";

/** Inspector uses the same block field and registry as the renderer; no class rewriting. */
export function blockStyleFields(
  block: JsonBlock,
  input: { schema: Record<string, unknown>; attrs: Record<string, unknown> },
  registry: StyleRegistry = DEFAULT_STYLE_REGISTRY
) {
  const properties = {
    ...(input.schema.properties as Record<string, unknown>),
  };
  const attrs = { ...input.attrs };
  delete properties.style;
  delete attrs.style;
  const legacy = block.props.find(
    (p) => p.name === "style" && p.kind === "string"
  );
  properties.bdStyle = {
    type: "object",
    title: "Block style",
    "x-tab": "Style",
    additionalProperties: false,
    required: ["layers"],
    properties: {
      layers: {
        type: "array",
        title: "Layers",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["declarations"],
          properties: {
            breakpoint: {
              type: ["string", "null"],
              title: "Breakpoint",
              enum: [null, ...Object.keys(registry.breakpoints)],
            },
            state: {
              type: ["string", "null"],
              title: "State",
              enum: [null, ...Object.keys(registry.states)],
            },
            declarations: {
              type: "object",
              title: "Properties",
              additionalProperties: { type: "string" },
            },
          },
        },
      },
    },
  };
  const bdStyle =
    block.style ??
    (legacy ? legacyStyle(String(legacy.value ?? "")) : { layers: [] });
  return { schema: { ...input.schema, properties }, attrs: {...attrs, bdStyle} };
}

export function applyBlockStyle(block: JsonBlock, value: unknown): JsonBlock {
  assertBlockStyle(value);
  return {
    ...block,
    style: value,
    props: block.props.filter(
      (p) => !(p.name === "style" && p.kind === "string")
    ),
  };
}
