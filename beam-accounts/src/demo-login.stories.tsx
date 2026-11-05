import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { DemoLogin, type DemoLoginUser } from './demo-login';
import { LoginPanel } from './login-panel';
import { AuthStage, MockAuthProvider } from './story-harness';

/**
 * Accounts / DemoLogin — the login page's demo sign-in (S1, owner-review-20261026 ticket 01). The demo-subject roster
 * as one-click buttons and, on a local host with the third demo gate open, a typeahead that signs in as ANY user.
 *
 * Every gate is the server's: the roster arrives only in demo mode, the search URL only on `APP_ENV=local` with
 * `ACCOUNT_DEMO_USER_PICKER` on. The component draws what it is given. Treatment axes: **composition** (roster only,
 * picker only, both, mounted in `LoginPanel`'s footer) and the picker's **states** (open on the roster, narrowed,
 * no match). Ambient light ⊗ dark inherited; every colour is a semantic token.
 *
 * Fixtures only: the search is a stub over a fixed list, and no story follows a link.
 */
const meta = {
    title: 'Accounts/DemoLogin',
    component: DemoLogin,
    parameters: { layout: 'padded' },
    decorators: [(Story) => <AuthStage>{Story()}</AuthStage>],
} satisfies Meta<typeof DemoLogin>;

export default meta;
type Story = StoryObj<typeof meta>;

const ACCOUNTS = [
    { key: 'owner', label: 'Demo Owner', url: '#owner' },
    { key: 'admin', label: 'Demo Operator', url: '#admin' },
    { key: 'member', label: 'Demo Member', url: '#member' },
    { key: 'solo', label: 'Demo Solo', url: '#solo' },
];

const USERS: DemoLoginUser[] = [
    { id: 'u1', name: 'Ada Lovelace', email: 'ada@numero.example', url: '#u1' },
    { id: 'u2', name: 'Alan Turing', email: 'alan@numero.example', url: '#u2' },
    { id: 'u3', name: 'Grace Hopper', email: 'grace@audiostud.example', url: '#u3' },
    { id: 'u4', name: 'Katherine Johnson', email: 'katherine@tower.example', url: '#u4' },
    { id: 'u5', name: 'Stephen Rushing', email: 'stephen@stephenrushing.example', url: '#u5' },
];

const search = async (query: string) => {
    const needle = query.trim().toLowerCase();
    return USERS.filter((user) => !needle || `${user.name} ${user.email}`.toLowerCase().includes(needle));
};

const noop = () => {};

/** Demo mode on, picker gate closed (any non-local host): the roster only. */
export const RosterOnly: Story = {
    args: { accounts: ACCOUNTS, onSelect: noop },
};

/** A local host with every gate open but no seeded demo subjects: the picker only. */
export const PickerOnly: Story = {
    args: { search, onSelect: noop },
};

/** A local host with every gate open: the roster and the picker. */
export const RosterAndPicker: Story = {
    args: { accounts: ACCOUNTS, search, onSelect: noop },
};

/** The picker opened: an empty query lists the first users by name, each with its email to tell them apart. */
export const PickerOpen: Story = {
    args: { accounts: ACCOUNTS, search, onSelect: noop },
    parameters: { docs: { story: { height: '420px' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /sign in as any user/i }));
        await expect(await canvas.findByText('Katherine Johnson')).toBeInTheDocument();
    },
};

/** Typing narrows by name or email. */
export const PickerNarrowed: Story = {
    args: { accounts: ACCOUNTS, search, onSelect: noop },
    parameters: { docs: { story: { height: '420px' } } },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /sign in as any user/i }));
        await userEvent.type(canvas.getByLabelText('Search by name or email'), 'numero');
        await expect(await canvas.findByText('Alan Turing')).toBeInTheDocument();
    },
};

/** A query that matches nobody says so. */
export const PickerNoMatch: Story = {
    args: { search, onSelect: noop },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: /sign in as any user/i }));
        await userEvent.type(canvas.getByLabelText('Search by name or email'), 'nobody');
        await expect(await canvas.findByText('No user matches')).toBeInTheDocument();
    },
};

/** Nothing published (production, or demo mode off): nothing drawn. */
export const Closed: Story = {
    args: { accounts: [], searchUrl: null, onSelect: noop },
};

/** Where a host mounts it: `LoginPanel`'s existing `footer` slot, under the form. */
export const InLoginPanel: Story = {
    render: () => (
        <MockAuthProvider>
            <div className="mx-auto w-full max-w-sm">
                <LoginPanel onSuccess={noop} showForgotLink showRemember footer={<DemoLogin accounts={ACCOUNTS} search={search} onSelect={noop} />} />
            </div>
        </MockAuthProvider>
    ),
};
