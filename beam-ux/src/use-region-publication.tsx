import { useEffect, useRef, useState } from 'react';
import type { SchemaNode } from '@schemastud/seam';
import { useQueryClient } from '@tanstack/react-query';
import { useEntryBody } from './hooks';
import { useNotify, useUxBuilderServices } from './provider';
import type { BeamUxEntryBodyData, EntryBody, EntryPublicationState } from './types';
import type { ReleaseRecord } from './releases';

/** A region keeps its loaded body and edit base together; Save never rebases an unsaved buffer implicitly. */
export function useRegionPublication(id: string, bodyBound: boolean, readOnly = false) {
    const { client } = useUxBuilderServices();
    const notify = useNotify();
    const cache = useQueryClient();
    const query = useEntryBody(id);
    const complete = Boolean(client.saveDraft && client.publish && client.listVersions && client.restoreVersion);
    // A host opts into the whole publication lifecycle or none; a partial client must never
    // fall through to immediate publication when its author meant to save a draft.
    const incomplete = bodyBound && !complete && Boolean(client.saveDraft || client.publish || client.listVersions || client.restoreVersion);
    const publicationEnabled = bodyBound && complete;
    const [loaded, setLoaded] = useState<{ envelope: BeamUxEntryBodyData; state: EntryPublicationState } | null>(null);
    const [draft, setDraft] = useState<EntryBody | null>(null);
    const [busy, setBusy] = useState(false);
    const locked = useRef(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [history, setHistory] = useState<EntryPublicationState | null>(null);
    const [choice, setChoice] = useState<{ ref: string; releases: ReleaseRecord[]; selected: string } | null>(null);

    const read = async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
            const before = await client.listVersions!(id);
            const envelope = await client.loadBody(id);
            const state = await client.listVersions!(id);
            if (before.headVersion === state.headVersion) return { envelope, state };
        }
        throw new Error('This entry changed while loading. Retry.');
    };
    useEffect(() => {
        if (!publicationEnabled) return;
        let live = true;
        read().then(value => { if (live) setLoaded(value); })
            .catch(failure => { if (live) setError(failure instanceof Error ? failure.message : 'Could not load publication history.'); });
        return () => { live = false; };
    }, [id, client, publicationEnabled]);

    const envelope = loaded?.envelope ?? query.data;
    const body = draft ?? envelope?.body ?? {};
    const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(envelope?.body ?? {});
    const refreshBody = (value: BeamUxEntryBodyData) => {
        cache.setQueryData(['beam-ux', 'entry-body', id], value);
        void cache.invalidateQueries({ queryKey: ['beam-ux', 'entry-body', id] });
    };
    const run = async (action: () => Promise<void>) => {
        if (locked.current || readOnly || incomplete || !bodyBound) return;
        locked.current = true; setBusy(true); setError(null); setNotice(null);
        try { await action(); }
        catch (failure) {
            const status = (failure as { status?: number; response?: { status?: number } } | null)?.response?.status
                ?? (failure as { status?: number } | null)?.status;
            const message = status === 409
                ? 'The server draft changed. Your edits are retained; discard them and reload before retrying.'
                : status === 403 ? 'You do not have permission to perform this action. Your edits are retained.'
                : failure instanceof Error ? failure.message : 'The action failed. Your edits are retained.';
            setError(message); notify({ type: 'error', message });
        } finally { locked.current = false; setBusy(false); }
    };
    const save = async (): Promise<EntryPublicationState> => {
        if (!loaded || !client.saveDraft) throw new Error('Publication history has not loaded.');
        const sent = body;
        const state = await client.saveDraft(id, sent, loaded.state.headVersion, 'UX builder draft');
        if (!state.headVersion) throw new Error('Save returned no version.');
        const nextEnvelope = { ...loaded.envelope, body: sent };
        setLoaded({ envelope: nextEnvelope, state }); setDraft(null); setHistory(null);
        refreshBody(nextEnvelope);
        return state;
    };
    const onSave = () => void run(async () => {
        if (publicationEnabled) { await save(); setNotice('Draft saved.'); notify({ type: 'success', message: 'Draft saved.' }); }
        else {
            const value = await client.saveBody(id, body);
            refreshBody(value); setDraft(null); notify({ type: 'success', message: 'Saved.' });
        }
    });
    const publishRef = async (ref: string) => {
        const state = await client.publish!(id, ref);
        setLoaded(previous => previous && { ...previous, state }); setHistory(null); setChoice(null);
        const message = state.compileError ? `Publication failed: ${state.compileError}`
            : state.release && state.release.status !== 'published' ? `Release ${state.release.status}; readers keep the published version.`
            : state.publishedVersion === ref ? 'Published.' : 'Publication is pending; readers keep the published version.';
        setNotice(message);
        notify({ type: state.compileError ? 'error' : 'success', message });
    };
    const publish = () => void run(async () => {
        if (!loaded) throw new Error('Publication history has not loaded.');
        const state = dirty ? await save() : loaded.state;
        if (!state.headVersion) throw new Error('Publish requires a saved version.');
        if (client.previewVersion || (client.listReleases && client.releaseCommand)) {
            const releases = client.listReleases && client.releaseCommand
                ? (await client.listReleases()).filter(release => ['draft', 'in_review', 'approved', 'scheduled'].includes(release.status)) : [];
            setChoice({ ref: state.headVersion, releases, selected: releases[0]?.id ?? '' });
        } else await publishRef(state.headVersion);
    });
    const preview = (ref: string) => {
        if (!client.previewVersion) return;
        // Reserve the window in the author gesture, just as PageEditor does, before awaiting the signed URL.
        const tab = window.open('about:blank', '_blank');
        if (!tab) { setError('Allow popups to open this version preview.'); return; }
        tab.opener = null;
        void run(async () => {
            try { const value = await client.previewVersion!(id, ref); tab.location.href = value.url; }
            catch (failure) { tab.close(); throw failure; }
        });
    };
    const controls = publicationEnabled && !readOnly ? <section aria-label="Entry publication" className="space-y-2 border-t p-3">
        {!loaded && error && <button type="button" disabled={busy} onClick={() => void run(async () => { setLoaded(await read()); })}>Retry publication history</button>}
        {loaded && <p>{loaded.state.headReadable ? `Draft ${loaded.state.headReadable}` : 'No saved draft'}{loaded.state.publishedReadable ? ` · readers see ${loaded.state.publishedReadable}` : ' · not published'}</p>}
        {error && loaded && <button type="button" disabled={busy || dirty || !!choice} onClick={() => void run(async () => {
            const value = await read(); setLoaded(value); setHistory(null); refreshBody(value.envelope);
        })}>Reload server version</button>}
        <button type="button" disabled={busy || !loaded || !!choice} onClick={publish}>Publish</button>
        <button type="button" disabled={busy || !loaded || !!choice} onClick={() => void run(async () => {
            if (history) setHistory(null); else setHistory(await client.listVersions!(id));
        })}>History</button>
        {choice && <div role="dialog" aria-label="Publish saved version">
            <p>Publish the saved version now, or add it to an open Release.</p>
            <button type="button" disabled={busy} onClick={() => void run(() => publishRef(choice.ref))}>Publish now</button>
            {client.previewVersion && <button type="button" disabled={busy} onClick={() => preview(choice.ref)}>Preview saved version</button>}
            {client.listReleases && client.releaseCommand && <>
                <select aria-label="Open Release" disabled={busy} value={choice.selected} onChange={event => setChoice({ ...choice, selected: event.target.value })}>
                    {choice.releases.map(release => <option key={release.id} value={release.id}>{release.title}</option>)}
                </select>
                <button type="button" disabled={busy || !choice.selected} onClick={() => void run(async () => {
                    const updated = await client.releaseCommand!(choice.selected, { action: 'member', entryId: id, ref: choice.ref });
                    setNotice(`Added to ${updated.title}; publication follows the Release workflow.`); setChoice(null);
                })}>Add to Release</button>
            </>}
            <button type="button" disabled={busy} onClick={() => setChoice(null)}>Cancel</button>
        </div>}
        {history && <aside aria-label="History">
            {history.versions.length === 0 && <p>No versions recorded.</p>}
            {history.versions.map(version => <div key={version.id}>
                <span>{version.readable}{version.isPublished ? ' · published' : ''}{version.isHead ? ' · draft' : ''}</span>
                {client.previewVersion && <button type="button" disabled={busy || !!choice} onClick={() => preview(version.id)}>Preview {version.readable}</button>}
                <button type="button" disabled={busy || dirty || !!choice} onClick={() => void run(async () => {
                    await client.restoreVersion!(id, version.id);
                    const value = await read(); setLoaded(value); setDraft(null); setHistory(value.state); refreshBody(value.envelope);
                    setNotice('Restored into a draft. Publish when ready.');
                })}>Restore {version.readable} into draft</button>
            </div>)}
            {dirty && <p>Save or discard your edits before restoring History.</p>}
        </aside>}
    </section> : null;
    return {
        schema: (envelope?.schema ?? null) as SchemaNode | null, body,
        onChange: (value: EntryBody) => { if (!locked.current && !readOnly && !choice) setDraft(value); },
        onSave,
        onDiscard: () => { if (!locked.current && !choice) setDraft(null); },
        saving: busy,
        saveLabel: publicationEnabled ? 'Save draft' : undefined,
        saveDisabled: readOnly || incomplete || !!choice || (publicationEnabled && !loaded),
        disabled: readOnly || incomplete || busy || !!choice || (publicationEnabled && !loaded),
        controls: <>{incomplete && <p role="alert">Incomplete publication transport: this editor requires draft, publish, history and restore together. No writes are available.</p>}{error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}{controls}</>,
    };
}
