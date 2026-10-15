import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';

// G1-BEAM-FRESH-INSTALL: the dashboard sidebar user chip must render as a STYLED ROW with a
// menu-control affordance — avatar and name side-by-side, a chevron — not a bare button that stacks
// them. The chip is RealmSwitcher (real, from @splicewire/beam-ux/nav) with a styled triggerClassName
// + a ChevronsUpDown in the label. Rendered via renderToStaticMarkup (the markup is what regressed).
const page = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));
vi.mock('@inertiajs/react', () => ({
    usePage: () => page,
    Link: ({ children, ...rest }: { children: unknown }) => rest && children,
}));

import { NavUser } from './nav-user';

const user = { id: 1, name: 'Ada Byron', email: 'ada@example.test', avatar: '' };
const realms = {
    current: 'app',
    back: null,
    realms: [{ key: 'app', label: 'App', href: '/dashboard', surface: 'app', locked: false }],
};

afterEach(() => {
    page.props = {};
});

it('renders the user chip as a full-width flex row with a ChevronsUpDown menu control (G1)', () => {
    page.props = { auth: { user }, realms };
    const html = renderToStaticMarkup(<NavUser />);
    // the trigger is a full-width flex ROW (avatar + name side-by-side, not stacked)
    expect(html).toMatch(/<button[^>]*class="[^"]*\bflex\b/);
    expect(html).toMatch(/<button[^>]*class="[^"]*\bw-full\b/);
    // a menu-control affordance is present
    expect(html).toContain('chevrons-up-down');
});

it('renders nothing when the realms payload is absent (unchanged)', () => {
    page.props = { auth: { user } };
    expect(renderToStaticMarkup(<NavUser />)).toBe('');
});
