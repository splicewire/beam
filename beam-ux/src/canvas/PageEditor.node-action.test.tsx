// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../editor/local-session', async (original) => {
    const actual = await original<typeof import('../editor/local-session')>();
    return { ...actual, IndexedDbSessions: class {
        async forEntry() { return []; } async write() {} close() {}
    } };
});
// The canvas reduced to one gesture: select the first node through the shell's mount, as a click on it would.
vi.mock('./CanvasWidget', () => ({
    CanvasWidget: ({ editShellMount }: { editShellMount: { selectNode(id: string | null): void } }) => (
        <button onClick={() => editShellMount.selectNode('0')}>Select the first block</button>
    ),
}));
vi.mock('./CanvasPalette', () => ({ CanvasPalette: () => null }));
vi.mock('./BlockInspector', () => ({ BlockInspector: () => null }));
import { PageEditor, type PageEditorTransport } from './PageEditor';
import { CanvasProvider } from './context';
import type { NodeActionDecision } from './node-action';

/**
 * node-actions-and-takes 04 in the real PageEditor: the Refine control appears in the inspector for the selected
 * node only when the host supplies `refineNode`; an accepted candidate is a Local Session change, and the next
 * draft save sends it through the ordinary saveDraft path. Texts are fixtures.
 */

const doc = [{ kind: 'text' as const, value: 'Fixture server text' }];
const state = { id: 'entry', headVersion: null, publishedVersion: null, versions: [], draftPending: false };
const saved = { ...state, headVersion: 'draft', publishedVersion: 'baseline' };
const kept: NodeActionDecision = {
    decision: 'kept',
    revision: {
        reference: 'fixture-ref',
        // The operation's real shape (laravel-beam-ux tests/CanvasNodePreviewTest.php:148-150): truth is the node.
        before: { address: '/0', truth: doc[0], standing: [] },
        after: { address: '/0', truth: { kind: 'text', value: 'Fixture refined text' }, standing: [] },
    },
    verdict: { hardFail: false, softWorse: false, reasons: [] },
};

afterEach(() => {
    act(() => window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'domain' } })));
    cleanup();
});

function mount(extra: Partial<PageEditorTransport> = {}) {
    const transport: PageEditorTransport = {
        saveBody: vi.fn(),
        saveDraft: vi.fn().mockResolvedValue(saved),
        publish: vi.fn().mockResolvedValue({ ...saved, publishedVersion: 'draft' }),
        listVersions: vi.fn().mockResolvedValue(state),
        restoreVersion: vi.fn(),
        ...extra,
    };
    render(
        <CanvasProvider config={{ registry: {}, MdxView: () => null, MdxEdit: () => null }}>
            <PageEditor slug="home" entryId="entry" userId="author" body={doc} transport={transport} />
        </CanvasProvider>,
    );
    act(() => window.dispatchEvent(new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } })));
    return transport;
}

it('offers Refine for the selected node, applies the accepted candidate locally, and saves it as an ordinary draft', async () => {
    const refineNode = vi.fn(async () => kept);
    const transport = mount({ refineNode });

    fireEvent.click(await screen.findByRole('button', { name: 'Select the first block' }));
    const control = await screen.findByRole('region', { name: 'Refine this block' });
    fireEvent.click(within(control).getByRole('button', { name: 'Regenerate' }));
    expect(refineNode).toHaveBeenCalledWith('home', { path: [0], mode: 'regenerate', body: doc });

    fireEvent.click(within(await screen.findByRole('group', { name: 'Candidate' })).getByRole('button', { name: 'Accept' }));
    // Nothing is written by accepting: the operation persisted nothing, and the draft save is the person's.
    expect(transport.saveDraft).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(transport.saveDraft).toHaveBeenCalledWith('home', [{ kind: 'text', value: 'Fixture refined text' }], null));
});

it('draws no Refine control when the host supplies no refineNode', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Select the first block' }));
    await screen.findByRole('button', { name: 'Save draft' });
    expect(screen.queryByRole('region', { name: 'Refine this block' })).toBeNull();
});
