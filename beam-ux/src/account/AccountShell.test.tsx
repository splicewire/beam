import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SidebarProvider, TooltipProvider } from '@schemastud/ui';
import { AccountShell } from './AccountShell.js';
import { AccountNav } from './AccountNav.js';
import type { AccountNavData, AccountShellData, LinkComponent } from './types.js';

// `AccountNav`'s rows are `SidebarMenuButton`s, which read the SidebarProvider context — so the
// standalone nav renders inside a bare provider (its natural home inside `<AccountShell>`).

const nav: AccountNavData = {
    items: [
        { title: 'Dashboard', href: '/account' },
        { title: 'Lyrics', href: '/account/lyrics' },
        { title: 'Voices', href: '/account/voices' },
    ],
};

const shell: AccountShellData = {
    plan: { tier: 'free', label: 'Free', credits: 6, max: 8 },
    profile: { handle: '@drew', avatar: 'DM', metrics: [{ label: 'SONGS', value: '4' }] },
    account: { email: 'drew@example.test', paymentMethodLabel: null },
    upsells: [
        { key: 'own-song', label: 'Own a song', href: '/buy' },
        { key: 'go-songwriter', label: 'Go Songwriter', href: '/subscribe' },
    ],
};

describe('AccountNav', () => {
    it('renders the projected account rows as links', () => {
        render(
            <SidebarProvider>
                <TooltipProvider>
                    <AccountNav nav={nav} />
                </TooltipProvider>
            </SidebarProvider>,
        );
        expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('href')).toBe('/account');
        expect(screen.getByRole('link', { name: 'Lyrics' }).getAttribute('href')).toBe('/account/lyrics');
    });

    it('renders nothing when the nav is absent or empty', () => {
        const { container } = render(
            <SidebarProvider>
                <AccountNav nav={null} />
            </SidebarProvider>,
        );
        expect(container.querySelectorAll('[data-slot="sidebar-menu-item"]').length).toBe(0);
    });

    it('routes through an injected linkComponent and flags the active row', () => {
        const Link: LinkComponent = ({ href, children, ...rest }) => (
            <a data-router="1" href={href} {...rest}>
                {children}
            </a>
        );
        render(
            <SidebarProvider>
                <TooltipProvider>
                    <AccountNav nav={nav} linkComponent={Link} isActive={(href) => href === '/account/lyrics'} />
                </TooltipProvider>
            </SidebarProvider>,
        );
        const lyrics = screen.getByRole('link', { name: 'Lyrics' });
        expect(lyrics.getAttribute('data-router')).toBe('1');
        // active state stamps data-active on the menu button (asChild ⇒ on the <a>)
        expect(lyrics.getAttribute('data-active')).toBe('true');
    });
});

describe('AccountShell', () => {
    it('composes brand + nav + user footer beside the page main (nav-only by default)', () => {
        render(
            <AccountShell
                nav={nav}
                shell={shell}
                brand={<span>wordmark</span>}
                brandHref="/account"
                user={<div>user-menu</div>}
            >
                <p>page body</p>
            </AccountShell>,
        );
        expect(screen.getByText('page body')).toBeTruthy();
        expect(screen.getByText('user-menu')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Dashboard' })).toBeTruthy();
        // opt-in sections are OFF by default — no plan/upsell rows leak into the nav-only sidebar
        expect(screen.queryByText('Own a song')).toBeNull();
        expect(screen.queryByText('drew@example.test')).toBeNull();
    });

    it('renders the opt-in plan/profile/account/upsell sections from the shell projection', () => {
        render(
            <AccountShell
                nav={nav}
                shell={shell}
                sections={{ plan: true, profile: true, account: true, upsells: true }}
            >
                <p>body</p>
            </AccountShell>,
        );
        // copy comes from the data, never baked in
        expect(screen.getAllByText('Free').length).toBeGreaterThan(0);
        expect(screen.getByText('6 / 8')).toBeTruthy();
        expect(screen.getByText('@drew')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Own a song' }).getAttribute('href')).toBe('/buy');
        expect(screen.getByText('drew@example.test')).toBeTruthy();
        expect(screen.getByText('None on file')).toBeTruthy();
    });

    it('renders the action slot and omits the header when no brand is given', () => {
        const { container } = render(
            <AccountShell nav={nav} action={<button>New song</button>}>
                <p>body</p>
            </AccountShell>,
        );
        expect(screen.getByRole('button', { name: 'New song' })).toBeTruthy();
        expect(container.querySelector('[data-slot="sidebar-header"]')).toBeNull();
    });
});
