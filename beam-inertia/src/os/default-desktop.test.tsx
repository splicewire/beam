// @vitest-environment jsdom
import { render, cleanup, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { DefaultOsDesktop } from './default-desktop';
import { buildDesktopChrome } from '@splicewire/beam-ux/shell';
import { MainframeOutlet } from '@schemastud/mainframe';
const state = vi.hoisted(() => ({
    page: { props: {} as Record<string, unknown> },
    visit: vi.fn(),
}));
vi.mock('@inertiajs/react', () => ({
    usePage: () => state.page,
    router: { visit: state.visit },
    Link: ({
        href,
        children,
        ...rest
    }: {
        href: string;
        children?: ReactNode;
    }) => (
        <a href={href} {...rest} data-inertia-link>
            {children}
        </a>
    ),
}));
vi.mock('@splicewire/beam-ux/shell', async (load) => {
    const actual = await load<typeof import('@splicewire/beam-ux/shell')>();
    return { ...actual, buildDesktopChrome: vi.fn(actual.buildDesktopChrome) };
});
vi.mock('@schemastud/mainframe', async (load) => {
    const actual = await load<typeof import('@schemastud/mainframe')>();
    return { ...actual, MainframeOutlet: vi.fn(actual.MainframeOutlet) };
});
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    state.page = { props: {} };
});
const manifest = ['locked', 'one', 'two', 'three', 'four'].map((key) => ({
    key,
    title: key,
    routeBase: '/' + key,
    locked: key === 'locked',
}));
describe('relocated zero-prop desktop adapter', () => {
    it('reads manifest with no props and opens exactly the first three unlocked realms', () => {
        state.page = { props: { realmManifest: manifest } };
        render(<DefaultOsDesktop />);
        const chrome = vi.mocked(buildDesktopChrome).mock.calls.at(-1)![0];
        expect(chrome.apps.map((a) => a.key)).toEqual([
            'locked',
            'one',
            'two',
            'three',
            'four',
        ]);
        const outlet = vi
            .mocked(MainframeOutlet)
            .mock.calls.find(([props]) => props.mode === 'os')![0];
        expect(outlet.ctx?.os).toHaveProperty('initialOpen', [
            'one',
            'two',
            'three',
        ]);
        chrome.onNavigate?.(chrome.apps[1]);
        expect(state.visit).toHaveBeenCalledWith('/one');
    });
    it('accepts an absent manifest and preserves supplied exclusions, surfaces, chrome and navigation', () => {
        const first = render(<DefaultOsDesktop />);
        expect(
            vi.mocked(buildDesktopChrome).mock.calls.at(-1)![0].apps
        ).toEqual([]);
        first.unmount();
        state.page = { props: { realmManifest: manifest } };
        const navigate = vi.fn();
        render(
            <DefaultOsDesktop
                exclude={new Set(['two'])}
                surfaceMap={{
                    one: {
                        label: 'override',
                        route: '/custom',
                        subtitle: 'custom',
                        accent: 'red',
                        geometry: { x: 0, y: 0, width: 320, height: 200 },
                        render: () => <p>custom surface</p>,
                    },
                }}
                onNavigate={navigate}
                chrome={{ launcherHeading: 'custom launcher' }}
            />
        );
        const chrome = vi.mocked(buildDesktopChrome).mock.calls.at(-1)![0];
        expect(chrome.apps.map((a) => a.key)).toEqual([
            'locked',
            'one',
            'three',
            'four',
        ]);
        expect(chrome.apps.find((a) => a.key === 'one')?.route).toBe('/custom');
        expect(chrome.launcherHeading).toBe('custom launcher');
        chrome.onNavigate?.(chrome.apps[1]);
        expect(navigate).toHaveBeenCalledWith(chrome.apps[1]);
        expect(screen.queryByText('custom surface')).not.toBeNull();
    });
    it('retains the injected Inertia error link when a real surface throws', () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        try {
            state.page = { props: { realmManifest: [manifest[1]] } };
            function Broken(): never {
                throw new Error('fixture surface failed');
            }
            render(
                <DefaultOsDesktop
                    surfaceMap={{
                        one: {
                            label: 'one',
                            route: '/recover',
                            subtitle: '',
                            accent: 'red',
                            geometry: { x: 0, y: 0, width: 320, height: 200 },
                            render: () => <Broken />,
                        },
                    }}
                />
            );
            expect(
                document
                    .querySelector('a[data-inertia-link]')
                    ?.getAttribute('href')
            ).toBe('/recover');
            expect(screen.queryByText('fixture surface failed')).not.toBeNull();
        } finally {
            consoleError.mockRestore();
        }
    });
});
