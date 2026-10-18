import { useState } from 'react';
import { WorkflowActionForm } from '@splicewire/beam-workflows';
import type { WorkflowProjectionData } from '@splicewire/beam-workflows';

/** Wire projection of the package-owned PHP ReleaseData / ReleaseCommandData. */
export interface ReleaseRecord {
    id: string; title: string; realm: string; status: string; reviewedBy: string | null;
    members: Array<{entryId: string; versionId: string | null; observedPin: string | null; redirectTarget: string | null; stale: boolean}>;
    workflow: WorkflowProjectionData | null; canSchedule: boolean; reviewRequired: boolean;
}
export interface ReleaseCommand {
    action: 'member' | 'drop' | 'rebase' | 'use-latest' | 'submit' | 'approve' | 'publish' | 'schedule' | 'rollback';
    entryId?: string; ref?: string | null; redirectTarget?: string | null; dueAt?: string; timezone?: string;
}
export interface ReleaseEntryChoice {
    id: string; title: string; versions: Array<{id: string; label: string}>; canTakeDown?: boolean;
}

/** Transport is injected; workflow states, version choices and stale-pin facts come from the server. */
export function ReleasePanel({release, entries, onCommand}: {
    release: ReleaseRecord; entries: ReleaseEntryChoice[];
    onCommand: (command: ReleaseCommand) => Promise<unknown>;
}) {
    const [entryId, setEntryId] = useState('');
    const [ref, setRef] = useState('');
    const [redirect, setRedirect] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const entry = entries.find(item => item.id === entryId);
    const immutable = release.status === 'published';
    const act = async (command: ReleaseCommand) => {
        setPending(true); setError(null);
        try { await onCommand(command); }
        catch (failure) { setError(failure instanceof Error ? failure.message : 'The Release could not be updated.'); }
        finally { setPending(false); }
    };
    const publishProjection = release.workflow && {
        ...release.workflow, transitions: release.workflow.transitions.filter(item => item.name === 'publish'),
    };
    return <section aria-label="Release" aria-busy={pending}>
        <h2>{release.title}</h2><p>Status: {release.status.replace('_', ' ')}</p>
        {release.reviewRequired && <p>Review is required before publication. The server checks every member’s permissions again at publish time.</p>}
        {error && <p role="alert">{error}</p>}
        <ul>{release.members.map(member => <li key={member.entryId}>
            <span>{entries.find(item => item.id === member.entryId)?.title ?? member.entryId}: {member.versionId === null ? 'Take-down' : `Saved version ${member.versionId}`}</span>
            {member.redirectTarget && <span> — Redirect target: {member.redirectTarget}</span>}
            {member.stale && <p role="status">The published version changed. Rebase or drop this member.</p>}
            {!immutable && <span>
                <button disabled={pending} onClick={() => void act({action:'rebase',entryId:member.entryId})}>Rebase</button>
                {member.versionId !== null && <button disabled={pending} onClick={() => void act({action:'use-latest',entryId:member.entryId})}>Use latest saved version</button>}
                <button disabled={pending} onClick={() => void act({action:'drop',entryId:member.entryId})}>Drop</button>
            </span>}
        </li>)}</ul>
        {!immutable && <fieldset disabled={pending}>
            <legend>Add a saved version or Take-down</legend>
            <label>Entry <select value={entryId} onChange={event => {setEntryId(event.target.value);setRef('');}}>
                <option value="">Choose an entry</option>{entries.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select></label>
            <label>Saved version <select value={ref} onChange={event => setRef(event.target.value)}>
                <option value="">Choose a saved version</option>{entry?.versions.map(version => <option key={version.id} value={version.id}>{version.label}</option>)}
                {entry?.canTakeDown && <option value="take-down">Take-down</option>}
            </select></label>
            {ref === 'take-down' && <label>Redirect to a published page (optional) <input value={redirect} onChange={event => setRedirect(event.target.value)} /></label>}
            <button disabled={!entry || !ref} onClick={() => void act({action:'member',entryId,ref:ref==='take-down'?null:ref,redirectTarget:ref==='take-down'?(redirect||null):null})}>Add to Release</button>
        </fieldset>}
        <div>{(['submit','approve','publish'] as const).filter(action => release.workflow?.available.includes(action)).map(action =>
            <button key={action} disabled={pending || (action==='publish' && release.members.some(member => member.stale))}
                onClick={() => void act({action})}>{action==='submit'?'Request review':action==='approve'?'Approve':'Publish now'}</button>)}</div>
        {immutable && <button disabled={pending} onClick={() => void act({action:'rollback'})}>Create rollback Release</button>}
        {!immutable && release.canSchedule && release.status === 'approved' && <WorkflowActionForm
            projection={publishProjection} initialTransition="publish" subjectLabel={release.title}
            onSchedule={async selection => { await onCommand({action:'schedule',dueAt:selection.dueAt,timezone:selection.timezone}); }} />}
        {!immutable && !release.canSchedule && <p>Scheduling is unavailable on this host. Reviewed Releases can still publish now.</p>}
    </section>;
}
