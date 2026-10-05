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
