import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import type { JsonDoc } from "../blockdoc/json";
import { EditorKitProvider } from "./context";
import { useComponentSession } from "./ComponentSessionHost";
import { VisualEditorMount } from "./mount";
import type { UxBuilderClient } from "../types";
import type {
  BeamUxEntryBodyData,
  ComponentCanvasData,
} from "@splicewire/beam-resources/types/beam-ux";
vi.mock("./local-session", async (original) => ({
  ...(await original<typeof import("./local-session")>()),
  IndexedDbSessions: class {
    async forEntry() {
      return [];
    }
    async write() {}
    close() {}
  },
}));
vi.mock("../canvas", () => ({
  CanvasProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  VisualEditor: ({
    value,
    onChange,
    onSave,
    onUndo,
  }: {
    value: JsonDoc;
    onChange: (next: JsonDoc) => void;
    onSave: () => void;
    onUndo: () => void;
  }) => (
    <section data-testid="session-canvas">
      <output>{JSON.stringify(value)}</output>
      <button
        onClick={() =>
          onChange([...value, { kind: "text", value: "Local edit" }])
        }
      >
        Edit local
      </button>
      <button onClick={onSave}>Save local</button>
      <button onClick={onUndo}>Undo local</button>
    </section>
  ),
}));
const component: ComponentCanvasData = {
  id: "component",
  definition: { name: "Card", props: [] },
  body: [
    {
      kind: "block",
      name: "section",
      isComponent: false,
      dynamic: false,
      props: [],
      children: [],
      component: { name: "Card", props: [] },
    },
  ],
  bindings: {},
  headVersion: "draft",
  publishedVersion: null,
};
function Open() {
  const open = useComponentSession();
  return (
    <button
      onClick={(event) =>
        open?.(component, { title: "Instance title" }, event.currentTarget)
      }
    >
      Open Card
    </button>
  );
}
const version = {
  id: "draft",
  version: 1,
  readable: "v1",
  label: null,
  createdBy: null,
  createdAt: null,
  isHead: true,
  isPublished: false,
};
function fixture(allow = true, reachEntries = 2) {
  const saveDraft = vi.fn(async (id: string) => ({
    id,
    headVersion: "next",
    headReadable: "v2",
    publishedVersion: id === "page" ? "pin" : null,
    publishedReadable: null,
    draftPending: true,
    versions: [{ ...version, id: "next" }],
    compileError: null,
  }));
  const client: UxBuilderClient = {
    loadBody: vi.fn(
      async (id): Promise<BeamUxEntryBodyData> => ({
        id,
        slug: id,
        type: id === "page" ? "page" : "component",
        format: "tsx",
        schema: null,
        body:
          id === "page"
            ? [{ kind: "text", value: "Page original" }]
            : component.body,
        source: null,
        compileError: null,
        authoredComponents: [],
      })
    ),
    saveBody: vi.fn(),
    saveDraft,
    publish: vi.fn(),
    restoreVersion: vi.fn(),
    listVersions: vi.fn(async (id) => ({
      id,
      headVersion: "draft",
      headReadable: "v1",
      publishedVersion: id === "page" ? "pin" : null,
      publishedReadable: null,
      draftPending: true,
      versions: [version],
      compileError: null,
    })),
    componentCapabilities: vi.fn(async () => ({
      id: "component",
      canEdit: allow,
      reachEntries: allow ? reachEntries : null,
      reachLimit: 500,
      reachUnavailable: false,
    })),
  };
  return { client, saveDraft };
}
afterEach(cleanup);
it("retains the dirty parent session while component undo/save address only the component", async () => {
  const { client, saveDraft } = fixture();
  render(
    <EditorKitProvider
      userId="author"
      canAuthor
      transport={client}
      canvasConfig={{ registry: {} }}
    >
      <Open />
      <VisualEditorMount entryRef={{ id: "page", slug: "page" }} />
    </EditorKitProvider>
  );
  const parent = await screen.findByTestId("session-canvas");
  fireEvent.click(within(parent).getByText("Edit local"));
  const before = parent.querySelector("output")!.textContent;
  expect(before).toContain("Local edit");
  fireEvent.click(screen.getByText("Open Card"));
  const dialog = await screen.findByRole("dialog", {
    name: "Edit component Card",
  });
  expect(within(dialog).getByText(/used directly by 2 entries/)).toBeTruthy();
  const child = await within(dialog).findByTestId("session-canvas");
  fireEvent.click(within(child).getByText("Edit local"));
  fireEvent.click(within(child).getByText("Undo local"));
  expect(child.querySelector("output")!.textContent).not.toContain(
    "Local edit"
  );
  fireEvent.click(within(child).getByText("Edit local"));
  fireEvent.click(within(child).getByText("Save local"));
  await waitFor(() => expect(saveDraft).toHaveBeenCalled());
  expect(saveDraft.mock.calls.every((args) => args[0] === "component")).toBe(
    true
  );
  expect(parent.querySelector("output")!.textContent).toBe(before);
  fireEvent.click(within(dialog).getByText("Back to parent"));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(parent.querySelector("output")!.textContent).toBe(before);
});
it("refused component admission never opens a child session or calls a write", async () => {
  const { client, saveDraft } = fixture(false);
  render(
    <EditorKitProvider
      userId="author"
      canAuthor
      transport={client}
      canvasConfig={{ registry: {} }}
    >
      <Open />
    </EditorKitProvider>
  );
  fireEvent.click(screen.getByText("Open Card"));
  await screen.findByRole("alert");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(saveDraft).not.toHaveBeenCalled();
});

it.each([0, 1, 2])(
  "labels %i direct referrers with correct units and the transitive-page limit",
  async (count) => {
    const { client } = fixture(true, count);
    render(
      <EditorKitProvider
        userId="author"
        canAuthor
        transport={client}
        canvasConfig={{ registry: {} }}
      >
        <Open />
      </EditorKitProvider>
    );
    fireEvent.click(screen.getByText("Open Card"));
    const dialog = await screen.findByRole("dialog", {
      name: "Edit component Card",
    });
    expect(
      within(dialog).getByText(
        new RegExp(
          `used directly by ${count} ${count === 1 ? "entry" : "entries"}$`
        )
      )
    ).toBeTruthy();
    expect(
      within(dialog).getByText("Transitive page reach is not included.")
    ).toBeTruthy();
  }
);
