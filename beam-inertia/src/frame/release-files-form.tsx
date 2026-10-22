import { useEffect } from 'react';
import type { FormBodySlotProps } from '@schemastud/frame';
import { FilesComparisonPanel } from '@splicewire/beam-ux';
import { bodyClient } from '../editor/transport';
import { getBeamInertiaConfig } from '../config';

/** Whole-object read form for the measured ReleaseFilesData read schema. Never registers CRUD Save. */
export function ReleaseFilesForm({formData, registerSubmit}: FormBodySlotProps) {
    useEffect(() => { registerSubmit(null); }, [registerSubmit]);
    return <div className="space-y-4">
        <h2 className="text-lg font-semibold">Historical Release member</h2>
        <dl>{['release', 'entry', 'versionId', 'members', 'recordingStatus', 'sha', 'message'].map(key =>
            <div key={key}><dt>{key}</dt><dd className="break-all">{String(formData[key] ?? '—')}</dd></div>)}</dl>
        {typeof formData.id === 'string' && <FilesComparisonPanel key={formData.id}
            memberId={formData.id} client={bodyClient} editorHref={getBeamInertiaConfig().fileEditorHref}/>}
    </div>;
}
