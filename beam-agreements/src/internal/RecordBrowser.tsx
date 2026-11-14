import { useState } from 'react';
import { EditShell, ListShell, useFrameInjection, type ResourceKey } from '@schemastud/frame';

/**
 * A resource's list that opens one record read-only, composed from frame's shells: the screens of this package are
 * this, under a heading. The list's columns, filters and record actions, and the detail's fields and actions, are what
 * the resource declares; nothing here names them.
 *
 * Key it by `resource` (the screens do): an opened record belongs to the resource it was opened from.
 */
export function RecordBrowser({ resource }: { resource: ResourceKey }) {
    const [opened, setOpened] = useState<string | null>(null);
    const { Button } = useFrameInjection().primitives;

    if (opened === null) {
        return (
            <ListShell
                resource={resource}
                onOpen={(record) => {
                    // `{ id: null }` is the shell's "new" request; nothing here creates.
                    const id = (record as { id?: unknown }).id;
                    if (id !== null && id !== undefined) setOpened(String(id));
                }}
            />
        );
    }

    return (
        <>
            <Button type="button" variant="ghost" onClick={() => setOpened(null)}>
                Back to the list
            </Button>
            {/* `readOnly` only stops editing; the read projection is asked for by purpose, so a field the resource
                serves on read (and never accepts on write) still shows. */}
            <EditShell resource={resource} id={opened} readOnly schemaPurpose="read" container="bare" />
        </>
    );
}
