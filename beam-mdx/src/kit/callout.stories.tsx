// Callout — the admonition box. Its sanctioned axis is the `type` VARIANT
// (note/tip/info/warning/danger), each keying a tinted background + left accent bar off
// the `--beam-*` status tokens via kit.css. light⊗dark is ambient (the toolbar); the
// tints/accents point at semantic/`--beam-*` tokens so they re-skin under `.dark`.
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Callout, type CalloutType } from './callout';
import { withSiteProse } from '../story-harness';

const meta = {
    title: 'Beam/Mdx/Kit/Callout',
    component: Callout,
    decorators: [withSiteProse],
    parameters: { layout: 'centered' },
    args: {
        title: 'Heads up',
        children: 'Callouts draw the eye to an admonition inside long-form prose.',
    },
    argTypes: {
        type: {
            control: 'inline-radio',
            options: ['note', 'tip', 'info', 'warning', 'danger'] satisfies CalloutType[],
        },
    },
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- The variant axis, one story per tone ---
export const Note: Story = { args: { type: 'note' } };
export const Tip: Story = { args: { type: 'tip', title: 'Tip' } };
export const Info: Story = { args: { type: 'info', title: 'Note' } };
export const Warning: Story = { args: { type: 'warning', title: 'Careful' } };
export const Danger: Story = { args: { type: 'danger', title: 'Stop' } };

// Untitled — the title is optional; body only.
export const Untitled: Story = { args: { type: 'note', title: undefined } };

// The full variant matrix on one canvas (the pilot's `AllVariants` shape).
export const AllTones: Story = {
    render: () => (
        <>
            {(['note', 'tip', 'info', 'warning', 'danger'] as CalloutType[]).map((type) => (
                <Callout key={type} type={type} title={type[0].toUpperCase() + type.slice(1)}>
                    A <code>{type}</code> callout — its tint + accent ride the{' '}
                    <code>--beam-*</code> status tokens.
                </Callout>
            ))}
        </>
    ),
};
