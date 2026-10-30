import { describe, expect, it } from "vitest";
import { useEditMode as pageEditorUseEditMode } from "./canvas/PageEditor.js";
import { useEditMode as lightUseEditMode } from "./edit-mode.js";
import * as lightEditModeEntry from "./edit-mode.js";
import * as legacyCanvasEntry from "./canvas/index.js";

describe("the lightweight edit-mode entry", () => {
  it("shares the exact hook implementation used by PageEditor", () => {
    expect(lightUseEditMode).toBe(pageEditorUseEditMode);
  });

  it("does not expose the shared-store reset seam", () => {
    expect(lightEditModeEntry).not.toHaveProperty("__resetEditMode");
  });

  it("keeps the reset seam on the legacy canvas entry", () => {
    expect(legacyCanvasEntry).toHaveProperty("__resetEditMode");
  });
});
