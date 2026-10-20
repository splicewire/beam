import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionTabs, type SectionTabLinkComponent } from './SectionTabs.js';
import type { RealmNavNode } from './types.js';

// A host tab link: `to`/`end`/children, exactly the shape the flagship's SectionTabLink speaks. The
// link owns its own active styling; here it just renders an <a> carrying `end` for assertions.
const Link: SectionTabLinkComponent = ({ to, end, children }) => (
    <a href={to} data-end={end ? 'true' : 'false'}>
        {children}
    </a>
);

const leaf = (title: string, href: string): RealmNavNode => ({
    kind: 'nav/link',
    title,
    href,
    match: `${href.replace(/^\//, '')}*`,
    children: [],
});

// The tenant tree shape APP-17 projects: a Knowledge section whose children include a Graph GROUP
// (a child carrying its own children), beside leaf sections (Calendar) and a section with a plain
// child strip (Threads).
const items: RealmNavNode[] = [
    leaf('Calendar', '/calendar'),
    {
        kind: 'nav/section',
        title: 'Knowledge',
        href: '/knowledge',
        match: 'knowledge*',
        children: [
            leaf('Fragments', '/knowledge/fragments'),
            leaf('Context scopes', '/knowledge/scopes'),
            {
                kind: 'nav/link',
                title: 'Graph',
                href: '/knowledge/graph/concepts', // group header lands on its first child (no Overview, APP-4)
                match: 'knowledge/graph*',
                children: [
                    leaf('Concepts', '/knowledge/graph/concepts'),
                    leaf('Rules', '/knowledge/graph/rules'),
                    leaf('Visualize', '/knowledge/graph/visualize'),
                ],
            },
        ],
    },
    {
        kind: 'nav/section',
        title: 'Threads',
        href: '/threads',
        match: 'threads*',
        children: [leaf('Threads', '/threads'), leaf('Agents', '/threads/agents')],
    },
];

describe('SectionTabs — primary strip from the active section’s projected children', () => {
    it('renders the active section’s children as the primary tab strip', () => {
        render(<SectionTabs items={items} pathname="/knowledge/fragments" linkComponent={Link} />);
        const primary = screen.getByRole('navigation', { name: 'Knowledge sub-sections' });
        const labels = within(primary)
            .getAllByRole('link')
            .map((a) => a.textContent);
        expect(labels).toEqual(['Fragments', 'Context scopes', 'Graph']);
        expect(within(primary).getByRole('link', { name: 'Graph' }).getAttribute('href')).toBe(
            '/knowledge/graph/concepts',
        );
    });

    it('picks the section by LONGEST match (a deep path still resolves its section)', () => {
        render(<SectionTabs items={items} pathname="/knowledge/graph/rules" linkComponent={Link} />);
        expect(screen.getByRole('navigation', { name: 'Knowledge sub-sections' })).toBeTruthy();
    });

    it('renders nothing for a leaf section (no children)', () => {
        const { container } = render(
            <SectionTabs items={items} pathname="/calendar" linkComponent={Link} />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing when no section matches the pathname', () => {
        const { container } = render(
            <SectionTabs items={items} pathname="/nowhere" linkComponent={Link} />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders nothing for a section whose only child is its own index (no redundant one-tab strip)', () => {
        const selfIndexOnly: RealmNavNode[] = [
            {
                kind: 'nav/section',
                title: 'Studio',
                href: '/studio',
                match: 'studio*',
                children: [leaf('Studio', '/studio')], // the sole child IS the section index
            },
        ];
        const { container } = render(
            <SectionTabs items={selfIndexOnly} pathname="/studio" linkComponent={Link} />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders the fallback (the host section name) for a leaf section', () => {
        const { container } = render(
            <SectionTabs
                items={items}
                pathname="/calendar"
                linkComponent={Link}
                fallback={<span data-testid="chrome">Calendar</span>}
            />,
        );
        expect(within(container).getByTestId('chrome').textContent).toBe('Calendar');
    });

    it('does NOT render the fallback when no section matches (there is no section to name)', () => {
        const { container } = render(
            <SectionTabs
                items={items}
                pathname="/nowhere"
                linkComponent={Link}
                fallback={<span data-testid="chrome">x</span>}
            />,
        );
        expect(within(container).queryByTestId('chrome')).toBeNull();
    });
});

describe('SectionTabs — the group strip (Knowledge → Graph, level 3)', () => {
    it('draws the active group’s children as a second strip only while inside the group', () => {
        render(<SectionTabs items={items} pathname="/knowledge/graph/concepts" linkComponent={Link} />);
        const group = screen.getByRole('navigation', { name: 'Graph group sections' });
        expect(
            within(group)
                .getAllByRole('link')
                .map((a) => a.textContent),
        ).toEqual(['Concepts', 'Rules', 'Visualize']);
    });

    it('does NOT draw the group strip when the active path is not inside the group', () => {
        render(<SectionTabs items={items} pathname="/knowledge/fragments" linkComponent={Link} />);
        expect(screen.queryByRole('navigation', { name: 'Graph group sections' })).toBeNull();
    });
});

describe('SectionTabs — the end (exact-match) flag', () => {
    it('end-matches only a child that lands on the section’s own href (an index/Overview tab)', () => {
        const withOverview: RealmNavNode[] = [
            {
                kind: 'nav/section',
                title: 'Determination',
                href: '/determination',
                match: 'determination*',
                children: [
                    leaf('Overview', '/determination'),
                    leaf('Declarations', '/determination/declarations'),
                ],
            },
        ];
        render(
            <SectionTabs items={withOverview} pathname="/determination" linkComponent={Link} />,
        );
        expect(screen.getByRole('link', { name: 'Overview' }).getAttribute('data-end')).toBe('true');
        expect(screen.getByRole('link', { name: 'Declarations' }).getAttribute('data-end')).toBe(
            'false',
        );
    });
});
