import { useState } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, it, expect, vi } from "vitest";
import type { ComponentCanvasData } from "@splicewire/beam-resources/types/beam-ux";
import type { JsonDoc } from "../blockdoc/json";
import { CanvasProvider } from "./context";
import { CanvasWidget } from "./CanvasWidget";
import { ComponentProps } from "./ComponentProps";
const entry: ComponentCanvasData = {
  id: "card",
  definition: {
    name: "Card",
    props: [
      {
        name: "title",
        type: "text",
        required: true,
        default: null,
        choices: [],
      },
      {
        name: "count",
        type: "number",
        required: false,
        default: 0,
        choices: [],
      },
    ],
  },
  body: [
    {
      kind: "block",
      name: "section",
      dynamic: false,
      isComponent: false,
      props: [],
      children: [],
    },
  ],
  bindings: {},
  headVersion: "head",
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
      attrsSchema: {
        type: "object",
        properties: { title: { type: "string" }, count: { type: "number" } },
        required: ["title"],
      },
    },
  ],
  "x-collections": [
    {
      name: "posts",
      schema: {
        type: "object",
        properties: {
          fields: {
            type: "object",
            properties: {
              title: { type: "string" },
              count: { type: "number" },
            },
          },
        },
      },
    },
  ],
};
afterEach(cleanup);
function Fixture({
  readOnly = false,
  change = () => {},
}: {
  readOnly?: boolean;
  change?: (next: JsonDoc) => void;
}) {
  const [doc, setDoc] = useState<JsonDoc>([
    {
      kind: "block",
      name: "Card",
      id: "instance",
      dynamic: false,
      isComponent: true,
      props: [{ name: "title", kind: "string", value: "Original" }],
      children: [],
    },
  ]);
  return (
    <CanvasProvider
      config={{
        registry: {},
        profile,
        authoredComponents: [entry],
        bindingPreview: { entryId: "page", recordCollection: "posts" },
      }}
    >
      <CanvasWidget
        value={doc}
        readOnly={readOnly}
        onChange={(next) => {
          change(next);
          setDoc(next);
        }}
      />
      <ComponentProps path="0" entry={entry} />
      <output data-testid="props-doc">{JSON.stringify(doc)}</output>
    </CanvasProvider>
  );
}
it("edits declared literal and compatible bound props through the existing Local Session command path", async () => {
  render(<Fixture />);
  const title = await screen.findByLabelText("Prop title");
  fireEvent.change(title, { target: { value: "Updated" } });
  fireEvent.blur(title);
  let [node] = JSON.parse(screen.getByTestId("props-doc").textContent!);
  expect(node.props).toContainEqual({
    name: "title",
    kind: "string",
    value: "Updated",
  });
  const binding = screen.getByLabelText("Bind prop title");
  expect(
    within(binding).queryByRole("option", { name: /fields.count/ })
  ).toBeNull();
  fireEvent.change(binding, { target: { value: "fields.title" } });
  [node] = JSON.parse(screen.getByTestId("props-doc").textContent!);
  expect(node.props).toContainEqual({
    name: "title",
    kind: "field",
    value: "fields.title",
  });
  expect(node.id).toBe("instance");
  const count = screen.getByLabelText("Prop count");
  fireEvent.change(count, { target: { value: "3" } });
  fireEvent.blur(count);
  expect(
    JSON.parse(screen.getByTestId("props-doc").textContent!)[0].props
  ).toContainEqual({ name: "count", kind: "number", value: 3 });
});
it("refuses removing a required prop without changing the instance", async () => {
  const change = vi.fn();
  render(<Fixture change={change} />);
  await screen.findByLabelText("Prop title");
  const before = screen.getByTestId("props-doc").textContent;
  fireEvent.click(screen.getByText("Unset prop title"));
  expect(screen.getByRole("alert").textContent).toContain(
    "required prop title"
  );
  expect(screen.getByTestId("props-doc").textContent).toBe(before);
  expect(change).not.toHaveBeenCalled();
});
it("keeps a read-only instance immutable", async () => {
  const change = vi.fn();
  render(<Fixture readOnly change={change} />);
  await screen.findByLabelText("Prop title");
  fireEvent.click(screen.getByText("Unset prop count"));
  expect(change).not.toHaveBeenCalled();
});
