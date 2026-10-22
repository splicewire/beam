import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ReleasePanel, type ReleaseRecord } from "./releases";

const release: ReleaseRecord = {
  id: "r1",
  title: "Launch",
  realm: "site",
  status: "draft",
  reviewedBy: null,
  members: [],
  workflow: {
    available: ["submit", "publish"],
    transitions: [],
    places: [],
    marking: ["draft"],
  } as unknown as ReleaseRecord["workflow"],
  canSchedule: false,
  reviewRequired: true,
};
const entries = [
  {
    id: "page",
    title: "Page",
    versions: [
      { id: "v1", label: "Version one" },
      { id: "v2", label: "Version two" },
    ],
    canTakeDown: true,
  },
];

describe("Release assembly", () => {
  it("sends the chosen saved version, not an implicit working head", async () => {
    const command = vi.fn(async () => undefined);
    render(
      <ReleasePanel release={release} entries={entries} onCommand={command} />,
    );
    fireEvent.change(screen.getByLabelText("Entry"), {
      target: { value: "page" },
    });
    fireEvent.change(screen.getByLabelText("Saved version"), {
      target: { value: "v1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add to Release" }));
    await waitFor(() =>
      expect(command).toHaveBeenCalledWith({
        action: "member",
        entryId: "page",
        ref: "v1",
        redirectTarget: null,
      }),
    );
    expect(screen.queryByRole("button", { name: "Publish now" })).toBeNull();
    expect(
      screen.queryByRole("form", { name: "Schedule workflow transition" }),
    ).toBeNull();
  });
  it("offers explicit rebase and drop for a moved pin and blocks publish", () => {
    render(
      <ReleasePanel
        release={{
          ...release,
          status: "approved",
          workflow: { ...release.workflow!, available: ["publish"] },
          members: [
            {
              entryId: "page",
              versionId: "v1",
              observedPin: "old",
              redirectTarget: null,
              stale: true,
            },
          ],
        }}
        entries={entries}
        onCommand={vi.fn()}
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Publish now" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Rebase" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Drop" })).toBeTruthy();
  });
  it("keeps a failed admission visible and never reports success", async () => {
    render(
      <ReleasePanel
        release={release}
        entries={entries}
        onCommand={async () => {
          throw new Error("Review required");
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Request review" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Review required",
    );
  });
  it("uses the existing workflow scheduling form only when calendars is available", async () => {
    const command = vi.fn(async () => undefined);
    render(
      <ReleasePanel
        release={{
          ...release,
          status: "approved",
          canSchedule: true,
          workflow: {
            ...release.workflow!,
            available: ["publish"],
            transitions: [{ name: "publish" }] as NonNullable<
              ReleaseRecord["workflow"]
            >["transitions"],
          },
        }}
        entries={entries}
        onCommand={command}
      />,
    );
    fireEvent.change(screen.getByLabelText("Date and time"), {
      target: { value: "2030-01-15T12:30" },
    });
    fireEvent.change(screen.getByLabelText("Timezone"), {
      target: { value: "UTC" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Schedule transition" }),
    );
    await waitFor(() =>
      expect(command).toHaveBeenCalledWith({
        action: "schedule",
        dueAt: "2030-01-15T12:30:00.000Z",
        timezone: "UTC",
      }),
    );
  });
});
