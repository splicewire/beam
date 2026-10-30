// @vitest-environment jsdom
// EP-38 (editor-parity ticket 10, js ADR-0005 d4): the packaged Entries seat. A host mounts it with its inputs at declared
// seams (manifest, transport, workflow binding, row actions, notice, chrome) and copies none of it.
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UxBuilderClient } from "../types";

const h = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  listProps: null as Record<string, unknown> | null,
  editProps: [] as Array<Record<string, unknown>>,
  providerClient: null as unknown,
}));

vi.mock("@schemastud/frame", () => ({
  ListShell: (props: Record<string, unknown> & { onOpen: (row: Record<string, unknown>) => void; slots: { RowActions?: (p: { record: Record<string, unknown> }) => ReactNode } }) => {
    h.listProps = props;
    const RowActions = props.slots.RowActions;
    return (
      <ul>
        {h.rows.map((row) => (
          <li key={String(row.id)}>
            <button type="button" onClick={() => props.onOpen(row)}>
              open {String(row.slug)}
            </button>
            {RowActions && <RowActions record={row} />}
          </li>
        ))}
      </ul>
    );
  },
  EditShell: (props: Record<string, unknown>) => {
    h.editProps.push(props);
    return <p>edit shell {String(props.id)} {props.readOnly ? "read-only" : "writable"}</p>;
  },
}));
vi.mock("../ThemeEditor", () => ({
  ThemeEditor: ({ entryId }: { entryId: string }) => <p>theme editor {entryId}</p>,
}));
vi.mock("../provider", () => ({
  UxBuilderProvider: ({ services, children }: { services: { client: unknown }; children: ReactNode }) => {
    h.providerClient = services.client;
    return <>{children}</>;
  },
}));
vi.mock("@splicewire/beam-workflows", () => ({
  WorkflowsProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useWorkflowsServices: () => workflowServices,
  WorkflowStepperTrack: ({ current }: { current: string }) => <p>stepper at {current}</p>,
  WorkflowActions: ({ onTransition }: { onTransition: (name: string) => void }) => (
    <button type="button" onClick={() => onTransition("publish")}>
      transition publish
    </button>
  ),
}));

const workflowServices = {
  client: { projection: vi.fn(), transition: vi.fn() },
};

import { EntriesSeat } from "./EntriesSeat";

const client = { loadBody: vi.fn(), saveBody: vi.fn() } as unknown as UxBuilderClient;
const projection = (current: string) => ({ places: [{ name: "draft" }, { name: "published" }], current, transitions: [] });

afterEach(() => {
  cleanup();
  h.rows = [];
  h.listProps = null;
  h.editProps = [];
  h.providerClient = null;
  workflowServices.client.projection.mockReset();
  workflowServices.client.transition.mockReset();
});

describe("EntriesSeat", () => {
  it("lists the beam-ux-entry resource with the host's slots and row actions, and offers New entry only when it may create", () => {
    const RowActions = ({ record }: { record: Record<string, unknown> }) => <span>view {String(record.slug)}</span>;
    h.rows = [{ id: "e1", slug: "about", type: "page" }];
    const { rerender } = render(
      <EntriesSeat manifest={{ can: { create: false } } as never} client={client} rowActions={RowActions} listSlots={{ Empty: () => null } as never} />,
    );

    expect(h.listProps?.resource).toBe("beam-ux-entry");
    expect((h.listProps?.slots as Record<string, unknown>).Empty).toBeTypeOf("function");
    expect((h.listProps?.slots as { Toolbar: () => unknown }).Toolbar()).toBeNull();
    expect(screen.getByText("view about")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "New entry" })).toBeNull();

    rerender(<EntriesSeat manifest={{ can: { create: true } } as never} client={client} />);
    fireEvent.click(screen.getByRole("button", { name: "New entry" }));
    expect(screen.getByText("edit shell null writable")).toBeTruthy();
  });

  it("opens a theme row in the packaged ThemeEditor over the host's transport", () => {
    h.rows = [{ id: "t1", slug: "default", type: "theme" }];
    render(<EntriesSeat manifest={{ can: {} } as never} client={client} />);

    fireEvent.click(screen.getByRole("button", { name: "open default" }));

    expect(screen.getByText("theme editor t1")).toBeTruthy();
    expect(h.providerClient).toBe(client);
  });

  it("opens an entry's content read-only without update, and shows Workflow only when the host binds one", () => {
    h.rows = [{ id: "e1", slug: "about", type: "page" }];
    const { rerender } = render(<EntriesSeat manifest={{ can: { update: false } } as never} client={client} />);

    fireEvent.click(screen.getByRole("button", { name: "open about" }));
    expect(screen.getByText("edit shell e1 read-only")).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "Workflow" })).toBeNull();

    rerender(
      <EntriesSeat
        manifest={{ can: { update: true } } as never}
        client={client}
        workflow={{ services: workflowServices as never, kind: "beam-ux-entry" }}
      />,
    );
    expect(screen.getByText("edit shell e1 writable")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Workflow" })).toBeTruthy();
  });

  it("renders an entry's workflow with beam-workflows through the host's binding, and applies a transition", async () => {
    h.rows = [{ id: "e1", slug: "about", type: "page" }];
    workflowServices.client.projection.mockResolvedValue(projection("draft"));
    workflowServices.client.transition.mockResolvedValue(projection("published"));
    render(
      <EntriesSeat
        manifest={{ can: { update: true } } as never}
        client={client}
        workflow={{ services: workflowServices as never, kind: "beam-ux-entry", queue: <a href="/queue">queue</a> }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "open about" }));
    fireEvent.click(screen.getByRole("tab", { name: "Workflow" }));

    expect(await screen.findByText("stepper at draft")).toBeTruthy();
    expect(workflowServices.client.projection).toHaveBeenCalledWith("beam-ux-entry", "e1");
    expect(screen.getByRole("link", { name: "queue" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "transition publish" }));
    expect(await screen.findByText("stepper at published")).toBeTruthy();
    expect(workflowServices.client.transition).toHaveBeenCalledWith("beam-ux-entry", "e1", "publish");
  });

  it("says an entry has no publish workflow, and offers a retry when its state does not load", async () => {
    h.rows = [{ id: "e1", slug: "about", type: "page" }];
    workflowServices.client.projection.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(null);
    render(
      <EntriesSeat manifest={{ can: {} } as never} client={client} workflow={{ services: workflowServices as never, kind: "beam-ux-entry" }} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "open about" }));
    fireEvent.click(screen.getByRole("tab", { name: "Workflow" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Could not load the workflow state (boom).");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("This entry has no publish workflow.")).toBeTruthy();
  });

  it("mounts inside the host's chrome when given, and shows the host's notice", async () => {
    h.rows = [{ id: "e1", slug: "about", type: "page" }];
    const Panel = ({ open, title, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; children: ReactNode }) =>
      open ? (
        <section aria-label={`host panel: ${title}`}>{children}</section>
      ) : null;
    render(<EntriesSeat manifest={{ can: {} } as never} client={client} chrome={{ Panel }} notice="That entry has no page." />);

    expect(screen.getByRole("status").textContent).toBe("That entry has no page.");
    fireEvent.click(screen.getByRole("button", { name: "open about" }));
    await waitFor(() => expect(screen.getByRole("region", { name: "host panel: Edit entry" })).toBeTruthy());
  });
});
