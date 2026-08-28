import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RealmNav, SIDEBAR_ACTIVE_FG } from './RealmNav.js';
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

    // Regression guard for the non-standard-token defect. `sidebar-active-foreground` is not one of
    // shadcn's eight standard sidebar tokens, so the bare utility resolved to no colour at all on any
    // host but splicewire-app. Both assertions matter:
    //  - the class must carry a FALLBACK, so a stock shadcn host still gets a colour;
    //  - the fallback must chain the RAW `--sidebar-*` properties, not the `--color-*` theme keys,
    //    because splicewire-app declares its palette in `@theme inline` and therefore emits no
    //    `--color-*` custom properties at runtime.
    // It also asserts the class is spelled LITERALLY — an interpolated `text-[${...}]` is invisible
    // to Tailwind's source scanner and would re-create the defect at build time.
    it('colours the active item through a token with a standard-token fallback', () => {
        const items = [node({ title: 'Songs', active: true }), node({ title: 'Lyrics' })];
        const { container } = render(<RealmNav items={items} variant="flat-with-headers" />);
        const [activeLink, idleLink] = Array.from(container.querySelectorAll('a'));

        expect(SIDEBAR_ACTIVE_FG).toBe('var(--sidebar-active-foreground,var(--sidebar-foreground))');
        expect(SIDEBAR_ACTIVE_FG).not.toContain('--color-');

        expect(activeLink.className).toContain(`text-[${SIDEBAR_ACTIVE_FG}]`);
        expect(idleLink.className).toContain(`hover:text-[${SIDEBAR_ACTIVE_FG}]`);

        // The bare non-standard utility must not come back.
        for (const link of [activeLink, idleLink]) {
            expect(link.className).not.toMatch(/(^|\s|:)text-sidebar-active-foreground(\s|$|\/)/);
        }
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
