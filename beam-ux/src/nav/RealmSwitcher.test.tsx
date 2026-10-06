import { fireEvent, render, screen } from '@testing-library/react';
import { Link as InertiaLink } from '@inertiajs/react';
import { MemoryRouter, NavLink } from 'react-router';
import { describe, expect, it } from 'vitest';
import { RealmSwitcher } from './RealmSwitcher';
import type { HostRealms, LinkComponent } from './types';
import { useCurrentRealm } from './useCurrentRealm';

/**
 * ux-walkthrough UX-12a (IA-3, IA-4, M7): realms are crossed ONLY through the RealmSwitcher, a router-free user menu
 * each shell feeds its own link. Two real adapters (Inertia's <Link>, react-router's <NavLink>) must draw the same
 * structure; that is what makes the seam real.
 */
const realms: HostRealms = {
    realms: [
        { key: 'tenant', label: 'App', href: '/dashboard', surface: 'app', locked: false },
        { key: 'user', label: 'Settings', href: '/settings/profile', surface: 'app', locked: false },
        { key: 'operator', label: 'Operator', href: '/operator', surface: 'app', locked: false },
        { key: 'site', label: 'Site', href: '/', surface: 'site', locked: false },
    ],
    current: 'tenant',
    back: null,
};

const inertia: LinkComponent = ({ href, className, children, ...rest }) => (
    <InertiaLink href={href} className={className} {...rest}>
        {children}
    </InertiaLink>
);
const reactRouter: LinkComponent = ({ href, className, children, ...rest }) => (
    <NavLink to={href} className={className} {...rest}>
        {children}
    </NavLink>
);

function structure(container: HTMLElement) {
    return [...container.querySelectorAll('[data-realm-switcher-item]')].map((el) => ({
        item: el.getAttribute('data-realm-switcher-item'),
        text: el.textContent,
        href: el.getAttribute('href'),
    }));
}

describe('RealmSwitcher', () => {
    it('renders no crossing until it is opened', () => {
        render(<RealmSwitcher realms={realms} label="Ada" signOutHref="/logout" />);
        expect(screen.queryByText('Operator')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: /ada/i }));
        expect(screen.getAllByText('Operator')).toHaveLength(1);
    });

    it('lists the app realms, then View site and Sign out, and never the site realm as a realm', () => {
        const { container } = render(<RealmSwitcher realms={realms} label="Ada" signOutHref="/logout" defaultOpen />);
        expect(structure(container)).toEqual([
            { item: 'realm', text: 'App', href: '/dashboard' },
            { item: 'realm', text: 'Settings', href: '/settings/profile' },
            { item: 'realm', text: 'Operator', href: '/operator' },
            { item: 'site', text: 'View site', href: '/' },
            { item: 'sign-out', text: 'Sign out', href: '/logout' },
        ]);
    });

    // The menu sits on the popover surface, so it carries the popover's foreground: inherited from a dark rail, its
    // items were near-invisible on the white panel (UX-12a fixture, owner).
    it('draws the open menu in the popover foreground on the popover surface', () => {
        render(<RealmSwitcher realms={realms} label="Ada" signOutHref="/logout" defaultOpen />);
        expect(screen.getByRole('menu').className).toMatch(/\bbg-popover\b.*\btext-popover-foreground\b|\btext-popover-foreground\b.*\bbg-popover\b/);
    });

    // The menu floats over the page instead of pushing it: opened in a site header it grew the header (UX-12a starter
    // retake). It drops below the trigger by default and opens above it for a shell whose trigger sits at the bottom.
    it('floats the open menu, below the trigger by default and above it on side="top"', () => {
        const { container, unmount } = render(<RealmSwitcher realms={realms} label="Ada" signOutHref="/logout" defaultOpen />);
        expect(container.querySelector('[data-realm-switcher]')?.className).toMatch(/\brelative\b/);
        expect(screen.getByRole('menu').className).toMatch(/\babsolute\b/);
        expect(screen.getByRole('menu').className).toMatch(/\btop-full\b/);
        unmount();
        render(<RealmSwitcher realms={realms} label="Ada" signOutHref="/logout" defaultOpen side="top" />);
        expect(screen.getByRole('menu').className).toMatch(/\bbottom-full\b/);
    });

    it('omits a locked realm and has no View site where no site realm exists', () => {
        const hub: HostRealms = { ...realms, realms: realms.realms.filter((r) => r.surface !== 'site').map((r) => (r.key === 'operator' ? { ...r, locked: true } : r)) };
        const { container } = render(<RealmSwitcher realms={hub} label="Ada" signOutHref="/logout" defaultOpen />);
        expect(structure(container).map((s) => s.text)).toEqual(['App', 'Settings', 'Sign out']);
    });

    it('draws identical structure through an Inertia Link and a react-router NavLink', () => {
        const a = render(<RealmSwitcher realms={realms} label="Ada" signOutHref="/logout" defaultOpen linkComponent={inertia} />);
        const viaInertia = structure(a.container);
        a.unmount();
        const b = render(
            <MemoryRouter>
                <RealmSwitcher realms={realms} label="Ada" signOutHref="/logout" defaultOpen linkComponent={reactRouter} />
            </MemoryRouter>,
        );
        expect(structure(b.container)).toEqual(viaInertia);
        expect(viaInertia).toHaveLength(5);
    });
});

describe('useCurrentRealm', () => {
    function Probe({ pathname, data }: { pathname: string; data: HostRealms }) {
        const { realm, back } = useCurrentRealm(data, pathname);
        return <output data-realm={realm?.key ?? ''} data-back={back?.href ?? ''}>{back?.label ?? ''}</output>;
    }
    const read = (pathname: string, data: HostRealms = realms) => {
        const { container, unmount } = render(<Probe pathname={pathname} data={data} />);
        const out = container.querySelector('output')!;
        const result = { realm: out.getAttribute('data-realm'), back: out.getAttribute('data-back'), label: out.textContent };
        unmount();
        return result;
    };

    it('derives the realm from the path by the longest home prefix', () => {
        expect(read('/operator/tenants').realm).toBe('operator');
        expect(read('/settings/profile').realm).toBe('user');
        expect(read('/dashboard').realm).toBe('tenant');
    });

    it('offers Back to the workspace outside the default realm only', () => {
        expect(read('/operator/tenants')).toEqual({ realm: 'operator', back: '/dashboard', label: 'App' });
        expect(read('/dashboard').back).toBe('');
    });

    it("prefers the server's back when it carries one", () => {
        const data = { ...realms, back: { label: 'Acme', href: '/w/acme' } };
        expect(read('/operator', data)).toEqual({ realm: 'operator', back: '/w/acme', label: 'Acme' });
    });
});
