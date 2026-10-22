import { useEffect } from 'react';
import { createFormResolver } from '@schemastud/frame';
import type { FormBodySlotProps } from '@schemastud/frame';
import { FilesComparisonPanel } from '@splicewire/beam-ux';
import { bodyClient } from '../editor/transport';
import { getBeamInertiaConfig } from '../config';

/** Whole-object read form for the measured ReleaseFilesData read schema. Never registers CRUD Save. */
export function ReleaseFilesForm({formData, registerSubmit}: FormBodySlotProps) {
    useEffect(() => { registerSubmit(null); }, [registerSubmit]);
    return <div className="space-y-4">
        <h2 className="text-lg font-semibold">Historical Release member</h2>
        <dl>{[['release', 'Release'], ['entry', 'Entry'], ['versionId', 'Historical saved version'], ['members', 'Whole Release'], ['recordingStatus', 'Local record'], ['sha', 'Commit SHA'], ['message', 'Recording result']].map(([key, label]) =>
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
