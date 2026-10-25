// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { __resetEditMode } from '@splicewire/beam-ux/canvas';
import { configureBeamInertia } from '../config';
import { PageEditor } from './page-editor';
import AuthEntry from '../pages/auth/entry';

const pageProps = vi.hoisted(() => ({ auth: { canAuthorUx: true, user: { id: "author" } } }));

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: pageProps }),
    Link: 'a',
    Head: () => null,
}));

const envelope = {
    id: 'a',
    slug: 'home',
    type: 'page',
    format: 'tsx',
    schema: null,
    source: null,
    compileError: null,
    authoredComponents: [],
    body: [
        {
            kind: 'block',
            name: 'h2',
            isComponent: false,
            dynamic: false,
            props: [],
            children: [{ kind: 'text', value: 'Saved content' }],
        },
    ],
};

// Storage behavior is proved separately in Chromium; this fixture supplies only the IDB boundary.
beforeEach(() => {
    vi.stubGlobal('indexedDB', { open: () => {
        const request: any = {};
        request.result = { close() {}, transaction: () => {
            const tx: any = { objectStore: () => ({
                getAll: () => { const read: any = { result: [] }; queueMicrotask(() => read.onsuccess?.()); return read; },
                put() { queueMicrotask(() => tx.oncomplete?.()); },
                delete() {},
            }) };
            return tx;
        } };
        queueMicrotask(() => request.onsuccess?.());
        return request;
    } });
});
const publication = { id:'a', draftPending:false, publishedVersion:'v1', publishedReadable:'v1', headVersion:'v1', headReadable:'v1', versions:[], compileError:null };
const historyClient = () => ({
    listVersions: vi.fn(async () => publication),
    saveDraft: vi.fn(async () => publication),
    publish: vi.fn(async () => publication),
    restoreVersion: vi.fn(async () => publication),
});

afterEach(() => {
    pageProps.auth.canAuthorUx = true;
    cleanup();
    __resetEditMode();
    configureBeamInertia({});
    vi.unstubAllGlobals();
});

it('the actual inline canvas refuses a body-only host without publication history', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    configureBeamInertia({
        entryClient: { loadBody: async () => envelope, saveBody: async () => envelope },
    });
    render(<PageEditor slug="home" entryId="a" />);
    await act(async () => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
    });

    expect((await screen.findByRole('alert')).textContent).toContain('publication transport');
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
});

