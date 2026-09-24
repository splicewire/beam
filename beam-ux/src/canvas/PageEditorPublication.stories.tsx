import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
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
 *
 * It also stands in for the HOST'S TOAST SURFACE. `notify` is an injected seam (the package never
 * imports a toast library), so a story without one would show nothing when an operation reports
 * something — and what an operation reports is half of what these stories are about: a publish and a
 * save both answer with a compile diagnostic, and the dock itself stays clean either way.
 */
function InEditMode({ transport }: { transport: PageEditorTransport }) {
    const [toasts, setToasts] = useState<{ kind: 'success' | 'error'; msg: string }[]>([]);
    const notify = {
        success: (msg: string) => setToasts((t) => [...t, { kind: 'success' as const, msg }]),
        error: (msg: string) => setToasts((t) => [...t, { kind: 'error' as const, msg }]),
    };

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        return () => __resetEditMode();
    }, []);

    return (
        <CanvasProvider config={config}>
            <div style={{ paddingTop: 56, minHeight: 320 }}>
                <PageEditor
                    slug="home"
                    body={body}
                    transport={transport}
                    notify={notify}
                    brand="beam-starter · editor"
                />
            </div>
            <div
                style={{
                    position: 'fixed',
                    right: 16,
                    bottom: 16,
                    display: 'grid',
                    gap: 8,
                    justifyItems: 'end',
                }}
            >
                {toasts.map((toast, i) => (
                    <div
                        key={i}
                        data-toast={toast.kind}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            font: '500 13px/1.4 system-ui, sans-serif',
                            color: '#fff',
                            maxWidth: 360,
                            background: toast.kind === 'error' ? '#b42318' : '#067647',
                        }}
                    >
                        {toast.msg}
                    </div>
                ))}
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

/**
 * Click a dock button by its visible label once the dock has mounted and the button is enabled.
 *
 * The dock only exists after the edit-mode broadcast lands, so a lookup at play start can find
 * nothing; a play that silently clicked nothing left these stories' baselines showing the state
 * BEFORE the one they are named for. Waiting for the button (and asserting the result, below) makes
 * the final frame the named state or fails the story.
 */
async function click(root: HTMLElement, label: string): Promise<void> {
    const button = await within(root).findByRole('button', { name: label });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
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
        await expect(await within(canvasElement).findByText(/Draft pending/)).toBeVisible();
    },
};

/** The VERSIONS panel over a pending draft: both pins flagged, Restore off every unpublished row. */
export const VersionsPanel: Story = {
    args: { transport: transportFor(DRAFT_PENDING) },
    play: async ({ canvasElement }) => {
        await click(canvasElement, 'Versions');
        const panel = await within(canvasElement).findByRole('complementary', { name: 'Versions' });
        await expect(await within(panel).findByRole('button', { name: 'Restore v2' })).toBeEnabled();
    },
};

/**
 * SAVED, BUT NOT COMPILED — the state an author used to be told was a clean "Saved".
 *
 * A Save is its own publish here: the body is written, a version recorded, the pin moved, and only
 * then is the artifact compiled. When that last step fails there is no artifact at the new address and
 * a reader is served the packaged default over a body that is perfectly intact — so the dock is clean,
 * the canvas is not dirty, and the ONE thing that is wrong is invisible from the canvas. The server
 * already answers with the diagnostic (`BeamUxEntryBodyData.compileError`); this is what reading it
 * looks like, and it is the same error surface a failed `Publish` uses.
 */
export const SavedWithACompileError: Story = {
    args: {
        transport: {
            ...transportFor(PUBLISHED),
            saveBody: async () => ({
                compileError: 'Unclosed <Card> on line 12 — readers still see the last good version.',
            }),
        },
    },
    play: async ({ canvasElement }) => {
        await click(canvasElement, 'Save');
        await expect(await within(canvasElement).findByText(/Unclosed <Card> on line 12/)).toBeVisible();
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
        await click(canvasElement, 'Restore v1');
        await expect(
            await within(canvasElement).findByRole('alertdialog', { name: 'Confirm restore' }),
        ).toBeVisible();
    },
};
