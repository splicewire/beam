// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { JsonDoc } from "@splicewire/beam-ux/jsondoc";

const loadBody = vi.hoisted(() => vi.fn());
const saveBody = vi.hoisted(() => vi.fn());
const saveDraft = vi.hoisted(() => vi.fn());
const publishVersion = vi.hoisted(() => vi.fn());
const listVersions = vi.hoisted(() => vi.fn());
const restoreVersion = vi.hoisted(() => vi.fn());
const listReleases = vi.hoisted(() => vi.fn());
const createRelease = vi.hoisted(() => vi.fn());
const releaseCommand = vi.hoisted(() => vi.fn());
const previewVersion = vi.hoisted(() => vi.fn());
const provided = vi.hoisted(() => ({ profile: undefined as unknown }));
vi.mock("./local-session", async (importOriginal) => {
  const original = await importOriginal<typeof import("./local-session")>();
  return {
    ...original,
    IndexedDbSessions: class {
      async forEntry() {
        return [];
      }
      async write() {}
      close() {}
    },
  };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("./context", () => ({
  useEditorKit: () => ({
    userId: "author",
    transport: {
      loadBody,
      saveBody,
      saveDraft,
      listVersions,
      listReleases,
      createRelease,
      releaseCommand,
      previewVersion,
      publish: publishVersion,
      restoreVersion,
    },
    theme: {},
    canAuthor: true,
    canvasConfig: { registry: {} },
    defaultTreeFor: () => [{ kind: "text", value: "SEED" }],
    notify: { success: vi.fn(), error: vi.fn() },
  }),
}));
// Observe the adapter's public controlled-value and save seam; the canvas has its own owning tests.
vi.mock("../canvas", () => ({
  CanvasProvider: ({
    children,
    config,
  }: {
    children: ReactNode;
    config: { profile?: unknown };
  }) => {
    provided.profile = config.profile;
    return <>{children}</>;
  },
  VisualEditor: ({
    value,
    onSave,
    onUndo,
  }: {
    value: JsonDoc;
    onSave: () => void;
    onUndo: () => void;
  }) => (
    <div data-testid="canvas">
      {JSON.stringify(value)}
      <button onClick={onSave}>Save</button>
      <button onClick={onUndo}>Undo</button>
    </div>
  ),
}));
import { VisualEditorMount } from "./mount";

const SAVED = [{ kind: "text", value: "Persisted A" }];
const ref = (id: string | null) => ({ id, slug: "home", format: "tsx" });
it("passes the server entry profile to the window canvas", async () => {
  const profile = {
    profile: "tenant",
    version: 1,
    nodes: [],
    "x-admits-code": false,
  };
  loadBody.mockResolvedValue({ body: SAVED, profile });
  render(<VisualEditorMount entryRef={ref("entry-profile")} />);
  await waitFor(() => expect(provided.profile).toBe(profile));
});
beforeEach(() => {
  const state = {
    headVersion: "v1",
    publishedVersion: "v1",
    draftPending: false,
    versions: [],
  };
  listVersions.mockResolvedValue(state);
  listReleases.mockResolvedValue([]);
  saveDraft.mockResolvedValue(state);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  loadBody.mockReset();
  saveBody.mockReset();
  saveDraft.mockReset();
  listVersions.mockReset();
  listReleases.mockReset();
  createRelease.mockReset();
  releaseCommand.mockReset();
  previewVersion.mockReset();
  publishVersion.mockReset();
  restoreVersion.mockReset();
});

it("withholds replacement writes after a refused window read", async () => {
  loadBody.mockRejectedValue(new Error("Forbidden"));
  render(<VisualEditorMount entryRef={ref("a")} />);

  await waitFor(() =>
    expect(screen.queryByText("Loading Local Session…")).toBeNull(),
  );
  expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  expect(screen.getByRole("alert").textContent).toContain("Forbidden");
  expect(saveBody).not.toHaveBeenCalled();
});

it.each(["ready", "refused"])(
  "withholds settled A while reading replacement B, then handles B as %s",
  async (outcome) => {
    let resolve: (value: unknown) => void = () => {};
    let reject: (reason: Error) => void = () => {};
    loadBody.mockResolvedValueOnce({ body: SAVED }).mockReturnValueOnce(
      new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      }),
    );
    const view = render(<VisualEditorMount entryRef={ref("a")} />);
    await screen.findByRole("button", { name: "Save" });

    view.rerender(<VisualEditorMount entryRef={ref("b")} />);

    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.getByText("Loading Local Session…")).toBeTruthy();
    await act(async () => {
      if (outcome === "refused") reject(new Error("Forbidden"));
      else resolve({ body: [{ kind: "text", value: "Persisted B" }] });
    });
    if (outcome === "refused") {
      expect(screen.queryByTestId("canvas")).toBeNull();
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(saveBody).not.toHaveBeenCalled();
    } else {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() =>
        expect(saveDraft).toHaveBeenCalledWith(
          "b",
          [{ kind: "text", value: "Persisted B" }],
          "v1",
        ),
      );
      expect(saveBody).not.toHaveBeenCalled();
    }
  },
);

