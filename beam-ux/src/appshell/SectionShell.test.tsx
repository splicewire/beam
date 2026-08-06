import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionShell, SectionTabStrip } from './SectionShell.js';
import type { SectionLinkComponent } from './types.js';

// A minimal injected link — the host would pass its router `NavLink` wrapper / Inertia `Link`.
const Link: SectionLinkComponent = ({ to, children }) => <a href={to}>{children}</a>;

describe('SectionShell', () => {
    it('frames children in the stack variant by default', () => {
        const { container } = render(
            <SectionShell>
                <p>body</p>
            </SectionShell>,
        );
        expect((container.firstChild as HTMLElement).className).toContain('space-y-4');
        expect(screen.getByText('body')).toBeTruthy();
    });

    it('uses the contained variant width when asked', () => {
        const { container } = render(
            <SectionShell variant="contained">
                <p>body</p>
            </SectionShell>,
        );
        expect((container.firstChild as HTMLElement).className).toContain('mx-auto');
        expect((container.firstChild as HTMLElement).className).toContain('max-w-5xl');
    });
});

describe('SectionTabStrip', () => {
    it('renders a link per tab through the injected link component', () => {
        render(
            <SectionTabStrip
                ariaLabel="Knowledge sub-sections"
                linkComponent={Link}
                tabs={[
                    { path: '/knowledge', label: 'Overview', end: true },
                    { path: '/knowledge/sources', label: 'Sources' },
                ]}
            />,
        );
        expect(screen.getByRole('link', { name: 'Overview' }).getAttribute('href')).toBe('/knowledge');
        expect(screen.getByRole('link', { name: 'Sources' }).getAttribute('href')).toBe(
            '/knowledge/sources',
        );
        expect(screen.getByRole('navigation', { name: 'Knowledge sub-sections' })).toBeTruthy();
    });

    it('renders nothing for an empty tab set', () => {
        const { container } = render(
            <SectionTabStrip ariaLabel="x" linkComponent={Link} tabs={[]} />,
        );
        expect(container.firstChild).toBeNull();
    });

    it('the divided variant carries the left-divider classes', () => {
        render(
            <SectionTabStrip
                ariaLabel="record tabs"
                linkComponent={Link}
                variant="divided"
                tabs={[{ path: '/circuits/1/runs', label: 'Runs' }]}
            />,
        );
        expect(
            screen.getByRole('navigation', { name: 'record tabs' }).className,
        ).toContain('border-l');
    });
});
