/**
 * The row shape `<EntryRowActions>` needs — a subset of `@schemastud/frame`'s `Row`
 * (`Record<string, unknown>`), so this component stays decoupled from Frame's own types (this
 * package does not depend on `@schemastud/frame`; a host narrows its `Row` to this shape when
 * mounting `<ListShell slots={{ RowActions: EntryRowActions }}>`).
 */
export interface EntryRowActionsRecord {
    id: string;
    slug: string;
    title?: string | null;
    realm: string;
    /**
     * Server-computed: does the viewer hold a `manage` grant on `realm`'s CENTRAL root entry
     * (`laravel-beam-accounts`' grant cascade, theme-entries-and-authoring ticket 06)? Never
     * derived client-side — an absent/false value simply hides the action.
     */
    canPromoteToCentral?: boolean;
}

export interface EntryRowActionsProps {
    record: EntryRowActionsRecord;
    onEdit: (record: EntryRowActionsRecord) => void;
    onDuplicate: (record: EntryRowActionsRecord) => void;
    onDelete: (record: EntryRowActionsRecord) => void;
    /** Absent when `record.canPromoteToCentral` is falsy — the action isn't rendered at all then. */
    onPromoteToCentral?: (record: EntryRowActionsRecord) => void;
    /** Override the destructive-action guard (default: `window.confirm`). Return false to abort. */
    confirmDelete?: (record: EntryRowActionsRecord) => boolean;
}