it("preserves a pinned empty draft without replacing it with a seed", async () => {
  loadBody.mockResolvedValue({ body: [] });
  render(<VisualEditorMount entryRef={ref("a")} />);
  fireEvent.click(await screen.findByRole("button", { name: "Save" }));
  await waitFor(() => expect(saveDraft).toHaveBeenCalledWith("a", [], "v1"));
  expect(saveBody).not.toHaveBeenCalled();
});

it("saves page settings and body as one draft and undoes both through the session", async () => {
  loadBody.mockResolvedValue({
    body: SAVED,
    pageSettings: { title: "Published title", segment: "home" },
  });
  render(<VisualEditorMount entryRef={ref("settings-page")} />);
  const title = await screen.findByLabelText("Title");
  fireEvent.change(title, { target: { value: "Draft title" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(saveDraft).toHaveBeenCalledWith(
      "settings-page",
      SAVED,
      "v1",
      undefined,
      { title: "Draft title", segment: "home" },
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "Undo" }));
  expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe(
    "Published title",
  );
});

it("mounts an unauthored existing row without writing, then first-saves with a null base", async () => {
  listVersions.mockResolvedValue({
    headVersion: null,
    publishedVersion: null,
    versions: [],
    draftPending: false,
  });
  loadBody.mockResolvedValue({ body: SAVED });
  render(<VisualEditorMount entryRef={ref("unauthored")} />);
  await screen.findByRole("button", { name: "Save" });
  expect(saveDraft).not.toHaveBeenCalled();
  expect(publishVersion).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() =>
    expect(saveDraft).toHaveBeenCalledWith("unauthored", SAVED, null),
  );
});
it("first Publish saves a null-base draft then publishes its returned ref", async () => {
  listVersions.mockResolvedValue({
    headVersion: null,
    publishedVersion: null,
    versions: [],
    draftPending: false,
  });
  loadBody.mockResolvedValue({ body: SAVED });
  publishVersion.mockResolvedValue({
    headVersion: "v1",
    publishedVersion: "v1",
    versions: [],
    draftPending: false,
  });
  render(<VisualEditorMount entryRef={ref("publish-first")} />);
  fireEvent.click(await screen.findByRole("button", { name: "Publish" }));
  await waitFor(() =>
    expect(saveDraft).toHaveBeenCalledWith(
      "publish-first",
      SAVED,
      null,
      undefined,
      null,
    ),
  );
  await waitFor(() =>
    expect(publishVersion).toHaveBeenCalledWith("publish-first", "v1"),
  );
});

