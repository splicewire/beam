import { createElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { describe, expect, it } from 'vitest';

import { compileMdx, fetchMdx, RemoteMdx } from './runtime-mdx';

describe('compileMdx — runtime MDX render', () => {
    it('renders raw MDX text through a supplied component map (kit fidelity)', async () => {
        const source = [
            '---',
            'title: Guarded',
            '---',
            '',
            '# Heading',
            '',
            '<Callout type="tip">Secret tip</Callout>',
            '',
            'Plain paragraph.',
        ].join('\n');

        // A stand-in kit component: the runtime path must route MDX tags to it.
        const Callout = ({ type, children }: { type?: string; children?: ReactNode }) =>
            createElement('aside', { 'data-kind': 'callout', 'data-type': type }, children);

        const Content = await compileMdx(source);
        const html = renderToStaticMarkup(
            createElement(Content, { components: { Callout } }),
        );

        expect(html).toContain('<h1>Heading</h1>');
        expect(html).toContain('data-kind="callout"');
        expect(html).toContain('data-type="tip"');
        expect(html).toContain('Secret tip');
        expect(html).toContain('Plain paragraph.');
        // The frontmatter block is stripped, never rendered as body text.
        expect(html).not.toContain('title: Guarded');
    });

    it('throws on malformed MDX so the caller can show an error state', async () => {
        await expect(compileMdx('<Unclosed>')).rejects.toThrow();
    });
});

describe('fetchMdx — the default RemoteMdx transport', () => {
    it('GETs the source as text/markdown same-origin and returns the body', async () => {
        const calls: Array<[string, RequestInit | undefined]> = [];
        const original = globalThis.fetch;
        globalThis.fetch = ((url: string, init?: RequestInit) => {
            calls.push([url, init]);
            return Promise.resolve({ ok: true, text: () => Promise.resolve('# Hi') } as Response);
        }) as typeof fetch;

        try {
            const text = await fetchMdx('/docs/guarded/docs/build/secret');

            expect(text).toBe('# Hi');
            expect(calls[0][0]).toBe('/docs/guarded/docs/build/secret');
            expect(calls[0][1]?.credentials).toBe('same-origin');
            expect((calls[0][1]?.headers as Record<string, string>).Accept).toBe('text/markdown');
        } finally {
            globalThis.fetch = original;
        }
    });

    it('throws on a non-2xx so the error path runs', async () => {
        const original = globalThis.fetch;
        globalThis.fetch = (() => Promise.resolve({ ok: false, status: 404 } as Response)) as typeof fetch;

        try {
            await expect(fetchMdx('/x')).rejects.toThrow('404');
        } finally {
            globalThis.fetch = original;
        }
    });
});

describe('RemoteMdx', () => {
    it('shows the fallback while the fetch is in flight (transport overridable via `fetcher`)', () => {
        // Synchronous render ⇒ the effect (fetch) has not resolved ⇒ the fallback shows. A custom
        // `fetcher` would supply the text; here we only assert the pre-fetch contract.
        const html = renderToStaticMarkup(
            createElement(RemoteMdx, {
                source: '/x',
                fetcher: () => Promise.resolve('# never awaited synchronously'),
                fallback: createElement('p', null, 'Loading'),
            }),
        );

        expect(html).toContain('Loading');
    });
});
