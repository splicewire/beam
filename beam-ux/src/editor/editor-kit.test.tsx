import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { EditorKitProvider, useEditorKit } from "./context";
import { PageEditor } from "./page-editor";
import type { UxBuilderClient } from "../types";
const tree = [
  {
    kind: "block" as const,
    name: "p",
    isComponent: false,
    dynamic: false,
    props: [],
    children: [{ kind: "text" as const, value: "SPA default" }],
  },
];
afterEach(cleanup);
it("an SPA without Inertia creates from its default tree using its injected token transport", async () => {
  const request = vi.fn(async (_url: string, _init: RequestInit) => ({
    id: "created-id",
  }));
  const transport: UxBuilderClient = {
    loadBody: vi.fn(),
    saveBody: vi.fn(),
    makeEditable: (slug, body) =>
      request("/api/beam-ux-entries/make-editable", {
        method: "POST",
        headers: { Authorization: "Bearer test-token" },
        body: JSON.stringify({ slug, body }),
      }),
  };
  render(
    <EditorKitProvider
      transport={transport}
      canAuthor
      defaultTreeFor={() => tree}
    >
      <PageEditor slug="spa-page" />
    </EditorKitProvider>
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Make this page editable" })
  );
  await waitFor(() => expect(request).toHaveBeenCalledOnce());
  expect(request.mock.calls[0][1].headers).toEqual({
    Authorization: "Bearer test-token",
  });
  expect(JSON.parse(request.mock.calls[0][1].body as string)).toEqual({
    slug: "spa-page",
    body: tree,
  });
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Make this page editable" })
    ).toBeNull()
  );
});
it("a non-author cannot create an editable entry", () => {
  render(
    <EditorKitProvider
      transport={{
        loadBody: vi.fn(),
        saveBody: vi.fn(),
        makeEditable: vi.fn(),
      }}
      canAuthor={false}
      defaultTreeFor={() => tree}
    >
      <PageEditor slug="spa-page" />
    </EditorKitProvider>
  );
  expect(
    screen.queryByRole("button", { name: "Make this page editable" })
  ).toBeNull();
});

it("explicit undefined optional inputs retain the kit defaults", () => {
  let received: ReturnType<typeof useEditorKit> | undefined;
  function Probe() {
    received = useEditorKit();
    return null;
  }
  const transport = { loadBody: vi.fn(), saveBody: vi.fn(), makeEditable: vi.fn() };
  render(<EditorKitProvider transport={transport} canAuthor={false} theme={undefined}
    canvasConfig={undefined} defaultTreeFor={undefined} notify={undefined}><Probe /></EditorKitProvider>);
  expect(received?.transport).toBe(transport);
  expect(received?.canAuthor).toBe(false);
  expect(received?.theme).toEqual({});
  expect(received?.canvasConfig).toBeDefined();
  expect(received?.defaultTreeFor).toBeTypeOf("function");
  expect(() => received!.notify.success("done")).not.toThrow();
  expect(() => received!.notify.error("failed")).not.toThrow();
});
