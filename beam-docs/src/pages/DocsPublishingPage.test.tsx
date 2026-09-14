import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { setDocsConfiguration } from '../config.js';
import { beamDocsPages } from './index.js';
import DocsPublishingPage from './DocsPublishingPage.js';

vi.mock('@inertiajs/react', () => ({ Head: ({ title }: { title: string }) => <title>{title}</title> }));
afterEach(() => setDocsConfiguration({ registryLinkEndpoint: null }));

it('resolves the operator page and uses its server-provided endpoint and optional docs URL', async () => {
    const transport = vi.fn().mockResolvedValue({ data: [] });
    setDocsConfiguration({ registryLinkEndpoint: null, transport });
    expect((await beamDocsPages['beam-docs/publishing']()).default).toBe(DocsPublishingPage);
    render(<DocsPublishingPage publicationsEndpoint="/operator/docs/publications" docsUrl="/learn/beam" />);
    await screen.findByText(/No releases have been published/);
    expect(transport.mock.calls[0][0]).toBe('/operator/docs/publications');
    expect(screen.getByRole('link', { name: 'Back to documentation' }).getAttribute('href')).toBe('/learn/beam');
});
