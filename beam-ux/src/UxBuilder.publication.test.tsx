import type { ComponentProps } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UxBuilder } from './UxBuilder';
import { UxBuilderProvider } from './provider';
import type { BeamUxEntryBodyData, EntryPublicationState, UxBuilderClient } from './types';

const publication: EntryPublicationState = {
    id: 'entry-1',
    headVersion: 'v1',
    publishedVersion: 'v1',
    headReadable: 'v1',
    publishedReadable: 'v1',
    draftPending: false,
    versions: [],
    compileError: null,
};

function mount(client: UxBuilderClient, notify = vi.fn(), options: Partial<ComponentProps<typeof UxBuilder>> = {}) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <UxBuilderProvider services={{ client, notify }}>
                <UxBuilder
                    regions={[{
                        id: 'body',
                        label: 'Body',
                        kind: 'richtext',
                        recordId: 'entry-1',
                        note: 'page · site',
                    }]}
                    pageTree={{ id: 'page', label: 'Page', kind: 'page', children: [] }}
                    palette={[]}
                    {...options}
                />
            </UxBuilderProvider>
        </QueryClientProvider>,
    );
    return { notify };
}

function client(overrides: Partial<UxBuilderClient> = {}): UxBuilderClient {
    return {
        loadBody: vi.fn(async () => ({
            id: 'entry-1',
            body: { content: '# Original' },
            schema: null,
        } as unknown as BeamUxEntryBodyData)),
        saveBody: vi.fn(async (_id, body) => ({ id: 'entry-1', body } as unknown as BeamUxEntryBodyData)),
        ...overrides,
    };
}

describe('UX builder publication-aware save', () => {
    it('saves through the draft capability and labels the action for tenant authoring', async () => {
        const saveBody = vi.fn();
        const saveDraft = vi.fn(async () => ({ ...publication, headVersion: 'v2', draftPending: true }));
        const notify = vi.fn();
        mount(client({
            saveBody,
            listVersions: vi.fn(async () => publication),
            saveDraft,
            publish: vi.fn(async () => publication),
            restoreVersion: vi.fn(async () => publication),
        }), notify);

        const source = await screen.findByLabelText('MDX source');
        fireEvent.change(source, { target: { value: '# Tenant draft' } });

        await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
        await waitFor(() => expect(saveDraft).toHaveBeenCalledWith(
            'entry-1',
            { content: '# Tenant draft' },
            'v1',
            'UX builder draft',
        ));
        expect(saveBody).not.toHaveBeenCalled();
        expect(notify).toHaveBeenCalledWith({ type: 'success', message: 'Draft saved.' });
    });

    it('keeps the central Save action on the immediate save-body path', async () => {
        const saveBody = vi.fn(async (_id, body) => ({ id: 'entry-1', body } as unknown as BeamUxEntryBodyData));
        const saveDraft = vi.fn();
        const notify = vi.fn();
        mount(client({ saveBody, saveDraft, listVersions: undefined }), notify);

        const source = await screen.findByLabelText('MDX source');
        fireEvent.change(source, { target: { value: '# Central save' } });

        expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(saveBody).toHaveBeenCalledWith('entry-1', { content: '# Central save' }));
        expect(saveDraft).not.toHaveBeenCalled();
        expect(notify).toHaveBeenCalledWith({ type: 'success', message: 'Saved.' });
    });
});


