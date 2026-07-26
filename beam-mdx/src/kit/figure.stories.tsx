// Figure — a captioned, framed exhibit. Axis: the two body shapes (an `img` via
// `src`+`alt`, or inline `children` — an ASCII/SVG diagram) ⊗ caption present/absent.
// Framed off `--sr-hairline`/`--beam-muted`; ambient light⊗dark.
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Figure } from './figure';
import { withSiteProse } from '../story-harness';

const meta = {
    title: 'Beam/Mdx/Kit/Figure',
    component: Figure,
    decorators: [withSiteProse],
    parameters: { layout: 'centered' },
} satisfies Meta<typeof Figure>;

export default meta;
type Story = StoryObj<typeof meta>;

// An inline SVG exhibit with a caption (no external image needed for the catalog).
export const InlineDiagram: Story = {
    render: () => (
        <Figure caption="The content plane: MDX files → resolver → ContentShow.">
            <svg viewBox="0 0 320 80" role="img" aria-label="content pipeline">
                <rect x="4" y="24" width="80" height="32" rx="4" fill="var(--beam-green-tint)" stroke="var(--sr-hairline)" />
                <text x="44" y="44" textAnchor="middle" fontSize="11" fill="var(--sr-heading)">.mdx</text>
                <line x1="88" y1="40" x2="120" y2="40" stroke="var(--sr-dim)" strokeWidth="1.5" />
                <rect x="120" y="24" width="80" height="32" rx="4" fill="var(--beam-green-tint)" stroke="var(--sr-hairline)" />
                <text x="160" y="44" textAnchor="middle" fontSize="11" fill="var(--sr-heading)">resolve</text>
                <line x1="204" y1="40" x2="236" y2="40" stroke="var(--sr-dim)" strokeWidth="1.5" />
                <rect x="236" y="24" width="80" height="32" rx="4" fill="var(--beam-green-tint)" stroke="var(--sr-hairline)" />
                <text x="276" y="44" textAnchor="middle" fontSize="11" fill="var(--sr-heading)">Show</text>
            </svg>
        </Figure>
    ),
};

// An ASCII exhibit inside a `<pre>` — the framed body scrolls if wide.
export const AsciiExhibit: Story = {
    render: () => (
        <Figure caption="A minimal deployment root.">
            <pre>{`[ deployment root ]
   └── <ContentShow slug="about" />
        └── .site-prose`}</pre>
        </Figure>
    ),
};

// An image body — a solid data-URI placeholder (self-contained, no network).
export const ImageWithCaption: Story = {
    args: {
        src:
            'data:image/svg+xml;utf8,' +
            encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="180"><rect width="480" height="180" fill="%2314803f"/><text x="240" y="98" font-size="20" fill="white" text-anchor="middle" font-family="sans-serif">screenshot</text></svg>',
            ),
        alt: 'A demo screenshot',
        caption: 'Every screenshot says what it demonstrates (src + alt required together).',
    },
};

// No caption — the framed body only.
export const Uncaptioned: Story = {
    render: () => (
        <Figure>
            <pre>{'no caption — just the frame'}</pre>
        </Figure>
    ),
};
