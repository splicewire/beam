import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import type { JsonDoc } from '../blockdoc/json.js';
import type { EntryPublicationState, EntryVersion } from '../types.js';
import { CanvasProvider } from './context.js';
import type { CanvasConfig } from './context.js';
import { PageEditor, __resetEditMode } from './PageEditor.js';
import type { PageEditorTransport } from './PageEditor.js';

/**
 * Catalog stories for the editor dock's **publication** affordance (G2-BEAM-DRAFT-PUBLISH).
 *
 * Its axis is **what the two pins say**: a working copy level with the published body, a working copy
 * ahead of it, the history panel over both, and the confirm a restore is gated behind. Everything the
 * dock knows arrives on ONE injected shape — `EntryPublicationState`, the projection of the PHP
 * `EntryPublicationData` every publication operation returns — so a story is a state, not a script.
 *
 * The FIRST story is the one worth reading twice: a transport with no publication methods gets the
 * Save/Exit dock unchanged. That is not a placeholder, it is the contract — a host mounts
 * `save-draft` / `publish` / `versions` / `restore` deliberately, and one that has not is not broken.
 */
/** No islands and no MDX lens: these stories are about the DOCK, not about what the canvas renders. */
const config: CanvasConfig = {
    registry: {},
    MdxView: () => null,
    MdxEdit: () => null,
};

const body: JsonDoc = [
    {
        kind: 'block',
        name: 'div',
        isComponent: false,
        dynamic: false,
        props: [],
        children: [
            {
                kind: 'block',
                name: 'h2',
                isComponent: false,
                dynamic: false,
                props: [],
                children: [{ kind: 'text', value: 'An editable hero, in place.' }],
            },
        ],
    },
];

const version = (over: Partial<EntryVersion>): EntryVersion => ({
    id: `v-${over.readable ?? 'v1'}`,
    version: 1,
    readable: 'v1',
    label: null,
    createdBy: null,
    createdAt: '2026-09-12T09:00:00+00:00',
    isHead: false,
    isPublished: false,
    ...over,
});

const PUBLISHED: EntryPublicationState = {
    id: 'entry-1',
    draftPending: false,
    publishedVersion: 'v-v1',
    publishedReadable: 'v1',
    headVersion: 'v-v1',
    headReadable: 'v1',
    versions: [version({ readable: 'v1', label: 'baseline', isHead: true, isPublished: true })],
    compileError: null,
};

const DRAFT_PENDING: EntryPublicationState = {
    id: 'entry-1',
    draftPending: true,
    publishedVersion: 'v-v1',
    publishedReadable: 'v1',
    headVersion: 'v-v2',
    headReadable: 'v2',
    versions: [
        version({ readable: 'v2', version: 2, label: 'draft', isHead: true }),
        version({ readable: 'v1', label: 'baseline', isPublished: true }),
    ],
    compileError: null,
};

const PUBLISHED_WITH_HISTORY: EntryPublicationState = {
    id: 'entry-1',
    draftPending: false,
    publishedVersion: 'v-v2',
    publishedReadable: 'v2',
    headVersion: 'v-v2',
    headReadable: 'v2',
    versions: [
        version({ readable: 'v2', version: 2, label: 'published', isHead: true, isPublished: true }),
        version({ readable: 'v1', label: 'baseline' }),
    ],
    compileError: null,
};

/** A transport whose publication methods all settle on one fixed state — a story is a state. */
const transportFor = (state: EntryPublicationState): PageEditorTransport => ({
    saveBody: async () => ({}),
    loadBody: async () => ({ body }),
    saveDraft: async () => state,
    publish: async () => state,
    listVersions: async () => state,
    restoreVersion: async () => state,
});

/**
 * The dock only renders in window (authoring) mode, which the host broadcasts — so a story has to
 * broadcast it too, and reset it on unmount or the next story inherits it.
 */
function InEditMode({ transport }: { transport: PageEditorTransport }) {
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        return () => __resetEditMode();
    }, []);

    return (
        <CanvasProvider config={config}>
            <div style={{ paddingTop: 56, minHeight: 320 }}>
                <PageEditor slug="home" body={body} transport={transport} brand="beam-starter · editor" />
            </div>
        </CanvasProvider>
    );
}

const meta = {
    title: 'BeamUx/Canvas/PageEditor publication',
    component: InEditMode,
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof InEditMode>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Let the dock's own promises settle before a `play` reads what they rendered. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 60));

/** Click a dock button by its visible label, then let the state it triggers land. */
async function click(root: HTMLElement, label: string): Promise<void> {
    const button = Array.from(root.querySelectorAll('.pe-btn')).find((b) => b.textContent === label);
    (button as HTMLElement | undefined)?.click();
    await settle();
}

/** NO publication seam — the Save/Exit dock a host that has not mounted the operations still gets. */
export const WithoutThePublicationSeam: Story = {
    args: { transport: { saveBody: async () => ({}) } },
};

/** PUBLISHED — the working copy and the readers' body are the same version; no badge. */
export const Published: Story = {
    args: { transport: transportFor(PUBLISHED) },
};

/**
 * DRAFT PENDING — the state the whole feature exists for. The badge names the version readers are
 * still on, because "unpublished changes" without saying what is live is the half that does not help.
 */
export const DraftPending: Story = {
    args: { transport: transportFor(DRAFT_PENDING) },
    play: async ({ canvasElement }) => {
        await click(canvasElement, 'Save draft');
    },
};

/** The VERSIONS panel over a pending draft: both pins flagged, Restore off every unpublished row. */
export const VersionsPanel: Story = {
    args: { transport: transportFor(DRAFT_PENDING) },
    play: async ({ canvasElement }) => {
        await click(canvasElement, 'Versions');
    },
};

/**
 * The RESTORE CONFIRM — one click ARMS it and a second performs it, because a restore changes what
 * every reader of the page is served and is not an undoable local edit.
 */
export const RestoreConfirm: Story = {
    args: { transport: transportFor(PUBLISHED_WITH_HISTORY) },
    play: async ({ canvasElement }) => {
        await click(canvasElement, 'Versions');
        (canvasElement.querySelector('[aria-label="Restore v1"]') as HTMLElement | null)?.click();
        await settle();
    },
};
