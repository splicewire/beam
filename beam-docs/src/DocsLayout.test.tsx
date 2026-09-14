import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    clearChromeRegistry, configureEntryPage, entryPageConfig, registerLayout, resetEntryPageConfig,
    resolveLayout, SpreadTemplate, ProseTemplate, type ChromeProps,
} from '@splicewire/beam-ux/docs';
import { ApiReference } from './ApiReference.js';
import { configureDocs } from './configure.js';
import { DocsLayout } from './DocsLayout.js';

const entry = { id: 'guide', slug: 'api-keys', title: 'API keys', type: 'page', format: 'mdx', url: '/docs/api-keys' };
const props = { entry, nav: null, currentHref: '/docs/api-keys' };

beforeEach(() => {
    clearChromeRegistry();
    resetEntryPageConfig();
});

describe('explicit documentation registration', () => {
    it('leaves generic UX without a docs layout until the capability is configured', () => {
        expect(resolveLayout('DocsLayout')).toBeNull();
        expect(entryPageConfig().components?.ApiReference).toBeUndefined();
        configureDocs();
        expect(resolveLayout('DocsLayout')).toBe(DocsLayout);
        expect(entryPageConfig().components?.ApiReference).toBe(ApiReference);
    });

    it('retains host factory wrappers, other body components and registered layout overrides', () => {
        const ThemedReference = () => <div>Host Scalar wrapper</div>;
        const Other = () => <div>Other component</div>;
        const HostLayout = ({ children }: ChromeProps) => <article>{children}</article>;
        configureEntryPage({ components: { ApiReference: ThemedReference, Other } });
        registerLayout('DocsLayout', HostLayout);
        configureDocs();
        expect(entryPageConfig().components).toEqual({ ApiReference: ThemedReference, Other });
        expect(resolveLayout('DocsLayout')).toBe(HostLayout);
    });
});

describe('DocsLayout', () => {
    it('gives a spread reference the viewport and keeps the rail beside a prose guide', () => {
        const { container, rerender } = render(
            <DocsLayout {...props}><SpreadTemplate {...props}><div>Reference</div></SpreadTemplate></DocsLayout>,
        );
        const style = (selector: string) => getComputedStyle(container.querySelector(selector)!);
        expect(style('.beam-docs-rail').display).toBe('none');
        expect(style('.beam-docs-aside').display).toBe('none');
        expect(style('.beam-docs-body').maxWidth).toBe('none');
        rerender(<DocsLayout {...props}><ProseTemplate {...props}><p>Guide</p></ProseTemplate></DocsLayout>);
        expect(style('.beam-docs-rail').display).not.toBe('none');
    });

    it('derives the rail from the current section after the docs root moves', () => {
        render(<DocsLayout {...props} currentHref="/learn/beam/api-keys" nav={{ items: [
            { title: 'Pricing', href: '/pricing' },
            { title: 'Docs', href: '/learn/beam', children: [{ title: 'API keys', href: '/learn/beam/api-keys' }] },
        ] }}><p>Guide</p></DocsLayout>);
        expect(screen.getByRole('link', { name: 'API keys' }).getAttribute('href')).toBe('/learn/beam/api-keys');
        expect(screen.queryByText('Pricing')).toBeNull();
    });
});