describe('the complete region publication journey', () => {
    function publicationClient(overrides: Partial<UxBuilderClient> = {}) {
        return client({
            listVersions: vi.fn(async () => publication),
            saveDraft: vi.fn(async () => ({ ...publication, headVersion: 'saved-v2', draftPending: true })),
            publish: vi.fn(async () => ({ ...publication, headVersion: 'saved-v2', publishedVersion: 'saved-v2' })),
            restoreVersion: vi.fn(async () => publication),
            ...overrides,
        });
    }

    it('saves the dirty region before publishing its exact returned version', async () => {
        const api = publicationClient();
        mount(api);
        fireEvent.change(await screen.findByLabelText('MDX source'), { target: { value: '# Publish this edit' } });
        await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
        await waitFor(() => expect(api.publish).toHaveBeenCalledWith('entry-1', 'saved-v2'));
        expect(api.saveDraft).toHaveBeenCalledWith('entry-1', { content: '# Publish this edit' }, 'v1', 'UX builder draft');
        expect(vi.mocked(api.saveDraft!).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(api.publish!).mock.invocationCallOrder[0]);
    });

    it('retains the loaded edit base even if another author moves the server head', async () => {
        let state = publication;
        const saveDraft = vi.fn(async () => { throw { status: 409 }; });
        const api = publicationClient({ listVersions: vi.fn(async () => state), saveDraft });
        mount(api);
        const source = await screen.findByLabelText('MDX source');
        fireEvent.change(source, { target: { value: '# Keep my unsaved work' } });
        state = { ...publication, headVersion: 'someone-elses-v2' };
        await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
        await waitFor(() => expect(saveDraft).toHaveBeenCalledWith('entry-1', { content: '# Keep my unsaved work' }, 'v1', 'UX builder draft'));
        expect(api.publish).not.toHaveBeenCalled();
        expect((screen.getByLabelText('MDX source') as HTMLTextAreaElement).value).toBe('# Keep my unsaved work');
        expect((await screen.findByRole('alert')).textContent).toMatch(/changed|conflict/i);
    });

    it('publishes the clean saved head without minting another draft', async () => {
        const api = publicationClient();
        mount(api);
        await screen.findByLabelText('MDX source');
        await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
        await waitFor(() => expect(api.publish).toHaveBeenCalledWith('entry-1', 'v1'));
        expect(api.saveDraft).not.toHaveBeenCalled();
    });

    it('reloads restored history and uses its new draft base for the next save', async () => {
        const old = { id: 'old-id', readable: 'v0', isPublished: false, isHead: false };
        let state = { ...publication, versions: [old] } as EntryPublicationState;
        let content = '# Original';
        const restoreVersion = vi.fn(async () => {
            state = { ...state, headVersion: 'restored-v3', headReadable: 'v3', draftPending: true };
            content = '# Restored original';
            return state;
        });
        const api = publicationClient({
            listVersions: vi.fn(async () => state),
            loadBody: vi.fn(async () => ({ id: 'entry-1', body: { content }, schema: null } as unknown as BeamUxEntryBodyData)),
            restoreVersion,
        });
        mount(api);
        await screen.findByLabelText('MDX source');
        await userEvent.click(screen.getByRole('button', { name: 'History' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Restore v0 into draft' }));
        await waitFor(() => expect((screen.getByLabelText('MDX source') as HTMLTextAreaElement).value).toBe('# Restored original'));
        expect(api.publish).not.toHaveBeenCalled();
        fireEvent.change(screen.getByLabelText('MDX source'), { target: { value: '# Edit restored draft' } });
        await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
        await waitFor(() => expect(api.saveDraft).toHaveBeenCalledWith('entry-1', { content: '# Edit restored draft' }, 'restored-v3', 'UX builder draft'));
    });

    it.each([403, 409])('retains pending edits after a %s refusal and never publishes', async (status) => {
        const api = publicationClient({ saveDraft: vi.fn(async () => { throw { response: { status } }; }) });
        mount(api);
        fireEvent.change(await screen.findByLabelText('MDX source'), { target: { value: '# Retained edit' } });
        await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
        expect(await screen.findByRole('alert')).toBeTruthy();
        expect((screen.getByLabelText('MDX source') as HTMLTextAreaElement).value).toBe('# Retained edit');
        expect(api.publish).not.toHaveBeenCalled();
    });

    it.each(['in_review', 'scheduled'])('reports the actual %s Release state without claiming publication', async (status) => {
        const notify = vi.fn();
        const release = { id: 'release-1', title: 'Review', status } as import('./releases').ReleaseRecord;
        const api = publicationClient({ publish: vi.fn(async () => ({ ...publication, release })) });
        mount(api, notify);
        await screen.findByLabelText('MDX source');
        await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
        expect((await screen.findByRole('status')).textContent).toContain(`Release ${status}`);
        expect(notify).not.toHaveBeenCalledWith({ type: 'success', message: 'Published.' });
    });

    it('shows a compilation failure without claiming the pin moved', async () => {
        const api = publicationClient({ publish: vi.fn(async () => ({ ...publication, compileError: 'Invalid block' })) });
        mount(api);
        await screen.findByLabelText('MDX source');
        await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
        expect((await screen.findByRole('status')).textContent).toContain('Publication failed: Invalid block');
    });

    it('keeps publication unavailable and the real editor disabled for an explicit read-only host', async () => {
        const api = publicationClient();
        mount(api, vi.fn(), { readOnly: true });
        const source = await screen.findByLabelText('MDX source');
        expect(source.closest('fieldset')?.disabled).toBe(true);
        expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
        expect(api.saveDraft).not.toHaveBeenCalled();
    });

    it('shows the same complete controls in the floating body editor', async () => {
        const api = publicationClient();
        mount(api, vi.fn(), { editorPlacement: 'overlay' });
        await screen.findByLabelText('MDX source');
        expect(screen.getByRole('button', { name: 'Save draft' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Publish' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'History' })).toBeTruthy();
    });

    it.each(['frame', 'list'] as const)('adds no save or publication to an unbound %s preview', async (kind) => {
        const api = publicationClient();
        mount(api, vi.fn(), { regions: [{ id: 'body', label: 'Preview', kind, recordId: 'entry-1', note: '' }] });
        await waitFor(() => expect(api.loadBody).toHaveBeenCalled());
        expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
        expect(api.saveDraft).not.toHaveBeenCalled();
    });

    it('preserves the real schema form while publishing its object body', async () => {
        const api = publicationClient({ loadBody: vi.fn(async () => ({
            id: 'entry-1', body: { headline: 'Original headline' },
            schema: { type: 'object', properties: { headline: { type: 'string', title: 'Headline' } } },
        } as unknown as BeamUxEntryBodyData)) });
        mount(api, vi.fn(), { regions: [{ id: 'body', label: 'Fields', kind: 'form', recordId: 'entry-1', note: '' }] });
        const headline = await screen.findByLabelText('Headline');
        fireEvent.change(headline, { target: { value: 'Published headline' } });
        await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
        await waitFor(() => expect(api.saveDraft).toHaveBeenCalledWith('entry-1', { headline: 'Published headline' }, 'v1', 'UX builder draft'));
        expect(api.publish).toHaveBeenCalledWith('entry-1', 'saved-v2');
    });

    it('retries a moved load boundary rather than pairing an old body with a new head', async () => {
        let reads = 0;
        const api = publicationClient({
            listVersions: vi.fn(async () => (++reads === 1 ? publication : { ...publication, headVersion: 'v2' })),
            loadBody: vi.fn(async () => ({ id: 'entry-1', body: { content: reads >= 3 ? '# Coherent v2' : '# Old v1' }, schema: null } as unknown as BeamUxEntryBodyData)),
        });
        mount(api);
        await waitFor(() => expect((screen.getByLabelText('MDX source') as HTMLTextAreaElement).value).toBe('# Coherent v2'));
        fireEvent.change(screen.getByLabelText('MDX source'), { target: { value: '# Edit coherent v2' } });
        await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
        await waitFor(() => expect(api.saveDraft).toHaveBeenCalledWith('entry-1', { content: '# Edit coherent v2' }, 'v2', 'UX builder draft'));
    });

    it('adds the exact saved version to a declared open Release instead of publishing directly', async () => {
        const release: import('./releases').ReleaseRecord = {
            id: 'release-1', title: 'Launch', realm: 'site', status: 'approved', reviewedBy: null,
            members: [], workflow: null, canSchedule: false, reviewRequired: true,
        };
        const releaseCommand = vi.fn(async () => release);
        const api = publicationClient({ listReleases: vi.fn(async () => [release]), releaseCommand });
        mount(api);
        fireEvent.change(await screen.findByLabelText('MDX source'), { target: { value: '# Release draft' } });
        await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
        expect(await screen.findByRole('dialog', { name: 'Publish saved version' })).toBeTruthy();
        expect((screen.getByLabelText('MDX source') as HTMLTextAreaElement).closest('fieldset')?.disabled).toBe(true);
        await userEvent.click(screen.getByRole('button', { name: 'Add to Release' }));
        await waitFor(() => expect(releaseCommand).toHaveBeenCalledWith('release-1', { action: 'member', entryId: 'entry-1', ref: 'saved-v2' }));
        expect(api.publish).not.toHaveBeenCalled();
        expect((await screen.findByRole('status')).textContent).toContain('publication follows the Release workflow');
    });

    it('keeps Preview optional and reports a blocked real preview window explicitly', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        const api = publicationClient({ previewVersion: vi.fn(async () => ({ url: '/signed/version-preview' })) });
        try {
            mount(api);
            await screen.findByLabelText('MDX source');
            await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
            await userEvent.click(await screen.findByRole('button', { name: 'Preview saved version' }));
            expect((await screen.findByRole('alert')).textContent).toContain('Allow popups');
            expect(api.previewVersion).not.toHaveBeenCalled();
            expect(api.publish).not.toHaveBeenCalled();
        } finally { open.mockRestore(); }
    });

    it('does not expose a stranded draft-only affordance when publication is incomplete', async () => {
        const api = publicationClient({ publish: undefined });
        mount(api);
        await screen.findByLabelText('MDX source');
        expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    });
});
