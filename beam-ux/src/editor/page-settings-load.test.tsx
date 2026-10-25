// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { EditorKitProvider } from './context';
import { PageEditor } from './page-editor';
import { __resetEditMode } from '../canvas/PageEditor';

vi.mock('./local-session', async importOriginal => {
    const original = await importOriginal<typeof import('./local-session')>();
    return { ...original, IndexedDbSessions: class {
        async forEntry() { return []; }
        async write() {}
        close() {}
    } };
});
afterEach(() => { cleanup(); __resetEditMode(); });

it('loads server page settings into the real PageEditor and saves the edited settings', async () => {
    const body = [{ kind: 'block' as const, name: 'p', isComponent: false, dynamic: false, props: [], children: [{kind: 'text' as const, value: 'Saved body'}] }];
    const settings = { title: 'Published title', segment: 'about', navOrder: 7 };
    const state = {headVersion: 'v1', publishedVersion: 'v1', draftPending: false, versions: []};
    const saveDraft = vi.fn().mockResolvedValue({...state, headVersion: 'v2', draftPending: true});
    const loadBody = vi.fn().mockResolvedValue({body, pageSettings: settings});
    render(<EditorKitProvider canAuthor userId="author" transport={{
        loadBody, saveBody: vi.fn(), saveDraft, listVersions: vi.fn().mockResolvedValue(state),
        publish: vi.fn(), restoreVersion: vi.fn(),
    }}><PageEditor slug="about" entryId="settings-entry" /></EditorKitProvider>);
    act(() => window.dispatchEvent(new CustomEvent('beam-ux:mode', {detail: {mode: 'window'}})));
    const title = await screen.findByLabelText('Title');
    expect((title as HTMLInputElement).value).toBe('Published title');
    expect(loadBody).toHaveBeenCalledWith('settings-entry');
    fireEvent.change(title, {target: {value: 'Edited title'}});
    fireEvent.click(screen.getByRole('button', {name: 'Save draft'}));
    await waitFor(() => expect(saveDraft).toHaveBeenCalledWith('settings-entry', body, 'v1', undefined,
        {...settings, title: 'Edited title'}));
});

it('shows the Redirects the server lists with the page in its settings (ux-0236 d14)', async () => {
    const body = [{ kind: 'block' as const, name: 'p', isComponent: false, dynamic: false, props: [], children: [] }];
    const state = {headVersion: 'v1', publishedVersion: 'v1', draftPending: false, versions: []};
    const loadBody = vi.fn().mockResolvedValue({body, pageSettings: {title: 'Pricing'},
        redirects: [{path: '/plans', match: 'exact', permanent: true, origin: 'author'}]});
    render(<EditorKitProvider canAuthor userId="author" transport={{
        loadBody, saveBody: vi.fn(), saveDraft: vi.fn(), listVersions: vi.fn().mockResolvedValue(state),
        publish: vi.fn(), restoreVersion: vi.fn(),
    }}><PageEditor slug="pricing" entryId="pricing-entry" /></EditorKitProvider>);
    act(() => window.dispatchEvent(new CustomEvent('beam-ux:mode', {detail: {mode: 'window'}})));

    const group = await screen.findByRole('group', {name: 'Redirects to this page'});
    expect(group.textContent).toContain('/plans · made by an author');
});
