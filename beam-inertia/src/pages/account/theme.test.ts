// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { MessageProvider } from '@schemastud/messages/react';
import type { ClientCatalog } from '@schemastud/messages';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@inertiajs/react', () => ({ Head: () => null }));
vi.mock('@splicewire/beam-ux', () => ({ ThemeEditor: () => null, UxBuilderProvider: () => null }));
import AccountTheme from './theme';
afterEach(cleanup);
it('the Theme empty state is customer-safe, not a seeder command (starter C50)', () => {
    const page = readFileSync(resolve('src/pages/account/theme.tsx'), 'utf8');
    expect(page).not.toContain('php artisan');
    expect(page).not.toContain('db:seed');
    // d15af22a theme.tsx's complete literal, now checked at its rendered seam.
    const { container } = render(createElement(AccountTheme, { entry: null }));
    expect(container.querySelector('p')?.textContent).toBe('This site is using the default theme — there is no custom theme to edit yet.');
    expect(container.textContent).toContain('default theme');
    expect(container.textContent).not.toContain('php artisan');
    expect(container.textContent).not.toContain('db:seed');
});
it('marks the actual Theme empty state under the real pseudo provider', () => {
    const value: ClientCatalog = { version: 1, locale: 'en-XA', realm: null, direction: 'ltr', messages: {} };
    const { container } = render(createElement(MessageProvider, { value, pseudo: true, children: createElement(AccountTheme, { entry: null }) }));
    expect(container.querySelector('p')?.textContent).toMatch(/^⟦/u);
    expect(container.textContent).not.toContain('php artisan');
    expect(container.textContent).not.toContain('db:seed');
});
