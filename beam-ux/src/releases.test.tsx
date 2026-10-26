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
    const command = vi.fn();
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
        onCommand={command}
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Publish now" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Rebase onto theirs" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Drop the entry" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Drop the entry" }));
    expect(command).toHaveBeenCalledWith({ action: "drop", entryId: "page" });
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

describe("Preview from the Release (ADR-0232 d8, d15; EP-18)", () => {
  it("opens the Release's Preview and turns its Preview Links on", async () => {
    const command = vi.fn(async () => undefined);
    render(
      <ReleasePanel
        release={{ ...release, previewHref: "/_beam/preview/open/r1", previewLinksEnabled: false, canManagePreviewLinks: true }}
        entries={entries}
        onCommand={command}
      />,
    );

    expect(screen.getByRole("link", { name: "Preview" }).getAttribute("href")).toBe("/_beam/preview/open/r1");
    fireEvent.click(screen.getByRole("button", { name: "Turn on Preview Links" }));
    await waitFor(() => expect(command).toHaveBeenCalledWith({ action: "links-on" }));
  });

  it("offers the link to copy, rotate or turn off", async () => {
    const link = "https://site.test/_beam/preview/release/r1?expires=1&signature=a";
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const command = vi.fn(async () => undefined);
    render(
      <ReleasePanel
        release={{ ...release, previewLinksEnabled: true, previewLink: link, canManagePreviewLinks: true }}
        entries={entries}
        onCommand={command}
      />,
    );

    expect((screen.getByLabelText("Preview Link") as HTMLInputElement).value).toBe(link);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledWith(link);
    fireEvent.click(screen.getByRole("button", { name: "Rotate links" }));
    await waitFor(() => expect(command).toHaveBeenCalledWith({ action: "rotate-links" }));
    fireEvent.click(screen.getByRole("button", { name: "Turn links off" }));
    await waitFor(() => expect(command).toHaveBeenCalledWith({ action: "links-off" }));
  });

  it("shows no link controls to a reader who can't edit every member (review of 3d7565ec)", () => {
    const { rerender } = render(
      <ReleasePanel
        release={{ ...release, previewLinksEnabled: false, canManagePreviewLinks: false }}
        entries={entries}
        onCommand={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Turn on Preview Links" })).toBeNull();

    rerender(
      <ReleasePanel
        release={{ ...release, previewLinksEnabled: true, previewLink: null, canManagePreviewLinks: false }}
        entries={entries}
        onCommand={vi.fn()}
      />,
    );
    expect(screen.getByText("Preview Links are on.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Rotate links" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Turn links off" })).toBeNull();
  });

  it("has no Preview or links on a published Release", () => {
    render(
      <ReleasePanel
        release={{ ...release, status: "published", previewHref: null, previewLinksEnabled: false }}
        entries={entries}
        onCommand={vi.fn()}
      />,
    );

    expect(screen.queryByRole("link", { name: "Preview" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Turn on Preview Links" })).toBeNull();
  });
});

describe("A Release's Redirects", () => {
  // ux-0236 d2 (EP-31 slice 5): the Release page lists the Redirects it leaves: those it would leave while open, and
  // those it left once published, where an unwanted one is removed from the list.
  it("lists the Redirects it would leave while open, with nothing to remove yet", () => {
    render(
      <ReleasePanel
        release={{ ...release, redirects: [
          { id: null, path: "/about", match: "exact", to: "/company", origin: "release" },
          { id: null, path: "/legacy", match: "exact", to: "/pricing", origin: "takedown" },
        ] }}
        entries={entries}
        onCommand={vi.fn()}
        onRemoveRedirect={vi.fn()}
      />,
    );
    const list = screen.getByRole("region", { name: "Redirects this Release leaves" });
    expect(Array.from(list.querySelectorAll("li")).map((item) => item.textContent)).toEqual([
      "/about → /company",
      "/legacy → /pricing (taken down)",
    ]);
    expect(screen.queryByRole("button", { name: /^Remove/ })).toBeNull();
  });

  it("removes one it left, once published", async () => {
    const remove = vi.fn(async () => undefined);
    render(
      <ReleasePanel
        release={{ ...release, status: "published", redirects: [
          { id: "rd1", path: "/about", match: "exact", to: "/company", origin: "release" },
          { id: "rd2", path: "/blog", match: "prefix", to: "/posts", origin: "release" },
        ] }}
        entries={entries}
        onCommand={vi.fn()}
        onRemoveRedirect={remove}
      />,
    );
    expect(screen.getByText("/blog and below → /posts")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove the Redirect from /about" }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith("rd1"));
    await waitFor(() => expect(screen.queryByText("/about → /company")).toBeNull());
    expect(screen.getByText("/blog and below → /posts")).toBeTruthy();
  });
});
