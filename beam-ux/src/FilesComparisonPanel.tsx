import { useEffect, useId, useRef, useState } from 'react';
import type { FileBatchReconcileInput, FileBatchReconcileResult, FileInspection, FileReconcileInput, FileReconcileResult } from './files';
import type { UxBuilderClient } from './types';
import { useBeamUxMessages } from './messages.js';

const buttonClassName = 'inline-flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50';
type FileConfirmation =
    | {action: 'take'; input: FileReconcileInput}
    | {action: 'restore'; input: FileReconcileInput}
    | {action: 'remirror'; input: FileReconcileInput}
    | {action: 'takeAll'; input: FileBatchReconcileInput};

/** Deliberate current-pin comparison. Captured confirmation survives errors until explicit reload. */
export function FilesComparisonPanel({memberId, client, editorHref}: {
    memberId: string; client: UxBuilderClient; editorHref?: (entryId: string) => string | undefined;
}) {
    const m = useBeamUxMessages();
    const [inspection, setInspection] = useState<FileInspection | null>(null);
    const [confirmation, setConfirmation] = useState<FileConfirmation | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<FileReconcileResult | null>(null);
    const [batchResult, setBatchResult] = useState<FileBatchReconcileResult | null>(null);
    const [resultFormat, setResultFormat] = useState<string | null>(null);
    const confirmButton = useRef<HTMLButtonElement>(null);
    const takeButton = useRef<HTMLButtonElement>(null);
    const restoreButton = useRef<HTMLButtonElement>(null);
    const remirrorButton = useRef<HTMLButtonElement>(null);
    const takeAllButton = useRef<HTMLButtonElement>(null);
    const returnFocus = useRef<'take' | 'restore' | 'remirror' | 'takeAll' | null>(null);
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
        setResult(null); setBatchResult(null); setResultFormat(null);
        void load();
        return () => { requestEpoch.current++; };
    }, [memberId, client]);
    useEffect(() => {
        if (confirmation && !busy && !error) confirmButton.current?.focus();
        else if (!confirmation && !busy && returnFocus.current) {
            ((returnFocus.current === 'take' ? takeButton : returnFocus.current === 'restore' ? restoreButton : returnFocus.current === 'remirror' ? remirrorButton : takeAllButton).current ?? reloadButton.current)?.focus();
            returnFocus.current = null;
        }
    }, [confirmation, busy, error]);
    const cancel = () => {
        returnFocus.current = confirmation?.action ?? null;
        setConfirmation(null);
    };
    const capture = (action: 'take' | 'restore' | 'remirror') => {
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
    const captureAll = () => {
        if (!inspection?.canTakeAll || !inspection.takeAllItems || inspection.takeAllItems.length < 1) return;
        setConfirmation({action: 'takeAll', input: {items: inspection.takeAllItems.map(({path: _path, ...item}) => ({...item})), confirmed: true}});
        setError('');
    };
    const submit = async () => {
        if (!confirmation) return;
        const action = confirmation.action;
        if (action === 'take' && !client.takeReleaseFile || action === 'restore' && !client.restoreMissingReleaseFile
            || action === 'remirror' && !client.remirrorReleaseFile || action === 'takeAll' && !client.takeAllReleaseFiles) return;
        const epoch = requestEpoch.current;
        const format = inspection?.format ?? null;
        setBusy(true); setError('');
        try {
            if (action === 'takeAll') {
                const response = await client.takeAllReleaseFiles!(memberId, confirmation.input);
                if (epoch !== requestEpoch.current) return;
                setBatchResult(response); setResult(null);
            } else {
                const operation = action === 'take' ? client.takeReleaseFile! : action === 'restore' ? client.restoreMissingReleaseFile! : client.remirrorReleaseFile!;
                const response = await operation.call(client, memberId, confirmation.input);
                if (epoch !== requestEpoch.current) return;
                setResult(response); setBatchResult(null); setResultFormat(format);
            }
            returnFocus.current = action;
            setConfirmation(null);
            if (client.inspectReleaseFile) {
                const updated = await client.inspectReleaseFile(memberId);
                if (epoch === requestEpoch.current) setInspection(updated);
            }
        } catch (failure) {
            if (epoch !== requestEpoch.current) return;
            setInspection(null);
            setError(failure instanceof Error ? failure.message : m.t('splicewire-beam-ux::messages.files_nothing_confirmed'));
        } finally { if (epoch === requestEpoch.current) setBusy(false); }
    };
    const drafted = result?.status === 'drafted' || result?.status === 'drafted-with-compile-error';
    const compileFailed = result?.status === 'drafted-with-compile-error' || result?.diagnostic?.code === 'compile-failed';
    // format is declared by the new server. An old cached projection's actual MDX path is also
    // enough to suppress a generic host Theme destination; it is never used as import authority.
    const mdxLinkRefused = resultFormat === 'mdx' || inspection?.format === 'mdx' || inspection?.path?.toLowerCase().endsWith('.mdx');
    const href = inspection && result && !mdxLinkRefused && editorHref?.(result.entryId);
    return <section aria-labelledby={headingId} aria-busy={busy} className="space-y-4 rounded-lg border bg-card p-4 text-card-foreground">
        <h2 id={headingId} className="text-lg font-semibold">{m.t('splicewire-beam-ux::messages.files_heading')}</h2>
        <p>{m.t('splicewire-beam-ux::messages.files_intro')}</p>
        <button className={buttonClassName} ref={reloadButton} type="button" disabled={busy} onClick={() => void load()}>{m.t('splicewire-beam-ux::messages.files_reload')}</button>
        {error && <p role="alert">{m.t('splicewire-beam-ux::messages.files_error_retained', { error })}</p>}
        {result && <div className="space-y-2 rounded border bg-muted p-3 text-foreground">
            {compileFailed
                ? <p role="alert">{m.t('splicewire-beam-ux::messages.files_compile_failed')}</p>
                : <p role="status">{result.message}</p>}
            <p className="break-all text-sm">{m.t('splicewire-beam-ux::messages.files_returned_versions', { head: result.headVersion ?? m.t('splicewire-beam-ux::messages.files_unavailable'), pin: result.publishedVersion ?? m.t('splicewire-beam-ux::messages.files_unavailable') })}</p>
            {compileFailed && <p className="text-sm">{m.t('splicewire-beam-ux::messages.files_compile_warning_scope')}</p>}
        </div>}
        {batchResult && <p role="status">{m.t('splicewire-beam-ux::messages.files_taken_as_drafts', { count: batchResult.count })}</p>}
        {drafted && href && <a href={href}>{m.t('splicewire-beam-ux::messages.files_open_entry')}</a>}
        {inspection && <>
            <p><strong>{inspection.state}</strong> — {inspection.message}</p>
            <dl><dt>{m.t('splicewire-beam-ux::messages.files_file')}</dt><dd>{inspection.path ?? m.t('splicewire-beam-ux::messages.files_unavailable')}</dd>
                <dt>{m.t('splicewire-beam-ux::messages.files_working_head')}</dt><dd className="break-all">{inspection.workingHeadVersion}</dd>
                <dt>{m.t('splicewire-beam-ux::messages.files_current_published_pin')}</dt><dd className="break-all">{inspection.publishedVersion}</dd></dl>
            {inspection.sourceTruncated && <p>{m.t('splicewire-beam-ux::messages.files_source_truncated')}</p>}
            <div className="grid gap-4 md:grid-cols-2">
                <div><h3>{m.t('splicewire-beam-ux::messages.files_published_bytes')}</h3><pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{inspection.publishedSource ?? m.t('splicewire-beam-ux::messages.files_unavailable')}</pre></div>
                <div><h3>{m.t('splicewire-beam-ux::messages.files_local_bytes')}</h3><pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{inspection.localSource ?? (inspection.fileExists ? m.t('splicewire-beam-ux::messages.files_unavailable') : m.t('splicewire-beam-ux::messages.files_missing'))}</pre></div>
            </div>
            {!confirmation && <div className="flex gap-4">
                {inspection.canTake && client.takeReleaseFile && <button className={buttonClassName} ref={takeButton} type="button" disabled={busy} onClick={() => capture('take')}>{m.t('splicewire-beam-ux::messages.files_take')}</button>}
                {inspection.canRestore && client.restoreMissingReleaseFile && <button className={buttonClassName} ref={restoreButton} type="button" disabled={busy} onClick={() => capture('restore')}>{m.t('splicewire-beam-ux::messages.files_restore')}</button>}
                {inspection.state === 'differs' && inspection.canRemirror && client.remirrorReleaseFile && <button className={buttonClassName} ref={remirrorButton} type="button" disabled={busy} onClick={() => capture('remirror')}>{m.t('splicewire-beam-ux::messages.files_remirror')}</button>}
                {inspection.canTakeAll && client.takeAllReleaseFiles && <button className={buttonClassName} ref={takeAllButton} type="button" disabled={busy} onClick={captureAll}>{m.t('splicewire-beam-ux::messages.files_take_all')}</button>}
            </div>}
            {inspection.fileExists && inspection.state !== 'unchanged' && <p>{m.t('splicewire-beam-ux::messages.files_restore_never_overwrites')}</p>}
        </>}
        {confirmation && <div role="group" aria-label={m.t('splicewire-beam-ux::messages.files_confirm_group')} className="flex flex-wrap items-center gap-3 rounded border p-3">
            <p>{confirmation.action === 'take'
                ? m.t('splicewire-beam-ux::messages.files_confirm_take_body')
                : confirmation.action === 'restore'
                    ? m.t('splicewire-beam-ux::messages.files_confirm_restore_body')
                    : confirmation.action === 'remirror'
                        ? m.t('splicewire-beam-ux::messages.files_confirm_remirror_body')
                        : m.t('splicewire-beam-ux::messages.files_confirm_take_all_body', { count: confirmation.input.items.length })}</p>
            {confirmation.action === 'takeAll'
                ? <><p className="break-all text-xs">{m.t('splicewire-beam-ux::messages.files_captured_states', { count: confirmation.input.items.length })}</p><ul className="list-disc pl-5">{inspection?.takeAllItems?.map(item => <li className="break-all" key={item.memberId}>{item.path}</li>)}</ul></>
                : <p className="break-all text-xs">{m.t('splicewire-beam-ux::messages.files_captured_versions', { head: confirmation.input.expectedHeadVersion, pin: confirmation.input.expectedPublishedVersion, file: confirmation.input.expectedFileSha256 ?? m.t('splicewire-beam-ux::messages.files_absent') })}</p>}
            <button className={buttonClassName} ref={confirmButton} type="button" disabled={busy || !!error} onClick={() => void submit()}>{confirmation.action === 'take' ? m.t('splicewire-beam-ux::messages.files_confirm_take') : confirmation.action === 'restore' ? m.t('splicewire-beam-ux::messages.files_confirm_restore') : confirmation.action === 'remirror' ? m.t('splicewire-beam-ux::messages.files_confirm_remirror') : m.t('splicewire-beam-ux::messages.files_confirm_take_all')}</button>
            <button className={buttonClassName} type="button" disabled={busy} onClick={cancel}>{m.t('splicewire-beam-ux::messages.files_cancel')}</button>
        </div>}
    </section>;
}
