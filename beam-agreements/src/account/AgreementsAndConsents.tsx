import { useState, type ReactNode } from 'react';
import { EditShell, ListShell, useFrameInjection, type ResourceKey } from '@schemastud/frame';

/**
 * "Agreements & consents" under the account, and the organisation owner's equivalent (agreements 10a, seam-ahead
 * trial). Each is a list of ledger entries that opens one entry's detail, composed from frame's shells.
 *
 * The port 10b binds is these props and the frame provider above them. The host mounts its kit's `Provider`, and the
 * entries resource arrives as a `ResourceKey` (CONFORM 03-1/03-2). Nothing here names a resource or a field: the
 * columns, the detail's fields and the actions come from what the host's manifest and schema declare. Withdraw is the
 * resource's own declared record action (destructive, confirm-only), which frame draws on each row and on the detail,
 * asks about, sends and announces (`ListShell`/`EditShell`, ADR-0005).
 */
export interface AgreementsScreenProps {
    /** The entries resource to list, as the host declared it. */
    resource: ResourceKey;
    /** Replaces the default heading. */
    heading?: ReactNode;
}

/** A person's own entries: what they agreed to, each with its version, and a withdraw where the resource offers one. */
export function AgreementsAndConsents(props: AgreementsScreenProps) {
    return <EntriesScreen {...props} label="Agreements & consents" />;
}

/** The entries made on an organisation's behalf, for its owner: the same composition over the organisation's resource. */
export function OrganisationAgreements(props: AgreementsScreenProps) {
    return <EntriesScreen {...props} label="Agreed for the organisation" />;
}

function EntriesScreen({ resource, heading, label }: AgreementsScreenProps & { label: string }) {
    const [opened, setOpened] = useState<string | null>(null);
    const { Button } = useFrameInjection().primitives;

    return (
        <section aria-label={label} data-beam-agreements="entries">
            <h2>{heading ?? label}</h2>
            {opened === null ? (
                <ListShell
                    resource={resource}
                    onOpen={(record) => {
                        // `{ id: null }` is the shell's "new" request; these entries are never created here.
                        const id = (record as { id?: unknown }).id;
                        if (id !== null && id !== undefined) setOpened(String(id));
                    }}
                />
            ) : (
                <>
                    <Button type="button" variant="ghost" onClick={() => setOpened(null)}>
                        Back to the list
                    </Button>
                    <EditShell resource={resource} id={opened} readOnly container="bare" />
                </>
            )}
        </section>
    );
}
