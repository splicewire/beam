import * as react from 'react';
import { ReactNode, ComponentProps, ComponentType } from 'react';
import { ContextManifest, EditShell, ListSlots, EditSlots } from '@schemastud/frame';
import { U as UxBuilderClient } from './types-BVTV8e6r.js';
import { WorkflowsServices } from '@splicewire/beam-workflows';
import '@splicewire/beam-workflows/action-form';
import '@splicewire/beam-resources/types/beam-ux';
import './json-CjRp6hiq.js';
import './style-DwvipGPs.js';
import '@babel/types';

/**
 * The Entries seat's declared workflow seam (editor-parity ticket 10, HC-05; EP-38): the host binds the workflow services
 * (their client reaches its entry workflow operations) and names the workflow kind; the seat renders one entry's current
 * marking and its transitions with `@splicewire/beam-workflows`' components.
 */
interface EntryWorkflowBinding {
    services: WorkflowsServices;
    /** The workflow kind the entry's projection and transitions are addressed by. */
    kind: string;
    /** Host chrome above the view, e.g. a link to the host's queue of everything awaiting a transition. */
    queue?: ReactNode;
}
declare function EntryWorkflow({ entryId, binding }: {
    entryId: string;
    binding: EntryWorkflowBinding;
}): react.JSX.Element;

/** The entry resource every host's Entries seat lists: pages, components and the theme row alike. */
declare const ENTRY_RESOURCE = "beam-ux-entry";
interface EntriesPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
}
interface EntriesTabsProps {
    tabs: Array<{
        value: string;
        label: string;
        content: ReactNode;
    }>;
}
/** An entry a host's index asks the seat to open: a theme row opens `ThemeEditor`, any other its content. */
interface EntriesSeatTarget {
    id: string;
    type?: string | null;
    slug?: string | null;
}
interface EntriesSeatProps {
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
    chrome?: {
        Panel?: ComponentType<EntriesPanelProps>;
        Tabs?: ComponentType<EntriesTabsProps>;
    };
    /**
     * The host's own index in place of the flat list (the Site map, owner-review-20261102 research 37). It receives the
     * seat's door, so "Open in editor" on the host's index opens the same panel a row would.
     */
    index?: (door: {
        open: (entry: EntriesSeatTarget) => void;
    }) => ReactNode;
    /**
     * Called whenever the editor panel closes: after a save or a create, or when it is dismissed. A host's own index reads
     * its facts again here; the flat list refreshes through Frame's own cache.
     */
    onEditorClose?: () => void;
}
/**
 * The packaged **Entries seat** (js ADR-0005 d4; editor-parity ticket 10; EP-38): browse, create and edit every beam-ux
 * entry of a site. A theme row opens the packaged `ThemeEditor`; an existing entry has its content form and, when the
 * host binds one, its workflow. A host mounts it inside its own Frame provider and supplies only declared seams; the
 * same component serves an Inertia page and the SPA.
 */
declare function EntriesSeat({ manifest, form, client, workflow, rowActions, notice, listSlots, editSlots, chrome, index, onEditorClose, }: EntriesSeatProps): react.JSX.Element;

export { ENTRY_RESOURCE, type EntriesPanelProps, EntriesSeat, type EntriesSeatProps, type EntriesSeatTarget, type EntriesTabsProps, EntryWorkflow, type EntryWorkflowBinding };
