import { useState } from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import { CanvasProvider, type CanvasConfig } from "./context";
import { CanvasWidget } from "./CanvasWidget";
import { ComponentTools } from "./ComponentTools";
import { LocalSession } from "../editor/local-session";
import type { JsonBlock } from "../blockdoc/json";
import type {
  ComponentCanvasData,
  EntryComponentCapabilitiesOutputData,
} from "@splicewire/beam-resources/types/beam-ux";
const block = (
  name: string,
  children: JsonBlock["children"] = []
): JsonBlock => ({
  kind: "block",
  name,
  isComponent: /^[A-Z]/.test(name),
  props: [],
  dynamic: false,
  children,
});
const card: ComponentCanvasData = {
  id: "card",
  definition: {
    name: "Card",
    props: [
      {
        name: "title",
        type: "text",
        required: false,
        default: "Default",
        choices: [],
      },
    ],
  },
  body: [
    block("section", [
      { kind: "text", value: "", prop: "title" },
      {
        ...block("Slot"),
        props: [{ name: "name", kind: "string", value: "media" }],
        children: [block("p", [{ kind: "text", value: "Fallback slot" }])],
      },
    ]),
  ],
  bindings: {},
  headVersion: "draft",
  publishedVersion: "pin",
};
const profile = {
  profile: "content",
  version: 1,
  doc: { admitsChildCategories: ["html"] },
  nodes: [
    {
      name: "Card",
      category: "html",
      admitsChildCategories: [],
      slots: [{ name: "media", admitsChildCategories: ["html"] }],
      attrsSchema: {
        type: "object",
        properties: { title: { type: "string" } },
      },
    },
    {
      name: "p",
      category: "html",
      admitsChildCategories: [],
      attrsSchema: { type: "object", properties: {} },
    },
  ],
};
afterEach(cleanup);
it("keeps an unfilled Authored Slot fallback visible and provided slot content editable at its caller path", () => {
  const node = {
    ...block("Card"),
    slots: { media: [block("p", [{ kind: "text", value: "Caller slot" }])] },
  };
  const view = render(
    <CanvasProvider
      config={{ registry: {}, profile, authoredComponents: [card] }}
    >
      <CanvasWidget value={[node]} />
    </CanvasProvider>
  );
  expect(
    screen
      .getByText("Caller slot")
      .closest("[data-bd-path]")
      ?.getAttribute("data-bd-path")
  ).toBe("0.slots.media.0");
  view.rerender(
    <CanvasProvider
      config={{ registry: {}, profile, authoredComponents: [card] }}
    >
      <CanvasWidget value={[block("Card")]} />
    </CanvasProvider>
  );
  expect(screen.getByText("Fallback slot")).toBeTruthy();
  expect(
    screen.getByText("Fallback slot").closest("[data-bd-slot]")
  ).toBeTruthy();
});
it("hides edit and detach when a Code Component shadows an Authored name", () => {
  render(
    <CanvasProvider
      config={{
        registry: { Card: () => <strong>Code view</strong> },
        authoredComponents: [card],
      }}
    >
      <ComponentTools
        doc={[block("Card")]}
        paths={["0"]}
        readOnly={false}
        onChange={() => {}}
      />
    </CanvasProvider>
  );
  expect(screen.queryByText("Detach component")).toBeNull();
  expect(screen.queryByText("Edit component")).toBeNull();
});
it("uses the addressed update admission and exact instance props to open a component", async () => {
  const open = vi.fn();
  const admission = vi.fn(
    async (): Promise<EntryComponentCapabilitiesOutputData> => ({
      id: "card",
      canEdit: false,
      reachEntries: null,
      reachLimit: 500,
      reachUnavailable: false,
    })
  );
  const base: CanvasConfig = {
    registry: {},
    authoredComponents: [card],
    componentAuthoring: {
      entryId: "page",
      client: { componentCapabilities: admission },
      refresh: async () => {},
      open,
    },
  };
  const node = {
    ...block("Card"),
    props: [{ kind: "string" as const, name: "title", value: "This instance" }],
  };
  const view = render(
    <CanvasProvider config={base}>
      <CanvasWidget value={[node]} />
    </CanvasProvider>
  );
  await waitFor(() => expect(admission).toHaveBeenCalled());
  expect(screen.queryByText("Edit component")).toBeNull();
  admission.mockResolvedValue({
    id: "card",
    canEdit: true,
    reachEntries: 2,
    reachLimit: 500,
    reachUnavailable: false,
  });
  view.rerender(
    <CanvasProvider
      config={{
        ...base,
        componentAuthoring: {
          ...base.componentAuthoring!,
          entryId: "other-page",
        },
      }}
    >
      <CanvasWidget value={[node]} />
    </CanvasProvider>
  );
  fireEvent.click(await screen.findByText("Edit component"));
  expect(open).toHaveBeenCalledWith(
    card,
    expect.objectContaining({ title: "This instance" }),
    expect.any(HTMLElement)
  );
});
it("retires an allowed action immediately when its addressed actor client changes", async () => {
  const open = vi.fn();
  const allowed = vi.fn(async () => ({
    id: "card",
    canEdit: true,
    reachEntries: 2,
    reachLimit: 500,
    reachUnavailable: false,
  }));
  const denied = vi.fn(async () => ({
    id: "card",
    canEdit: false,
    reachEntries: null,
    reachLimit: 500,
    reachUnavailable: false,
  }));
  const config = (
    check: (id: string) => Promise<EntryComponentCapabilitiesOutputData>
  ): CanvasConfig => ({
    registry: {},
    authoredComponents: [card],
    componentAuthoring: {
      entryId: "page",
      client: { componentCapabilities: check },
      refresh: async () => {},
      open,
    },
  });
  const view = render(
    <CanvasProvider config={config(allowed)}>
      <CanvasWidget value={[block("Card")]} />
    </CanvasProvider>
  );
  await screen.findByText("Edit component");
  view.rerender(
    <CanvasProvider config={config(denied)}>
      <CanvasWidget value={[block("Card")]} />
    </CanvasProvider>
  );
  expect(screen.queryByText("Edit component")).toBeNull();
  await waitFor(() => expect(denied).toHaveBeenCalled());
  expect(open).not.toHaveBeenCalled();
});
it("creates once before one local swap, and a real Local Session undo restores the page without deleting that entry", async () => {
  const create = vi.fn(async () => ({ id: "new-card" }));
  const refresh = vi.fn(async () => {});
  const change = vi.fn();
  const doc = [block("section", [{ kind: "text", value: "Literal" }])];
  const session = new LocalSession(
    { entry: "page", user: "author", base: "head" },
    doc
  );
  function Fixture() {
    const [, rerender] = useState(0);
    return (
      <CanvasProvider
        config={{
          registry: {},
          componentAuthoring: {
            entryId: "page",
            client: { createComponent: create },
            refresh,
          },
        }}
      >
        <ComponentTools
          doc={doc}
          paths={["0"]}
          readOnly={false}
          onChange={(next, expected) => {
            change(next, expected);
            session.change(next);
            rerender((n) => n + 1);
          }}
        />
        <output data-testid="page-session">
          {JSON.stringify(session.body)}
        </output>
        <button
          onClick={() => {
            session.undo();
            rerender((n) => n + 1);
          }}
        >
          Undo swap
        </button>
      </CanvasProvider>
    );
  }
  render(<Fixture />);
  fireEvent.change(screen.getByLabelText("Component name"), {
    target: { value: "Card" },
  });
  fireEvent.click(screen.getByText("Make component"));
  await waitFor(() => expect(change).toHaveBeenCalledTimes(1));
  expect(create).toHaveBeenCalledTimes(1);
  expect(change.mock.calls[0][0][0].name).toBe("Card");
  expect(doc[0].name).toBe("section");
  expect(session.snapshot().cursor).toBe(1);
  fireEvent.click(screen.getByText("Undo swap"));
  expect(session.body).toEqual(doc);
  expect(session.snapshot().cursor).toBe(0);
  expect(create).toHaveBeenCalledTimes(1);
  expect(refresh).toHaveBeenCalledTimes(1);
});
it("retains the created entry and original page when refreshing the component catalogue fails", async () => {
  const create = vi.fn(async () => ({ id: "retained-card" }));
  const refresh = vi.fn(async () => {
    throw Error("Catalogue unavailable");
  });
  const change = vi.fn();
  const doc = [block("section", [{ kind: "text", value: "Original" }])];
  render(
    <CanvasProvider
      config={{
        registry: {},
        componentAuthoring: {
          entryId: "page",
          client: { createComponent: create },
          refresh,
        },
      }}
    >
      <ComponentTools
        doc={doc}
        paths={["0"]}
        readOnly={false}
        onChange={change}
      />
    </CanvasProvider>
  );
  fireEvent.change(screen.getByLabelText("Component name"), {
    target: { value: "Card" },
  });
  fireEvent.click(screen.getByText("Make component"));
  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    expect.stringContaining("Component entry retained-card was retained")
  );
  expect(change).not.toHaveBeenCalled();
  expect(create).toHaveBeenCalledTimes(1);
  expect(doc[0].name).toBe("section");
});
