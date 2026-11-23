import { describe, expect, it } from "vitest";
import * as beamInertia from "../index";

// frame-foundation 92: the three a host page needs to mount the realm's frame kit are on the package root.
describe("beam-inertia's host frame mount", () => {
  it("exports BeamFrameProvider, FrameRealmProvider and useFrameRealm", () => {
    expect(typeof beamInertia.BeamFrameProvider).toBe("function");
    expect(typeof beamInertia.FrameRealmProvider).toBe("function");
    expect(typeof beamInertia.useFrameRealm).toBe("function");
    // realm-neutral, no alias: it mounts the operator realm as readily as a tenant's (grill 92 part 3).
    expect("TenantFrameProvider" in beamInertia).toBe(false);
  });
});
