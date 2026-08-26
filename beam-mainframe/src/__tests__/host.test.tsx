/**
 * The host-shell factory acceptance (ticket 06): prove `createMainframeHost` reproduces the four
 * load-bearing behaviors a host used to hand-wire —
 *
 *   1. **Mode select + author gate** — a non-author sees only the page (no ribbon/toggle); an author
 *      gets the ribbon and the read↔author toggle, and toggling swaps the `main` fork.
 *   2. **Kind-aware `main` fork** — authoring a Puck body opens `renderEditor`; a chrome-only body
 *      opens `renderInspector` over the page; an unbound entry falls through to the page (never a
 *      blank editor). The retired whole-entry `composable` seal (ticket 14 F06) is GONE — per-node
 *      opacity (ADR-0016, `isIsland()`) now seals individual nodes INSIDE the mounted editor, so a
 *      Puck body always opens `renderEditor`, sealed or not.
 *   3. **`?beam_entry=` override** — the query param loads that entry instead of the route's own.
 *   4. **`useBeamUxEntry`** — a wrapped page reads the loaded entry chrome through the context.
 *
 * Plus the {@link EntryRef} contract (beam-docs-satellite ticket 37): the transport is handed an
 * `{id, slug}` pair, the id wins wherever a host supplies one, and an unmappable component resolves to
 * NO ref and probes NOTHING.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    createMainframeHost,
    entryRefLabel,
    useBeamUxEntry,
    type EntryRef,
    type HostEntryBody,
    type MainframeHostConfig,
} from '../index';

// A stub renderer set: each fork renders a distinct testid so we can assert WHICH fork won. Every case
// below opts into `componentSlugFallback` because it addresses its entry by COMPONENT NAME ('listen');
// that guess is opt-in now, so a stub that forgot it would resolve no ref at all.
function stubConfig(over: Partial<MainframeHostConfig>): MainframeHostConfig {
    return {
        componentSlugFallback: true,
        usePageContext: () => ({ component: 'listen', canAuthor: false }),
        loadEntryBody: async () => null,
        renderEditor: ({ ref }) => <div data-testid="editor">editor:{entryRefLabel(ref)}</div>,
        renderRead: ({ ref }) => <div data-testid="read">read:{entryRefLabel(ref)}</div>,
        renderInspector: ({ ref }) => <div data-testid="inspector">inspector:{entryRefLabel(ref)}</div>,
        ...over,
    };
}

const PAGE = <div data-testid="page">the page</div>;

afterEach(() => {
    // reset the URL between the ?beam_entry cases
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
});

describe('createMainframeHost — author gate + mode select', () => {
    it('a non-author sees only the page — no ribbon, no toggle', async () => {
        const Host = createMainframeHost(stubConfig({ usePageContext: () => ({ component: 'listen', canAuthor: false }) }));
        render(<Host>{PAGE}</Host>);

        expect(screen.getByTestId('page')).toBeTruthy();
        expect(screen.queryByText('beam-ux')).toBeNull();
        expect(screen.queryByText('Edit page')).toBeNull();
    });

    it('an author with a bound entry gets the ribbon + toggle; toggling enters the editor fork', async () => {
        const body: HostEntryBody = { slug: 'listen-songs', schema: null, body: { content: [] } };
        const Host = createMainframeHost(
            stubConfig({
                usePageContext: () => ({ component: 'listen', canAuthor: true }),
                loadEntryBody: async () => body,
            }),
        );
        render(<Host>{PAGE}</Host>);

        // ribbon + toggle appear once the entry binds
        await waitFor(() => expect(screen.getByText('Edit page')).toBeTruthy());

        // read mode: a Puck body renders through renderRead
        expect(screen.getByTestId('read')).toBeTruthy();

        // toggle into window mode → the kind-aware fork picks the Puck editor (Puck body)
        act(() => {
            fireEvent.click(screen.getByText('Edit page'));
        });
        await waitFor(() => expect(screen.getByTestId('editor')).toBeTruthy());
        // the editor is handed the resolved entry REF (component-derived here → slug 'listen', no id)
        expect(screen.getByTestId('editor').textContent).toBe('editor:listen');
    });
});

describe('createMainframeHost — kind-aware main fork', () => {
    it('a chrome-only body edits in place via the inspector (page beneath)', async () => {
        const body: HostEntryBody = { slug: 'listen-songs', schema: null, body: { heading: 'Listen', content: 'intro' } };
        const Host = createMainframeHost(
            stubConfig({ usePageContext: () => ({ component: 'listen', canAuthor: true }), loadEntryBody: async () => body }),
        );
        render(<Host>{PAGE}</Host>);
        await waitFor(() => expect(screen.getByText('Edit page')).toBeTruthy());

        act(() => fireEvent.click(screen.getByText('Edit page')));

        await waitFor(() => expect(screen.getByTestId('inspector')).toBeTruthy());
        expect(screen.getByTestId('page')).toBeTruthy(); // real page renders beneath the inspector
        expect(screen.queryByTestId('editor')).toBeNull();
    });

    it('a Puck body always opens the structural editor — no whole-entry composable seal', async () => {
        // Ticket 04 (theme-entries-and-authoring): the retired `composable` flag used to seal a whole
        // behavior-realm entry (e.g. auth-login) to the inspector even when it carried a Puck body.
        // That seal is GONE — a Puck body now always opens `renderEditor`; per-node opacity (ADR-0016,
        // `isIsland()`) is the host-owned canvas's job to seal individual nodes, out of this
        // package's scope to simulate (beam-mainframe stays canvas-agnostic).
        const body: HostEntryBody = { slug: 'auth-login', schema: null, body: { content: [] } };
        const Host = createMainframeHost(
            stubConfig({ usePageContext: () => ({ component: 'listen', canAuthor: true }), loadEntryBody: async () => body }),
        );
        render(<Host>{PAGE}</Host>);
        await waitFor(() => expect(screen.getByText('Edit page')).toBeTruthy());

        act(() => fireEvent.click(screen.getByText('Edit page')));

        await waitFor(() => expect(screen.getByTestId('editor')).toBeTruthy());
        expect(screen.queryByTestId('inspector')).toBeNull();
    });

    it('an unbound entry (load miss) never shows the toggle — nothing to author', async () => {
        const Host = createMainframeHost(
            stubConfig({ usePageContext: () => ({ component: 'listen', canAuthor: true }), loadEntryBody: async () => null }),
        );
        render(<Host>{PAGE}</Host>);

        // give the async load a tick to resolve to null
        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.getByTestId('page')).toBeTruthy();
        expect(screen.queryByText('Edit page')).toBeNull();
    });
});

describe('createMainframeHost — ?beam_entry override + useBeamUxEntry', () => {
    it('?beam_entry loads that slug instead of the route entry', async () => {
        window.history.replaceState({}, '', '/?beam_entry=template-foo');
        const seen: EntryRef[] = [];
        const Host = createMainframeHost(
            stubConfig({
                usePageContext: () => ({ component: 'listen', canAuthor: true }),
                loadEntryBody: async (ref) => {
                    seen.push(ref);
                    return { slug: ref.slug ?? '', schema: null, body: { content: [] } };
                },
            }),
        );
        render(<Host>{PAGE}</Host>);

        await waitFor(() => expect(seen.map((r) => r.slug)).toContain('template-foo'));
        expect(seen.map((r) => r.slug)).not.toContain('listen');
        // the override is slug-addressed by construction — a human types a key, not a uuid
        expect(seen.every((r) => r.id === null)).toBe(true);
    });

    it('?beam_entry_id addresses by id, and the ref carries no slug', async () => {
        window.history.replaceState({}, '', '/?beam_entry_id=01a001bc-0000-7000-8000-000000000001');
        const seen: EntryRef[] = [];
        const Host = createMainframeHost(
            stubConfig({
                usePageContext: () => ({ component: 'listen', canAuthor: true }),
                loadEntryBody: async (ref) => {
                    seen.push(ref);
                    return { slug: 'whatever', schema: null, body: { content: [] } };
                },
            }),
        );
        render(<Host>{PAGE}</Host>);

        await waitFor(() => expect(seen).toHaveLength(1));
        expect(seen[0]).toEqual({ id: '01a001bc-0000-7000-8000-000000000001', slug: null });
    });

    it('a wrapped page reads the loaded entry chrome via useBeamUxEntry', async () => {
        function Consumer() {
            const entry = useBeamUxEntry<{ heading?: string }>();
            return <div data-testid="page">{entry?.body.heading ?? 'fallback'}</div>;
        }
        const body: HostEntryBody = { slug: 'listen-songs', schema: null, body: { heading: 'From the entry' } };
        const Host = createMainframeHost(
            stubConfig({ usePageContext: () => ({ component: 'listen', canAuthor: false }), loadEntryBody: async () => body }),
        );
        render(
            <Host>
                <Consumer />
            </Host>,
        );

        await waitFor(() => expect(screen.getByText('From the entry')).toBeTruthy());
    });
});

describe('createMainframeHost — the entry REF (ticket 37)', () => {
    it('prefers props.entry.id over every other branch, and still carries the slug', async () => {
        const seen: EntryRef[] = [];
        const Host = createMainframeHost(
            stubConfig({
                componentToEntry: { listen: 'listen-songs' },
                usePageContext: () => ({
                    component: 'listen',
                    canAuthor: true,
                    slug: 'the-real-entry',
                    entryId: '01a001bc-0000-7000-8000-0000000000aa',
                }),
                loadEntryBody: async (ref) => {
                    seen.push(ref);
                    return { slug: 'the-real-entry', schema: null, body: { content: [] } };
                },
            }),
        );
        render(<Host>{PAGE}</Host>);

        await waitFor(() => expect(seen).toHaveLength(1));
        expect(seen[0]).toEqual({ id: '01a001bc-0000-7000-8000-0000000000aa', slug: 'the-real-entry' });
    });

    it('an unmapped component with the guess OFF resolves no ref and never touches the transport', async () => {
        // The `site-entry` defect, as a test. Every rendered entry is the component `site/entry`; the
        // old unconditional slash-swap probed `site-entry`, a row that has never existed — a stray 401
        // per anonymous page view, and at an auto-provisioning host a junk entry minted on author visit.
        const seen: EntryRef[] = [];
        const Host = createMainframeHost(
            stubConfig({
                componentSlugFallback: false,
                componentToEntry: {},
                usePageContext: () => ({ component: 'site/entry', canAuthor: true }),
                loadEntryBody: async (ref) => {
                    seen.push(ref);
                    return null;
                },
            }),
        );
        render(<Host>{PAGE}</Host>);

        await act(async () => {
            await Promise.resolve();
        });

        expect(seen).toEqual([]);
        expect(screen.getByTestId('page')).toBeTruthy();
        expect(screen.queryByText('Edit page')).toBeNull();
    });

    it('the guess stays available, opt-in, for a host that still wants it', async () => {
        const seen: EntryRef[] = [];
        const Host = createMainframeHost(
            stubConfig({
                componentSlugFallback: true,
                usePageContext: () => ({ component: 'site/entry', canAuthor: true }),
                loadEntryBody: async (ref) => {
                    seen.push(ref);
                    return null;
                },
            }),
        );
        render(<Host>{PAGE}</Host>);

        await waitFor(() => expect(seen).toHaveLength(1));
        expect(seen[0]).toEqual({ id: null, slug: 'site-entry' });
    });
});
