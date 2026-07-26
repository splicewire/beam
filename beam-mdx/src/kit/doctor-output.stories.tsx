// DoctorOutput — renders captured `splicewire:beam:doctor` text as a Pass/Warn/Fail
// readiness report. Axis: the STATES of a report (all-pass / mixed / all-fail) ⊗ the two
// input shapes (`raw` prop vs. children). Status pips/labels ride the `--beam-green/warn/
// danger` tokens; ambient light⊗dark.
import type { Meta, StoryObj } from '@storybook/react-vite';

import { DoctorOutput } from './doctor-output';
import { withSiteProse } from '../story-harness';

const meta = {
    title: 'Beam/Mdx/Kit/DoctorOutput',
    component: DoctorOutput,
    decorators: [withSiteProse],
    parameters: { layout: 'centered' },
} satisfies Meta<typeof DoctorOutput>;

export default meta;
type Story = StoryObj<typeof meta>;

const mixed = `PASS  Vite preset: registered and building the content map
PASS  Tokens: --sr-* + --beam-* resolved
WARN  Draftable prefixes: broadcasts/ has 3 undated entries
INFO  References: 12 live, 2 pending
FAIL  Site prose: .site-prose stylesheet not imported`;

// The `raw` prop — a mixed report exercising every status level + the summary tally.
export const MixedReport: Story = { args: { raw: mixed } };

// All-pass — the healthy path.
export const AllPass: Story = {
    args: {
        raw: `PASS  Vite preset: registered
PASS  Content map: 42 files
PASS  Tokens: resolved
PASS  Site prose: imported`,
    },
};

// All-fail — the broken path (red pips dominate).
export const AllFail: Story = {
    args: {
        raw: `FAIL  Vite preset: not registered
FAIL  Content map: empty
ERROR Tokens: --sr-* undefined`,
    },
};

// The children shape — text passed as a child instead of the `raw` prop.
export const FromChildren: Story = {
    render: () => (
        <DoctorOutput>
            {`PASS  One check passed
WARN  One advisory
FAIL  One failure`}
        </DoctorOutput>
    ),
};
