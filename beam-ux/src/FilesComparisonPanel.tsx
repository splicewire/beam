import { useEffect, useId, useRef, useState } from 'react';
import type { FileInspection, FileReconcileInput, FileReconcileResult } from './files';
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
    const [result, setResult] = useState<FileReconcileResult | null>(null);
    const [resultFormat, setResultFormat] = useState<string | null>(null);
    const confirmButton = useRef<HTMLButtonElement>(null);
    const takeButton = useRef<HTMLButtonElement>(null);
    const restoreButton = useRef<HTMLButtonElement>(null);
    const returnFocus = useRef<'take' | 'restore' | null>(null);
    const reloadButton = useRef<HTMLButtonElement>(null);
    const requestEpoch = useRef(0);
    const headingId = useId();
    const load = async () => {
        const epoch = ++requestEpoch.current;
        setBusy(true); setError(''); setConfirmation(null);
        setInspection(null);
        try {
            if (!client.inspectReleaseFile) throw new Error('File inspection is unavailable in this host.');
            const response = await client.inspectReleaseFile(memberId);
            if (epoch === requestEpoch.current) setInspection(response);
        } catch (failure) {
            if (epoch === requestEpoch.current) setError(failure instanceof Error ? failure.message : 'Comparison failed.');
        }
        finally { if (epoch === requestEpoch.current) setBusy(false); }
    };
    useEffect(() => {
        setResult(null); setResultFormat(null);
        void load();
        return () => { requestEpoch.current++; };
    }, [memberId, client]);
    useEffect(() => {
        if (confirmation && !busy && !error) confirmButton.current?.focus();
        else if (!confirmation && !busy && returnFocus.current) {
            ((returnFocus.current === 'take' ? takeButton : restoreButton).current ?? reloadButton.current)?.focus();
            returnFocus.current = null;
        }
    }, [confirmation, busy, error]);
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
        setError('');
    };
    const submit = async () => {
        if (!confirmation) return;
        const operation = confirmation.action === 'take' ? client.takeReleaseFile : client.restoreMissingReleaseFile;
        if (!operation) return;
        const epoch = requestEpoch.current;
        const format = inspection?.format ?? null;
        setBusy(true); setError('');
        try {
            const response = await operation.call(client, memberId, confirmation.input);
            if (epoch !== requestEpoch.current) return;
            setResult(response); setResultFormat(format);
            returnFocus.current = confirmation.action;
            setConfirmation(null);
            if (client.inspectReleaseFile) {
                const updated = await client.inspectReleaseFile(memberId);
                if (epoch === requestEpoch.current) setInspection(updated);
            }
        } catch (failure) {
            if (epoch !== requestEpoch.current) return;
            setInspection(null);
            setError(failure instanceof Error ? failure.message : 'Nothing could be confirmed. Reload comparison.');
        } finally { if (epoch === requestEpoch.current) setBusy(false); }
    };
    const drafted = result?.status === 'drafted' || result?.status === 'drafted-with-compile-error';
    const compileFailed = result?.status === 'drafted-with-compile-error' || result?.diagnostic?.code === 'compile-failed';
    // format is declared by the new server. An old cached projection's actual MDX path is also
    // enough to suppress a generic host Theme destination; it is never used as import authority.
    const mdxLinkRefused = resultFormat === 'mdx' || inspection?.format === 'mdx' || inspection?.path?.toLowerCase().endsWith('.mdx');
    const href = inspection && result && !mdxLinkRefused && editorHref?.(result.entryId);
    return <section aria-labelledby={headingId} aria-busy={busy} className="space-y-4 rounded-lg border bg-card p-4 text-card-foreground">
        <h2 id={headingId} className="text-lg font-semibold">Current published file</h2>
        <p>Compare the local file with the entry’s current published pin. The historical Release member above stays fixed.</p>
        <button className={buttonClassName} ref={reloadButton} type="button" disabled={busy} onClick={() => void load()}>Reload comparison</button>
        {error && <p role="alert">{error} The captured inspection is retained. Reload explicitly before a new attempt.</p>}
        {result && <div className="space-y-2 rounded border bg-muted p-3 text-foreground">
            {compileFailed
                ? <p role="alert">Draft retained; compilation failed. Published content is unchanged. Review the draft before publication.</p>
                : <p role="status">{result.message}</p>}
            <p className="break-all text-sm">Returned working head: {result.headVersion ?? 'Unavailable'}. Published pin: {result.publishedVersion ?? 'Unavailable'}.</p>
            {compileFailed && <p className="text-sm">This warning describes the save response; later comparison reads do not provide stored compilation history.</p>}
        </div>}
        {drafted && href && <a href={href}>Open entry</a>}
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
            {inspection.format !== 'mdx' && inspection.fileExists && inspection.state !== 'unchanged' && <p>Restore never overwrites an existing file. Preserve or move it before restoring a missing published file.</p>}
        </>}
        {confirmation && <div role="group" aria-label="Confirm file reconciliation" className="flex flex-wrap items-center gap-3 rounded border p-3">
            <p>{confirmation.action === 'take'
                ? 'Replace the inspected working draft with this admitted local file body? Prior versions remain in history. The published pin, local file and Git stay unchanged. Publish separately through ordinary review.'
                : 'Create the missing file from the current published pin? Draft, history and Git stay unchanged. Any appearing file blocks creation. An incomplete file is preserved for explicit inspection or moving before retry.'}</p>
            <p className="break-all text-xs">Captured head {confirmation.input.expectedHeadVersion}; published {confirmation.input.expectedPublishedVersion}; file {confirmation.input.expectedFileSha256 ?? 'absent'}.</p>
            <button className={buttonClassName} ref={confirmButton} type="button" disabled={busy || !!error} onClick={() => void submit()}>{confirmation.action === 'take' ? 'Confirm take file as draft' : 'Confirm restore missing file'}</button>
            <button className={buttonClassName} type="button" disabled={busy} onClick={cancel}>Cancel</button>
        </div>}
    </section>;
}
