import { canMountPublication, isUnauthored } from './publication-state';
import { PageSettings } from './PageSettings';
import { SourceMode } from './SourceMode';
import { BuiltReleaseAssembly, ReleasePanel } from '../releases';
import type { SessionPageSettings } from './local-session';
// Window-mode authoring shares the package-owned Local Session and publication transport.
import { useEffect, useState } from 'react';
import { VersionRecordingReferences } from '../recording';
import type { JsonDoc } from '../blockdoc/json';
import type { EntryPublicationState } from '../types';
import { CanvasProvider, VisualEditor } from '../canvas';
import { useEditorKit } from './context';
import { useLocalSession } from './use-local-session';

type EntryRef = { id: string | null; slug: string | null; format?: string | null };
export function VisualEditorMount({ entryRef }: { entryRef: EntryRef }) {
    const { userId, canAuthor } = useEditorKit();
    // An address or actor change retires the previous editor before the new read starts.
    // Its loaded document, pending session and write callbacks must never cross that boundary.
    return <AddressedVisualEditor key={JSON.stringify([entryRef.id, userId, canAuthor])} entryRef={entryRef} />;
}
function AddressedVisualEditor({ entryRef }: { entryRef: EntryRef }) {
    const { transport, theme, canvasConfig, userId, canAuthor, notify } = useEditorKit();
    const [loaded, setLoaded] = useState<{ body: JsonDoc; state: EntryPublicationState; pageSettings?: SessionPageSettings; styleRegistry?: import('../blockdoc/style-runtime.js').StyleRegistry; profile?: import('@schemastud/blockdoc').BlockdocManifest } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [conflict, setConflict] = useState(false);
    const [busy, setBusy] = useState(false);
    const [history, setHistory] = useState(false);
    const id = entryRef.id;
    const local = useLocalSession(id ?? '', userId, loaded?.state.headVersion, loaded?.body ?? [], !!loaded && !!id, loaded?.pageSettings ?? null);
    useEffect(() => {
        if (!id || !userId || !canAuthor || !transport.listVersions || !transport.saveDraft || !transport.publish || !transport.restoreVersion) {
            setError('The editor requires an authored entry, authenticated author, and publication transport.'); return;
        }
        let live = true;
        Promise.all([transport.loadBody(id), transport.listVersions(id)]).then(([envelope, state]) => {
            if (!live) return;
            if (!canMountPublication(state)) throw new Error('This entry has no Publication Pin. Publish its baseline before mounting the editor.');
            const body = (envelope as { body?: unknown }).body;
            if (!Array.isArray(body)) throw new Error('The entry has no editable document.');
            setLoaded({ body: body as JsonDoc, state, pageSettings: (envelope as unknown as { pageSettings?: SessionPageSettings }).pageSettings, styleRegistry: (envelope as { styleRegistry?: import("../blockdoc/style-runtime.js").StyleRegistry }).styleRegistry, profile: (envelope as { pageSettings?: SessionPageSettings; styleRegistry?: import('../blockdoc/style-runtime.js').StyleRegistry; profile?: import('@schemastud/blockdoc').BlockdocManifest }).profile });
        }).catch(reason => live && setError(reason instanceof Error ? reason.message : 'Could not load editor history. Verify the versions and publication-pin migrations.'));
        return () => { live = false; };
        // The transport may be a new object each render; the address owns the load lifecycle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, userId, canAuthor]);
    const run = async (action: () => Promise<void>) => {
        setBusy(true);
        try { await action(); }
        catch (reason) {
            if ((reason as { status?: number })?.status === 409) setConflict(true);
            else notify.error(reason instanceof Error ? reason.message : 'Editor action failed');
        } finally { setBusy(false); }
    };
    const save = () => run(async () => {
        if (!id || !local.session || !transport.saveDraft) return;
        if (local.session.source) throw new Error('Apply or discard Source Mode before saving.');
        const sent = local.session.body;
        const sentSettings = local.session.pageSettings;
        const state = sentSettings ? await transport.saveDraft(id, sent as unknown as Record<string, unknown>, local.session.identity.base, undefined, sentSettings) : await transport.saveDraft(id, sent as unknown as Record<string, unknown>, local.session.identity.base);
        if (!state.headVersion) throw new Error('Save returned no version.');
        local.saved(state.headVersion, sent, sentSettings);
        setLoaded(previous => previous && { ...previous, state });
        notify.success('Draft saved');
    });
    const resolveConflict = (ours: boolean) => run(async () => {
        if (local.session?.source) throw new Error('Apply or discard Source Mode before resolving the conflict.');
        if (!id || !transport.listVersions || !transport.saveDraft || !local.session) return;
        const current = await transport.listVersions(id);
        if (!current.headVersion) throw new Error('No current server version.');
        if (ours) {
            const sent = local.session.body;
            const sentSettings = local.session.pageSettings;
            const state = await transport.saveDraft(id, sent as unknown as Record<string, unknown>, current.headVersion, undefined, sentSettings);
            if (!state.headVersion) throw new Error('Save returned no version.');
            local.saved(state.headVersion, sent, sentSettings); setLoaded(previous => previous && { ...previous, state });
        } else {
            const envelope = await transport.loadBody(id) as { body?: unknown; pageSettings?: SessionPageSettings; styleRegistry?: import('../blockdoc/style-runtime.js').StyleRegistry; profile?: import('@schemastud/blockdoc').BlockdocManifest };
            if (!Array.isArray(envelope.body)) throw new Error('No current body.');
            local.reset(current.headVersion, envelope.body, envelope.pageSettings);
            setLoaded({ body: envelope.body as JsonDoc, state: current, pageSettings: envelope.pageSettings, profile: envelope.profile, styleRegistry: envelope.styleRegistry });
        }
        setConflict(false);
    });
    if (error || local.error) return <div role="alert">{error ?? local.error}</div>;
    if (local.pending) return <div role="alertdialog" aria-label="Unsaved session base moved">
        <p>The server base changed from {local.pending.identity.base}.</p>
        <button onClick={() => void local.recover(true)}>Restore unsaved changes</button>
        <button onClick={() => void local.recover(false)}>Discard</button>
    </div>;
    if (!loaded || !local.session) return <div role="status">Loading Local Session…</div>;
    const publish = () => run(async () => {
        if (!id || !transport.publish || !local.session) return;
        if (local.session.source) throw new Error('Apply or discard Source Mode before publishing.');
        let ref = local.session.identity.base;
        if (isUnauthored(loaded.state)) {
            if (!transport.saveDraft) return;
            const sent = local.session.body;
            const settings = local.session.pageSettings;
            const draft = await transport.saveDraft(id, sent as unknown as Record<string, unknown>, null, undefined, settings);
            if (!draft.headVersion) throw new Error('Save returned no version.');
            ref = draft.headVersion;
            local.saved(ref, sent, settings);
            setLoaded(previous => previous && { ...previous, state: draft });
        } else if (local.session.dirty) throw new Error('Save your draft before publishing it.');
        if (!ref) throw new Error('Publish requires a saved version.');
        const state = await transport.publish(id, ref);
        setLoaded(previous => previous && { ...previous, state });
        if (state.compileError) notify.error(state.compileError);
        else notify.success(state.release && state.release.status !== 'published' ? 'Release submitted for review' : 'Published');
    });
    const restore = (ref: string) => run(async () => {
        if (local.session!.dirty) throw new Error('Save or discard unsaved changes before restoring History.');
        if (!id || !transport.restoreVersion) return;
        const state = await transport.restoreVersion(id, ref);
        const envelope = await transport.loadBody(id) as { body?: unknown; pageSettings?: SessionPageSettings; styleRegistry?: import('../blockdoc/style-runtime.js').StyleRegistry; profile?: import('@schemastud/blockdoc').BlockdocManifest };
        if (!state.headVersion || !Array.isArray(envelope.body)) throw new Error('Could not load the restored draft.');
        local.reset(state.headVersion, envelope.body, envelope.pageSettings);
        setLoaded({ body: envelope.body as JsonDoc, state, profile: envelope.profile, styleRegistry: envelope.styleRegistry });
        notify.success('Restored into a draft');
    });
    return <CanvasProvider config={{ ...canvasConfig, profile: loaded.profile, styleRegistry: loaded.styleRegistry }}>
        {conflict && <div role="alertdialog" aria-label="Save conflict">
            <p>The server draft changed.</p>
            <button disabled={busy} onClick={() => void resolveConflict(false)}>Reload theirs</button>
            <button disabled={busy} onClick={() => void resolveConflict(true)}>Save ours as a new version</button>
        </div>}
        <div aria-label="Publication controls">
            <button disabled={busy || (local.session.dirty && !isUnauthored(loaded.state))} onClick={() => void publish()}>Publish</button>
            <button onClick={() => setHistory(!history)}>History</button>
            <span>{local.session.dirty ? 'Unsaved changes' : 'Draft saved'}</span>
        </div>
        {loaded.state.release && transport.releaseCommand && <ReleasePanel release={loaded.state.release}
            entries={[{id:id!,title:entryRef.slug ?? 'This entry',versions:loaded.state.versions.map(version => ({id:version.id,label:version.readable ?? version.id}))}]}
            onCommand={async command => {
                const release = await transport.releaseCommand!(loaded.state.release!.id, command);
                const state = await transport.listVersions!(id!);
                setLoaded(previous => previous && {...previous,state:{...state,release}});
            }} />}
        {id && loaded.state.headVersion && loaded.state.versions.length > 0 && transport.listReleases && transport.createRelease && transport.releaseCommand && (
            <BuiltReleaseAssembly
                entryId={id}
                entryTitle={entryRef.slug ?? 'This entry'}
                versions={loaded.state.versions.map(version => ({id:version.id,label:version.readable ?? version.id}))}
                listReleases={() => transport.listReleases!()}
                createRelease={(entryId, title) => transport.createRelease!(entryId, title)}
                releaseCommand={(releaseId, command) => transport.releaseCommand!(releaseId, command)}
            />
        )}
        {history && <aside aria-label="History">{loaded.state.versions.map(version => <div key={version.id}>
            <span>{version.readable} {version.label}</span>
            <VersionRecordingReferences recordings={version.recordings} />
            <button disabled={busy || local.session!.dirty} onClick={() => void restore(version.id)}>Restore {version.readable} into draft</button>
        </div>)}</aside>}
        {!local.session.source && local.session.pageSettings && <PageSettings value={local.session.pageSettings} onChange={settings => local.change(local.session!.body, settings)} />}
        <SourceMode local={local} allowed={(!loaded.profile || !('x-admits-code' in loaded.profile) || loaded.profile['x-admits-code'] !== false) && (!entryRef.format || entryRef.format === 'tsx')}
            conversion={id && transport.printSource && transport.readSource ? {print:body=>transport.printSource!(id,body),read:(source,body)=>transport.readSource!(id,source,body)} : undefined}>
        <VisualEditor value={local.session.body as JsonDoc} onChange={local.change}
            onSave={save} onUndo={local.undo} onRedo={local.redo}
            canUndo={local.session.canUndo} canRedo={local.session.canRedo}
            theme={theme} brand="Entry editor" />
        </SourceMode>
    </CanvasProvider>;
}
export default VisualEditorMount;
