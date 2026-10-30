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
  it("previews breakpoints against the canvas container and a selected state, with the published class (EP-12)", () => {
    const style: BlockStyle = {
      layers: [
        { declarations: { color: "red" } },
        { breakpoint: "md", declarations: { padding: "2rem" } },
        { state: "hover", declarations: { color: "blue" } },
      ],
    };
    const published = compileBlockStyle(style);
    const canvas = compileBlockStyle(style, undefined, { container: "beam-canvas", state: null });
    expect(canvas.className).toBe(published.className);
    expect(canvas.css).toContain("@container beam-canvas (min-width: 48rem)");
    expect(canvas.css).not.toContain("@media");
    expect(canvas.css).toContain(`.${published.className}:hover{color:blue}`);

    const hovered = compileBlockStyle(style, undefined, { container: "beam-canvas", state: "hover" });
    expect(hovered.className).toBe(published.className);
    expect(hovered.css).toContain(`.${published.className}{color:blue}`);
    expect(hovered.css).not.toContain(":hover");
    // Layer order is cascade order: the previewed state still follows the base layer it overrides.
    expect(hovered.css.indexOf("color:blue")).toBeGreaterThan(hovered.css.indexOf("color:red"));

    const entry = compileEntryStyles([style], undefined, { container: "beam-canvas", state: "hover" });
    expect(entry.classes).toEqual([published.className]);
    expect(entry.css).toContain("@container beam-canvas (min-width: 48rem)");
  });
  it("keeps the published output byte-identical when no preview is asked for", () => {
    const style: BlockStyle = {
      layers: [{ declarations: { color: "red" } }, { breakpoint: "md", state: "hover", declarations: { padding: "2rem" } }],
    };
    expect(compileBlockStyle(style, undefined, undefined)).toEqual(compileBlockStyle(style));
    expect(compileEntryStyles([style]).css).toContain("@media (min-width: 48rem)");
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
