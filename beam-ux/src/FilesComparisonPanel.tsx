import { useEffect, useId, useRef, useState } from 'react';
import type { FileInspection, FileReconcileInput } from './files';
import type { UxBuilderClient } from './types';

const buttonClassName = 'inline-flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50';

/** Deliberate current-pin comparison. Captured confirmation survives errors until explicit reload. */
export function FilesComparisonPanel({memberId, client, editorHref}: {
    memberId: string; client: UxBuilderClient; editorHref?: (entryId: string) => string | undefined;
}) {
    const [inspection, setInspection] = useState<FileInspection | null>(null);
    const [confirmation, setConfirmation] = useState<{action: 'take' | 'restore'; input: FileReconcileInput} | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState('');
    const [drafted, setDrafted] = useState(false);
    const confirmButton = useRef<HTMLButtonElement>(null);
    const takeButton = useRef<HTMLButtonElement>(null);
    const restoreButton = useRef<HTMLButtonElement>(null);
    const returnFocus = useRef<'take' | 'restore' | null>(null);
    const headingId = useId();
    const load = async () => {
        setBusy(true); setError(''); setConfirmation(null);
        try {
            if (!client.inspectReleaseFile) throw new Error('File inspection is unavailable in this host.');
            setInspection(await client.inspectReleaseFile(memberId));
        } catch (failure) { setError(failure instanceof Error ? failure.message : 'Comparison failed.'); }
        finally { setBusy(false); }
    };
    useEffect(() => { void load(); }, [memberId, client]);
    useEffect(() => {
        if (confirmation) confirmButton.current?.focus();
        else if (returnFocus.current) {
            (returnFocus.current === 'take' ? takeButton : restoreButton).current?.focus();
            returnFocus.current = null;
        }
    }, [confirmation]);
    const cancel = () => {
        returnFocus.current = confirmation?.action ?? null;
        setConfirmation(null);
    };
    const capture = (action: 'take' | 'restore') => {
        if (!inspection?.workingHeadVersion || !inspection.publishedVersion || !inspection.fingerprint) return;
        setConfirmation({action, input: {
            expectedHeadVersion: inspection.workingHeadVersion,
            expectedPublishedVersion: inspection.publishedVersion,
            expectedFileExists: inspection.fileExists,
            expectedFileSha256: inspection.fileSha256,
            fingerprint: inspection.fingerprint, confirmed: true,
        }});
        setError(''); setResult('');
    };
    const submit = async () => {
        if (!confirmation) return;
        const operation = confirmation.action === 'take' ? client.takeReleaseFile : client.restoreMissingReleaseFile;
        if (!operation) return;
        setBusy(true); setError('');
        try {
            const response = await operation.call(client, memberId, confirmation.input);
            setResult(response.message); setDrafted(response.status === 'drafted'); setConfirmation(null);
            if (client.inspectReleaseFile) setInspection(await client.inspectReleaseFile(memberId));
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : 'Nothing could be confirmed. Reload comparison.');
        } finally { setBusy(false); }
    };
    const href = inspection && editorHref?.(inspection.entryId);
    return <section aria-labelledby={headingId} className="space-y-4 rounded-lg border bg-card p-4 text-card-foreground">
        <h2 id={headingId} className="text-lg font-semibold">Current published file</h2>
        <p>Compare the local file with the entry’s current published pin. The historical Release member above stays fixed.</p>
        <button className={buttonClassName} type="button" disabled={busy} onClick={() => void load()}>Reload comparison</button>
        {error && <p role="alert">{error} The captured inspection is retained. Reload explicitly before a new attempt.</p>}
        {result && <p role="status">{result}</p>}
        {drafted && href && <a href={href}>Open Theme</a>}
        {inspection && <>
            <p><strong>{inspection.state}</strong> — {inspection.message}</p>
            <dl><dt>File</dt><dd>{inspection.path ?? 'Unavailable'}</dd>
                <dt>Working head</dt><dd className="break-all">{inspection.workingHeadVersion}</dd>
                <dt>Current published pin</dt><dd className="break-all">{inspection.publishedVersion}</dd></dl>
            {inspection.sourceTruncated && <p>Source previews are truncated. Validation uses the complete bounded file.</p>}
            <div className="grid gap-4 md:grid-cols-2">
                <div><h3>Current published bytes</h3><pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{inspection.publishedSource ?? 'Unavailable'}</pre></div>
                <div><h3>Local bytes</h3><pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{inspection.localSource ?? (inspection.fileExists ? 'Unavailable' : 'Missing')}</pre></div>
            </div>
            {!confirmation && <div className="flex gap-4">
                {inspection.canTake && client.takeReleaseFile && <button className={buttonClassName} ref={takeButton} type="button" disabled={busy} onClick={() => capture('take')}>Take file as draft</button>}
                {inspection.canRestore && client.restoreMissingReleaseFile && <button className={buttonClassName} ref={restoreButton} type="button" disabled={busy} onClick={() => capture('restore')}>Restore missing published file</button>}
            </div>}
            {inspection.fileExists && inspection.state !== 'unchanged' && <p>Restore never overwrites an existing file. Preserve or move it before restoring a missing published file.</p>}
        </>}
        {confirmation && <div role="group" aria-label="Confirm file reconciliation" className="flex flex-wrap items-center gap-3 rounded border p-3">
            <p>{confirmation.action === 'take'
                ? 'Replace the inspected working draft with this complete validated local Theme? The published pin, file and Git stay unchanged. Publish separately through ordinary review.'
                : 'Create the missing file from the current published pin? Draft, history and Git stay unchanged. Any appearing file blocks creation. An incomplete file is preserved for explicit inspection or moving before retry.'}</p>
            <p className="break-all text-xs">Captured head {confirmation.input.expectedHeadVersion}; published {confirmation.input.expectedPublishedVersion}; file {confirmation.input.expectedFileSha256 ?? 'absent'}.</p>
            <button className={buttonClassName} ref={confirmButton} type="button" disabled={busy || !!error} onClick={() => void submit()}>{confirmation.action === 'take' ? 'Confirm take file as draft' : 'Confirm restore missing file'}</button>
            <button className={buttonClassName} type="button" disabled={busy} onClick={cancel}>Cancel</button>
        </div>}
    </section>;
}
