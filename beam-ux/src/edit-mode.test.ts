import { describe, expect, it } from "vitest";
import { useEditMode as pageEditorUseEditMode } from "./canvas/PageEditor.js";
import { useEditMode as lightUseEditMode } from "./edit-mode.js";

describe("the lightweight edit-mode entry", () => {
  it("shares the exact hook implementation used by PageEditor", () => {
    expect(lightUseEditMode).toBe(pageEditorUseEditMode);
  });
});
