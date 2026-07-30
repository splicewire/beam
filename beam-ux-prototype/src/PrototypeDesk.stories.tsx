import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, Blocks, Building, CalendarDays, Cable, Clapperboard, Library, MessagesSquare, Plug, Settings, ShieldCheck, Workflow } from 'lucide-react';
import { Crumb, PrototypeDesk } from './PrototypeDesk';
import type { NavGroup } from './types';

/**
 * Catalog story for the desk shell (extract ticket 05). Proves the shell renders with **no host
 * `@/` dependency**: the two couplings are injected here — a stub `BrandComponent` and sample
 * `nav` groups. Sanctioned treatment axes: **canvas** (`dotted` work surface vs `flat` Settings
 * surface), **brand present vs absent**, and the **proposed-delta** rail markers. It's `h-screen`,
 * so stories use a `fullscreen` canvas.
 *
 * Note: the `dotted` canvas texture reads only where the host seeds the `--dotted-dot` token +
 * `dotted-bg` utility; the beam workbench seeds them, so the dotted surface shows here.
 */

/** A stub brand lockup — stands in for a host's real `@/components/brand/BrandLockup`. */
function StubBrand() {
    return (
        <span className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded bg-sidebar-primary/25 text-[13px]">◈</span>
            Acme
        </span>
    );
}

const SAMPLE_NAV: NavGroup[] = [
    {
        items: [
            { key: 'studio', label: 'Studio', icon: Clapperboard },
            { key: 'calendar', label: 'Calendar', icon: CalendarDays },
            { key: 'knowledge', label: 'Knowledge', icon: Library },
            { key: 'compliance', label: 'Compliance', icon: ShieldCheck },
            { key: 'circuits', label: 'Circuits', icon: Workflow },
            { key: 'threads', label: 'Threads', icon: MessagesSquare },
        ],
    },
    {
        label: 'System',
        items: [
            { key: 'models', label: 'Models', icon: Blocks },
            { key: 'conduits', label: 'Conduits', icon: Plug },
            { key: 'activity', label: 'Activity', icon: Activity },
        ],
    },
    {
        label: 'Account',
        // A redesign PROPOSAL — rendered with the ring-dot marker + legend.
        items: [{ key: 'settings', label: 'Settings', icon: Settings, proposed: true, ticket: '01' }],
    },
];

const OPERATOR_NAV: NavGroup[] = [
    {
        label: 'Operator realm',
        items: [
            { key: 'tenants', label: 'Tenants', icon: Building },
            { key: 'connectors', label: 'Connectors', icon: Cable },
            { key: 'operations', label: 'Operations', icon: Activity, proposed: true, ticket: '23' },
        ],
    },
];

function SampleMain({ heading }: { heading: string }) {
    return (
        <div className="mx-auto max-w-3xl space-y-4">
            <h2 className="text-lg font-semibold">{heading}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-28 rounded-lg border border-border bg-card" />
                <div className="h-28 rounded-lg border border-border bg-card" />
            </div>
        </div>
    );
}

const meta = {
    title: 'UX Prototype/PrototypeDesk',
    component: PrototypeDesk,
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PrototypeDesk>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default work surface — dotted canvas, brand present, a proposed rail marker on Settings. */
export const DottedCanvas: Story = {
    args: {
        nav: SAMPLE_NAV,
        BrandComponent: StubBrand,
        active: 'studio',
        breadcrumb: <Crumb trail={['Studio', 'Compositions']} />,
        canvas: 'dotted',
        children: <SampleMain heading="Work surface (dotted)" />,
    },
};

/** The Settings/meta surface — flat canvas, Settings active. */
export const FlatCanvas: Story = {
    args: {
        nav: SAMPLE_NAV,
        BrandComponent: StubBrand,
        active: 'settings',
        breadcrumb: <Crumb trail={['Settings', 'Billing']} />,
        canvas: 'flat',
        children: <SampleMain heading="Settings surface (flat)" />,
    },
};

/** No `BrandComponent` — the rail's brand slot is empty; everything else still renders. */
export const NoBrand: Story = {
    args: {
        nav: SAMPLE_NAV,
        active: 'circuits',
        canvas: 'dotted',
        children: <SampleMain heading="No host brand" />,
    },
};

/** The operator-realm rail preset, with a top-bar action. */
export const OperatorRail: Story = {
    args: {
        nav: OPERATOR_NAV,
        BrandComponent: StubBrand,
        active: 'tenants',
        breadcrumb: <Crumb trail={['Platform', 'Tenants']} />,
        actions: (
            <button
                type="button"
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
                New tenant
            </button>
        ),
        canvas: 'flat',
        children: <SampleMain heading="Operator realm" />,
    },
};
