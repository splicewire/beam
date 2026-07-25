import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContentSectionNodeView } from './ContentSectionNodeView';
import { makeNodeProps } from './story-harness';

/**
 * Catalog story for the `content_section` NodeView (storybook-authoring convention — the third
 * ADR-0116 promotion deliverable). Ambient axes (token + light/dark) come from the beam workbench
 * global decorators; the capability-gated axis here is STATES (empty / titled / with generation
 * context).
 */
const meta = {
    title: 'Content/ContentSectionNodeView',
    component: ContentSectionNodeView,
    parameters: { layout: 'padded' },
    render: (args) => <ContentSectionNodeView {...args} />,
} satisfies Meta<typeof ContentSectionNodeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Titled: Story = { args: makeNodeProps({ heading: 'Why rapid cooling matters' }) };

export const Empty: Story = { args: makeNodeProps({ heading: '' }) };

export const WithGenerationContext: Story = {
    args: makeNodeProps({
        heading: 'The danger zone',
        strategy: 'First',
        imagePrompt: 'A thermometer in the 40–140°F range',
        groundingTokens: ['fda-food-code', 'cooling-times'],
    }),
};
