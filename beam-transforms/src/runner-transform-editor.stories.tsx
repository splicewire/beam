import type { Meta, StoryObj } from '@storybook/react-vite';
import { RunnerTransformEditor } from './runner-transform-editor';
import { MockTransformsProvider, SAMPLE_TRANSFORMS } from './story-harness';

/**
 * Transforms / RunnerTransformEditor — the authoring surface for sandboxed, user-authored transforms
 * (popcorn-runner-substrate ticket 09; ADR-0116/0141). Portable + DTO-first: owns its react-query
 * data logic, types off the RunnerTransform wire shape, imports only the @schemastud/ui foundation,
 * takes transport + feedback via <TransformsProvider>.
 *
 * Treatment axes: **states** dominates — populated / empty / loading; plus the deny-by-default
 * effective-grant readout (a transform requesting net:open shows the floored effective + denied
 * chip) and the trust chip that flips the primary CTA to "Request review & save".
 */
const meta = {
    title: 'Transforms/RunnerTransformEditor',
    component: RunnerTransformEditor,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <div className="mx-auto w-full max-w-6xl p-4">{Story()}</div>],
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** Populated — the default library with a mix of floored + clean transforms. */
export const Populated: Story = {
    render: () => (
        <MockTransformsProvider config={{ transforms: SAMPLE_TRANSFORMS }}>
            <RunnerTransformEditor />
        </MockTransformsProvider>
    ),
};

/** Empty — the zero-state before any transform is authored. */
export const Empty: Story = {
    render: () => (
        <MockTransformsProvider config={{ listState: 'empty' }}>
            <RunnerTransformEditor />
        </MockTransformsProvider>
    ),
};

/** Loading — the list query held open (the deterministic loading state). */
export const Loading: Story = {
    render: () => (
        <MockTransformsProvider config={{ listState: 'loading' }}>
            <RunnerTransformEditor />
        </MockTransformsProvider>
    ),
};