it("creates a built Release and assembles saved versions from multiple entries", async () => {
  const created = {
    id: "release-launch",
    title: "Launch",
    realm: "site",
    status: "draft",
    reviewedBy: null,
    members: [],
    workflow: null,
    canSchedule: false,
    reviewRequired: false,
  };
  const firstState = {
    headVersion: "first-v2",
    publishedVersion: "first-v1",
    draftPending: true,
    versions: [
      { id: "first-v1", readable: "v1" },
      { id: "first-v2", readable: "v2" },
    ],
  };
  const secondState = {
    headVersion: "second-v3",
    publishedVersion: "second-v2",
    draftPending: true,
    versions: [{ id: "second-v3", readable: "v3" }],
  };
  listVersions.mockImplementation(async (id: string) =>
    id === "first-entry" ? firstState : secondState,
  );
  createRelease.mockResolvedValue(created);
  releaseCommand.mockImplementation(async (releaseId, command) => ({
    ...created,
    id: releaseId,
    members: [
      {
        entryId: command.entryId,
        versionId: command.ref,
        observedPin: null,
        redirectTarget: null,
        stale: false,
      },
    ],
  }));
  loadBody.mockResolvedValue({ body: SAVED });

  const first = render(<VisualEditorMount entryRef={ref("first-entry")} />);
  fireEvent.change(await screen.findByLabelText("Release title"), {
    target: { value: "Launch" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create built Release" }));
  await waitFor(() =>
    expect(createRelease).toHaveBeenCalledWith("first-entry", "Launch"),
  );

  expect(await screen.findByRole("region", { name: "Release" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Entry"), {
    target: { value: "first-entry" },
  });
  fireEvent.change(screen.getByLabelText("Saved version"), {
    target: { value: "first-v2" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add to Release" }));
  await waitFor(() =>
    expect(releaseCommand).toHaveBeenLastCalledWith("release-launch", {
      action: "member",
      entryId: "first-entry",
      ref: "first-v2",
      redirectTarget: null,
    }),
  );

  const assembled = {
    ...created,
    members: [
      {
        entryId: "first-entry",
        versionId: "first-v2",
        observedPin: null,
        redirectTarget: null,
        stale: false,
      },
    ],
  };
  listReleases.mockResolvedValue([assembled]);
  first.rerender(<VisualEditorMount entryRef={ref("second-entry")} />);
  fireEvent.change(await screen.findByLabelText("Release to assemble"), {
    target: { value: "release-launch" },
  });
  fireEvent.change(screen.getByLabelText("Entry"), {
    target: { value: "second-entry" },
  });
  fireEvent.change(screen.getByLabelText("Saved version"), {
    target: { value: "second-v3" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add to Release" }));

  await waitFor(() =>
    expect(releaseCommand).toHaveBeenLastCalledWith("release-launch", {
      action: "member",
      entryId: "second-entry",
      ref: "second-v3",
      redirectTarget: null,
    }),
  );
});

it("offers only draft Releases for adding an entry", async () => {
  const release = (id: string, status: string) => ({
    id,
    title: status,
    realm: "site",
    status,
    reviewedBy: null,
    members: [],
    workflow: null,
    canSchedule: false,
    reviewRequired: false,
  });
  listVersions.mockResolvedValue({
    headVersion: "v1",
    publishedVersion: "v1",
    draftPending: false,
    versions: [{ id: "v1", readable: "v1" }],
  });
  listReleases.mockResolvedValue([
    release("draft-release", "draft"),
    release("review-release", "in_review"),
    release("approved-release", "approved"),
    release("scheduled-release", "scheduled"),
    release("terminal-release", "cancelled"),
  ]);
  loadBody.mockResolvedValue({ body: SAVED });
  render(<VisualEditorMount entryRef={ref("entry-draft-only")} />);

  const releases = await screen.findByLabelText("Release to assemble");
  expect(releases.querySelector('option[value="draft-release"]')).not.toBeNull();
  for (const id of [
    "review-release",
    "approved-release",
    "scheduled-release",
    "terminal-release",
  ]) {
    expect(releases.querySelector(`option[value="${id}"]`)).toBeNull();
  }
});
it("refuses a missing pin when history exists even if head is missing", async () => {
  listVersions.mockResolvedValue({
    headVersion: null,
    publishedVersion: null,
    versions: [{ id: "old" }],
    draftPending: false,
  });
  loadBody.mockResolvedValue({ body: SAVED });
  render(<VisualEditorMount entryRef={ref("damaged")} />);
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Publication Pin",
  );
  expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
});

it("projects all recording references in window history without writing the version or body", async () => {
  loadBody.mockResolvedValue({ body: SAVED });
  const version = {
    id: "v1",
    readable: "v1-published",
    label: "Published",
    recordings: [
      {
        releaseId: "release-a",
        status: "recorded",
        sha: "123456789abcdef",
        noChange: false,
        canRetry: false,
        message: "Recorded locally.",
      },
      {
        releaseId: "release-b",
        status: "failed",
        sha: null,
        noChange: false,
        canRetry: true,
        message: "Hook refused",
      },
    ],
  };
  const original = JSON.stringify(version);
  listVersions.mockResolvedValue({
    headVersion: "v1",
    publishedVersion: "v1",
    draftPending: false,
    versions: [version],
  });
  render(<VisualEditorMount entryRef={ref("a")} />);
  await screen.findByRole("button", { name: "Save" });
  fireEvent.click(screen.getByRole("button", { name: "History" }));
  expect(screen.getByText(/Git 1234567.*release-a/)).toBeTruthy();
  expect(screen.getByText(/Not committed.*release-b/)).toBeTruthy();
  expect(JSON.stringify(version)).toBe(original);
  expect(saveDraft).not.toHaveBeenCalled();
  expect(saveBody).not.toHaveBeenCalled();
});

// review-r1 (EP-26 E): every load path keeps the Page Fields offer, not only the first mount.
const OFFERED = { body: SAVED, pageSettings: { title: "Pie" }, pageFields: { names: ["recipe"], schema: null } };

it("keeps the Page Fields offer after a conflict's Reload theirs", async () => {
  loadBody.mockResolvedValue(OFFERED);
  saveDraft.mockRejectedValueOnce({ status: 409 });
  render(<VisualEditorMount entryRef={ref("offer-reload")} />);
  await screen.findByLabelText("Child page fields");
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Local pie" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  fireEvent.click(await screen.findByRole("button", { name: "Reload theirs" }));

  await waitFor(() => expect(loadBody).toHaveBeenCalledTimes(2));
  await waitFor(() => expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("Pie"));
  expect(screen.getByLabelText("Child page fields")).toBeTruthy();
});

it("keeps the page settings and the Page Fields offer after a History restore", async () => {
  loadBody.mockResolvedValue(OFFERED);
  const old = { id: "v0", readable: "v0", label: "Older", recordings: [] };
  listVersions.mockResolvedValue({ headVersion: "v1", publishedVersion: "v1", draftPending: false, versions: [old] });
  restoreVersion.mockResolvedValue({ headVersion: "v2", publishedVersion: "v1", draftPending: true, versions: [old] });
  render(<VisualEditorMount entryRef={ref("offer-restore")} />);
  await screen.findByLabelText("Child page fields");
  fireEvent.click(screen.getByRole("button", { name: "History" }));
  fireEvent.click(screen.getByRole("button", { name: "Restore v0 into draft" }));

  await waitFor(() => expect(restoreVersion).toHaveBeenCalledWith("offer-restore", "v0"));
  await waitFor(() => expect(loadBody).toHaveBeenCalledTimes(2));
  expect(screen.getByLabelText("Child page fields")).toBeTruthy();
  expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("Pie");
});

it("opens a saved history version through the author preview transport without writing it", async () => {
  loadBody.mockResolvedValue({ body: SAVED });
  listVersions.mockResolvedValue({
    headVersion: "v2",
    publishedVersion: "v2",
    draftPending: false,
    versions: [{ id: "v1", readable: "v1-old", label: "Older" }],
  });
  previewVersion.mockResolvedValue({ url: "/beam-ux/preview/signed" });
  const popup = {
    opener: window,
    location: { href: "about:blank" },
    close: vi.fn(),
  } as unknown as Window;
  vi.spyOn(window, "open").mockReturnValue(popup);

  render(<VisualEditorMount entryRef={ref("entry-a")} />);
  await screen.findByRole("button", { name: "Save" });
  fireEvent.click(screen.getByRole("button", { name: "History" }));
  fireEvent.click(await screen.findByRole("button", { name: "Open" }));

  await waitFor(() =>
    expect(popup.location.href).toBe(
      `${window.location.origin}/beam-ux/preview/signed`,
    ),
  );
  expect(window.open).toHaveBeenCalledWith("about:blank", "_blank");
  expect(popup.opener).toBeNull();
  expect(previewVersion).toHaveBeenCalledWith("entry-a", "v1");
  expect(saveDraft).not.toHaveBeenCalled();
  expect(saveBody).not.toHaveBeenCalled();
});
