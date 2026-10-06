import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RealmHeader } from './RealmHeader';

/** ux-walkthrough UX-12a (IA-4): outside the default workspace the rail top names the realm and offers Back. */
describe('RealmHeader', () => {
    it('names the realm and links back to the workspace', () => {
        const { container } = render(
            <RealmHeader realm={{ key: 'operator', label: 'Operator', href: '/operator', surface: 'app', locked: false }} back={{ label: 'Acme', href: '/dashboard' }} />,
        );
        expect(container.querySelector('[data-realm-label]')?.textContent).toBe('Operator');
        const back = container.querySelector('a[data-realm-back]');
        expect(back?.getAttribute('href')).toBe('/dashboard');
        expect(back?.textContent).toBe('← Back to Acme');
    });

    // The header sits on whatever surface the shell's rail is (dark at the flagship, light in beam-inertia), so Back
    // inherits that surface's foreground and only dims it: a fixed muted colour vanished on the flagship's dark rail.
    it("draws Back in the rail's own foreground, dimmed, never a fixed colour", () => {
        const { container } = render(
            <RealmHeader realm={{ key: 'operator', label: 'Operator', href: '/operator', surface: 'app', locked: false }} back={{ label: 'App', href: '/dashboard' }} />,
        );
        const cls = container.querySelector('a[data-realm-back]')?.className ?? '';
        expect(cls).not.toMatch(/\btext-(muted|foreground|popover|sidebar)[\w-]*/);
        expect(cls).toMatch(/\bopacity-\d+/);
    });

    it('renders nothing in the default workspace (no back)', () => {
        const { container } = render(
            <RealmHeader realm={{ key: 'tenant', label: 'App', href: '/dashboard', surface: 'app', locked: false }} back={null} />,
        );
        expect(container.innerHTML).toBe('');
    });
});
