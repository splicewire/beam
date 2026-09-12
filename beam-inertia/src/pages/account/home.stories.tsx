import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { AccountShell } from '@splicewire/beam-ux/account';
import { setStubPage } from '../../story-harness';

/**
 * Account / Home — the packaged `account/home` page, resolved via `resolveBeamPage` and
 * mounted inside the promoted `AccountShell` (`@splicewire/beam-ux/account`) exactly the
 * way a real host's `layout:` resolution wraps `account/*` pages (see beam-inertia's
 * `index.tsx` `beamInertiaOptions().layout`). Both packages' real exports, no deep paths.
 */
function AccountHomeStage() {
    const [Page, setPage] = useState<ComponentType | null>(null);
    setStubPage({});
    useEffect(() => {
        let alive = true;
        resolveBeamPage('account/home').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);

    return (
        <AccountShell
            nav={{
                items: [
                    { title: 'Home', href: '/account' },
                    { title: 'Settings', href: '/settings/profile' },
                ],
            }}
            navLabel="Account"
            shell={{
                plan: { tier: 'growth', label: 'Growth plan' },
                profile: { handle: 'ada', metrics: [] },
                account: { email: 'ada@example.test' },
                upsells: [],
            }}
            sections={{ plan: true, account: true }}
            isActive={(href) => href === '/account'}
        >
            {Page ? <Page /> : null}
        </AccountShell>
    );
}

const meta = {
    title: 'Inertia/Account/Home',
    parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj;

export const Populated: Story = {
    render: () => <AccountHomeStage />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByText('Account home')).toBeInTheDocument();
        await expect(canvas.getByText('Growth plan')).toBeInTheDocument();
    },
};

export const NarrowViewport: Story = {
    render: () => <AccountHomeStage />,
    parameters: { viewport: { defaultViewport: 'mobile1' } },
};
