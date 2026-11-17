import { useEffect, useRef, useState } from 'react';
import type { SchemaNode } from '@schemastud/seam';
import { useQueryClient } from '@tanstack/react-query';
import { useEntryBody } from './hooks';
import { useNotify, useUxBuilderServices } from './provider';
import type { BeamUxEntryBodyData, EntryBody, EntryPublicationState } from './types';
import type { ReleaseRecord } from './releases';
import { useBeamUxMessages } from './messages.js';
import { NoticeError, notice as line, noticeOf, say, type Notice } from './message-descriptor.js';

/** A region keeps its loaded body and edit base together; Save never rebases an unsaved buffer implicitly. */
export function useRegionPublication(id: string, bodyBound: boolean, readOnly = false) {
    const m = useBeamUxMessages();
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
    const [error, setError] = useState<Notice | null>(null);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [history, setHistory] = useState<EntryPublicationState | null>(null);
    const [choice, setChoice] = useState<{ ref: string; releases: ReleaseRecord[]; selected: string } | null>(null);

    const read = async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
            const before = await client.listVersions!(id);
            const envelope = await client.loadBody(id);
            const state = await client.listVersions!(id);
            if (before.headVersion === state.headVersion) return { envelope, state };
        }
        throw new NoticeError(line('splicewire-beam-ux::messages.publication_changed_while_loading'));
    };
    useEffect(() => {
        if (!publicationEnabled) return;
        let live = true;
        read().then(value => { if (live) setLoaded(value); })
            .catch(failure => { if (live) setError(noticeOf(failure, line('splicewire-beam-ux::messages.publication_history_load_failed'))); });
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
            const message: Notice = status === 409
                ? line('splicewire-beam-ux::messages.publication_conflict')
                : status === 403 ? line('splicewire-beam-ux::messages.publication_forbidden')
                : noticeOf(failure, line('splicewire-beam-ux::messages.publication_action_failed'));
            setError(message); notify({ type: 'error', message: say(m, message) });
        } finally { locked.current = false; setBusy(false); }
    };
    const save = async (): Promise<EntryPublicationState> => {
        if (!loaded || !client.saveDraft) throw new NoticeError(line('splicewire-beam-ux::messages.publication_history_not_loaded'));
        const sent = body;
        const state = await client.saveDraft(id, sent, loaded.state.headVersion, 'UX builder draft');
        if (!state.headVersion) throw new NoticeError(line('splicewire-beam-ux::messages.publication_save_returned_no_version'));
        const nextEnvelope = { ...loaded.envelope, body: sent };
        setLoaded({ envelope: nextEnvelope, state }); setDraft(null); setHistory(null);
        refreshBody(nextEnvelope);
        return state;
    };
    const onSave = () => void run(async () => {
        if (publicationEnabled) { await save(); setNotice(line('splicewire-beam-ux::messages.publication_draft_saved')); notify({ type: 'success', message: m.t('splicewire-beam-ux::messages.publication_draft_saved') }); }
        else {
            const value = await client.saveBody(id, body);
            refreshBody(value); setDraft(null); notify({ type: 'success', message: m.t('splicewire-beam-ux::messages.publication_saved') });
        }
    });
    const publishRef = async (ref: string) => {
        const state = await client.publish!(id, ref);
        setLoaded(previous => previous && { ...previous, state }); setHistory(null); setChoice(null);
        const message: Notice = state.compileError ? line('splicewire-beam-ux::messages.publication_failed', { error: state.compileError })
            : state.release && state.release.status !== 'published' ? line('splicewire-beam-ux::messages.publication_release_status', { status: state.release.status })
            : state.publishedVersion === ref ? line('splicewire-beam-ux::messages.publication_published') : line('splicewire-beam-ux::messages.publication_pending');
        setNotice(message);
        notify({ type: state.compileError ? 'error' : 'success', message: say(m, message) });
    };
    const publish = () => void run(async () => {
        if (!loaded) throw new NoticeError(line('splicewire-beam-ux::messages.publication_history_not_loaded'));
        const state = dirty ? await save() : loaded.state;
        if (!state.headVersion) throw new NoticeError(line('splicewire-beam-ux::messages.publication_requires_saved_version'));
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
        if (!tab) { setError(line('splicewire-beam-ux::messages.publication_allow_popups')); return; }
        tab.opener = null;
        void run(async () => {
            try { const value = await client.previewVersion!(id, ref); tab.location.href = value.url; }
            catch (failure) { tab.close(); throw failure; }
        });
    };
    const controls = publicationEnabled && !readOnly ? <section aria-label={m.t('splicewire-beam-ux::messages.publication_label')} className="space-y-2 border-t p-3">
        {!loaded && error && <button type="button" disabled={busy} onClick={() => void run(async () => { setLoaded(await read()); })}>{m.t('splicewire-beam-ux::messages.publication_retry_history')}</button>}
        {loaded && <p>{loaded.state.headReadable ? m.t('splicewire-beam-ux::messages.publication_draft_version', { version: loaded.state.headReadable }) : m.t('splicewire-beam-ux::messages.publication_no_saved_draft')}{loaded.state.publishedReadable ? ` ${m.t('splicewire-beam-ux::messages.publication_readers_see', { version: loaded.state.publishedReadable })}` : ` ${m.t('splicewire-beam-ux::messages.publication_not_published')}`}</p>}
        {error && loaded && <button type="button" disabled={busy || dirty || !!choice} onClick={() => void run(async () => {
            const value = await read(); setLoaded(value); setHistory(null); refreshBody(value.envelope);
        })}>{m.t('splicewire-beam-ux::messages.publication_reload_server_version')}</button>}
        <button type="button" disabled={busy || !loaded || !!choice} onClick={publish}>{m.t('splicewire-beam-ux::messages.publication_publish')}</button>
        <button type="button" disabled={busy || !loaded || !!choice} onClick={() => void run(async () => {
            if (history) setHistory(null); else setHistory(await client.listVersions!(id));
        })}>{m.t('splicewire-beam-ux::messages.publication_history')}</button>
        {choice && <div role="dialog" aria-label={m.t('splicewire-beam-ux::messages.publication_publish_saved_version')}>
            <p>{m.t('splicewire-beam-ux::messages.publication_choice_prompt')}</p>
            <button type="button" disabled={busy} onClick={() => void run(() => publishRef(choice.ref))}>{m.t('splicewire-beam-ux::messages.publication_publish_now')}</button>
            {client.previewVersion && <button type="button" disabled={busy} onClick={() => preview(choice.ref)}>{m.t('splicewire-beam-ux::messages.publication_preview_saved_version')}</button>}
            {client.listReleases && client.releaseCommand && <>
                <select aria-label={m.t('splicewire-beam-ux::messages.publication_open_release')} disabled={busy} value={choice.selected} onChange={event => setChoice({ ...choice, selected: event.target.value })}>
                    {choice.releases.map(release => <option key={release.id} value={release.id}>{release.title}</option>)}
                </select>
                <button type="button" disabled={busy || !choice.selected} onClick={() => void run(async () => {
                    const updated = await client.releaseCommand!(choice.selected, { action: 'member', entryId: id, ref: choice.ref });
                    setNotice(line('splicewire-beam-ux::messages.publication_added_to_release', { title: updated.title })); setChoice(null);
                })}>{m.t('splicewire-beam-ux::messages.publication_add_to_release')}</button>
            </>}
            <button type="button" disabled={busy} onClick={() => setChoice(null)}>{m.t('splicewire-beam-ux::messages.publication_cancel')}</button>
        </div>}
        {history && <aside aria-label={m.t('splicewire-beam-ux::messages.publication_history')}>
            {history.versions.length === 0 && <p>{m.t('splicewire-beam-ux::messages.publication_no_versions')}</p>}
            {history.versions.map(version => <div key={version.id}>
                <span>{version.readable}{version.isPublished ? ` ${m.t('splicewire-beam-ux::messages.publication_published_marker')}` : ''}{version.isHead ? ` ${m.t('splicewire-beam-ux::messages.publication_draft_marker')}` : ''}</span>
                {client.previewVersion && <button type="button" disabled={busy || !!choice} onClick={() => preview(version.id)}>{m.t('splicewire-beam-ux::messages.publication_preview_version', { version: version.readable })}</button>}
                <button type="button" disabled={busy || dirty || !!choice} onClick={() => void run(async () => {
                    await client.restoreVersion!(id, version.id);
                    const value = await read(); setLoaded(value); setDraft(null); setHistory(value.state); refreshBody(value.envelope);
                    setNotice(line('splicewire-beam-ux::messages.publication_restored'));
                })}>{m.t('splicewire-beam-ux::messages.publication_restore_version', { version: version.readable })}</button>
            </div>)}
            {dirty && <p>{m.t('splicewire-beam-ux::messages.publication_save_before_restore')}</p>}
        </aside>}
    </section> : null;
    return {
        schema: (envelope?.schema ?? null) as SchemaNode | null, body,
        onChange: (value: EntryBody) => { if (!locked.current && !readOnly && !choice) setDraft(value); },
        onSave,
        onDiscard: () => { if (!locked.current && !choice) setDraft(null); },
        saving: busy,
        saveLabel: publicationEnabled ? m.t('splicewire-beam-ux::messages.publication_save_draft') : undefined,
        saveDisabled: readOnly || incomplete || !!choice || (publicationEnabled && !loaded),
        disabled: readOnly || incomplete || busy || !!choice || (publicationEnabled && !loaded),
        controls: <>{incomplete && <p role="alert">{m.t('splicewire-beam-ux::messages.publication_incomplete_transport')}</p>}{error && <p role="alert">{say(m, error)}</p>}{notice && <p role="status">{say(m, notice)}</p>}{controls}</>,
    };
}
