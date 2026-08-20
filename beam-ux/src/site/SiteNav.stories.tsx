import type { Meta, StoryObj } from '@storybook/react-vite';
import { SiteNav } from './SiteNav';
import type { SiteNavData } from './types';

/**
 * Catalog stories for {@link SiteNav}. Its axis is **which slice of the projection, at what depth** —
 * one `NavProjector` payload serves both the flat header row and a nested docs sidebar (ADR-0210 §5),
 * which is why there is no second `<DocsNav>` component.
 */
const meta = {
    title: 'BeamUx/Site/SiteNav',
    component: SiteNav,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof SiteNav>;

export default meta;

/** One projected `site` sitemap — the same payload every story below reads. */
const nav: SiteNavData = {
    items: [
        { title: 'Home', href: '/' },
        { title: 'Pricing', href: '/pricing' },
        {
            title: 'Docs',
            href: '/beam/docs',
            children: [
                {
                    title: 'Reference',
                    href: '/beam/docs/reference',
                    children: [
                        { title: 'API', href: '/beam/docs/reference/api' },
                        { title: 'MCP', href: '/beam/docs/reference/mcp' },
                    ],
                },
                {
                    title: 'Guides',
                    href: '/beam/docs/guides',
                    children: [{ title: 'Installing beam', href: '/beam/docs/guides/install' }],
                },
            ],
        },
    ],
};

/** The header row — the historical default, unchanged: a bare fragment of top-level links. */
export const HeaderRow: StoryObj = {
    render: () => <SiteNav nav={nav} itemStyle={{ marginRight: '1rem' }} />,
};

/** The docs sidebar — same payload, `rootPath` selects the subtree and `maxDepth` nests it. */
export const DocsSidebar: StoryObj = {
    render: () => <SiteNav nav={nav} rootPath="/beam/docs" maxDepth={3} />,
};

/** `maxDepth` truncates: sections listed, their leaves withheld. */
export const DocsSidebarSectionsOnly: StoryObj = {
    render: () => <SiteNav nav={nav} rootPath="/beam/docs" maxDepth={2} />,
};

/** A missing root renders nothing — the honest signal that the docs root segment moved. */
export const RootNotFound: StoryObj = {
    render: () => <SiteNav nav={nav} rootPath="/docs" maxDepth={3} />,
};
