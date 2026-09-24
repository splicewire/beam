import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect } from 'storybook/test';
import { CreateTeamForm } from './create-team-form';

/**
 * Accounts / CreateTeamForm — the `teams.create` page body (beam-inertia `account/create-team`). One
 * field; the submit stays disabled until a name is typed. States: empty, filled, submitting, and the
 * server's `name` validation error echoed back.
 */
const meta = {
    title: 'Accounts/CreateTeamForm',
    component: CreateTeamForm,
    parameters: { layout: 'padded' },
    args: { onSubmit: () => {}, cancelHref: '/dashboard' },
} satisfies Meta<typeof CreateTeamForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty — the first-run user's view; "Create team" is disabled until there is a name. */
export const Default: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Create team' })).toBeDisabled();
    },
};

/** Filled — `play` types a name, which enables the submit. */
export const Filled: Story = {
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.type(canvas.getByLabelText('Team name'), 'Rocket Club');
        await expect(canvas.getByRole('button', { name: 'Create team' })).toBeEnabled();
    },
};

/** Submitting — the host's request is in flight. */
export const Submitting: Story = {
    args: { defaultName: 'Rocket Club', processing: true },
};

/** Validation error — the operation refused the name and the page handed the error back. */
export const NameError: Story = {
    args: { defaultName: 'x', errors: { name: 'The name field must not be greater than 255 characters.' } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('alert')).toHaveTextContent(/255 characters/);
    },
};
