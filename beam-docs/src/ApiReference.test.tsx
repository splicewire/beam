import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiReference, SCALAR_CDN_URL } from './ApiReference.js';
import { setDocsConfiguration } from './config.js';
import { configureDocs } from './configure.js';
import type { DocsTransport } from './publications.js';

afterEach(() => {
    setDocsConfiguration({ registryLinkEndpoint: null });
    vi.unstubAllGlobals();
    document.head.querySelectorAll('script').forEach((s) => s.remove());
});

describe('ApiReference', () => {
    it('drives the injected factory and never touches the network', () => {
        const createApiReference = vi.fn();
        const fetch = vi.fn();
        vi.stubGlobal('fetch', fetch);
        render(<ApiReference specUrl="/beam/openapi.json" createApiReference={createApiReference} />);

        expect(createApiReference).toHaveBeenCalledTimes(1);
        const [element, config] = createApiReference.mock.calls[0] as [HTMLElement, Record<string, unknown>];
        expect(element.tagName).toBe('DIV');
        expect(config.url).toBe('/beam/openapi.json');
        expect(config.theme).toBe('default');
        expect(document.head.querySelector('script')).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
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

    it('passes hierarchical tags and all host Scalar options through the injected factory', () => {
        const factory = vi.fn();
        const configuration = { showSidebar: true, content: { 'x-tagGroups': [{ name: 'Accounts', tags: ['Teams'] }] } };
        render(<ApiReference specUrl="/beam/openapi.yaml" createApiReference={factory} configuration={configuration} />);
        expect(factory.mock.calls[0][1]).toMatchObject(configuration);
        expect(factory.mock.calls[0][1].url).toBe('/beam/openapi.yaml');
    });

    it('loads the server-selected successful link when docs integration is configured', async () => {
        const transport = vi.fn<DocsTransport>().mockResolvedValue({ data: { url: 'https://registry.scalar.com/@beam/apis/api/1.0.0' } });
        configureDocs({ transport });
        const factory = vi.fn();
        render(<ApiReference specUrl="/beam/openapi.yaml" createApiReference={factory} />);
        const link = await screen.findByRole('link', { name: 'View published API in Scalar Registry' });
        expect(link.getAttribute('href')).toBe('https://registry.scalar.com/@beam/apis/api/1.0.0');
        expect(transport.mock.calls[0][0]).toBe('/beam/docs/registry-link');
        expect(factory).toHaveBeenCalledTimes(1);
    });

    it('honors an explicitly hidden link without fetching, and rejects an unsafe explicit link', () => {
        const transport = vi.fn<DocsTransport>();
        configureDocs({ transport });
        const factory = vi.fn();
        const { rerender } = render(<ApiReference specUrl="/spec" createApiReference={factory} registryUrl={null} />);
        expect(transport).not.toHaveBeenCalled();
        expect(screen.queryByRole('link')).toBeNull();
        rerender(<ApiReference specUrl="/spec" createApiReference={factory} registryUrl="javascript:alert(1)" />);
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('keeps the local reference when link display is disabled or the endpoint fails', async () => {
        const transport = vi.fn<DocsTransport>().mockResolvedValueOnce({ data: { url: null } })
            .mockRejectedValueOnce(new Error('unavailable'));
        const factory = vi.fn();
        const { rerender } = render(<ApiReference specUrl="/spec" createApiReference={factory} registryLinkEndpoint="/first" transport={transport} />);
        await waitFor(() => expect(transport).toHaveBeenCalledTimes(1));
        expect(screen.queryByRole('link')).toBeNull();
        rerender(<ApiReference specUrl="/spec" createApiReference={factory} registryLinkEndpoint="/second" transport={transport} />);
        await waitFor(() => expect(transport).toHaveBeenCalledTimes(2));
        expect(screen.queryByRole('link')).toBeNull();
        expect(factory).toHaveBeenCalledTimes(1);
    });
});
