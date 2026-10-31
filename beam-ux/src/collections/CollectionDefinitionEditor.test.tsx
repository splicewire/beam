import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CollectionDefinitionEditor } from "./CollectionDefinitionEditor";
import type { CollectionDefinitionInputData } from "./generated";

afterEach(cleanup);
const initial: CollectionDefinitionInputData = {
  stem: "https://tenant.test/schemas/posts",
  baseVersion: 3,
  label: "Posts",
  nameField: "title",
  fields: [
    {
      name: "title",
      type: "string",
      required: true,
      public: false,
      filterable: true,
      sortable: false,
      unique: true,
      relation: null,
    },
  ],
};
const schema = {
  type: "object",
  required: ["label"],
  properties: {
    label: { type: "string", title: "Label", minLength: 1 },
    stem: { type: "string", title: "Stem" },
    baseVersion: { type: "integer" },
  },
};

it("edits through the shared schema form and saves against the loaded version", async () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <CollectionDefinitionEditor
      schema={schema}
      initial={initial}
      onSave={onSave}
      onCancel={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText(/Label/), {
    target: { value: "Articles" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save version" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
  expect(onSave.mock.calls[0][0]).toEqual({ ...initial, label: "Articles" });
  expect(screen.getByLabelText("Stem")).toHaveProperty("readOnly", true);
});

it("retains the draft and reports a refused save without treating it as saved", async () => {
  render(
    <CollectionDefinitionEditor
      schema={schema}
      initial={initial}
      onSave={async () => {
        throw new Error("Reload the latest version.");
      }}
      onCancel={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText(/Label/), {
    target: { value: "Edited draft" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save version" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "Reload the latest version.",
    ),
  );
  expect(screen.getByLabelText(/Label/)).toHaveProperty(
    "value",
    "Edited draft",
  );
  expect(screen.getByRole("button", { name: "Save version" })).toHaveProperty(
    "disabled",
    false,
  );
});
