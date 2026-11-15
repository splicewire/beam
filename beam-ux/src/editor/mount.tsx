import {useComponentAuthoring} from './use-component-authoring';
import {useBindingPreviewPort} from './use-binding-preview-port';
import { componentDependencies } from './component-dependencies';
import { canMountPublication, isUnauthored, isAuthoredComponentEnvelope } from './publication-state';
import { PageSettings, type PageFieldsOffer, type RedirectToPage } from './PageSettings';
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
import { useBeamUxMessages } from '../messages.js';
import { NoticeError, notice as line, noticeOf, say, type Notice } from '../message-descriptor.js';

/** The File Languages Source Mode prints and reads (beam JS ADR-0006 d4); the server's lens refuses the rest. */
const SOURCE_LANGUAGES: readonly string[] = ['tsx', 'mdx'];

type EntryRef = { id: string | null; slug: string | null; format?: string | null; bodyKind?: string | null };
export function VisualEditorMount({ entryRef }: { entryRef: EntryRef }) {
    const { userId, canAuthor } = useEditorKit();
    // An address or actor change retires the previous editor before the new read starts.
    // Its loaded document, pending session and write callbacks must never cross that boundary.
    return <AddressedVisualEditor key={JSON.stringify([entryRef.id, userId, canAuthor])} entryRef={entryRef} />;
}
/** What the editor keeps of a body envelope. */
interface LoadedEnvelope {
    authoredComponents?: import("@splicewire/beam-resources/types/beam-ux").ComponentCanvasData[];
    bindings?: import("../bindings/runtime.js").BindingPayload;
    body: JsonDoc;
    pageSettings?: SessionPageSettings;
    pageFields: PageFieldsOffer | null;
    fileLanguages: string[];
    redirects: RedirectToPage[] | null;
    mediaLibrary?: boolean;
    styleRegistry?: import('../blockdoc/style-runtime.js').StyleRegistry;
    profile?: import('@schemastud/blockdoc').BlockdocManifest;
}

/**
 * One reading of the body envelope for every load: the first mount, a conflict's Reload theirs and a History restore,
 * so none of them drops what the others keep (the page settings, the Page Fields offer, the profile, the styles).
 */
function readEnvelope(envelope: unknown, missing: Notice): LoadedEnvelope {
    const read = (envelope ?? {}) as Partial<LoadedEnvelope> & { body?: unknown };
    if (!Array.isArray(read.body)) throw new NoticeError(missing);
    return { mediaLibrary: read.mediaLibrary===true, authoredComponents: read.authoredComponents, bindings: read.bindings, body: read.body as JsonDoc, pageSettings: read.pageSettings, pageFields: read.pageFields ?? null, fileLanguages: read.fileLanguages ?? [], redirects: read.redirects ?? null, styleRegistry: read.styleRegistry, profile: read.profile };
}

