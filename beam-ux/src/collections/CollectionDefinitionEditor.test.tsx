import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  CollectionDefinitionEditor,
  CollectionRegistrationImpact,
} from "./CollectionDefinitionEditor";
import type { CollectionDefinitionInputData, SchemaVersionImpactData } from "./generated";

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
    registrationConfirmation: {
      type: "object",
      properties: {
        schemaFingerprint: { type: "string", title: "Fingerprint" },
      },
    },
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
  expect(onSave.mock.calls[0][0]).toEqual({
    ...initial,
    label: "Articles",
    registrationConfirmation: null,
  });
  expect(screen.getByLabelText("Stem")).toHaveProperty("readOnly", true);
  expect(screen.queryByLabelText("Fingerprint")).toBeNull();
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

const impact = {
  schemaFingerprint: "a".repeat(64),
  pages: [
    {
      id: "page-1",
      title: "Published article",
      publishedVersion: "pin-7",
      fields: ["subtitle"],
    },
  ],
};
it("lists actual published impacts and sends exact pins only after explicit confirmation", async () => {
  const onSave = vi
    .fn()
    .mockRejectedValueOnce(new CollectionRegistrationImpact(impact))
    .mockResolvedValueOnce(undefined);
  render(
    <CollectionDefinitionEditor
      schema={schema}
      initial={initial}
      onSave={onSave}
      onCancel={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save version" }));
  await screen.findByRole("region", { name: "Published pages affected" });
  expect(screen.getByText("Published article")).toBeTruthy();
  expect(onSave.mock.calls[0][0].registrationConfirmation).toBeNull();
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm and save version" }),
  );
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  expect(onSave.mock.calls[1][0].registrationConfirmation).toEqual({
    schemaFingerprint: impact.schemaFingerprint,
    publishedVersions: { "page-1": "pin-7" },
  });
});
it("invalidates the pending confirmation when a field changes", async () => {
  const onSave = vi
    .fn()
    .mockRejectedValue(new CollectionRegistrationImpact(impact));
  render(
    <CollectionDefinitionEditor
      schema={schema}
      initial={initial}
      onSave={onSave}
      onCancel={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save version" }));
  await screen.findByRole("button", { name: "Confirm and save version" });
  fireEvent.change(screen.getByLabelText(/Label/), {
    target: { value: "Changed again" },
  });
  expect(
    screen.queryByRole("button", { name: "Confirm and save version" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save version" }));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  expect(onSave.mock.calls[1][0].registrationConfirmation).toBeNull();
});

it("accepts the frozen host adapter unchanged and reviews its raw HTTP 409 before confirmation", async () => {
  const failure = Object.assign(new Error("HTTP conflict"), {
    response: {
      status: 409,
      data: {
        data: impact,
        success: false,
        message: "Review actual published pages.",
      },
    },
  });
  const onSave = vi
    .fn()
    .mockRejectedValueOnce(failure)
    .mockResolvedValueOnce(undefined);
  render(
    <CollectionDefinitionEditor
      schema={schema}
      initial={initial}
      onSave={onSave}
      onCancel={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save version" }));
  await screen.findByRole("region", { name: "Published pages affected" });
  expect(screen.getByRole("alert").textContent).toBe(
    "Review actual published pages.",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm and save version" }),
  );
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  expect(onSave.mock.calls[1][0].registrationConfirmation).toEqual({
    schemaFingerprint: impact.schemaFingerprint,
    publishedVersions: { "page-1": "pin-7" },
  });
});

it("confirms the same input with every impacted page and parent dependency publication pin", async () => {
  const withParents: SchemaVersionImpactData = {
    schemaFingerprint: "b".repeat(64),
    pages: [
      {
        id: "child-1",
        title: "Child article",
        publishedVersion: "child-pin-1",
        fields: ["subtitle"],
        dependencies: { "parent-1": "parent-pin-3" },
      },
      {
        id: "child-2",
        title: "Second article",
        publishedVersion: "child-pin-2",
        fields: ["subtitle"],
        dependencies: {
          "parent-1": "parent-pin-3",
          "parent-2": "parent-pin-4",
        },
      },
    ],
  };
  const onSave = vi
    .fn()
    .mockRejectedValueOnce(new CollectionRegistrationImpact(withParents))
    .mockResolvedValueOnce(undefined);
  render(
    <CollectionDefinitionEditor
      schema={schema}
      initial={initial}
      onSave={onSave}
      onCancel={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save version" }));
  await screen.findByText("Child article");
  expect(screen.getByText("Second article")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm and save version" }),
  );
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  expect(onSave.mock.calls[1][0]).toEqual({
    ...onSave.mock.calls[0][0],
    registrationConfirmation: {
      schemaFingerprint: withParents.schemaFingerprint,
      publishedVersions: {
        "child-1": "child-pin-1",
        "child-2": "child-pin-2",
        "parent-1": "parent-pin-3",
        "parent-2": "parent-pin-4",
      },
    },
  });
});

it("requires a fresh author confirmation when the backend re-reports stale pins or schema", async () => {
  const freshImpact = {
    ...impact,
    schemaFingerprint: "c".repeat(64),
    pages: [
      {
        ...impact.pages[0],
        publishedVersion: "pin-8",
        dependencies: { "parent-1": "parent-pin-9" },
      },
    ],
  };
  const onSave = vi
    .fn()
    .mockRejectedValueOnce(new CollectionRegistrationImpact(impact))
    .mockRejectedValueOnce(new CollectionRegistrationImpact(freshImpact))
    .mockResolvedValueOnce(undefined);
  render(
    <CollectionDefinitionEditor
      schema={schema}
      initial={initial}
      onSave={onSave}
      onCancel={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save version" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Confirm and save version" }),
  );
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  fireEvent.click(
    await screen.findByRole("button", { name: "Confirm and save version" }),
  );
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(3));
  expect(onSave.mock.calls[2][0]).toEqual({
    ...onSave.mock.calls[0][0],
    registrationConfirmation: {
      schemaFingerprint: freshImpact.schemaFingerprint,
      publishedVersions: { "page-1": "pin-8", "parent-1": "parent-pin-9" },
    },
  });
});

it("shows a hard URL break refusal without offering an impact-confirmation bypass", async () => {
  const refusal = Object.assign(new Error("HTTP unprocessable"), {
    response: {
      status: 422,
      data: {
        message: "A published Record Page still binds this URL field.",
        data: impact,
      },
    },
  });
  const onSave = vi.fn().mockRejectedValueOnce(refusal);
  render(
    <CollectionDefinitionEditor
      schema={schema}
      initial={initial}
      onSave={onSave}
      onCancel={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save version" }));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "published Record Page",
    ),
  );
  expect(
    screen.queryByRole("button", { name: "Confirm and save version" }),
  ).toBeNull();
  expect(onSave).toHaveBeenCalledOnce();
});
