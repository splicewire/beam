// @vitest-environment jsdom
/**
 * ux-walkthrough UX-03 / IA-14: the Inertia shell renders the host's shared `brand` (laravel-beam M8 through
 * `Brand::for()`) and spells no brand of its own: no "Beam Starter", no "Laravel", no starter-kit links.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const props = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock('@inertiajs/react', () => ({ usePage: () => ({ props: props.value }) }));

import AppLogo from './components/app-logo';
import AppLogoIcon from './components/app-logo-icon';
import { configureBeamInertia } from './config';
import { brandTitle } from './hooks/use-brand';

afterEach(cleanup);

it('titles a page from the brand, with or without a template, and never invents one', () => {
    expect(brandTitle('Billing', { name: 'Acme', titleTemplate: null })).toBe('Billing - Acme');
    expect(brandTitle('Billing', { name: 'Acme', titleTemplate: ':title · :name' })).toBe('Billing · Acme');
    expect(brandTitle('', { name: 'Acme', titleTemplate: null })).toBe('Acme');
    expect(brandTitle('Billing', { name: '', titleTemplate: null })).toBe('Billing');
});

it('renders the shared brand name in the logo lockup', () => {
    props.value = { name: 'acme-app', brand: { name: 'Acme', logo: null, titleTemplate: null, legalEntity: null, passkeyCopy: '' } };
    const { container } = render(<AppLogo />);

    expect(container.textContent).toContain('Acme');
    expect(container.textContent).not.toMatch(/Beam Starter|Laravel/);
});

it('falls back to the shared app name when a host does not share a brand yet', () => {
    props.value = { name: 'Acme' };
    const { container } = render(<AppLogo />);

    expect(container.textContent).toContain('Acme');
});

const brand = (name: string, logo: string | null = null) => ({ name, logo, titleTemplate: null, legalEntity: null, passkeyCopy: '' });

/**
 * UX-03b (integrator 07:45Z): every starter shell showed the Laravel starter kit's logo, because each host passed that
 * SVG as `logo` and the icon rendered whatever the host passed. The mark is the BRAND's: its `logo` URL when the host
 * declares one, else a neutral monogram of its name. A host-passed component is the explicit override.
 */
it('draws the brand logo URL as the mark when the brand declares one', () => {
    configureBeamInertia({});
    props.value = { brand: brand('Acme', '/brand/acme.svg') };
    const { container } = render(<AppLogoIcon />);

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/brand/acme.svg');
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Acme');
});

it('draws a neutral monogram of the brand name when no logo is declared', () => {
    configureBeamInertia({});
    props.value = { brand: brand('Splicewire') };
    const { container } = render(<AppLogoIcon />);

    expect(container.textContent).toBe('S');
    expect(container.querySelector('path')).toBeNull();
});
