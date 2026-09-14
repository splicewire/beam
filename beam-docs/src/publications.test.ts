import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDocsPublicationsClient, fetchDocs, scalarRegistryUrl } from './publications.js';

afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
    document.head.querySelectorAll('meta[name="csrf-token"]').forEach((node) => node.remove());
});

describe('default Laravel transport', () => {
    it('sends the decoded XSRF cookie and same-origin credentials on writes', async () => {
        document.cookie = 'XSRF-TOKEN=token%2Bwith%3Dencoding; path=/';
        const fetch = vi.fn().mockResolvedValue(new Response('{"data":[]}', { status: 200 }));
        vi.stubGlobal('fetch', fetch);
        await fetchDocs('/beam/docs/publications', { method: 'POST', body: '{"version":"v1"}' });
        const init = fetch.mock.calls[0][1] as RequestInit;
        const headers = new Headers(init.headers);
        expect(init.credentials).toBe('same-origin');
        expect(init.cache).toBe('no-store');
        expect(headers.get('X-XSRF-TOKEN')).toBe('token+with=encoding');
        expect(headers.get('Content-Type')).toBe('application/json');
        expect(init.body).toBe('{"version":"v1"}');
    });

    it('uses the Laravel meta token when no XSRF cookie exists', async () => {
        const meta = document.createElement('meta');
        meta.name = 'csrf-token';
        meta.content = 'meta-session-token';
        document.head.append(meta);
        const fetch = vi.fn().mockResolvedValue(new Response('{"data":[]}', { status: 200 }));
        vi.stubGlobal('fetch', fetch);
        await fetchDocs('/beam/docs/publications/release/retry', { method: 'POST' });
        expect(new Headers(fetch.mock.calls[0][1].headers).get('X-CSRF-TOKEN')).toBe('meta-session-token');
    });

    it('rejects an external origin before any request and never exposes response error bodies', async () => {
        const fetch = vi.fn().mockResolvedValue(new Response('secret-token-in-server-debug-page', { status: 500 }));
        vi.stubGlobal('fetch', fetch);
        await expect(fetchDocs('https://outside.example/collect', { method: 'POST' })).rejects.toThrow('this site’s origin');
        expect(fetch).not.toHaveBeenCalled();
        await expect(fetchDocs('/beam/docs/publications')).rejects.toThrow('Try again or check the publishing service');
    });

    it('refuses malformed envelopes instead of reporting an empty successful list', async () => {
        const client = createDocsPublicationsClient('/beam/docs/publications', async () => ({ items: [] }));
        await expect(client.list()).rejects.toThrow('unreadable response');
    });
});

describe('Scalar Registry links', () => {
    it.each([
        'http://registry.scalar.com/@beam/apis/api',
        'https://registry.scalar.com.attacker.example/@beam/apis/api',
        'https://registry.scalar.com@attacker.example/@beam/apis/api',
        'https://secret@registry.scalar.com/@beam/apis/api',
        'https://registry.scalar.com:444/@beam/apis/api',
        'javascript:alert(1)',
        '//registry.scalar.com/@beam/apis/api',
    ])('rejects %s', (url) => {
        expect(scalarRegistryUrl(url)).toBeNull();
    });
});
