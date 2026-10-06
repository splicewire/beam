// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * ux-walkthrough UX-12a, probe PR-1: no author edited an app page in place, so the in-place editor (the OS dock)
 * overlays `site/*` pages only. An app-realm page gets no dock even for an `os.enter` principal.
 */
const page = vi.hoisted(() => ({ component: 'site/home', props: { can: { 'os.enter': true } as Record<string, boolean> } }));

vi.mock('@inertiajs/react', () => ({ usePage: () => page }));
vi.mock('../os/operator-desk', () => ({ default: () => <div data-testid="dock" /> }));

import OsLayout from './os-layout';

afterEach(cleanup);

describe('OsLayout', () => {
    it('overlays the editor on a site page for an os.enter principal', () => {
        page.component = 'site/home';
        render(<OsLayout><p>page</p></OsLayout>);
        expect(screen.queryByTestId('dock')).not.toBeNull();
    });

    it('leaves an app-realm page without the editor', () => {
        page.component = 'operator/dashboard';
        render(<OsLayout><p>page</p></OsLayout>);
        expect(screen.queryByTestId('dock')).toBeNull();
        page.component = 'dashboard';
        cleanup();
        render(<OsLayout><p>page</p></OsLayout>);
        expect(screen.queryByTestId('dock')).toBeNull();
    });

    // UX-12a follow-up 2: the dock floats over the bottom-right corner, so while it is mounted the layout publishes
    // the room it takes; the site footer pads by it. No dock, no clearance.
    it('publishes the dock clearance only while the dock is mounted', () => {
        const clearance = () => document.documentElement.style.getPropertyValue('--beam-dock-clearance');
        page.component = 'site/home';
        const { unmount } = render(<OsLayout><p>page</p></OsLayout>);
        expect(clearance()).not.toBe('');
        unmount();
        expect(clearance()).toBe('');
        page.component = 'dashboard';
        render(<OsLayout><p>page</p></OsLayout>);
        expect(clearance()).toBe('');
    });
});
