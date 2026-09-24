import { useEffect, useState, type ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect } from 'storybook/test';
import { resolveBeamPage } from '@splicewire/beam-inertia';
import { setStubPage } from '../../story-harness';

/**
 * Site / Home — the read fork (G2-BEAM-AUTHOR-ENTRY): a rendered entry with a compiled
 * `artifact` renders `<EntryBody>` (the reader's real path); an entry with none falls back
 * to the packaged default tree via `<PageEditor>` in its read (non-editing) fork. Stubbed
 * the same way `EntryBody.test.tsx` does — `artifact.url` unset/unresolvable rather than a
 * mocked network — no app/Laravel coupling either way.
 */
/** The starters' seeded `theme.site` (light slots only) — the dark slots come from the package defaults. */
const STARTER_SITE_THEME = {
    background: '#f8fafc',
    foreground: '#0f172a',
    muted: '#475569',
    accent: '#0f172a',
    accentHover: '#1e293b',
    accentForeground: '#FFFFFF',
    border: 'rgba(15,23,42,.08)',
    darkBackground: '#0B0F17',
    darkForeground: '#E5E7EB',
    darkMuted: '#9CA3AF',
    darkAccent: '#8AA4FF',
    darkAccentHover: '#A9BDFF',
    darkAccentForeground: '#0B0F17',
    darkBorder: '#262B36',
};

function SiteHomeStage({
    entry,
    theme,
}: {
    entry?: { id: string; slug: string; artifact?: { url: string; version?: string | null } | null } | null;
    theme?: Record<string, string>;
}) {
    const [Page, setPage] = useState<ComponentType<Record<string, unknown>> | null>(null);
    setStubPage({ auth: { user: null }, ...(theme ? { theme: { site: theme } } : {}) });
    useEffect(() => {
        let alive = true;
        resolveBeamPage('site/home').then((C) => alive && setPage(() => C));
        return () => {
            alive = false;
        };
    }, []);
    if (!Page) return null;
    return <Page entry={entry} />;
}

const meta = {
    title: 'Inertia/Site/Home',
    parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj;

/** With a compiled artifact — the reader path, `<EntryBody>` fetches (and here, fails to resolve) it. */
export const WithArtifact: Story = {
    render: () => (
        <SiteHomeStage
            entry={{ id: 'entry-1', slug: 'home', artifact: { url: '/beam/ux/artifacts/does-not-exist.js', version: 'v1' } }}
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByText(/could not be loaded|splicewire:beam:ux:compile/i, undefined, { timeout: 3000 }),
        ).toBeInTheDocument();
    },
};

/** No entry / no artifact — the packaged default tree renders (read mode, no authored save yet). */
export const DefaultTree: Story = {
    render: () => <SiteHomeStage entry={null} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByText(/editable in place through the promoted/i, undefined, { timeout: 3000 }),
        ).toBeInTheDocument();
    },
};

export const NarrowViewport: Story = {
    render: () => <SiteHomeStage entry={null} />,
    globals: { viewport: { value: 'mobile1', isRotated: false } },
};

/**
 * The dark variant: the site chrome, the demo hero and feature cards and the default copy re-bind to
 * the dark `theme.site` slots under `.dark` (the app's stored appearance, else the system scheme).
 * Pinned dark so the capture is the one the theme was designed for, with the resolved theme present.
 */
export const DefaultTreeDark: Story = {
    render: () => <SiteHomeStage entry={null} theme={STARTER_SITE_THEME} />,
    globals: { colorScheme: 'dark' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(
            await canvas.findByText(/editable in place through the promoted/i, undefined, { timeout: 3000 }),
        ).toBeInTheDocument();
        const root = canvasElement.querySelector('.st-site') as HTMLElement;
        await expect(getComputedStyle(root).backgroundColor).toBe('rgb(11, 15, 23)');
    },
};

/** The same page with the theme present, light — the seeded slots paint exactly the pre-theme palette. */
export const DefaultTreeThemed: Story = {
    render: () => <SiteHomeStage entry={null} theme={STARTER_SITE_THEME} />,
    globals: { colorScheme: 'light' },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByText(/editable in place through the promoted/i, undefined, { timeout: 3000 });
        const root = canvasElement.querySelector('.st-site') as HTMLElement;
        await expect(getComputedStyle(root).backgroundColor).toBe('rgb(248, 250, 252)');
    },
};
