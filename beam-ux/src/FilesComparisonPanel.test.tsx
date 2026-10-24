import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FilesComparisonPanel } from './FilesComparisonPanel';
import type { FileInspection, FileReconcileInput, FileReconcileResult } from './files';
import type { UxBuilderClient } from './types';

afterEach(cleanup);
const inspected: FileInspection = {
    memberId: 'member', entryId: 'entry', state: 'differs', message: 'Canonical color changed',
    workingHeadVersion: 'head-a', publishedVersion: 'pin-a', fileExists: true,
    fileSha256: 'hash-a', fingerprint: 'placement-a', path: 'theme.css',
    publishedSource: 'old', localSource: 'new', canTake: true, canRestore: false, sourceTruncated: false,
};
function setup(inspection = inspected) {
    const inspectReleaseFile = vi.fn(async () => inspection);
    const takeReleaseFile = vi.fn(async (_id: string, _input: FileReconcileInput): Promise<FileReconcileResult> => ({
        status: 'drafted', message: 'Draft saved.', entryId: 'entry', headVersion: 'head-b', publishedVersion: 'pin-a',
    }));
    const restoreMissingReleaseFile = vi.fn(async () => ({status: 'restored', message: 'Restored.', entryId: 'entry', headVersion: 'head-a', publishedVersion: 'pin-a'}));
    const client: UxBuilderClient = {loadBody: vi.fn(), saveBody: vi.fn(), inspectReleaseFile, takeReleaseFile, restoreMissingReleaseFile};
    render(<FilesComparisonPanel memberId="member" client={client} editorHref={id => `/host/theme/${id}`}/>);
    return {inspectReleaseFile, takeReleaseFile, restoreMissingReleaseFile};
}
describe('deliberate file reconciliation', () => {
    it('restores missing canonical MDX with exact absence tokens, cancel focus and no Theme editor link', async () => {
        const client = setup({...inspected,format:'mdx',path:'help/page/intro.mdx',state:'missing',localSource:null,fileExists:false,fileSha256:null,canTake:false,canRestore:true});
        const restore = await screen.findByRole('button', {name:'Restore missing published file'});
        fireEvent.click(restore);
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button',{name:'Confirm restore missing file'})));
        fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
        expect(document.activeElement).toBe(screen.getByRole('button',{name:'Restore missing published file'}));
        expect(client.restoreMissingReleaseFile).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button',{name:'Restore missing published file'}));
        fireEvent.click(screen.getByRole('button',{name:'Confirm restore missing file'}));
        await screen.findByText('Restored.');
        expect(client.restoreMissingReleaseFile).toHaveBeenCalledExactlyOnceWith('member', {expectedHeadVersion:'head-a',expectedPublishedVersion:'pin-a',expectedFileExists:false,expectedFileSha256:null,fingerprint:'placement-a',confirmed:true});
        expect(client.takeReleaseFile).not.toHaveBeenCalled();
        expect(screen.queryByRole('link')).toBeNull();
    });
    it('explains no-overwrite for an existing different MDX file as well as Theme', async () => {
        setup({...inspected,format:'mdx',path:'help/page/intro.mdx'});
        await screen.findByRole('button',{name:'Take file as draft'});
        expect(screen.getByText(/Restore never overwrites an existing file/)).toBeTruthy();
        expect(screen.queryByRole('button',{name:'Restore missing published file'})).toBeNull();
    });

    it('captures exact inspection, cancel restores focus, confirms draft and uses host href', async () => {
        const client = setup();
        const take = await screen.findByRole('button', {name: 'Take file as draft'});
        fireEvent.click(take);
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', {name: 'Confirm take file as draft'})));
        fireEvent.click(screen.getByRole('button', {name: 'Cancel'}));
        expect(document.activeElement).toBe(screen.getByRole('button', {name:'Take file as draft'}));
        expect(client.takeReleaseFile).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', {name:'Take file as draft'}));
        fireEvent.click(screen.getByRole('button', {name: 'Confirm take file as draft'}));
        await screen.findByText('Draft saved.');
        expect(client.takeReleaseFile).toHaveBeenCalledExactlyOnceWith('member', {
            expectedHeadVersion:'head-a', expectedPublishedVersion:'pin-a', expectedFileExists:true,
            expectedFileSha256:'hash-a', fingerprint:'placement-a', confirmed:true,
        });
        expect(screen.getByRole('link', {name:'Open entry'}).getAttribute('href')).toBe('/host/theme/entry');
        expect(client.inspectReleaseFile).toHaveBeenCalledTimes(2);
    });
    it('retains stale confirmation and blocks repeat until explicit reload', async () => {
        const client = setup();
        client.takeReleaseFile.mockRejectedValueOnce(new Error('Published pin moved'));
        fireEvent.click(await screen.findByRole('button', {name: 'Take file as draft'}));
        fireEvent.click(screen.getByRole('button', {name:'Confirm take file as draft'}));
        await screen.findByRole('alert');
        expect(client.inspectReleaseFile).toHaveBeenCalledTimes(1);
        expect((screen.getByRole('button', {name:'Confirm take file as draft'}) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByRole('group')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', {name:'Reload comparison'}));
        await waitFor(() => expect(client.inspectReleaseFile).toHaveBeenCalledTimes(2));
        expect(screen.queryByRole('group')).toBeNull();
    });
    it('shows missing-only confirmation with captured absence and never calls import', async () => {
        const client = setup({...inspected,state:'missing',localSource:null,fileExists:false,fileSha256:null,canTake:false,canRestore:true});
        fireEvent.click(await screen.findByRole('button', {name:'Restore missing published file'}));
        expect(screen.getByText(/Any appearing file blocks creation/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', {name:'Confirm restore missing file'}));
        await screen.findByText('Restored.');
        expect(client.restoreMissingReleaseFile).toHaveBeenCalledWith('member', expect.objectContaining({expectedFileExists:false,expectedFileSha256:null}));
        expect(client.takeReleaseFile).not.toHaveBeenCalled();
    });
    it('offers no import/restore for invalid source', async () => {
        setup({...inspected,state:'invalid',canTake:false});
        await screen.findByText('invalid');
        expect(screen.queryByRole('button', {name:'Take file as draft'})).toBeNull();
        expect(screen.queryByRole('button', {name:'Restore missing published file'})).toBeNull();
    });
    it('shows retained compile failure and actual pointers without raw diagnostics or a Theme link for MDX', async () => {
        const client = setup({...inspected,format:'mdx',path:'help/page/intro.mdx'});
        client.takeReleaseFile.mockResolvedValueOnce({
            status:'drafted-with-compile-error',message:'DO_NOT_LEAK /private/compiler/stderr',
            entryId:'entry',headVersion:'retained-d3',publishedVersion:'unchanged-p1',
            diagnostic:{code:'compile-failed',message:'DO_NOT_LEAK source/stack'},
        });
        fireEvent.click(await screen.findByRole('button',{name:'Take file as draft'}));
        expect(screen.getByText(/Prior versions remain in history/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button',{name:'Confirm take file as draft'}));
        await screen.findByText('Draft retained; compilation failed. Published content is unchanged. Review the draft before publication.');
        expect(screen.getByText(/Returned working head: retained-d3. Published pin: unchanged-p1/)).toBeTruthy();
        expect(screen.queryByText(/DO_NOT_LEAK/)).toBeNull();
        expect(screen.queryByRole('link')).toBeNull();
        await waitFor(()=>expect(client.inspectReleaseFile).toHaveBeenCalledTimes(2));
        fireEvent.click(screen.getByRole('button',{name:'Reload comparison'}));
        await waitFor(()=>expect(client.inspectReleaseFile).toHaveBeenCalledTimes(3));
        expect(screen.getByText(/Draft retained; compilation failed/)).toBeTruthy();
        expect(screen.queryByRole('button',{name:'Restore missing published file'})).toBeNull();
    });
    it('hides previously read source on forbidden or source failure until an explicit successful reload', async () => {
        const client = setup();
        await screen.findByText('old');
        client.inspectReleaseFile.mockRejectedValueOnce(new Error('Access denied'));
        fireEvent.click(screen.getByRole('button',{name:'Reload comparison'}));
        await screen.findByRole('alert');
        expect(screen.queryByText('old')).toBeNull();
        expect(screen.queryByText('new')).toBeNull();
        expect(screen.queryByRole('button',{name:'Take file as draft'})).toBeNull();
        fireEvent.click(screen.getByRole('button',{name:'Reload comparison'}));
        await screen.findByText('old');
        expect(screen.getByRole('button',{name:'Take file as draft'})).toBeTruthy();
    });
    it('hides stale source after a refused take while retaining only the exact disabled confirmation', async () => {
        const client = setup({...inspected,format:'mdx'});
        client.takeReleaseFile.mockRejectedValueOnce(new Error('File changed. Reload required.'));
        fireEvent.click(await screen.findByRole('button',{name:'Take file as draft'}));
        fireEvent.click(screen.getByRole('button',{name:'Confirm take file as draft'}));
        await screen.findByRole('alert');
        expect(screen.queryByText('old')).toBeNull();
        expect(screen.queryByText('new')).toBeNull();
        expect(screen.getByText(/Captured head head-a; published pin-a; file hash-a/)).toBeTruthy();
        expect((screen.getByRole('button',{name:'Confirm take file as draft'}) as HTMLButtonElement).disabled).toBe(true);
        expect(client.inspectReleaseFile).toHaveBeenCalledTimes(1);
    });
    it('keeps legacy missing-format Theme hrefs but never sends an MDX path to that generic destination', async () => {
        setup({...inspected,path:'help/page/intro.mdx'});
        fireEvent.click(await screen.findByRole('button',{name:'Take file as draft'}));
        fireEvent.click(screen.getByRole('button',{name:'Confirm take file as draft'}));
        await screen.findByText('Draft saved.');
        expect(screen.queryByRole('link')).toBeNull();
    });
});
