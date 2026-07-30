import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, Blocks, CreditCard, Landmark, Receipt, ShieldCheck, Users, Waypoints } from 'lucide-react';
import { SettingsFrame } from './SettingsFrame';
import type { NavTab } from './types';

/**
 * Catalog story for the Settings meta-area layout (extract ticket 05). Sanctioned treatment axes:
 * the **shape of the injected `tabs`** (a short vs long sub-nav) and **which tab is active**, plus
 * the optional `title`. The `tabs` are host-owned DATA passed as a prop — the layout imports no nav.
 */
const FEW_TABS: NavTab[] = [
    { key: 'account', label: 'Account', icon: Users },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'billing', label: 'Billing', icon: CreditCard },
];

const MANY_TABS: NavTab[] = [
    { key: 'account', label: 'Account', icon: Users },
    { key: 'tokens', label: 'API tokens', icon: ShieldCheck },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'models', label: 'Models', icon: Blocks },
    { key: 'grounding', label: 'Grounding', icon: Waypoints },
    { key: 'activity', label: 'Activity', icon: Activity },
    { key: 'usage', label: 'Usage', icon: CreditCard },
    { key: 'subscription', label: 'Subscription', icon: Landmark },
    { key: 'credits', label: 'Credits', icon: Receipt },
];

function SampleContent({ label }: { label: string }) {
    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">{label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Content fills the `flex-1` column right of the sub-nav — left-aligned, never
                    centered in a narrow column.
                </p>
            </div>
            <div className="h-24 rounded-lg border border-dashed border-border" />
        </div>
    );
}

const meta = {
    title: 'UX Prototype/SettingsFrame',
    component: SettingsFrame,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof SettingsFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A short sub-nav; the first tab active. */
export const FewTabs: Story = {
    args: {
        active: 'account',
        tabs: FEW_TABS,
        children: <SampleContent label="Account" />,
    },
};

/** The full folded sub-nav (ticket-01 superset), a middle tab active. */
export const ManyTabs: Story = {
    args: {
        active: 'grounding',
        tabs: MANY_TABS,
        children: <SampleContent label="Grounding" />,
    },
};

/** A custom heading instead of the default "Settings". */
export const CustomTitle: Story = {
    args: {
        active: 'billing',
        title: 'Workspace',
        tabs: FEW_TABS,
        children: <SampleContent label="Billing" />,
    },
};
