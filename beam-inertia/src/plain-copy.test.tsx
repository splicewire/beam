// @vitest-environment jsdom
/**
 * Launch ticket 05 item 2: the starter's default home and account home described the internals to an end user
 * ("sealed island", "JsonDoc body", "@splicewire/beam-ux/canvas", "promoted AccountShell", "AccountShellProvider").
 * Default copy says what the site does; the internals belong in docs.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({ Head: () => null }));

import { DEFAULT_TREES } from './editor/defaults';
import { DemoFeatureRow, DemoHero } from './editor/islands';
import AccountHome from './pages/account/home';

const INTERNALS = /sealed island|JsonDoc|@splicewire|beam-ux|canvas|AccountShell|Provider|registry|\bhost\b|sitemap|Inertia share/i;

afterEach(cleanup);

it('keeps the internals out of the default home body', () => {
    expect(JSON.stringify(DEFAULT_TREES.home)).not.toMatch(INTERNALS);
});

it.each([
    ['DemoHero', DemoHero],
    ['DemoFeatureRow', DemoFeatureRow],
    ['AccountHome', AccountHome],
])('keeps the internals out of %s', (_name, Component) => {
    const { container } = render(<Component />);
    expect(container.textContent).not.toMatch(INTERNALS);
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
});
