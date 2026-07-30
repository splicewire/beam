import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { VariantBar } from './VariantBar';

/**
 * Catalog story for the floating `?variant=` switcher (extract ticket 05). Its sanctioned treatment
 * axis is **active index** — which fork of a side-by-side comparison is selected (first / middle /
 * last) — plus the `hint` label. No variant/size/tone/density props (rule of sanction). It's
 * `fixed bottom-center`, so stories render on a `fullscreen` canvas with room above it.
 */
const VARIANTS = [
    { key: 'coexist', label: 'Coexist' },
    { key: 'blockdoc', label: 'Blockdoc-first' },
    { key: 'toggle', label: 'Mode toggle' },
];

const meta = {
    title: 'UX Prototype/VariantBar',
    component: VariantBar,
    parameters: { layout: 'fullscreen' },
    decorators: [
        (Story) => (
            <div className="relative h-64 w-full bg-background">
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof VariantBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Active = the first fork (nothing else selected yet). */
export const FirstActive: Story = {
    args: { variants: VARIANTS, active: 'coexist', onSelect: () => {} },
};

/** Active = a middle fork. */
export const MiddleActive: Story = {
    args: { variants: VARIANTS, active: 'blockdoc', onSelect: () => {} },
};

/** Active = the last fork. */
export const LastActive: Story = {
    args: { variants: VARIANTS, active: 'toggle', onSelect: () => {} },
};

/** A custom hint label instead of the default `variant ←/→`. */
export const CustomHint: Story = {
    args: { variants: VARIANTS, active: 'coexist', hint: 'permission tier', onSelect: () => {} },
};

/** Live selection — clicking a pill moves the active state. */
export const Interactive: StoryObj = {
    render: () => {
        const [active, setActive] = useState('coexist');
        return <VariantBar variants={VARIANTS} active={active} onSelect={setActive} />;
    },
};
