// SectionLanding / CardGrid / Card — the scannable gateway pattern: a hero over a
// responsive 1→2→3 card grid, each card a full-card link. Axes: hero states (eyebrow/lede
// present-or-absent), card states (icon present-or-absent), grid VIEWPORT (the column
// reflow). Signal accent + lift ride `--beam-signal`/`--sr-*`; ambient light⊗dark.
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SectionLanding, CardGrid, Card } from './section-landing';
import { withSiteProse } from '../story-harness';

const meta = {
    title: 'Beam/Mdx/Kit/SectionLanding',
    component: SectionLanding,
    decorators: [withSiteProse],
    parameters: { layout: 'fullscreen' },
    // Default arg satisfies SectionLanding's required `heading`; every story below is
    // render-driven (it composes the hero + CardGrid) and ignores this.
    args: { heading: 'Build with Beam' },
} satisfies Meta<typeof SectionLanding>;

export default meta;
type Story = StoryObj<typeof meta>;

// A generic doc icon (inline SVG — the kit takes a ReactNode, never an emoji).
const bookIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5Z" />
        <path d="M8 3v18" />
    </svg>
);

// The full landing: hero (eyebrow + heading + lede) over a three-card grid with icons.
export const FullLanding: Story = {
    render: () => (
        <SectionLanding
            eyebrow="Docs"
            heading="Build with Beam"
            lede="A scannable gateway to the guide tracks — each card is one full-card link target."
        >
            <CardGrid>
                <Card href="#start" title="Getting started" blurb="Install, wire the preset, ship your first page." icon={bookIcon} />
                <Card href="#content" title="Authoring content" blurb="MDX files, frontmatter, the draft convention." icon={bookIcon} />
                <Card href="#deploy" title="Deploying" blurb="Build-time exclusion, tokens, the site prose." icon={bookIcon} />
            </CardGrid>
        </SectionLanding>
    ),
};

// A bare hero — heading only, no eyebrow/lede.
export const HeadingOnly: Story = {
    render: () => (
        <SectionLanding heading="Guides">
            <CardGrid>
                <Card href="#a" title="One" blurb="No icon on these cards." />
                <Card href="#b" title="Two" blurb="Blurb only." />
            </CardGrid>
        </SectionLanding>
    ),
};

// A single card — proves the grid reflows to one column gracefully.
export const SingleCard: Story = {
    render: () => (
        <SectionLanding eyebrow="Reference" heading="API">
            <CardGrid>
                <Card href="#api" title="ContentShow" blurb="The parameterized renderer." icon={bookIcon} />
            </CardGrid>
        </SectionLanding>
    ),
};

// Viewport axis: narrow — the 1→2→3 grid collapses to a single column.
export const MobileViewport: Story = {
    parameters: { viewport: { defaultViewport: 'mobile1' } },
    render: () => (
        <SectionLanding eyebrow="Docs" heading="On mobile" lede="The card grid reflows to one column below 40rem.">
            <CardGrid>
                <Card href="#1" title="First" blurb="Stacks vertically." icon={bookIcon} />
                <Card href="#2" title="Second" blurb="Full-width hit target." icon={bookIcon} />
                <Card href="#3" title="Third" blurb="One column." icon={bookIcon} />
            </CardGrid>
        </SectionLanding>
    ),
};
