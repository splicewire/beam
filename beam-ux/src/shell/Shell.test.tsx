import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Shell } from './Shell.js';
import type { ShellApp, ShellAutoPage } from './types.js';

const apps: ShellApp[] = [
    { key: 'site', title: 'Site', realm: 'SITE', subtitle: 'Public · marketing', render: () => <p>site body</p> },
    { key: 'account', title: 'Account', realm: 'ACCOUNT', subtitle: 'Authed · library', render: () => <p>account body</p> },
    { key: 'studio', title: 'Studio', realm: 'STUDIO', render: () => <p>studio body</p> },
];

const autoSurfaced: ShellAutoPage[] = [
    { key: 'privacy', title: 'Privacy', route: '/privacy', render: () => <p>privacy body</p> },
    { key: 'terms', title: 'Terms', route: '/terms', render: () => <p>terms body</p> },
];

const launcher = () => document.querySelector('[data-shell-launcher]') as HTMLElement;

describe('Shell — launcher (data-driven from apps)', () => {
    it('renders one tile per app from the apps prop, not a hardcoded list', async () => {
        render(<Shell apps={apps} initialOpen={[]} />);
        await userEvent.click(screen.getByRole('button', { name: 'Open launcher' }));
        const tiles = launcher().querySelectorAll('[data-shell-app]');
        expect(tiles.length).toBe(3);
        expect(within(launcher()).getByText('Site')).toBeTruthy();
        expect(within(launcher()).getByText('Studio')).toBeTruthy();
        expect(within(launcher()).getByText('Public · marketing')).toBeTruthy();
    });

    it('renders auto-surfaced pages as their own tier with the AUTO route tag', async () => {
        render(<Shell apps={apps} autoSurfaced={autoSurfaced} initialOpen={[]} />);
        await userEvent.click(screen.getByRole('button', { name: 'Open launcher' }));
        const subApps = launcher().querySelectorAll('[data-shell-sub-app]');
        expect(subApps.length).toBe(2);
        expect(within(launcher()).getByText('auto ✦ /privacy')).toBeTruthy();
        expect(within(launcher()).getByText('auto ✦ /terms')).toBeTruthy();
    });
});

describe('Shell — window lifecycle', () => {
    it('opens the initial app and frames its host-rendered content', () => {
        render(<Shell apps={apps} initialOpen={['site']} />);
        expect(screen.getByText('site body')).toBeTruthy();
        const win = document.querySelector('[data-shell-window]') as HTMLElement;
        expect(win.getAttribute('data-realm')).toBe('SITE');
        expect(win.getAttribute('data-focused')).toBe('');
    });

    it('launching an app opens a window and lights its dock task', async () => {
        render(<Shell apps={apps} initialOpen={[]} />);
        expect(document.querySelector('[data-shell-window]')).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Open launcher' }));
        await userEvent.click(within(launcher()).getByText('Account'));
        expect(screen.getByText('account body')).toBeTruthy();
        const task = document.querySelector('[data-shell-task]') as HTMLElement;
        expect(task.textContent).toContain('Account');
    });

    it('closes a window via its close light', async () => {
        render(<Shell apps={apps} initialOpen={['site']} />);
        expect(screen.getByText('site body')).toBeTruthy();
        await userEvent.click(screen.getByRole('button', { name: 'Close Site' }));
        expect(screen.queryByText('site body')).toBeNull();
    });

    it('minimize hides the surface but keeps the dock task', async () => {
        render(<Shell apps={apps} initialOpen={['site']} />);
        await userEvent.click(screen.getByRole('button', { name: 'Minimize Site' }));
        expect(screen.queryByText('site body')).toBeNull();
        expect(document.querySelector('[data-shell-task]')?.textContent).toContain('Site');
    });
});

describe('Shell — menu bar', () => {
    it('renders brand, menus, and status', () => {
        render(
            <Shell
                apps={apps}
                initialOpen={[]}
                brand={<span>audiostud·os</span>}
                menus={[{ label: 'File' }, { label: 'Realm' }]}
                status={<span>12:00</span>}
            />,
        );
        expect(screen.getByText('audiostud·os')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'File' })).toBeTruthy();
        expect(screen.getByText('12:00')).toBeTruthy();
    });
});
