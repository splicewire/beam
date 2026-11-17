import { Button } from '@schemastud/ui';
import { useBeamUxMessages } from '../messages.js';
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
    confirmDelete,
}: EntryRowActionsProps) {
    const m = useBeamUxMessages();
    const confirmed = confirmDelete ?? ((entry: EntryRowActionsRecord) => window.confirm(m.t('splicewire-beam-ux::messages.admin_delete_confirm', { label: entry.title ?? entry.slug })));
    return (
        <div className="flex items-center justify-end gap-1" role="group" aria-label={m.t('splicewire-beam-ux::messages.admin_entry_actions')}>
            <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(record)}>
                {m.t('splicewire-beam-ux::messages.admin_edit')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onDuplicate(record)}>
                {m.t('splicewire-beam-ux::messages.admin_duplicate')}
            </Button>
            {record.canPromoteToCentral ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onPromoteToCentral?.(record)}
                >
                    {m.t('splicewire-beam-ux::messages.admin_promote_to_central')}
                </Button>
            ) : null}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                    if (confirmed(record)) {
                        onDelete(record);
                    }
                }}
            >
                {m.t('splicewire-beam-ux::messages.admin_delete')}
            </Button>
        </div>
    );
}
