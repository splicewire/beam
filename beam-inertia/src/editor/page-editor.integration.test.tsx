// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { __resetEditMode } from '@splicewire/beam-ux/canvas';
import { configureBeamInertia } from '../config';
import { PageEditor } from './page-editor';
import AuthEntry from '../pages/auth/entry';

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: { auth: { canAuthorUx: true } } }),
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

afterEach(() => {
    cleanup();
    __resetEditMode();
    configureBeamInertia({});
    vi.unstubAllGlobals();
});

it('the actual inline canvas keeps ordinary Save and omits publication for a body-only host', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    configureBeamInertia({
        entryClient: { loadBody: async () => envelope, saveBody: async () => envelope },
    });
    render(<PageEditor slug="home" entryId="a" />);
    await act(async () => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
    });

    expect(await screen.findByRole('button', { name: 'Save' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
});

it('retains the complete publication dock when the injected host supplies it', async () => {
    const state = {
        id: 'a',
        draftPending: false,
        publishedVersion: null,
        publishedReadable: null,
        headVersion: null,
        headReadable: null,
        versions: [],
        compileError: null,
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
    configureBeamInertia({
        entryClient: { loadBody: async (id) => (id === 'a' ? envelope : next), saveBody },
    });
    const view = render(<PageEditor slug="home" entryId="a" />);
    await act(async () => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
    });
    await screen.findByRole('button', { name: 'Save' });

    view.rerender(<PageEditor slug="home" entryId="b" />);
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    const save = await screen.findByRole('button', { name: 'Save' });
    await act(async () => {
        fireEvent.click(save);
    });
    expect(saveBody).toHaveBeenCalledWith('b', next.body);
});

it('the existing auth slug remount exits editing before the next page can be authored', async () => {
    const loadBody = vi.fn(async () => envelope);
    configureBeamInertia({ entryClient: { loadBody, saveBody: async () => envelope } });
    const entry = { id: 'a', slug: 'login', format: 'tsx', artifact: null };
    const view = render(<AuthEntry slug="login" entry={entry} body={envelope.body} />);
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Edit content' }));
    });
    await screen.findByRole('button', { name: 'Save' });

    view.rerender(
        <AuthEntry
            slug="register"
            entry={{ ...entry, id: 'b', slug: 'register' }}
            body={envelope.body}
        />,
    );

    expect(screen.getByRole('button', { name: 'Edit content' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    // The previous global mode can initiate B's read before the parent's domain-mode effect runs.
    // The existing remount contract resets editing; it does not promise to suppress that read.
});
