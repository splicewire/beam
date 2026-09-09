import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntakeProvider } from './provider';
import { IntakeSectionForm } from './IntakeSectionForm';
import { emptySection, populatedSection, receipt } from './story-fixtures';
import type { IntakeClient } from './types';

function Harness({
    children,
    client,
}: {
    children: ReactNode;
    client: IntakeClient;
}) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: { mutations: { retry: false } },
            }),
    );
    return (
        <QueryClientProvider client={queryClient}>
            <IntakeProvider services={{ client }}>{children}</IntakeProvider>
        </QueryClientProvider>
    );
}
const clients = {
    success: { submit: async () => receipt },
    loading: { submit: () => new Promise<typeof receipt>(() => {}) },
    failed: {
        submit: async () => {
            throw new Error('Submission was rejected. Please try again.');
        },
    },
} satisfies Record<string, IntakeClient>;

const meta = {
    title: 'Intake/IntakeSectionForm',
    component: IntakeSectionForm,
    args: { section: emptySection },
    parameters: { layout: 'padded' },
    decorators: [
        (Story, context) => (
            <Harness
                client={context.parameters.intakeClient ?? clients.success}
            >
                <Story />
            </Harness>
        ),
    ],
} satisfies Meta<typeof IntakeSectionForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Populated: Story = { args: { section: populatedSection } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = {
    parameters: { intakeClient: clients.loading },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
        await expect(canvas.findByRole('status')).resolves.toHaveTextContent(
            'Submitting section',
        );
    },
};
export const Failed: Story = {
    parameters: { intakeClient: clients.failed },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
        await expect(canvas.findByRole('alert')).resolves.toHaveTextContent(
            'Submission was rejected',
        );
    },
};
export const Success: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /submit/i }));
        await expect(canvas.findByRole('status')).resolves.toHaveTextContent(
            receipt.submission_id,
        );
    },
};
export const Mobile: Story = {
    globals: { viewport: { value: 'mobile1', isRotated: false } },
    decorators: [
        (Story) => (
            <div style={{ width: '100%', maxWidth: 320 }}>
                <Story />
            </div>
        ),
    ],
};
export const Desktop: Story = {
    decorators: [
        (Story) => (
            <div style={{ width: 768 }}>
                <Story />
            </div>
        ),
    ],
};
// Token/colorScheme are ambient: beam's existing workbench seeds light and dark.
