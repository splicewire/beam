import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RealmNav, SIDEBAR_ACTIVE_FG } from './RealmNav.js';
import { REALM_NAV_CSS } from './css.js';
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
    // host but splicewire-app. The colour is a rule in the sheet the component renders, keyed off the
    // server-stamped `data-active` (beam-docs-satellite 62 — an arbitrary-value utility inside this
    // package's dist was invisible to every host that does not scan it). Both assertions still matter:
    //  - the rule must carry a FALLBACK, so a stock shadcn host still gets a colour;
    //  - the fallback must chain the RAW `--sidebar-*` properties, not the `--color-*` theme keys,
    //    because splicewire-app declares its palette in `@theme inline` and therefore emits no
    //    `--color-*` custom properties at runtime.
    it('colours the active item through a sheet rule with a standard-token fallback', () => {
        const items = [node({ title: 'Songs', active: true }), node({ title: 'Lyrics' })];
        const { container } = render(<RealmNav items={items} variant="flat-with-headers" />);
        const [activeLink, idleLink] = Array.from(container.querySelectorAll('a'));

        expect(SIDEBAR_ACTIVE_FG).toBe('var(--sidebar-active-foreground,var(--sidebar-foreground))');
        expect(SIDEBAR_ACTIVE_FG).not.toContain('--color-');

        expect(container.querySelector('style')?.textContent).toBe(REALM_NAV_CSS);
        expect(REALM_NAV_CSS).toContain(`.beam-nav-item[data-active='true'] { color: ${SIDEBAR_ACTIVE_FG}; }`);
        expect(activeLink.className).toContain('beam-nav-item');
        expect(activeLink.getAttribute('data-active')).toBe('true');
        expect(idleLink.getAttribute('data-active')).toBe('false');

        // Neither the bare non-standard utility nor its arbitrary-value successor may come back.
        for (const link of [activeLink, idleLink]) {
            expect(link.className).not.toMatch(/(^|\s|:)text-sidebar-active-foreground(\s|$|\/)/);
            expect(link.className).not.toContain('text-[var(--sidebar-active-foreground');
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

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The soft-lock (Frame OS ticket 11). `NavLocked` was built, typed, tested and WIRE-VISIBLE in PHP
// with no producer and no renderer anywhere in the family — a declared field nothing emitted and
// nothing read. These pin the renderer half.
//
// The interaction contract is deliberately the SAME as the locked desktop tile's, pinned in
// `@schemastud/mainframe` by *"a locked tile opens the upsell popover — never navigates or opens a
// window"*. A locked nav ROW and a locked desktop TILE are one soft-gate affordance in two chromes;
// making them behave differently would be a difference with no reason behind it.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const locked = (over: Partial<RealmNavNode> & { title: string; reason: string; upsell?: string | null }) => ({
    ...node(over),
    locked: { reason: over.reason, upsell: over.upsell ?? null },
});

describe('RealmNav — a soft-locked row', () => {
    it('renders the locked row as a NON-navigating control, never a link', () => {
        const items: RealmNavNode[] = [
            node({ title: 'Songs' }),
            locked({ title: 'Studio', href: '/studio', reason: 'Available on the Songwriter plan', upsell: 'go-songwriter' }),
        ];
        const { container } = render(<RealmNav items={items} variant="flat-with-headers" />);

        // The unlocked sibling is still a link with its href — the lock changes nothing else.
        expect(screen.getByRole('link', { name: 'Songs' }).getAttribute('href')).toBe('/songs');

        // The locked one is NOT a link, and carries no href to middle-click, copy or prefetch.
        expect(screen.queryByRole('link', { name: /Studio/ })).toBeNull();
        const row = container.querySelector('[data-locked="true"]')!;
        expect(row).not.toBeNull();
        expect(row.tagName).toBe('BUTTON');
        expect(row.getAttribute('href')).toBeNull();
        expect(row.textContent).toContain('Studio');
        // The server's reason is the hover affordance, and a lock badge marks the row.
        expect(row.getAttribute('title')).toBe('Available on the Songwriter plan');
        expect(container.querySelector('.beam-nav-lock')).not.toBeNull();
    });

    it('never marks a locked row active, whatever the server stamped', () => {
        const items = [locked({ title: 'Studio', href: '/studio', reason: 'Upgrade', active: true, activeTrail: true })];
        const { container } = render(<RealmNav items={items} variant="flat-with-headers" />);
        // A row that cannot be navigated to cannot be the page you are on.
        expect(container.querySelector('[data-locked="true"]')!.getAttribute('data-active')).toBe('false');
    });

    it('opens the upsell popover on click, carrying the SERVER reason — and does not navigate', () => {
        const Link: LinkComponent = vi.fn(({ href, children, ...rest }) => (
            <a href={href} {...rest}>
                {children}
            </a>
        ));
        const items = [locked({ title: 'Studio', href: '/studio', reason: 'Available on the Songwriter plan' })];
        const { container } = render(
            <RealmNav items={items} variant="flat-with-headers" linkComponent={Link} />,
        );

        expect(container.querySelector('.beam-nav-upsell')).toBeNull();
        fireEvent.click(container.querySelector('[data-locked="true"]')!);

        const pop = container.querySelector('.beam-nav-upsell')!;
        expect(pop).not.toBeNull();
        expect(pop.getAttribute('role')).toBe('dialog');
        expect(pop.getAttribute('aria-label')).toBe('Unlock Studio');
        // The copy is the server's sentence verbatim — nothing is fabricated client-side.
        expect(container.querySelector('.beam-nav-upsell-copy')?.textContent).toBe(
            'Available on the Songwriter plan',
        );
        // The injected router was never reached: a locked row does not navigate.
        expect(Link).not.toHaveBeenCalled();
        expect(container.querySelectorAll('a').length).toBe(0);
    });

    it('hands the host the OPAQUE upsell token for its own CTA, and interprets it itself never', () => {
        const cta = vi.fn((n: RealmNavNode, ctx: { upsell: string | null }) => (
            <a data-cta="1" href={`/pricing/${ctx.upsell}`}>
                Upgrade {n.title}
            </a>
        ));
        const items = [locked({ title: 'Studio', href: '/studio', reason: 'Upgrade', upsell: 'go-songwriter' })];
        const { container } = render(<RealmNav items={items} variant="flat-with-headers" upsellCta={cta} />);

        fireEvent.click(container.querySelector('[data-locked="true"]')!);

        expect(cta).toHaveBeenCalledTimes(1);
        expect(cta.mock.calls[0][1]).toEqual({ upsell: 'go-songwriter' });
        expect(container.querySelector('a[data-cta="1"]')?.getAttribute('href')).toBe('/pricing/go-songwriter');
        // The packaged fallback CTA is replaced, not stacked beside the host's.
        expect(container.querySelector('.beam-nav-upsell-cta')).toBeNull();
    });

    it('falls back to a packaged CTA when the lock carries no upsell token', () => {
        const items = [locked({ title: 'Studio', href: '/studio', reason: 'Coming soon', upsell: null })];
        const { container } = render(<RealmNav items={items} variant="flat-with-headers" />);
        fireEvent.click(container.querySelector('[data-locked="true"]')!);

        expect(container.querySelector('.beam-nav-upsell-cta')?.textContent).toBe('Upgrade');
        expect(container.querySelector('.beam-nav-upsell-copy')?.textContent).toBe('Coming soon');
    });

    it('dismisses through the scrim, and shows one popover at a time across two locked rows', () => {
        const items = [
            locked({ title: 'Studio', href: '/studio', reason: 'Studio reason' }),
            locked({ title: 'Calendar', href: '/calendar', reason: 'Calendar reason' }),
        ];
        const { container } = render(<RealmNav items={items} variant="flat-with-headers" />);
        const [studio, calendar] = Array.from(container.querySelectorAll('[data-locked="true"]'));

        fireEvent.click(studio);
        expect(container.querySelector('.beam-nav-upsell-copy')?.textContent).toBe('Studio reason');

        // A second locked row REPLACES the popover rather than opening a second one.
        fireEvent.click(calendar);
        expect(container.querySelectorAll('.beam-nav-upsell').length).toBe(1);
        expect(container.querySelector('.beam-nav-upsell-copy')?.textContent).toBe('Calendar reason');

        fireEvent.click(container.querySelector('.beam-nav-upsell-scrim')!);
        expect(container.querySelector('.beam-nav-upsell')).toBeNull();
    });

    it('keeps a locked row in a section-groups rail too (both variants, one rule)', () => {
        const items: RealmNavNode[] = [
            {
                kind: 'nav/section',
                title: 'Platform',
                href: null,
                children: [node({ title: 'Tenants' }), locked({ title: 'Brokers', href: '/brokers', reason: 'Plan required' })],
            },
        ];
        const { container } = render(<RealmNav items={items} variant="section-groups" />);
        expect(screen.getByRole('link', { name: 'Tenants' })).toBeTruthy();
        expect(container.querySelector('[data-locked="true"]')?.textContent).toContain('Brokers');
    });

    it('renders a locked row that has NO href, rather than dropping it as a group header', () => {
        // A section a plan does not include often has nothing meaningful to point at. Dropping it for
        // want of an href would delete the very state the projection exists to make visible; reading
        // it as a group header (the href-less convention) would render it as a label with no upsell.
        const items: RealmNavNode[] = [
            node({ title: 'Songs' }),
            { kind: 'nav/link', title: 'Studio', href: null, children: [], locked: { reason: 'Plan required', upsell: null } },
        ];
        const { container } = render(<RealmNav items={items} variant="flat-with-headers" />);

        const row = container.querySelector('[data-locked="true"]')!;
        expect(row).not.toBeNull();
        expect(row.tagName).toBe('BUTTON');
        // It stayed in the FIRST group — it did not open a new one the way an href-less header does.
        expect(container.querySelectorAll('.beam-nav-item').length).toBe(2);
        fireEvent.click(row);
        expect(container.querySelector('.beam-nav-upsell-copy')?.textContent).toBe('Plan required');
    });

    it('styles the locked row from the rendered sheet, not from a host-scanned utility', () => {
        const items = [locked({ title: 'Studio', href: '/studio', reason: 'Upgrade' })];
        const { container } = render(<RealmNav items={items} variant="flat-with-headers" />);

        expect(container.querySelector('style')?.textContent).toBe(REALM_NAV_CSS);
        expect(REALM_NAV_CSS).toContain(".beam-nav-item[data-locked='true']");
        expect(REALM_NAV_CSS).toContain('.beam-nav-upsell {');
        // The desktop chrome leaves `.upsell-pop` / `.launcher-scrim` for the HOST to style. This
        // package ships rules inline, so reusing those names would restyle the host's dock popover
        // wherever both render. The namespaces must stay disjoint.
        expect(REALM_NAV_CSS).not.toContain('.upsell-pop');
        expect(REALM_NAV_CSS).not.toContain('.launcher-scrim');
    });
});

/**
 * ⚠️ **The mutation that exposed this test's absence.** Dropping the `|| node.locked` clause from
 * `isRailable` — the rule that keeps an href-less locked node in the rail — left the whole file GREEN.
 * Both existing locked-without-href cases MISS that code path: a TOP-LEVEL one is decided by the
 * group-opening branch instead, and the section-groups one carries an href, so `Boolean(node.href)`
 * admits it either way. The clause only ever runs for a locked CHILD with no href, and nothing
 * exercised it.
 *
 * It is a real case, not a contrived one. A section a plan does not include is exactly the node most
 * likely to have nothing to point at, and under a group header it would silently vanish — the
 * declared-and-invisible outcome this whole effort exists to remove.
 */
describe('RealmNav — a locked CHILD with no href (the mutation-found gap)', () => {
    it('keeps it in a section-groups rail', () => {
        const items: RealmNavNode[] = [
            {
                kind: 'nav/section',
                title: 'Platform',
                href: null,
                children: [
                    node({ title: 'Tenants' }),
                    { kind: 'nav/link', title: 'Brokers', href: null, children: [], locked: { reason: 'Plan required', upsell: null } },
                ],
            },
        ];
        const { container } = render(<RealmNav items={items} variant="section-groups" />);

        expect(screen.getByRole('link', { name: 'Tenants' })).toBeTruthy();
        const row = container.querySelector('[data-locked="true"]')!;
        expect(row).not.toBeNull();
        expect(row.textContent).toContain('Brokers');
    });

    it('keeps it under a flat-with-headers group header', () => {
        const items: RealmNavNode[] = [
            {
                kind: 'nav/section',
                title: 'Library',
                href: null,
                children: [
                    node({ title: 'Lyrics' }),
                    { kind: 'nav/link', title: 'Voices', href: null, children: [], locked: { reason: 'Plan required', upsell: null } },
                ],
            },
        ];
        const { container } = render(<RealmNav items={items} variant="flat-with-headers" />);

        expect(screen.getByText('Library')).toBeTruthy();
        expect(screen.getByRole('link', { name: 'Lyrics' })).toBeTruthy();
        expect(container.querySelector('[data-locked="true"]')?.textContent).toContain('Voices');
    });
});
