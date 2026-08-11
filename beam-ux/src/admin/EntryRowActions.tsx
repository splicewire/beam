import { Button } from '@schemastud/ui';
import type { EntryRowActionsRecord, EntryRowActionsProps } from './types.js';

/**
 * `edit`/`duplicate`/`delete` are always offered; `promote-to-central` is CONDITIONAL —
 * server-computed on `record.canPromoteToCentral` (whether the viewer holds a `manage` grant on the
 * target realm's central root, `laravel-beam-accounts`' grant-cascade — theme-entries-and-authoring
 * ticket 06), never client-decided. `onDelete` is called only after the built-in confirm guard
 * passes; a host that wants a richer confirm UI overrides `confirmDelete` instead of the default
 * `window.confirm`.
 */
export function EntryRowActions({
    record,
    onEdit,
    onDuplicate,
    onDelete,
    onPromoteToCentral,
    confirmDelete = defaultConfirmDelete,
}: EntryRowActionsProps) {
    return (
        <div className="flex items-center justify-end gap-1" role="group" aria-label="Entry actions">
            <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(record)}>
                Edit
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onDuplicate(record)}>
                Duplicate
            </Button>
            {record.canPromoteToCentral ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onPromoteToCentral?.(record)}
                >
                    Promote to central
                </Button>
            ) : null}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                    if (confirmDelete(record)) {
                        onDelete(record);
                    }
                }}
            >
                Delete
            </Button>
        </div>
    );
}

function defaultConfirmDelete(record: EntryRowActionsRecord): boolean {
    const label = record.title ?? record.slug;

    return window.confirm(`Delete "${label}"? This can be restored later.`);
}
