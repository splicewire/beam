import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransformsProvider } from './provider';
import { RunnerTransformEditor } from './runner-transform-editor';
import { makeTransformsClient, MockTransformsProvider, SAMPLE_TRANSFORMS } from './story-harness';

/**
 * Transforms / RunnerTransformEditor — the authoring surface for sandboxed, user-authored transforms
 * (popcorn-runner-substrate ticket 09; ADR-0116/0141). Portable + DTO-first: owns its react-query
 * data logic, types off the RunnerTransform wire shape, imports only the @schemastud/ui foundation,
 * takes transport + feedback via <TransformsProvider>.
 *
 * Treatment axes: **states** dominates — populated / empty / loading / refusal / read recovery; plus the deny-by-default
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

function FailedRead({ status }: { status: number | 'network' }) {
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: { queries: { retry: false, gcTime: 0 } },
            }),
        [status]
    );
    const client = useMemo(() => {
        let calls = 0;
        return {
            ...makeTransformsClient(),
            list: async () => {
                if (++calls > 1 && (status === 'network' || status >= 500))
                    return SAMPLE_TRANSFORMS;
                if (status === 'network') throw new Error('Private transport detail');
                throw {
                    response: { status, data: { message: 'Private transport detail' } },
                };
            },
        };
    }, [status]);
    return (
        <QueryClientProvider client={queryClient}>
            <TransformsProvider services={{ client }}>
                <RunnerTransformEditor />
            </TransformsProvider>
        </QueryClientProvider>
    );
}

const refusalPlay: Story['play'] = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('alert')).toHaveTextContent(
        'You do not have access to transforms.'
    );
    await expect(canvasElement.querySelector('[data-page-state]')).toHaveAttribute(
        'data-page-state',
        'forbidden'
    );
    await expect(canvas.queryByText('No transforms yet')).not.toBeInTheDocument();
    await expect(canvas.queryByLabelText('Name')).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
};

export const Forbidden: Story = {
    render: () => <FailedRead status={403} />,
    play: refusalPlay,
};
export const Unauthenticated: Story = {
    render: () => <FailedRead status={401} />,
    play: refusalPlay,
};

export const ClientError: Story = {
    render: () => <FailedRead status={422} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('alert')).toHaveTextContent(
            'Could not load transforms.'
        );
        await expect(canvasElement.querySelector('[data-page-state]')).toHaveAttribute(
            'data-page-state',
            'error'
        );
        await expect(canvas.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
        await expect(canvas.queryByText('No transforms yet')).not.toBeInTheDocument();
    },
};

const recoveryPlay: Story['play'] = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Could not load transforms.');
    await expect(canvasElement.querySelector('[data-page-state]')).toHaveAttribute(
        'data-page-state',
        'error'
    );
    await expect(canvas.queryByText('No transforms yet')).not.toBeInTheDocument();
    await expect(canvas.queryByLabelText('Name')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(await canvas.findByText('Shape payload')).toBeVisible();
    await expect(canvasElement.querySelector('[data-page-state]')).toHaveAttribute(
        'data-page-state',
        'ready'
    );
};

export const ReadFailureRetry: Story = {
    render: () => <FailedRead status={503} />,
    play: recoveryPlay,
};
export const NetworkFailureRetry: Story = {
    render: () => <FailedRead status="network" />,
    play: recoveryPlay,
};
