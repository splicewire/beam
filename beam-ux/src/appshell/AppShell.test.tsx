import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SlotRegistry } from '@schemastud/mainframe';
import { AppShell } from './AppShell.js';
import { AppRail } from './AppRail.js';
import { createBeamApp } from './createBeamApp.js';

afterEach(cleanup);
const can = (cap: string) => cap === 'edit';
const contribute = (slots: SlotRegistry) => {
    slots.contribute({ slot: 'rail', key: 'nav', node: <span>Host rail</span> });
    slots.contribute({ slot: 'windowEdit', key: 'edit', node: <span>Edit window</span>, can: 'edit' });
    slots.contribute({ slot: 'focusExit', key: 'exit', node: <span>Exit focus</span> });
};

describe('router-neutral app shell', () => {
    it('places the injected outlet and host rail, then changes only mode placement', () => {
        const props = { can, contribute, context: {}, outlet: <h1>Host page</h1> };
        const { rerender } = render(<AppShell {...props} mode="desk" />);
        expect(screen.getByText('Host rail')).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Host page' })).toBeTruthy();
        rerender(<AppShell {...props} mode="window" />);
        expect(screen.queryByText('Host rail')).toBeNull();
        expect(screen.getByText('Edit window')).toBeTruthy();
        rerender(<AppShell {...props} mode="focus" />);
        expect(screen.getByText('Exit focus')).toBeTruthy();
        expect(screen.queryByText('Edit window')).toBeNull();
    });

    it('gates contributions through the injected capability resolver', () => {
        render(<AppShell mode="window" can={() => false} context={{}} contribute={contribute} outlet="Page" />);
        expect(screen.getByText('Page')).toBeTruthy();
        expect(screen.queryByText('Edit window')).toBeNull();
    });

    it('uses host-controlled mobile disclosure and the same rail', () => {
        const change = vi.fn();
        const props = { can, contribute, outlet: 'Page', mode: 'desk' as const };
        const { rerender } = render(<AppShell {...props} context={{ navigation: { mobile: true, open: false, onOpenChange: change } }} />);
        fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
        expect(change).toHaveBeenCalledWith(true);
        rerender(<AppShell {...props} context={{ navigation: { mobile: true, open: true, onOpenChange: change } }} />);
        expect(screen.getByRole('dialog').textContent).toContain('Host rail');
    });

    it('injects link rendering and derives active state without owning routes', () => {
        const groups = [{ id: 'settings', label: 'Settings', items: [
            { id: 'account', title: 'Account', href: '/account' },
            { id: 'tokens', title: 'API tokens', href: '/tokens' },
        ] }];
        const Link = (p: React.ComponentProps<'a'>) => <a {...p} data-host-link="yes" />;
        const { rerender } = render(<AppRail groups={groups} Link={Link} isActive={href => href === '/account'} />);
        expect(screen.getByRole('link', { name: 'Account' }).getAttribute('aria-current')).toBe('page');
        expect(screen.getByRole('link', { name: 'Account' }).className).toContain('bg-sidebar-accent');
        rerender(<AppRail groups={groups} Link={Link} isActive={href => href === '/tokens'} />);
        expect(screen.getByRole('link', { name: 'Account' }).hasAttribute('aria-current')).toBe(false);
        expect(screen.getByRole('link', { name: 'API tokens' }).getAttribute('aria-current')).toBe('page');
        expect(screen.getAllByRole('link').every(a => a.dataset.hostLink === 'yes')).toBe(true);
    });

    it('isolates runtime injection between app instances without creating a router', () => {
        const one = createBeamApp({ runtime: { name: 'One' } });
        const two = createBeamApp({ runtime: { name: 'Two' } });
        function OneLabel() { return <span>{one.useRuntime().name}</span>; }
        function TwoLabel() { return <span>{two.useRuntime().name}</span>; }
        render(<><one.App mode="focus" can={can} context={{}} outlet={<OneLabel />} /><two.App mode="focus" can={can} context={{}} outlet={<TwoLabel />} /></>);
        expect(screen.getByText('One')).toBeTruthy();
        expect(screen.getByText('Two')).toBeTruthy();
    });
    it('updates the outlet without retaining stale page content', () => {
        const props = { mode: 'focus' as const, can, context: {} };
        const { rerender } = render(<AppShell {...props} outlet={<h1>First page</h1>} />);
        rerender(<AppShell {...props} outlet={<h1>Second page</h1>} />);
        expect(screen.queryByText('First page')).toBeNull();
        expect(screen.getByText('Second page')).toBeTruthy();
    });

    it('defaults to document links and never invents feature navigation', () => {
        const { rerender } = render(<AppRail groups={[]} />);
        expect(screen.queryAllByRole('link')).toHaveLength(0);
        rerender(<AppRail groups={[{ id: 'custom', label: 'Custom', items: [
            { id: 'docs', title: 'Docs', href: 'https://example.test/docs' },
        ] }]} />);
        const link = screen.getByRole('link', { name: 'Docs' });
        expect(link.getAttribute('href')).toBe('https://example.test/docs');
        expect(link.hasAttribute('aria-current')).toBe(false);
    });

    it('lets host providers read runtime and rejects a missing app provider', () => {
        const app = createBeamApp({ runtime: { name: 'Host' }, Providers });
        function Providers({ children }: { children: React.ReactNode }) {
            return <section aria-label={app.useRuntime().name}>{children}</section>;
        }
        render(<app.App mode="focus" context={{}} can={can} outlet="Page" />);
        expect(screen.getByRole('region', { name: 'Host' }).textContent).toBe('Page');
        const warning = vi.spyOn(console, 'error').mockImplementation(() => {});
        function Outside() { app.useRuntime(); return null; }
        try { expect(() => render(<Outside />)).toThrow('inside its own App'); }
        finally { warning.mockRestore(); }
    });

});
