import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RealmNav } from './RealmNav.js';
import type { LinkComponent, RealmNavNode } from './types.js';

const node = (over: Partial<RealmNavNode> & { title: string }): RealmNavNode => ({
    kind: 'nav/link',
    href: `/${over.title.toLowerCase()}`,
    active: false,
    activeTrail: false,
    children: [],
    ...over,
});

describe('RealmNav — flat-with-headers (tenant realm)', () => {
    it('renders a header from an href-less node and groups the items under it', () => {
        const items: RealmNavNode[] = [
            node({ title: 'Home', href: '/' }),
            { kind: 'nav/section', title: 'Library', href: null, children: [] },
            node({ title: 'Lyrics' }),
            node({ title: 'Voices' }),
        ];
        render(<RealmNav items={items} variant="flat-with-headers" />);

        // The href-less "Library" is a group LABEL, not a link.
        expect(screen.queryByRole('link', { name: 'Library' })).toBeNull();
        expect(screen.getByText('Library')).toBeTruthy();
        // The two following items are links.
        expect(screen.getByRole('link', { name: 'Lyrics' }).getAttribute('href')).toBe('/lyrics');
        expect(screen.getByRole('link', { name: 'Voices' }).getAttribute('href')).toBe('/voices');
    });

    it('preserves the authored order from the tree (no re-sort)', () => {
        const items = [node({ title: 'Charlie' }), node({ title: 'Alpha' }), node({ title: 'Bravo' })];
        render(<RealmNav items={items} variant="flat-with-headers" />);
        const links = screen.getAllByRole('link').map((a) => a.textContent);
        expect(links).toEqual(['Charlie', 'Alpha', 'Bravo']);
    });
});

describe('RealmNav — section-groups (operator realm)', () => {
    it('renders each top-level node as a labeled group of its children (multiple launch entries)', () => {
        const items: RealmNavNode[] = [
            {
                kind: 'nav/section',
                title: 'Platform',
                href: null,
                active: false,
                activeTrail: false,
                children: [node({ title: 'Dashboard' }), node({ title: 'Tenants' })],
            },
        ];
        render(<RealmNav items={items} variant="section-groups" />);
        expect(screen.getByText('Platform')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Dashboard' })).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Tenants' })).toBeTruthy();
    });

    it('falls back to the section itself as a lone item when it has no children', () => {
        const items = [node({ title: 'Usage', href: '/usage' })];
        render(<RealmNav items={items} variant="section-groups" />);
        expect(screen.getByRole('link', { name: 'Usage' }).getAttribute('href')).toBe('/usage');
    });
});

describe('RealmNav — active trail from PHP-stamped fields', () => {
    it('marks the row active from the server `active` flag, not from a client re-derivation', () => {
        const items = [
            node({ title: 'Songs', active: true }),
            node({ title: 'Voices', activeTrail: true }),
            node({ title: 'Lyrics' }),
        ];
        render(<RealmNav items={items} variant="flat-with-headers" />);
        expect(screen.getByRole('link', { name: 'Songs' }).getAttribute('data-active')).toBe('true');
        expect(screen.getByRole('link', { name: 'Songs' }).getAttribute('aria-current')).toBe('page');
        // activeTrail also stamps active.
        expect(screen.getByRole('link', { name: 'Voices' }).getAttribute('data-active')).toBe('true');
        // A node the server did not stamp is NOT active (never recomputed from a URL).
        expect(screen.getByRole('link', { name: 'Lyrics' }).getAttribute('data-active')).toBe('false');
        expect(screen.getByRole('link', { name: 'Lyrics' }).getAttribute('aria-current')).toBeNull();
    });
});

describe('RealmNav — injected chrome', () => {
    it('routes through an injected linkComponent', () => {
        const Link: LinkComponent = ({ href, children, ...rest }) => (
            <a data-router="1" href={href} {...rest}>
                {children}
            </a>
        );
        const items = [node({ title: 'Songs' })];
        render(<RealmNav items={items} variant="flat-with-headers" linkComponent={Link} />);
        const link = screen.getByRole('link', { name: 'Songs' });
        expect(link.getAttribute('data-router')).toBe('1');
    });

    it('injected icon receives node + resolved class + active flag', () => {
        const items = [node({ title: 'Songs', icon: 'Library', active: true })];
        const { container } = render(
            <RealmNav
                items={items}
                variant="flat-with-headers"
                icon={(n, ctx) => (
                    <i data-icon={n.icon} data-active={String(ctx.active)} className={ctx.className} />
                )}
            />,
        );
        const i = container.querySelector('i')!;
        expect(i.getAttribute('data-icon')).toBe('Library');
        expect(i.getAttribute('data-active')).toBe('true');
        expect(i.className).toContain('text-sidebar-primary');
    });

    it('renders nothing for an empty / absent tree', () => {
        const { container } = render(<RealmNav items={null} />);
        expect(container.querySelectorAll('a').length).toBe(0);
        const { container: c2 } = render(<RealmNav items={[]} />);
        expect(c2.querySelectorAll('a').length).toBe(0);
    });

    it('honors classNames overrides', () => {
        const items = [node({ title: 'Songs' })];
        const { container } = render(
            <RealmNav
                items={items}
                variant="flat-with-headers"
                classNames={{ root: 'my-rail', item: 'my-item' }}
            />,
        );
        expect(container.querySelector('nav.my-rail')).toBeTruthy();
        expect(container.querySelector('a.my-item')).toBeTruthy();
    });
});
