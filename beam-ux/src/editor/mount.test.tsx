// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { JsonDoc } from '@splicewire/beam-ux/jsondoc';

const loadBody = vi.hoisted(() => vi.fn());
const saveBody = vi.hoisted(() => vi.fn());
const saveDraft = vi.hoisted(() => vi.fn());
const publishVersion = vi.hoisted(() => vi.fn());
const listVersions = vi.hoisted(() => vi.fn());
const provided = vi.hoisted(() => ({ profile: undefined as unknown }));
vi.mock('./local-session', async importOriginal => {
    const original = await importOriginal<typeof import('./local-session')>();
    return { ...original, IndexedDbSessions: class {
        async forEntry() { return []; }
        async write() {}
        close() {}
    } };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('./context', () => ({useEditorKit: () => ({userId:"author", transport:{loadBody,saveBody,saveDraft,listVersions,publish:publishVersion,restoreVersion:vi.fn()}, theme:{}, canAuthor:true, canvasConfig:{registry:{}}, defaultTreeFor:()=>[{kind:'text',value:'SEED'}], notify:{success:vi.fn(),error:vi.fn()}})}));
// Observe the adapter's public controlled-value and save seam; the canvas has its own owning tests.
vi.mock('../canvas', () => ({
    CanvasProvider: ({ children, config }: { children: ReactNode; config: { profile?: unknown } }) => { provided.profile = config.profile; return <>{children}</>; },
    VisualEditor: ({ value, onSave, onUndo }: { value: JsonDoc; onSave: () => void; onUndo: () => void }) => (
        <div data-testid="canvas">
            {JSON.stringify(value)}
            <button onClick={onSave}>Save</button>
            <button onClick={onUndo}>Undo</button>
        </div>
    ),
}));
import { VisualEditorMount } from './mount';

const SAVED = [{ kind: 'text', value: 'Persisted A' }];
const ref = (id: string | null) => ({ id, slug: 'home', format: 'tsx' });
it('passes the server entry profile to the window canvas', async () => {
    const profile = { profile: 'tenant', version: 1, nodes: [], 'x-admits-code': false };
    loadBody.mockResolvedValue({ body: SAVED, profile });
    render(<VisualEditorMount entryRef={ref('entry-profile')} />);
    await waitFor(() => expect(provided.profile).toBe(profile));
});
beforeEach(() => {
    const state = { headVersion:'v1', publishedVersion:'v1', draftPending:false, versions:[] };
    listVersions.mockResolvedValue(state);
    saveDraft.mockResolvedValue(state);
});
afterEach(() => {
    cleanup();
    loadBody.mockReset();
    saveBody.mockReset();
    saveDraft.mockReset();
    listVersions.mockReset();
    publishVersion.mockReset();
});

it('withholds replacement writes after a refused window read', async () => {
    loadBody.mockRejectedValue(new Error('Forbidden'));
    render(<VisualEditorMount entryRef={ref('a')} />);

    await waitFor(() => expect(screen.queryByText('Loading Local Session…')).toBeNull());
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('Forbidden');
    expect(saveBody).not.toHaveBeenCalled();
});

it.each(['ready', 'refused'])(
    'withholds settled A while reading replacement B, then handles B as %s',
    async (outcome) => {
        let resolve: (value: unknown) => void = () => {};
        let reject: (reason: Error) => void = () => {};
        loadBody.mockResolvedValueOnce({ body: SAVED }).mockReturnValueOnce(
            new Promise((yes, no) => {
                resolve = yes;
                reject = no;
            }),
        );
        const view = render(<VisualEditorMount entryRef={ref('a')} />);
        await screen.findByRole('button', { name: 'Save' });

        view.rerender(<VisualEditorMount entryRef={ref('b')} />);

        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
        expect(screen.getByText('Loading Local Session…')).toBeTruthy();
        await act(async () => {
            if (outcome === 'refused') reject(new Error('Forbidden'));
            else resolve({ body: [{ kind: 'text', value: 'Persisted B' }] });
        });
        if (outcome === 'refused') {
            expect(screen.queryByTestId('canvas')).toBeNull();
            expect(screen.getByRole('alert')).toBeTruthy();
            expect(saveBody).not.toHaveBeenCalled();
        } else {
            fireEvent.click(screen.getByRole('button', { name: 'Save' }));
            await waitFor(() => expect(saveDraft).toHaveBeenCalledWith('b', [{ kind: 'text', value: 'Persisted B' }], 'v1'));
            expect(saveBody).not.toHaveBeenCalled();
        }
    },
);

it('preserves a pinned empty draft without replacing it with a seed', async () => {
    loadBody.mockResolvedValue({ body: [] });
    render(<VisualEditorMount entryRef={ref('a')} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveDraft).toHaveBeenCalledWith('a', [], 'v1'));
    expect(saveBody).not.toHaveBeenCalled();
});

it('saves page settings and body as one draft and undoes both through the session', async () => {
    loadBody.mockResolvedValue({ body: SAVED, pageSettings: { title: 'Published title', segment: 'home' } });
    render(<VisualEditorMount entryRef={ref('settings-page')} />);
    const title = await screen.findByLabelText('Title');
    fireEvent.change(title, { target: { value: 'Draft title' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(saveDraft).toHaveBeenCalledWith('settings-page', SAVED, 'v1', undefined, { title: 'Draft title', segment: 'home' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Published title');
});

it('mounts an unauthored existing row without writing, then first-saves with a null base', async () => {
    listVersions.mockResolvedValue({headVersion:null,publishedVersion:null,versions:[],draftPending:false});
    loadBody.mockResolvedValue({body:SAVED});
    render(<VisualEditorMount entryRef={ref('unauthored')} />);
    await screen.findByRole('button',{name:'Save'});
    expect(saveDraft).not.toHaveBeenCalled();
    expect(publishVersion).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Save'}));
    await waitFor(()=>expect(saveDraft).toHaveBeenCalledWith('unauthored',SAVED,null));
});
it('first Publish saves a null-base draft then publishes its returned ref', async () => {
    listVersions.mockResolvedValue({headVersion:null,publishedVersion:null,versions:[],draftPending:false});
    loadBody.mockResolvedValue({body:SAVED});
    publishVersion.mockResolvedValue({headVersion:'v1',publishedVersion:'v1',versions:[],draftPending:false});
    render(<VisualEditorMount entryRef={ref('publish-first')} />);
    fireEvent.click(await screen.findByRole('button',{name:'Publish'}));
    await waitFor(()=>expect(saveDraft).toHaveBeenCalledWith('publish-first',SAVED,null,undefined,null));
    await waitFor(()=>expect(publishVersion).toHaveBeenCalledWith('publish-first','v1'));
});
it('refuses a missing pin when history exists even if head is missing', async () => {
    listVersions.mockResolvedValue({headVersion:null,publishedVersion:null,versions:[{id:'old'}],draftPending:false});
    loadBody.mockResolvedValue({body:SAVED});
    render(<VisualEditorMount entryRef={ref('damaged')} />);
    expect((await screen.findByRole('alert')).textContent).toContain('Publication Pin');
    expect(screen.queryByRole('button',{name:'Save'})).toBeNull();
});
