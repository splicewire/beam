import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiReference, SCALAR_CDN_URL } from './ApiReference.js';

afterEach(() => {
    vi.unstubAllGlobals();
    document.head.querySelectorAll('script').forEach((s) => s.remove());
});

describe('ApiReference', () => {
    it('drives the injected factory and never touches the network', () => {
        const createApiReference = vi.fn();
        render(<ApiReference specUrl="/beam/openapi.json" createApiReference={createApiReference} />);

        expect(createApiReference).toHaveBeenCalledTimes(1);
        const [element, config] = createApiReference.mock.calls[0] as [HTMLElement, Record<string, unknown>];
        expect(element.tagName).toBe('DIV');
        expect(config.url).toBe('/beam/openapi.json');
        expect(config.theme).toBe('default');
        expect(document.head.querySelector('script')).toBeNull();
    });

    it('bakes in the MCP-layer curation and appends host theme css after it', () => {
        const createApiReference = vi.fn();
        render(
            <ApiReference
                specUrl="/beam/openapi.json"
                createApiReference={createApiReference}
                customCss=".scalar-app { --scalar-font: 'Space Grotesk'; }"
            />,
        );
        const css = String((createApiReference.mock.calls[0][1] as Record<string, unknown>).customCss);
        expect(css).toContain('.scalar-mcp-layer { display: none !important; }');
        expect(css).toContain("--scalar-font: 'Space Grotesk'");
        expect(css.indexOf('scalar-mcp-layer')).toBeLessThan(css.indexOf('Space Grotesk'));
    });

    it('omits the curation when the host opts out, and ships no palette of its own', () => {
        const createApiReference = vi.fn();
        render(
            <ApiReference specUrl="/s.json" createApiReference={createApiReference} hideMcpLayer={false} />,
        );
        expect((createApiReference.mock.calls[0][1] as Record<string, unknown>).customCss).toBeUndefined();
    });

    it('falls back to a script load from the configurable url when no factory is injected', async () => {
        render(<ApiReference specUrl="/s.json" scriptUrl="/vendor/scalar.js" />);
        await waitFor(() => {
            const script = document.head.querySelector('script');
            expect(script?.getAttribute('src')).toBe('/vendor/scalar.js');
        });
        expect(SCALAR_CDN_URL).toBe('https://cdn.jsdelivr.net/npm/@scalar/api-reference');
    });

    it('uses a factory already on the global when the renderer is present', () => {
        const createApiReference = vi.fn();
        vi.stubGlobal('Scalar', { createApiReference });
        render(<ApiReference specUrl="/s.json" />);
        expect(createApiReference).toHaveBeenCalledTimes(1);
        expect(document.head.querySelector('script')).toBeNull();
    });

    it('clears the renderer-owned subtree on unmount', () => {
        const createApiReference = vi.fn((element: string | HTMLElement) => {
            (element as HTMLElement).appendChild(document.createElement('span'));
        });
        const { container, unmount } = render(
            <ApiReference specUrl="/s.json" createApiReference={createApiReference} />,
        );
        const mount = container.querySelector('[data-beam-ux-api-reference]') as HTMLElement;
        expect(mount.childElementCount).toBe(1);
        unmount();
        expect(mount.childElementCount).toBe(0);
    });
});
