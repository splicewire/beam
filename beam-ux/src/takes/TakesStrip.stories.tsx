import type { Meta, StoryObj } from '@storybook/react-vite';
import { TakesStrip } from './TakesStrip';
import type { StripTake } from './types';

/**
 * Catalog story for {@link TakesStrip} (node-actions-and-takes 06). The acceptance's story: a music take (a rendered
 * artifact, with a player and a recorded steering fingerprint) and a cell revision (a replaced payload, with no
 * fingerprint, which says so) side by side for one node. Every value is a fixture.
 */
const meta = {
    title: 'BeamUx/TakesStrip',
    component: TakesStrip,
    parameters: { layout: 'padded' },
} satisfies Meta<typeof TakesStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = Date.now();
export const MUSIC_TAKE: StripTake = {
    key: 'artifact:fixture-job-1',
    kind: 'artifact',
    title: 'Music take · fixture-music-model',
    at: new Date(now - 12 * 60_000).toISOString(),
    audition: { url: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=', medium: 'audio' },
    fingerprint: [
        { label: 'Voice', value: 'Fixture voice' },
        { label: 'Prompt', value: 'warm, unhurried' },
    ],
    canRevert: false,
    canKeep: true,
};
export const CELL_REVISION: StripTake = {
    key: 'revision:fixture-41',
    kind: 'revision',
    title: 'Before a refine',
    at: new Date(now - 3 * 60 * 60_000).toISOString(),
    excerpt: 'Fixture verse — the first lines of the version a refine replaced.',
    fingerprint: null,
    canRevert: true,
    canKeep: false,
};

export const SideBySide: Story = {
    args: {
        takes: [MUSIC_TAKE, CELL_REVISION],
        labels: { region: 'Takes of this verse', empty: 'No other takes yet.', note: "Regenerate doesn't keep the version it replaces." },
        onRevert: () => undefined,
        onKeep: () => undefined,
    },
};

export const Empty: Story = {
    args: { takes: [], labels: { region: 'Takes of this verse', empty: 'No other takes yet. Each refine or polish keeps the version it replaced here.' } },
};

export const Loading: Story = {
    args: { takes: undefined, pending: true, labels: { region: 'Takes of this verse', empty: '' } },
};
