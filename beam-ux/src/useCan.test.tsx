import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const injection = vi.hoisted(() => ({
  can: vi.fn(),
  manifestFor: vi.fn(),
}));

vi.mock("@schemastud/frame", () => ({
  useFrameInjection: () => injection,
}));

import { useCan } from "./useCan.js";

function Control({
  resource,
  operation,
}: {
  resource: string;
  operation: string;
}) {
  return useCan(resource, operation) ? <button>New entry</button> : null;
}

describe("useCan", () => {
  beforeEach(() => {
    injection.can.mockReset();
    injection.manifestFor.mockReset();
  });

  it("keeps a CRUD control only when Frame admits that resource operation", () => {
    injection.can.mockImplementation(
      (operation, resource) =>
        operation === "create" && resource === "fragments"
    );

    const { rerender } = render(
      <Control resource="fragments" operation="create" />
    );
    expect(screen.getByRole("button", { name: "New entry" })).toBeTruthy();

    rerender(<Control resource="agents" operation="create" />);
    expect(screen.queryByRole("button", { name: "New entry" })).toBeNull();
    expect(injection.can).toHaveBeenCalledWith("create", "agents");
  });

  it("reads a declared custom operation only from the manifest's per-actor can map", () => {
    injection.manifestFor.mockImplementation((resource) =>
      resource === "circuits"
        ? { can: { actions: { run: true, archive: false } } }
        : undefined
    );

    const { rerender } = render(
      <Control resource="circuits" operation="run" />
    );
    expect(screen.getByRole("button", { name: "New entry" })).toBeTruthy();

    rerender(<Control resource="circuits" operation="archive" />);
    expect(screen.queryByRole("button", { name: "New entry" })).toBeNull();

    rerender(<Control resource="unknown" operation="run" />);
    expect(screen.queryByRole("button", { name: "New entry" })).toBeNull();
  });
});
