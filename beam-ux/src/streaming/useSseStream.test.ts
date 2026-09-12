import { describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSseStream } from './useSseStream';

/**
 * G6-BEAM-UX-SSE-URL-JOIN: the stream URL was built as `${baseURL ?? ''}${path}`, a raw
 * template concatenation with no separator handling. A baseURL of `.../api/v1` (no trailing
 * slash, axios's normal shape) joined to a route path of `circuits/{id}/run` (no leading
 * slash, as `route()`-generated paths are written — relative to the axios baseURL, the same
 * way axios itself would insert the missing '/') collapsed to `.../api/v1circuits/{id}/run`
 * — a 404 in production. This locks the join to mirror what axios does when it composes
 * baseURL + a relative url, across every leading/trailing-slash combination, plus the case
 * where `path` is already absolute (must be used as-is, untouched by baseURL).
 */
describe('useSseStream URL join', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    function captureFetchedUrl(client: { defaults: { baseURL?: string } }, path: string) {
        let capturedUrl: string | undefined;
        const fetchMock = vi.fn().mockImplementation((url: string) => {
            capturedUrl = url;
            return Promise.resolve({
                ok: true,
                body: null,
                [Symbol.asyncIterator]: async function* () {},
            } as unknown as Response);
        });
        vi.stubGlobal('fetch', fetchMock);

        const { result } = renderHook(() =>
            useSseStream<{ event: string; data: unknown }>(client, path),
        );
        act(() => {
            result.current.start();
        });
        return () => capturedUrl;
    }

    function captureFetchedInit(client: { defaults: { baseURL?: string } }, path: string) {
        let capturedInit: RequestInit | undefined;
        const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
            capturedInit = init;
            return Promise.resolve({
                ok: true,
                body: null,
                [Symbol.asyncIterator]: async function* () {},
            } as unknown as Response);
        });
        vi.stubGlobal('fetch', fetchMock);

        const { result } = renderHook(() =>
            useSseStream<{ event: string; data: unknown }>(client, path),
        );
        act(() => {
            result.current.start();
        });
        return () => capturedInit;
    }

    it('joins a baseURL with no trailing slash and a path with no leading slash', () => {
        const getUrl = captureFetchedUrl({ defaults: { baseURL: 'https://beam.test/api/v1' } }, 'circuits/1/run');
        expect(getUrl()).toBe('https://beam.test/api/v1/circuits/1/run');
    });

    it('joins a baseURL with a trailing slash and a path with no leading slash', () => {
        const getUrl = captureFetchedUrl({ defaults: { baseURL: 'https://beam.test/api/v1/' } }, 'circuits/1/run');
        expect(getUrl()).toBe('https://beam.test/api/v1/circuits/1/run');
    });

    it('joins a baseURL with no trailing slash and a path with a leading slash', () => {
        const getUrl = captureFetchedUrl({ defaults: { baseURL: 'https://beam.test/api/v1' } }, '/circuits/1/run');
        expect(getUrl()).toBe('https://beam.test/api/v1/circuits/1/run');
    });

    it('joins a baseURL with a trailing slash and a path with a leading slash without doubling it', () => {
        const getUrl = captureFetchedUrl({ defaults: { baseURL: 'https://beam.test/api/v1/' } }, '/circuits/1/run');
        expect(getUrl()).toBe('https://beam.test/api/v1/circuits/1/run');
    });

    it('uses an absolute path as-is, ignoring baseURL', () => {
        const getUrl = captureFetchedUrl(
            { defaults: { baseURL: 'https://beam.test/api/v1' } },
            'https://other.test/circuits/1/run',
        );
        expect(getUrl()).toBe('https://other.test/circuits/1/run');
    });

    it('uses the bare path when there is no baseURL', () => {
        const getUrl = captureFetchedUrl({ defaults: {} }, '/circuits/1/run');
        expect(getUrl()).toBe('/circuits/1/run');
    });
});

/**
 * G6-FLAGSHIP-PLAYWRIGHT (follow-on, same call site): fixing the URL join above got the request
 * to the right route, but exposed a second, previously-unreachable defect — the fetch carried no
 * `credentials` and no XSRF header, so a session-cookie-authenticated (Sanctum stateful) POST came
 * back 419. `ui/src/lib/chat-transport.ts` (the pattern this hook says it mirrors) and
 * `ui/src/lib/api.ts`'s `xsrfHeaders()` both already send `credentials: 'same-origin'` plus
 * `X-XSRF-TOKEN` read off the `XSRF-TOKEN` cookie — this hook's raw `fetch` dropped both when the
 * bespoke chat transport was generalized into a reusable hook.
 */
describe('useSseStream stateful-session credentials', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });

    function captureFetchedUrl(client: { defaults: { baseURL?: string } }, path: string) {
        const fetchMock = vi.fn().mockImplementation(() => {
            return Promise.resolve({
                ok: true,
                body: null,
                [Symbol.asyncIterator]: async function* () {},
            } as unknown as Response);
        });
        vi.stubGlobal('fetch', fetchMock);

        const { result } = renderHook(() =>
            useSseStream<{ event: string; data: unknown }>(client, path),
        );
        act(() => {
            result.current.start();
        });
        return fetchMock;
    }

    it('sends the decoded XSRF-TOKEN cookie as X-XSRF-TOKEN and same-origin credentials', () => {
        document.cookie = 'XSRF-TOKEN=abc%20def';
        const fetchMock = captureFetchedUrl(
            { defaults: { baseURL: 'https://beam.test/api/v1' } },
            'circuits/1/run',
        );
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect((init.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('abc def');
        expect(init.credentials).toBe('same-origin');
    });

    it('omits X-XSRF-TOKEN when there is no cookie, but still sends same-origin credentials', () => {
        const fetchMock = captureFetchedUrl(
            { defaults: { baseURL: 'https://beam.test/api/v1' } },
            'circuits/1/run',
        );
        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect((init.headers as Record<string, string>)['X-XSRF-TOKEN']).toBeUndefined();
        expect(init.credentials).toBe('same-origin');
    });
});
