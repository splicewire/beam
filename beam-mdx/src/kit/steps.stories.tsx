// Steps / Step — an auto-numbered procedure list with a vertical rail. No enum axes
// (the sanctioned axis is STATES-of-content: titled vs untitled, count); the CSS counter
// numbers the markers, the rail + markers ride `--sr-*`/`--beam-*` tokens. Ambient light⊗dark.
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Steps, Step } from './steps';
import { withSiteProse } from '../story-harness';

const meta = {
    title: 'Beam/Mdx/Kit/Steps',
    component: Steps,
    decorators: [withSiteProse],
    parameters: { layout: 'centered' },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

// The canonical titled procedure — markers auto-number, the rail stops at the last step.
export const TitledProcedure: Story = {
    render: () => (
        <Steps>
            <Step title="Install the package">
                Add <code>@splicewire/beam-mdx</code> to your satellite and wire the Vite preset.
            </Step>
            <Step title="Author your MDX">
                Drop a <code>.mdx</code> file under <code>content/</code>; the kit components
                compose inline.
            </Step>
            <Step title="Ship it">
                The build-time draft-exclusion plugin omits undated drafts from prod bundles.
            </Step>
        </Steps>
    ),
};

// Untitled steps — body only; the marker + rail still carry the sequence.
export const UntitledSteps: Story = {
    render: () => (
        <Steps>
            <Step>Clone the starter.</Step>
            <Step>Run the dev server.</Step>
            <Step>Open the docs site.</Step>
        </Steps>
    ),
};

// A single step — the rail hides (no `:last-child` line).
export const SingleStep: Story = {
    render: () => (
        <Steps>
            <Step title="The only step">One step: the rail has nothing to connect to.</Step>
        </Steps>
    ),
};
