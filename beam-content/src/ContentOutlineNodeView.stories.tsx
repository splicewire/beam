import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContentOutlineNodeView } from './ContentOutlineNodeView';
import { makeNodeProps } from './story-harness';

/**
 * Catalog story for the `content_outline` NodeView (storybook-authoring convention). Ambient axes
 * (token + light/dark) come from the beam workbench global decorators; the capability-gated axis
 * here is STATES (empty / populated outline).
 */
const meta = {
    title: 'Content/ContentOutlineNodeView',
    component: ContentOutlineNodeView,
    parameters: { layout: 'padded' },
    render: (args) => <ContentOutlineNodeView {...args} />,
} satisfies Meta<typeof ContentOutlineNodeView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
    args: makeNodeProps({
        title: 'Cooling Cooked Foods Safely',
        excerpt: 'How to move hot food through the danger zone before pathogens grow.',
        sectionHeadings: ['Why rapid cooling matters', 'The two-stage rule', 'Practical cooling methods'],
    }),
};

export const Empty: Story = { args: makeNodeProps({ title: '', excerpt: '', sectionHeadings: [] }) };