it('retains the complete publication dock when the injected host supplies it', async () => {
    const state = {
        id: 'a',
        draftPending: false,
        publishedVersion: 'v1',
        publishedReadable: null,
        headVersion: 'v1',
        headReadable: null,
        versions: [],
        compileError: null,
        authoredComponents: [],
    };
    const listVersions = vi.fn(async () => state);
    configureBeamInertia({
        entryClient: {
            loadBody: async () => envelope,
            saveBody: async () => envelope,
            saveDraft: async () => state,
            publish: async () => state,
            listVersions,
            restoreVersion: async () => state,
        },
    });
    render(<PageEditor slug="home" entryId="a" />);
    await act(async () => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
    });

    expect(await screen.findByRole('button', { name: 'Save draft' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeTruthy();
    expect(listVersions).toHaveBeenCalledWith('a');
});

it('same-mounted inline navigation reseeds the real canvas only for the replacement identity', async () => {
    const next = {
        ...envelope,
        id: 'b',
        body: [{ ...envelope.body[0], children: [{ kind: 'text', value: 'Replacement content' }] }],
    };
    const saveBody = vi.fn(async () => next);
    const history = historyClient();
    configureBeamInertia({
        entryClient: { ...history, loadBody: async (id) => (id === 'a' ? envelope : next), saveBody },
    });
    const view = render(<PageEditor slug="home" entryId="a" />);
    await act(async () => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
    });
    await screen.findByRole('button', { name: 'Publish' });

    view.rerender(<PageEditor slug="home" entryId="b" />);
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
    const save = await screen.findByRole('button', { name: 'Save draft' });
    await act(async () => {
        fireEvent.click(save);
    });
    expect(history.saveDraft).toHaveBeenCalledWith('b', next.body, 'v1');
    expect(saveBody).not.toHaveBeenCalled();
});

it('the existing auth slug remount exits editing before the next page can be authored', async () => {
    const loadBody = vi.fn(async () => envelope);
    configureBeamInertia({ entryClient: { ...historyClient(), loadBody, saveBody: async () => envelope } });
    const entry = { id: 'a', slug: 'login', format: 'tsx', artifact: null };
    const view = render(<AuthEntry slug="login" entry={entry} body={envelope.body} />);
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Edit content' }));
    });
    await screen.findByRole('button', { name: 'Publish' });

    view.rerender(
        <AuthEntry
            slug="register"
            entry={{ ...entry, id: 'b', slug: 'register' }}
            body={envelope.body}
        />,
    );

    expect(screen.getByRole('button', { name: 'Edit content' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
    // The previous global mode can initiate B's read before the parent's domain-mode effect runs.
    // The existing remount contract resets editing; it does not promise to suppress that read.
});

const cleared = {
    id: 'a',
    draftPending: false,
    publishedVersion: 'v1',
    publishedReadable: null,
    headVersion: 'v1',
    headReadable: null,
    versions: [],
    compileError: null,
    authoredComponents: [],
};

it('an author clears the working draft only after confirming', async () => {
    const clearBody = vi.fn(async () => cleared);
    configureBeamInertia({
        entryClient: { ...historyClient(), loadBody: async () => envelope, saveBody: async () => envelope, clearBody },
    });
    render(<PageEditor slug="home" entryId="a" />);
    await act(async () => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
    });

    await screen.findByText('Saved content');
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Remove content' }));
    });
    // One click opens the confirm step; nothing has been removed yet.
    expect(clearBody).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog', { name: 'Confirm remove content' })).toBeTruthy();

    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Confirm remove' }));
    });

    expect(clearBody).toHaveBeenCalledWith('a');
    expect(screen.queryByText('Saved content')).toBeNull();
    expect(screen.queryByRole('alertdialog', { name: 'Confirm remove content' })).toBeNull();
});

it('cancelling the confirm removes nothing', async () => {
    const clearBody = vi.fn(async () => cleared);
    configureBeamInertia({
        entryClient: { ...historyClient(), loadBody: async () => envelope, saveBody: async () => envelope, clearBody },
    });
    render(<PageEditor slug="home" entryId="a" />);
    await act(async () => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
    });

    await act(async () => {
        fireEvent.click(await screen.findByRole('button', { name: 'Remove content' }));
    });
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });

    expect(clearBody).not.toHaveBeenCalled();
    expect(screen.getByText('Saved content')).toBeTruthy();
});

it('a viewer without the author ability is not offered Remove content', async () => {
    pageProps.auth.canAuthorUx = false;
    const clearBody = vi.fn(async () => cleared);
    configureBeamInertia({
        entryClient: { ...historyClient(), loadBody: async () => envelope, saveBody: async () => envelope, clearBody },
    });
    render(<PageEditor slug="home" entryId="a" />);
    await act(async () => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
    });

    await screen.findByRole('button', { name: 'Publish' });
    expect(screen.queryByRole('button', { name: 'Remove content' })).toBeNull();
});

it('refuses to mount the inline editor when the entry has no Publication Pin', async () => {
    configureBeamInertia({ entryClient: {
        ...historyClient(), loadBody: async () => envelope, saveBody: async () => envelope,
        listVersions: async () => ({ ...publication, publishedVersion: null }),
    } });
    render(<PageEditor slug="home" entryId="a" />);
    await act(async () => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
    });
    expect((await screen.findByRole('alert')).textContent).toContain('Publication Pin');
    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
});
