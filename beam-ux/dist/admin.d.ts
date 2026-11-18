import * as react from 'react';

/**
 * The row shape `<EntryRowActions>` needs — a subset of `@schemastud/frame`'s `Row`
 * (`Record<string, unknown>`), so this component stays decoupled from Frame's own types (this
 * package does not depend on `@schemastud/frame`; a host narrows its `Row` to this shape when
 * mounting `<ListShell slots={{ RowActions: EntryRowActions }}>`).
 */
interface EntryRowActionsRecord {
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
interface EntryRowActionsProps {
    record: EntryRowActionsRecord;
    onEdit: (record: EntryRowActionsRecord) => void;
    onDuplicate: (record: EntryRowActionsRecord) => void;
    onDelete: (record: EntryRowActionsRecord) => void;
    /** Absent when `record.canPromoteToCentral` is falsy — the action isn't rendered at all then. */
    onPromoteToCentral?: (record: EntryRowActionsRecord) => void;
    /** Override the destructive-action guard (default: `window.confirm`). Return false to abort. */
    confirmDelete?: (record: EntryRowActionsRecord) => boolean;
}

/**
 * `edit`/`duplicate`/`delete` are always offered; `promote-to-central` is CONDITIONAL —
 * server-computed on `record.canPromoteToCentral` (whether the viewer holds a `manage` grant on the
 * target realm's central root, `laravel-beam-accounts`' grant-cascade — theme-entries-and-authoring
 * ticket 06), never client-decided. `onDelete` is called only after the built-in confirm guard
 * passes; a host that wants a richer confirm UI overrides `confirmDelete` instead of the default
 * `window.confirm`.
 */
declare function EntryRowActions({ record, onEdit, onDuplicate, onDelete, onPromoteToCentral, confirmDelete, }: EntryRowActionsProps): react.JSX.Element;

export { EntryRowActions, type EntryRowActionsProps, type EntryRowActionsRecord };
