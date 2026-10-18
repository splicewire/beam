import { describe, it, expect } from "vitest";
import {
  compileBlockStyle,
  compileEntryStyles,
  styleRegistry,
} from "./style-runtime";
import type { BlockStyle } from "./style";

describe("render-time Block Style", () => {
  it("shares identical rules and resolves host breakpoints without rebuilding the entry", () => {
    const style: BlockStyle = {
      layers: [
        { declarations: { color: "red" } },
        { breakpoint: "md", state: "hover", declarations: { padding: "2rem" } },
      ],
    };
    const defaults = compileEntryStyles([style, style]);
    expect(defaults.classes[0]).toBe(defaults.classes[1]);
    expect(defaults.css.match(/color:red/g)).toHaveLength(1);
    expect(defaults.css).toContain("utilities,beam-block-style");
    expect(defaults.css).toContain("@media (min-width: 48rem)");
    const custom = compileEntryStyles(
      [style],
      styleRegistry({ responsive: { breakpoints: { md: "52rem" } } })
    );
    expect(custom.css).toContain("@media (min-width: 52rem)");
    expect(custom.classes[0]).not.toBe(defaults.classes[0]);
  });
  it("rejects unrecognized conditions and style-tag breakout", () => {
    expect(() =>
      compileBlockStyle({
        layers: [{ state: "visited", declarations: { color: "red" } }],
      })
    ).toThrow();
    expect(() =>
      compileBlockStyle({
        layers: [{ declarations: { color: "red}</style>" } }],
      })
    ).toThrow();
  });
});
