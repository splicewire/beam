import { describe, it, expect } from "vitest";
import { parse, print } from "./lens";
import { toJson, jsonToTsx } from "./json";

describe("Block Style lens", () => {
  it("owns only bdStyle literal grammar and preserves developer object props", () => {
    const source =
      '<div className="md:p-2" style={{ color: token }} data-x={{ arbitrary: call() }} bdStyle={{layers:[{declarations:{color:"red"}},{breakpoint:"md",state:"hover",declarations:{padding:"2rem"}}]}} />;';
    const tree = parse(source);
    expect(print(tree)).toBe(source);
    const doc = toJson(tree);
    expect(doc[0]).toHaveProperty("style.layers.1.breakpoint", "md");
    expect(doc[0]).toHaveProperty("props.1.kind", "expression");
    expect(toJson(parse(jsonToTsx(doc)))).toEqual(doc);
  });

  it("refuses executable bdStyle instead of treating it as a literal", () => {
    expect(() =>
      toJson(parse("<div bdStyle={{layers: getLayers()}} />"))
    ).toThrow(/literal/);
  });

  it("migrates legacy style strings to a base layer", () => {
    const doc = toJson(parse('<p style="color:red;padding:2rem" />'));
    expect(doc[0]).toHaveProperty("style.layers.0.declarations", {
      color: "red",
      padding: "2rem",
    });
    expect(jsonToTsx(doc)).toContain("bdStyle=");
    expect(jsonToTsx(doc)).not.toContain(" style=");
  });
});
