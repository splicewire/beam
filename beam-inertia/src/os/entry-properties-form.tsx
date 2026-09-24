// The page's ENTRY FORM, as the body of the "Page properties" window — Frame's own `EditShell` over the
// `beam-ux-entry` ParticleResource, for the entry the current page renders.
//
// This is the same surface the tenant console mounts at `/beam-ux-entry/{id}` (and that
// g2-beam-theme-nav edits the `about` row through): the schema, the record, the gate and the PUT are
// the resource's declarations, served by `/frame/manifest`. Nothing here restates a field. The window
// used to be a stub (slug + "Edit content") waiting for "a meta surface this starter has no equivalent
// of yet" — the resource IS that surface, and audiostud's bespoke `/beam/ux/meta` endpoint is the
// shape the particle doctrine rules out (a boundary shape that is not a declared particle).
import { router } from '@inertiajs/react';
import { EditShell } from '@schemastud/frame';
import { formFromManifest, useFrameManifest } from '../frame/manifest';
import { TenantFrameProvider } from '../frame/provider';
import { DefaultFrameRealm, FrameRealmProvider } from '../frame/realm';

/** The ParticleResource every page entry is a row of (`#[ParticleResource]` on beam-ux's entry). */
export const ENTRY_RESOURCE = 'beam-ux-entry';

function EntryForm({ entryId }: { entryId: string }) {
    const { data: manifest, isLoading, error } = useFrameManifest();

    if (isLoading) {
        return <p className="p-4 text-sm text-muted-foreground">Loading the entry form…</p>;
    }

    if (error || !manifest || !manifest.resources.some((r) => r.key === ENTRY_RESOURCE)) {
        // Named, not blank: a principal whose manifest does not carry the resource cannot edit the row
        // here, and the console would refuse them the same way.
        return (
            <p role="note" className="p-4 text-sm text-muted-foreground">
                The entry form is not available here ({ENTRY_RESOURCE} is not in this realm&rsquo;s frame
                manifest).
            </p>
        );
    }

    return (
        <EditShell
            resource={ENTRY_RESOURCE}
            id={entryId}
            // The window IS the container; frame's own side panel would be a second overlay inside it.
            container="bare"
            // Read once the manifest is in hand — EditShell seeds its form mode on mount.
            form={formFromManifest(manifest, ENTRY_RESOURCE)}
            // Title, segment and nav order are what the page around this window renders: re-read the
            // page props so the live site under the window shows the saved row.
            onSaved={() => router.reload()}
        />
    );
}

export default function EntryPropertiesForm({ entryId }: { entryId: string }) {
    return (
        // The TENANT realm's manifest, explicitly: this window floats over site pages whose own props
        // name no realm, and `beam-ux-entry` is placed in the tenant console.
        <FrameRealmProvider {...DefaultFrameRealm}>
            <TenantFrameProvider>
                <EntryForm entryId={entryId} />
            </TenantFrameProvider>
        </FrameRealmProvider>
    );
}
