import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DocsLayout } from './DocsLayout.js';

const props = {
    entry: {
        id: 'glossary',
        slug: 'glossary',
        title: 'Glossary',
        type: 'page',
        format: 'mdx',
        url: '/docs/glossary',
    },
    nav: null,
    currentHref: '/docs/glossary',
};
const terms = [
    'Tenant',
    ...Array.from({ length: 25 }, (_, i) => `Term ${i + 2}`),
];
const glossary = (
    <>
        {terms.map((term, i) => (
            <h3 key={term} id={i === 0 ? 'tenant' : `term-${i + 1}`}>
                {term}
            </h3>
        ))}
    </>
);

const observedNodes: Element[] = [];

beforeEach(() => {
    observedNodes.length = 0;
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            observe(node: Element) {
                observedNodes.push(node);
            }
            disconnect() {}
        }
    );
    window.history.replaceState(null, '', '/docs/glossary');
});
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: undefined,
    });
});

it('decorates all 26 late glossary headings and refreshes OnThisPage from the same scan', async () => {
    const { rerender } = render(
        <DocsLayout {...props}>
            <p>Loading</p>
        </DocsLayout>
    );
    expect(
        screen.queryByRole('navigation', { name: 'On this page' })
    ).toBeNull();
    rerender(<DocsLayout {...props}>{glossary}</DocsLayout>);
    await waitFor(() =>
        expect(
            screen.getAllByRole('button', { name: /^Copy link to / })
        ).toHaveLength(26)
    );
    const toc = await screen.findByRole('navigation', { name: 'On this page' });
    expect(within(toc).getAllByRole('link')).toHaveLength(26);
    expect(
        within(toc).getByRole('link', { name: 'Tenant' }).getAttribute('href')
    ).toBe('#tenant');
    rerender(
        <DocsLayout {...props}>
            <h2 id="next">Next heading</h2>
            <h3 id="detail">Detail</h3>
        </DocsLayout>
    );
    await waitFor(() =>
        expect(
            screen.queryByRole('button', { name: 'Copy link to Tenant' })
        ).toBeNull()
    );
    await waitFor(() =>
        expect(
            within(
                screen.getByRole('navigation', { name: 'On this page' })
            ).getAllByRole('link')
        ).toHaveLength(2)
    );
});

it('copies the canonical fragment URL and Markdown form with a transient copied status', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
    });
    render(<DocsLayout {...props}>{glossary}</DocsLayout>);
    const urlButton = await screen.findByRole('button', {
        name: 'Copy link to Tenant',
    });
    fireEvent.click(urlButton);
    await waitFor(() =>
        expect(writeText).toHaveBeenLastCalledWith(
            `${location.origin}/docs/glossary#tenant`
        )
    );
    await waitFor(() =>
        expect(screen.getByRole('status').textContent).toBe('Copied')
    );
    fireEvent.click(
        screen.getByRole('button', { name: 'Copy Markdown link to Tenant' })
    );
    await waitFor(() =>
        expect(writeText).toHaveBeenLastCalledWith(
            `[Tenant](${location.origin}/docs/glossary#tenant)`
        )
    );
    await waitFor(
        () => expect(screen.getByRole('status').textContent).toBe(''),
        { timeout: 2500 }
    );
    expect(
        within(
            screen.getByRole('navigation', { name: 'On this page' })
        ).getByRole('link', { name: 'Tenant' })
    ).toBeTruthy();
});

it('does not claim success when clipboard is absent or rejects', async () => {
    const { rerender } = render(<DocsLayout {...props}>{glossary}</DocsLayout>);
    fireEvent.click(
        await screen.findByRole('button', { name: 'Copy link to Tenant' })
    );
    expect(screen.queryByText('Copied')).toBeNull();
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
    });
    rerender(<DocsLayout {...props}>{glossary}</DocsLayout>);
    fireEvent.click(
        screen.getByRole('button', { name: 'Copy link to Tenant' })
    );
    await waitFor(() =>
        expect(screen.getByRole('status').textContent).toBe('Copy unavailable')
    );
});

it('rebinds the scroll observer when replacement headings have identical ids and text', async () => {
    const { container, rerender } = render(
        <DocsLayout {...props}>
            <section key="original">{glossary}</section>
        </DocsLayout>
    );
    const original = container.querySelector('#tenant');
    await waitFor(() => expect(observedNodes).toContain(original));
    const originalCount = observedNodes.length;
    rerender(
        <DocsLayout {...props}>
            <section key="replacement">{glossary}</section>
        </DocsLayout>
    );
    const replacement = container.querySelector('#tenant');
    expect(replacement).not.toBe(original);
    expect(original?.isConnected).toBe(false);
    await waitFor(() => expect(observedNodes).toContain(replacement));
    // Our portals must not trigger repeated self-scans or duplicate scroll observers.
    expect(observedNodes.length - originalCount).toBe(26);
});
