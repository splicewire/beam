import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FilesComparisonPanel } from './FilesComparisonPanel';
import type { FileInspection, FileReconcileInput } from './files';
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
    const takeReleaseFile = vi.fn(async (_id: string, _input: FileReconcileInput) => ({
        status: 'drafted', message: 'Draft saved.', entryId: 'entry', headVersion: 'head-b', publishedVersion: 'pin-a',
    }));
    const restoreMissingReleaseFile = vi.fn(async () => ({status: 'restored', message: 'Restored.', entryId: 'entry', headVersion: 'head-a', publishedVersion: 'pin-a'}));
    const client: UxBuilderClient = {loadBody: vi.fn(), saveBody: vi.fn(), inspectReleaseFile, takeReleaseFile, restoreMissingReleaseFile};
    render(<FilesComparisonPanel memberId="member" client={client} editorHref={id => `/host/theme/${id}`}/>);
    return {inspectReleaseFile, takeReleaseFile, restoreMissingReleaseFile};
}
describe('deliberate file reconciliation', () => {
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
        expect(screen.getByRole('link', {name:'Open Theme'}).getAttribute('href')).toBe('/host/theme/entry');
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
});
