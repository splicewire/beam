import { EditShell, ListShell, type ContextManifest, type EditSlots, type ListSlots } from "@schemastud/frame";
import { Button } from "@schemastud/ui";
import { useId, useState, type ComponentProps, type ComponentType, type ReactNode } from "react";
import { UxBuilderProvider } from "../provider";
import { ThemeEditor } from "../ThemeEditor";
import type { UxBuilderClient } from "../types";
import { EntryWorkflow, type EntryWorkflowBinding } from "./EntryWorkflow";

/** The entry resource every host's Entries seat lists: pages, components and the theme row alike. */
export const ENTRY_RESOURCE = "beam-ux-entry";

export interface EntriesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export interface EntriesTabsProps {
  tabs: Array<{ value: string; label: string; content: ReactNode }>;
}

export interface EntriesSeatProps {
  /** The `beam-ux-entry` resource's Frame context (its `can` and list manifest), from the host's manifest. */
  manifest?: ContextManifest;
  /** The resource's create/edit form mode, from the host's manifest. */
  form?: ComponentProps<typeof EditShell>["form"];
  /** The entry transport the theme editor writes through. */
  client: UxBuilderClient;
  /** The declared workflow seam. Absent, an entry shows its content only. */
  workflow?: EntryWorkflowBinding;
  /** Beside the row's declared actions, e.g. a link to the entry's page. */
  rowActions?: ListSlots["RowActions"];
  /** A host message shown above the list, e.g. why a "View page" came back here. */
  notice?: ReactNode;
  /** The host's Frame slot sets (its design system's list and form parts). */
  listSlots?: Partial<ListSlots>;
  editSlots?: Partial<EditSlots>;
  /** Host chrome for the editing panel and an entry's tabs. Absent, the seat renders plain inline ones. */
  chrome?: { Panel?: ComponentType<EntriesPanelProps>; Tabs?: ComponentType<EntriesTabsProps> };
}

type Editing = { mode: "new" } | { mode: "edit"; id: string } | { mode: "theme"; id: string; slug: string } | null;

// The seat owns the panel, so EditShell renders its form straight into it.
const PassthroughContainer = ({ children }: { children?: ReactNode }) => <>{children}</>;

/**
 * The packaged **Entries seat** (js ADR-0005 d4; editor-parity ticket 10; EP-38): browse, create and edit every beam-ux
 * entry of a site. A theme row opens the packaged `ThemeEditor`; an existing entry has its content form and, when the
 * host binds one, its workflow. A host mounts it inside its own Frame provider and supplies only declared seams; the
 * same component serves an Inertia page and the SPA.
 */
export function EntriesSeat({
  manifest,
  form,
  client,
  workflow,
  rowActions,
  notice,
  listSlots,
  editSlots,
  chrome,
}: EntriesSeatProps) {
  const can = manifest?.can;
  const [editing, setEditing] = useState<Editing>(null);
  const Panel = chrome?.Panel ?? InlinePanel;
  const Tabs = chrome?.Tabs ?? InlineTabs;
  const close = () => setEditing(null);
  const shellSlots = { ...editSlots, Container: PassthroughContainer };

  const title = editing?.mode === "new" ? "New entry" : editing?.mode === "theme" ? `Theme — ${editing.slug}` : "Edit entry";

  const content = (id: string) => (
    <EditShell
      resource={ENTRY_RESOURCE}
      id={id}
      readOnly={can?.update !== true}
      container="panel"
      form={form}
      onSaved={close}
      onCancel={close}
      slots={shellSlots}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Entries</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every page, component and theme of this site.</p>
        </div>
        {can?.create && (
          <Button type="button" onClick={() => setEditing({ mode: "new" })}>
            New entry
          </Button>
        )}
      </div>

      {notice && (
        <p role="status" className="rounded-md border px-4 py-3 text-sm">
          {notice}
        </p>
      )}

      <ListShell
        resource={ENTRY_RESOURCE}
        columns={[]}
        manifest={manifest}
        onOpen={(record) =>
          setEditing(
            record.type === "theme"
              ? { mode: "theme", id: String(record.id), slug: String(record.slug) }
              : { mode: "edit", id: String(record.id) },
          )
        }
        slots={{
          ...listSlots,
          // The heading's "New entry" opens the create panel; the toolbar's own create button would be a second one.
          Toolbar: () => null,
          ...(rowActions ? { RowActions: rowActions } : {}),
        }}
      />

      <Panel open={editing !== null} onOpenChange={(open) => (!open ? close() : undefined)} title={title}>
        {editing?.mode === "theme" && (
          <UxBuilderProvider services={{ client }}>
            <ThemeEditor entryId={editing.id} />
          </UxBuilderProvider>
        )}
        {editing?.mode === "new" && (
          <EditShell
            resource={ENTRY_RESOURCE}
            id={null}
            container="panel"
            form={form}
            onSaved={close}
            onCancel={close}
            slots={shellSlots}
          />
        )}
        {editing?.mode === "edit" &&
          // An entry's history is the editor dock's Versions panel (restore makes a draft), so there is no Versions tab.
          (workflow ? (
            <Tabs
              tabs={[
                { value: "content", label: "Content", content: content(editing.id) },
                { value: "workflow", label: "Workflow", content: <EntryWorkflow entryId={editing.id} binding={workflow} /> },
              ]}
            />
          ) : (
            content(editing.id)
          ))}
      </Panel>
    </div>
  );
}

function InlinePanel({ open, onOpenChange, title, children }: EntriesPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <section aria-label={title} className="space-y-4 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </div>
      {children}
    </section>
  );
}

function InlineTabs({ tabs }: EntriesTabsProps) {
  const [active, setActive] = useState(tabs[0]?.value);
  const id = useId();

  return (
    <div className="space-y-3">
      <div role="tablist" className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`${id}-${tab.value}-tab`}
            aria-selected={tab.value === active}
            aria-controls={`${id}-${tab.value}`}
            className={tab.value === active ? "font-semibold underline underline-offset-4" : "text-muted-foreground"}
            onClick={() => setActive(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs
        .filter((tab) => tab.value === active)
        .map((tab) => (
          <div key={tab.value} role="tabpanel" id={`${id}-${tab.value}`} aria-labelledby={`${id}-${tab.value}-tab`}>
            {tab.content}
          </div>
        ))}
    </div>
  );
}
