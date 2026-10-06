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
});
