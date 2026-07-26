// Content — the embed-by-reference renderer: `<Content name>` resolves an authored
// fragment from the content map (fixtured here via CitationHarness's fixtureResolve) and
// renders it inline, bare (its own frontmatter layout ignored). Axis = STATES: resolved
// fragment / unknown name (renders null, warns in DEV). Ambient light⊗dark under .site-prose.
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Content } from './content';
import { CitationHarness, SiteProse } from '../story-harness';

const meta = {
    title: 'Beam/Mdx/Content',
    component: Content,
    parameters: { layout: 'centered' },
    // Default arg satisfies Content's required `name`; every story below is render-driven
    // (it wraps Content in the CitationHarness) and ignores this.
    args: { name: 'fragments/callout-note' },
} satisfies Meta<typeof Content>;

export default meta;
type Story = StoryObj<typeof meta>;

// A resolved fragment — embedded inline from the fixture content map.
export const Resolved: Story = {
    render: () => (
        <SiteProse>
            <CitationHarness>
                <p>Prose before the embed.</p>
                <Content name="fragments/callout-note" />
                <p>Prose after the embed.</p>
            </CitationHarness>
        </SiteProse>
    ),
};

// Two distinct fragments embedded on one page — a shared block dropped in many places.
export const MultipleEmbeds: Story = {
    render: () => (
        <SiteProse>
            <CitationHarness>
                <Content name="fragments/pricing-blurb" />
                <Content name="fragments/callout-note" />
            </CitationHarness>
        </SiteProse>
    ),
};

// An unknown name — renders nothing (a DEV-only console warning; no crash, no blank slot noise).
export const UnknownName: Story = {
    render: () => (
        <SiteProse>
            <CitationHarness>
                <p>
                    The next embed points at a missing file, so it renders nothing (below this
                    line):
                </p>
                <Content name="fragments/does-not-exist" />
            </CitationHarness>
        </SiteProse>
    ),
};
