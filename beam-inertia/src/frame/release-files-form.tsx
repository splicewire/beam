import { useBeamMessages } from '../messages';
import { useEffect } from 'react';
import { createFormResolver } from '@schemastud/frame';
import type { FormBodySlotProps } from '@schemastud/frame';
import { FilesComparisonPanel } from '@splicewire/beam-ux';
import { bodyClient } from '../editor/transport';
import { getBeamInertiaConfig } from '../config';

/** Whole-object read form for the measured ReleaseFilesData read schema. Never registers CRUD Save. */
export function ReleaseFilesForm({formData, registerSubmit}: FormBodySlotProps) {
    const m = useBeamMessages();
    useEffect(() => { registerSubmit(null); }, [registerSubmit]);
    return <div className="space-y-4">
        <h2 className="text-lg font-semibold">{m.t('splicewire-beam-inertia::messages.surfaces_release_member')}</h2>
        <dl>{[['release', m.t('splicewire-beam-inertia::messages.surfaces_release')], ['entry', m.t('splicewire-beam-inertia::messages.surfaces_entry')], ['versionId', m.t('splicewire-beam-inertia::messages.surfaces_historical_version')], ['members', m.t('splicewire-beam-inertia::messages.surfaces_whole_release')], ['recordingStatus', m.t('splicewire-beam-inertia::messages.surfaces_local_record')], ['sha', m.t('splicewire-beam-inertia::messages.surfaces_commit_sha')], ['message', m.t('splicewire-beam-inertia::messages.surfaces_recording_result')]].map(([key, label]) =>
            <div key={key}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mb-3 break-all">{String(formData[key] ?? '—')}</dd></div>)}</dl>
        {typeof formData.id === 'string' && <FilesComparisonPanel key={formData.id}
            memberId={formData.id} client={bodyClient} editorHref={getBeamInertiaConfig().fileEditorHref}/>}
    </div>;
}

/** Bind only the measured read identity; action and write schemas keep their ordinary forms. */
export function createReleaseFilesFormResolver() {
    const resolver = createFormResolver();
    resolver.registerFormForSchema(schema => schema.$id === 'ReleaseFilesData', ReleaseFilesForm);
    return resolver;
}
