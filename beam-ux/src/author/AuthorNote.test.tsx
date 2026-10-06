// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AuthorNote } from './AuthorNote';

/**
 * app-walkthrough APP-10 (APP-22, M14): wire types, routes, ADR numbers, config paths and guards render only through
 * <AuthorNote>, which is null outside a development build. A production bundle carries none of it as copy.
 */
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
});
afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllEnvs();
});

it('shows the author chrome in a development build, marked as such', () => {
    vi.stubEnv('DEV', true);
    act(() => root.render(<AuthorNote>POST /embeds/{'{id}'}/config</AuthorNote>));

    const note = container.querySelector('[data-author-note]');
    expect(note?.textContent).toBe('POST /embeds/{id}/config');
});

it('renders nothing in a production build', () => {
    vi.stubEnv('DEV', false);
    act(() => root.render(<AuthorNote>Root · require.root</AuthorNote>));

    expect(container.innerHTML).toBe('');
});
