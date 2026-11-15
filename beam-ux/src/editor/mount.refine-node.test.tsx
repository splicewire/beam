// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

/**
 * node-actions-and-takes 04: the editor kit's VisualEditorMount (the Site section's editor) binds the entry client's
 * `refineNode` to the open entry and hands it to the canvas; a client without `refineNode` hands it nothing, so hosts
 * that have not mounted the operation see no change. Texts are fixtures.
 */

const seen = vi.hoisted(() => ({ nodeAction: 'unset' as unknown, transport: {} as Record<string, unknown> }));
vi.mock('./local-session', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./local-session')>()),
    IndexedDbSessions: class { async forEntry() { return []; } async write() {} close() {} },
}));
vi.mock('./context', () => ({
    useEditorKit: () => ({
        userId: 'author', canAuthor: true, theme: {}, canvasConfig: { registry: {} },
        transport: seen.transport, notify: { success: vi.fn(), error: vi.fn() },
    }),
}));
vi.mock('../canvas', () => ({
    CanvasProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    VisualEditor: ({ nodeAction }: { nodeAction?: unknown }) => {
        seen.nodeAction = nodeAction;
        return <div data-testid="canvas" />;
    },
}));
import { VisualEditorMount } from './mount';

afterEach(() => { cleanup(); seen.nodeAction = 'unset'; });

const state = { headVersion: 'v1', publishedVersion: 'v1', draftPending: false, versions: [] };
const BODY = [{ kind: 'text', value: 'Fixture body' }];
function transport(extra: Record<string, unknown> = {}) {
    seen.transport = {
        loadBody: vi.fn().mockResolvedValue({ body: BODY }), listVersions: vi.fn().mockResolvedValue(state),
        saveBody: vi.fn(), saveDraft: vi.fn(), publish: vi.fn(), restoreVersion: vi.fn(), ...extra,
    };
}

it("binds the entry client's refineNode to the open entry", async () => {
    const decision = { decision: 'kept' };
    const refineNode = vi.fn().mockResolvedValue(decision);
    transport({ refineNode });
    render(<VisualEditorMount entryRef={{ id: 'entry-1', slug: 'home', format: 'tsx' }} />);

    await waitFor(() => expect(seen.nodeAction).not.toBe('unset'));
    const port = seen.nodeAction as { slug: string; refine: (slug: string, request: unknown) => Promise<unknown> };
    expect(port.slug).toBe('home');
    const request = { path: [0], mode: 'regenerate', body: BODY };
    await expect(port.refine('home', request)).resolves.toBe(decision);
    expect(refineNode).toHaveBeenCalledWith('entry-1', request);
});

it('hands the canvas no node-action port when the client has no refineNode', async () => {
    transport();
    render(<VisualEditorMount entryRef={{ id: 'entry-1', slug: 'home', format: 'tsx' }} />);
    await waitFor(() => expect(seen.nodeAction).not.toBe('unset'));
    expect(seen.nodeAction).toBeUndefined();
});
