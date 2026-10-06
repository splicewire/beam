// @vitest-environment jsdom
/**
 * FrameRail (ux-walkthrough UX-12a) is NavFrame's successor: the same projected nav, drawn by the packaged RealmNav.
 * These are NavFrame's behaviours, kept:
 * - a childless linked top-level node is a row, not an empty group heading (launch ticket 00, overnight-ui2 06);
 * - a leaf the surrounding rail already links is skipped;
 * - the `zone: meta` node is the Developer zone, whose seats keep their rows (UX-08, c4622dc).
 */
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import type { FrameNavNode } from '../frame/manifest';
import { FrameRail } from './frame-rail';

const nav = vi.hoisted(() => ({ items: [] as unknown[] }));

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children, ...rest }: { href: string; children?: ReactNode }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));
vi.mock('../frame/manifest', () => ({ useFrameManifest: () => ({ data: { nav } }) }));
vi.mock('../hooks/use-current-url', () => ({ useCurrentUrl: () => ({ isCurrentUrl: (href: string) => href === '/entries' }) }));

afterEach(cleanup);

const node = (over: Partial<FrameNavNode>): FrameNavNode => ({
    kind: 'link',
    title: '',
    href: null,
    icon: null,
    routeName: null,
    locked: null,
    children: [],
    ...over,
});

it('draws a childless linked node as a row, and a parent as a labelled group', () => {
    nav.items = [
        node({ title: 'Platform', children: [node({ title: 'Entries', href: '/entries' })] }),
        node({ title: 'Dashboard', href: '/operator/dashboard', routeName: 'operator-dashboard.index' }),
    ];

    render(<FrameRail />);

    expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('href')).toBe('/operator/dashboard');
    expect(screen.getByText('Platform').closest('a')).toBeNull();
    expect(screen.getByRole('link', { name: 'Entries' }).getAttribute('data-active')).toBe('true');
});

it('skips a leaf whose href the rail already links', () => {
    nav.items = [
        node({ title: 'Platform', children: [node({ title: 'Entries', href: '/entries' })] }),
        node({ title: 'Dashboard', href: '/dashboard', routeName: 'tenant-dashboard.index' }),
    ];

    render(<FrameRail omitHrefs={['/dashboard']} />);

    expect(screen.queryByRole('link', { name: 'Dashboard' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Entries' })).toBeTruthy();
});

it('draws the meta zone as a Developer zone whose seats keep their rows', () => {
    nav.items = [
        node({ title: 'Entries', href: '/beam-ux-entry', zone: 'primary' }),
        node({
            title: 'Developer',
            routeName: 'developer.section',
            zone: 'meta',
            children: [
                node({
                    title: 'Ops',
                    href: '/ops',
                    routeName: 'ops.section',
                    children: [node({ title: 'Files', href: '/beam-ux-mirror-status' }), node({ title: 'Git repos', href: '/git-repo' })],
                }),
            ],
        }),
    ];

    const { container } = render(<FrameRail />);

    const zone = container.querySelector('[data-zone="meta"]');
    expect(zone).not.toBeNull();
    expect(zone!.textContent).toContain('Ops');
    for (const title of ['Files', 'Git repos']) {
        expect(zone!.contains(screen.getByRole('link', { name: title }))).toBe(true);
    }
    expect(zone!.contains(screen.getByRole('link', { name: 'Entries' }))).toBe(false);
});

it('renders nothing when the manifest has no nav', () => {
    nav.items = [];
    const { container } = render(<FrameRail />);
    expect(container.innerHTML).toBe('');
});
