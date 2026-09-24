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
function SiteHomeStage({ entry }: { entry?: { id: string; slug: string; artifact?: { url: string; version?: string | null } | null } | null }) {
    const [Page, setPage] = useState<ComponentType<Record<string, unknown>> | null>(null);
    setStubPage({ auth: { user: null } });
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