function AddressedVisualEditor({ entryRef }: { entryRef: EntryRef }) {
    const { transport, theme, canvasConfig, userId, canAuthor, notify, brand } = useEditorKit();
    const [loaded, setLoaded] = useState<(LoadedEnvelope & { state: EntryPublicationState }) | null>(null);
    const m = useBeamUxMessages();
    const [error, setError] = useState<Notice | null>(null);
    const [conflict, setConflict] = useState(false);
    const [busy, setBusy] = useState(false);
    const [history, setHistory] = useState(false);
    const id = entryRef.id;
    const componentAuthoring=useComponentAuthoring(id,true,async()=>{
        if(!id)return;
        const fresh=readEnvelope(await transport.loadBody(id), line('splicewire-beam-ux::messages.mount_body_unavailable'));
        setLoaded(previous=>previous?{...previous,profile:fresh.profile,authoredComponents:fresh.authoredComponents}:previous);
    });
    const local = useLocalSession(id ?? '', userId, loaded?.state.headVersion, loaded?.body ?? [], !!loaded && !!id, loaded?.pageSettings ?? null);
    useEffect(() => {
        if (!id || !userId || !canAuthor || !transport.listVersions || !transport.saveDraft || !transport.publish || !transport.restoreVersion) {
            setError(line('splicewire-beam-ux::messages.mount_requires_transport')); return;
        }
        let live = true;
        Promise.all([transport.loadBody(id), transport.listVersions(id)]).then(([envelope, state]) => {
            if (!live) return;
            if (!canMountPublication(state,isAuthoredComponentEnvelope(envelope))) throw new NoticeError(line('splicewire-beam-ux::messages.mount_no_publication_pin'));
            setLoaded({ ...readEnvelope(envelope, line('splicewire-beam-ux::messages.mount_no_editable_document')), state });
        }).catch(reason => live && setError(noticeOf(reason, line('splicewire-beam-ux::messages.mount_history_load_failed'))));
        return () => { live = false; };
        // The transport may be a new object each render; the address owns the load lifecycle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, userId, canAuthor]);
    const bindingPreview = useBindingPreviewPort(transport,id,userId,canAuthor,loaded?.pageSettings?.recordPage?.collection);
    const mediaLibrary = loaded?.mediaLibrary && id && transport.listImages && transport.uploadImage ? {
        list: () => transport.listImages!(id), upload: (file:File) => transport.uploadImage!(id,file),
    } : undefined;
    const run = async (action: () => Promise<void>) => {
        setBusy(true);
        try { await action(); }
        catch (reason) {
            if ((reason as { status?: number })?.status === 409) setConflict(true);
            else notify.error(say(m, noticeOf(reason, line('splicewire-beam-ux::messages.mount_action_failed'))));
        } finally { setBusy(false); }
    };
    const save = () => run(async () => {
        if (!id || !local.session || !transport.saveDraft) return;
        if (local.session.source) throw new NoticeError(line('splicewire-beam-ux::messages.mount_source_before_save'));
        const sent = local.session.body;
        const sentSettings = local.session.pageSettings;
        const state = sentSettings ? await transport.saveDraft(id, sent as unknown as Record<string, unknown>, local.session.identity.base, undefined, sentSettings) : await transport.saveDraft(id, sent as unknown as Record<string, unknown>, local.session.identity.base);
        if (!state.headVersion) throw new NoticeError(line('splicewire-beam-ux::messages.mount_save_returned_no_version'));
        local.saved(state.headVersion, sent, sentSettings);
        setLoaded(previous => previous && { ...previous, state });
        notify.success(m.t('splicewire-beam-ux::messages.mount_draft_saved'));
    });
    const resolveConflict = (ours: boolean) => run(async () => {
        if (local.session?.source) throw new NoticeError(line('splicewire-beam-ux::messages.mount_source_before_conflict'));
        if (!id || !transport.listVersions || !transport.saveDraft || !local.session) return;
        const current = await transport.listVersions(id);
        if (!current.headVersion) throw new NoticeError(line('splicewire-beam-ux::messages.mount_no_current_version'));
        if (ours) {
            const sent = local.session.body;
            const sentSettings = local.session.pageSettings;
            const state = await transport.saveDraft(id, sent as unknown as Record<string, unknown>, current.headVersion, undefined, sentSettings);
            if (!state.headVersion) throw new NoticeError(line('splicewire-beam-ux::messages.mount_save_returned_no_version'));
            local.saved(state.headVersion, sent, sentSettings); setLoaded(previous => previous && { ...previous, state });
        } else {
            const envelope = readEnvelope(await transport.loadBody(id), line('splicewire-beam-ux::messages.mount_no_current_body'));
            local.reset(current.headVersion, envelope.body, envelope.pageSettings);
            setLoaded({ ...envelope, state: current });
        }
        setConflict(false);
    });
    if (error || local.error) return <div role="alert">{say(m, (error ?? local.error)!)}</div>;
    if (local.pending) return <div role="alertdialog" aria-label={m.t('splicewire-beam-ux::messages.mount_session_base_moved')}>
        <p>{m.t('splicewire-beam-ux::messages.mount_base_changed', { base: local.pending.identity.base })}</p>
        <button onClick={() => void local.recover(true)}>{m.t('splicewire-beam-ux::messages.mount_restore_unsaved')}</button>
        <button onClick={() => void local.recover(false)}>{m.t('splicewire-beam-ux::messages.mount_discard')}</button>
    </div>;
    if (!loaded || !local.session) return <div role="status">{m.t('splicewire-beam-ux::messages.mount_loading_session')}</div>;
    const publish = () => run(async () => {
        if (!id || !transport.publish || !local.session) return;
        if (local.session.source) throw new NoticeError(line('splicewire-beam-ux::messages.mount_source_before_publish'));
        let ref = local.session.identity.base;
        if (isUnauthored(loaded.state)) {
            if (!transport.saveDraft) return;
            const sent = local.session.body;
            const settings = local.session.pageSettings;
            const draft = await transport.saveDraft(id, sent as unknown as Record<string, unknown>, null, undefined, settings);
            if (!draft.headVersion) throw new NoticeError(line('splicewire-beam-ux::messages.mount_save_returned_no_version'));
            ref = draft.headVersion;
            local.saved(ref, sent, settings);
            setLoaded(previous => previous && { ...previous, state: draft });
        } else if (local.session.dirty) throw new NoticeError(line('splicewire-beam-ux::messages.mount_save_before_publish'));
        if (!ref) throw new NoticeError(line('splicewire-beam-ux::messages.mount_requires_saved_version'));
        const state = await transport.publish(id, ref);
        setLoaded(previous => previous && { ...previous, state });
        if (state.compileError) notify.error(state.compileError);
        else notify.success(state.release && state.release.status !== 'published' ? m.t('splicewire-beam-ux::messages.mount_release_submitted') : m.t('splicewire-beam-ux::messages.mount_published'));
    });
    const restore = (ref: string) => run(async () => {
        if (local.session!.dirty) throw new NoticeError(line('splicewire-beam-ux::messages.mount_save_before_restore'));
        if (!id || !transport.restoreVersion) return;
        const state = await transport.restoreVersion(id, ref);
        const envelope = readEnvelope(await transport.loadBody(id), line('splicewire-beam-ux::messages.mount_restored_load_failed'));
        if (!state.headVersion) throw new NoticeError(line('splicewire-beam-ux::messages.mount_restored_load_failed'));
        local.reset(state.headVersion, envelope.body, envelope.pageSettings);
        setLoaded({ ...envelope, state });
        notify.success(m.t('splicewire-beam-ux::messages.mount_restored'));
    });
    const openPreview = async (versionId: string) => {
        if (!id || !transport.previewVersion) return;
        const popup = window.open('about:blank', '_blank');
        if (!popup) {
            notify.error(m.t('splicewire-beam-ux::messages.mount_allow_popups'));
            return;
        }
        popup.opener = null;
        try {
            const preview = await transport.previewVersion(id, versionId);
            const target = new URL(preview.url, window.location.href);
            if (target.origin !== window.location.origin) {
                throw new NoticeError(line('splicewire-beam-ux::messages.mount_preview_same_host'));
            }
            popup.location.href = target.href;
        } catch (reason) {
            popup.close();
            notify.error(say(m, noticeOf(reason, line('splicewire-beam-ux::messages.mount_preview_failed'))));
        }
    };
    const dependencies = componentDependencies(local.session.body as JsonDoc, loaded.authoredComponents ?? []);
    const pendingComponents = dependencies.filter(entry => entry.headVersion && entry.headVersion !== entry.publishedVersion);
    const componentChoices = pendingComponents.map(entry => ({id: entry.id, title: entry.definition.name ?? m.t('splicewire-beam-ux::messages.mount_component'),
        versions: [{id: entry.headVersion!, label: m.t('splicewire-beam-ux::messages.mount_pending_component_draft')}]}));
    return <CanvasProvider config={{ ...canvasConfig, mediaLibrary, profile: loaded.profile, styleRegistry: loaded.styleRegistry,
        bindingPreview, bindings: loaded.bindings, authoredComponents: loaded.authoredComponents,
        componentAuthoring }}>
        {conflict && <div role="alertdialog" aria-label={m.t('splicewire-beam-ux::messages.mount_save_conflict')}>
            <p>{m.t('splicewire-beam-ux::messages.mount_save_conflict_prompt')}</p>
            <button disabled={busy} onClick={() => void resolveConflict(false)}>{m.t('splicewire-beam-ux::messages.mount_reload_theirs')}</button>
            <button disabled={busy} onClick={() => void resolveConflict(true)}>{m.t('splicewire-beam-ux::messages.mount_save_ours')}</button>
        </div>}
        {!!loaded.state.diagnostics?.length && <aside role="status" aria-label={m.t('splicewire-beam-ux::messages.mount_diagnostics')}><ul>
            {loaded.state.diagnostics.map(message => <li key={message}>{message}</li>)}
        </ul></aside>}
        {pendingComponents.length > 0 && <aside aria-label={m.t('splicewire-beam-ux::messages.mount_component_drafts')}>
            <p>{m.t('splicewire-beam-ux::messages.mount_component_drafts_prompt', { names: pendingComponents.map(entry => entry.definition.name).join(', ') })}</p>
        </aside>}
        <div aria-label={m.t('splicewire-beam-ux::messages.mount_publication_controls')}>
            <button disabled={busy || (local.session.dirty && !isUnauthored(loaded.state))} onClick={() => void publish()}>{m.t('splicewire-beam-ux::messages.mount_publish')}</button>
            <button onClick={() => setHistory(!history)}>{m.t('splicewire-beam-ux::messages.mount_history')}</button>
            <span>{local.session.dirty ? m.t('splicewire-beam-ux::messages.mount_unsaved_changes') : m.t('splicewire-beam-ux::messages.mount_draft_saved')}</span>
        </div>
        {loaded.state.release && transport.releaseCommand && <ReleasePanel release={loaded.state.release}
            entries={[{id:id!,title:entryRef.slug ?? m.t('splicewire-beam-ux::messages.mount_this_entry'),versions:loaded.state.versions.map(version => ({id:version.id,label:version.readable ?? version.id}))}]}
            onCommand={async command => {
                const release = await transport.releaseCommand!(loaded.state.release!.id, command);
                const state = await transport.listVersions!(id!);
                setLoaded(previous => previous && {...previous,state:{...state,release}});
            }}
            onRemoveRedirect={transport.removeRedirect && (redirectId => transport.removeRedirect!(redirectId))} />}
        {id && loaded.state.headVersion && loaded.state.versions.length > 0 && transport.listReleases && transport.createRelease && transport.releaseCommand && (
            <BuiltReleaseAssembly
                entryId={id}
                entryTitle={entryRef.slug ?? m.t('splicewire-beam-ux::messages.mount_this_entry')}
                versions={loaded.state.versions.map(version => ({id:version.id,label:version.readable ?? version.id}))}
                canTakeDown={loaded.state.publishedVersion !== null}
                relatedEntries={componentChoices}
                listReleases={() => transport.listReleases!()}
                createRelease={(entryId, title) => transport.createRelease!(entryId, title)}
                releaseCommand={(releaseId, command) => transport.releaseCommand!(releaseId, command)}
                removeRedirect={transport.removeRedirect && (redirectId => transport.removeRedirect!(redirectId))}
            />
        )}
        {history && <aside aria-label={m.t('splicewire-beam-ux::messages.mount_history')}>{loaded.state.versions.map(version => <div key={version.id}>
            <span>{version.readable} {version.label}</span>
            <VersionRecordingReferences recordings={version.recordings} />
            {transport.previewVersion && (
                <button disabled={busy} onClick={() => void openPreview(version.id)}>{m.t('splicewire-beam-ux::messages.mount_open')}</button>
            )}
            <button disabled={busy || local.session!.dirty} onClick={() => void restore(version.id)}>{m.t('splicewire-beam-ux::messages.mount_restore_version', { version: version.readable })}</button>
        </div>)}</aside>}
        {!local.session.source && local.session.pageSettings && <PageSettings value={local.session.pageSettings} pageFields={loaded.pageFields} fileLanguages={loaded.fileLanguages} redirects={loaded.redirects} mediaLibrary={mediaLibrary} onChange={settings => local.change(local.session!.body, settings)} />}
        <SourceMode local={local} allowed={(!loaded.profile || !('x-admits-code' in loaded.profile) || loaded.profile['x-admits-code'] !== false) && (!entryRef.format || SOURCE_LANGUAGES.includes(entryRef.format))}
            language={entryRef.format ?? 'tsx'}
            conversion={id && transport.printSource && transport.readSource ? {print:body=>transport.printSource!(id,body),read:(source,body)=>transport.readSource!(id,source,body)} : undefined}>
        <VisualEditor value={local.session.body as JsonDoc} onChange={local.change}
            onSave={save} onUndo={local.undo} onRedo={local.redo}
            canUndo={local.session.canUndo} canRedo={local.session.canRedo}
            theme={theme} brand={brand ? m.t('splicewire-beam-ux::messages.mount_brand_editor', { brand }) : m.t('splicewire-beam-ux::messages.mount_entry_editor')}
            nodeAction={id && transport.refineNode ? { slug: entryRef.slug ?? id, refine: (_slug, request) => transport.refineNode!(id, request) } : undefined} />
        </SourceMode>
    </CanvasProvider>;
}
export default VisualEditorMount;
