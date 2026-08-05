/**
 * The host-shell factory acceptance (ticket 06): prove `createMainframeHost` reproduces the four
 * load-bearing behaviors a host used to hand-wire —
 *
 *   1. **Mode select + author gate** — a non-author sees only the page (no ribbon/toggle); an author
 *      gets the ribbon and the read↔author toggle, and toggling swaps the `main` fork.
 *   2. **Kind-aware `main` fork** — authoring a composable Puck body opens `renderEditor`; a
 *      chrome-only body opens `renderInspector` over the page; an unbound entry falls through to the
 *      page (never a blank editor); a non-composable Puck body is sealed to the inspector.
 *   3. **`?beam_entry=` override** — the query param loads that entry instead of the route's own.
 *   4. **`useBeamUxEntry`** — a wrapped page reads the loaded entry chrome through the context.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createMainframeHost, useBeamUxEntry, type HostEntryBody, type MainframeHostConfig } from '../index';

// A stub renderer set: each fork renders a distinct testid so we can assert WHICH fork won.
function stubConfig(over: Partial<MainframeHostConfig>): MainframeHostConfig {
    return {
        usePageContext: () => ({ component: 'listen', canAuthor: false }),
        loadEntryBody: async () => null,
        renderEditor: ({ slug }) => <div data-testid="editor">editor:{slug}</div>,
        renderRead: ({ slug }) => <div data-testid="read">read:{slug}</div>,
        renderInspector: ({ slug }) => <div data-testid="inspector">inspector:{slug}</div>,
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

        // toggle into window mode → the kind-aware fork picks the Puck editor (composable Puck body)
        act(() => {
            fireEvent.click(screen.getByText('Edit page'));
        });
        await waitFor(() => expect(screen.getByTestId('editor')).toBeTruthy());
        // the editor is handed the resolved entry slug (component-derived here → 'listen')
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

    it('a non-composable Puck body is sealed — the structural editor never opens', async () => {
        const body: HostEntryBody = { slug: 'auth-login', schema: null, body: { content: [] }, composable: false };
        const Host = createMainframeHost(
            stubConfig({ usePageContext: () => ({ component: 'listen', canAuthor: true }), loadEntryBody: async () => body }),
        );
        render(<Host>{PAGE}</Host>);
        await waitFor(() => expect(screen.getByText('Edit page')).toBeTruthy());

        act(() => fireEvent.click(screen.getByText('Edit page')));

        // sealed → falls to the inspector (bound), never the structural canvas
        await waitFor(() => expect(screen.getByTestId('inspector')).toBeTruthy());
        expect(screen.queryByTestId('editor')).toBeNull();
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
        const seen: string[] = [];
        const Host = createMainframeHost(
            stubConfig({
                usePageContext: () => ({ component: 'listen', canAuthor: true }),
                loadEntryBody: async (slug) => {
                    seen.push(slug);
                    return { slug, schema: null, body: { content: [] } };
                },
            }),
        );
        render(<Host>{PAGE}</Host>);

        await waitFor(() => expect(seen).toContain('template-foo'));
        expect(seen).not.toContain('listen-songs');
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
