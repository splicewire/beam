import { expect, it } from "vitest";
import { blockStyleFields, applyBlockStyle } from "./block-style";
import { styleRegistry } from "../blockdoc/style-runtime";
import type { JsonBlock } from "../blockdoc/json";

it("edits the block field using resolved conditions without touching classes or code props", () => {
  const block: JsonBlock = {
    kind: "block",
    name: "p",
    isComponent: false,
    dynamic: false,
    children: [],
    props: [
      { name: "className", kind: "string", value: "md:p-2" },
      { name: "style", kind: "expression", value: "{color: token}" },
    ],
  };
  const fields = blockStyleFields(
    block,
    { schema: { properties: { style: { type: "string" } } }, attrs: {} },
    styleRegistry({ responsive: { breakpoints: { md: "52rem" } } })
  );
  expect(fields.schema.properties).not.toHaveProperty("style");
  expect(fields.schema.properties.bdStyle).toHaveProperty(
    "properties.layers.items.properties.state.enum",
    [null, "hover", "focus-visible", "active"]
  );
  const next = applyBlockStyle(block, {
    layers: [
      { breakpoint: "md", state: "hover", declarations: { padding: "2rem" } },
    ],
  });
  expect(next.props).toEqual(block.props);
  expect(next.style?.layers[0].breakpoint).toBe("md");
});
