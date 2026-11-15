// @vitest-environment jsdom
/**
 * The editor kit carries the host client's `refineNode` to the canvas (node-actions-and-takes 04). The canvas grows its
 * Refine control exactly when its transport has `refineNode` (proven against the real canvas in
 * `canvas/PageEditor.node-action.test.tsx`); this file proves the kit's half: a client that supplies the operation
 * reaches the canvas addressed by the entry id, and a client that does not leaves the canvas without it.
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const editMode = vi.hoisted(() => ({ value: true }));
const client = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const seen = vi.hoisted(() => ({ transport: undefined as undefined | Record<string, unknown> }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('./context', () => ({
    useEditorKit: () => ({
        transport: client.current,
        theme: {},
        canAuthor: true,
        canvasConfig: { registry: {} },
        defaultTreeFor: () => [{ kind: 'text', value: 'SEED' }],
        notify: { success: vi.fn(), error: vi.fn() },
    }),
}));
vi.mock('../canvas', () => ({
    CanvasProvider: ({ children }: { children: unknown }) => <>{children as never}</>,
    useEditMode: () => editMode.value,
    PageEditor: ({ transport }: { transport: Record<string, unknown> }) => {
        seen.transport = transport;
        // The canvas's own gate: the control renders only when the transport carries refineNode.
        return <div data-testid="canvas">{transport.refineNode ? <section aria-label="Refine this block" /> : null}</div>;
    },
}));

import { PageEditor } from './page-editor';

const BODY = [{ kind: 'block', name: 'p', id: 'n1', isComponent: false, dynamic: false, props: [], children: [] }];

afterEach(() => {
    cleanup();
    seen.transport = undefined;
});

describe('editor kit — refineNode reaches the canvas', () => {
    it('forwards the client operation, addressed by the entry id, and the canvas grows its Refine control', async () => {
        const decision = { decision: 'kept', revision: null, verdict: null };
        const refineNode = vi.fn().mockResolvedValue(decision);
        client.current = { loadBody: vi.fn().mockResolvedValue({ body: BODY }), saveBody: vi.fn(), refineNode };
        render(<PageEditor slug="home" entryId="e1" />);
        await waitFor(() => expect(screen.getByTestId('canvas')).toBeTruthy());

        expect(screen.getByRole('region', { name: 'Refine this block' })).toBeTruthy();
        const request = { path: [0], nodeId: 'n1', mode: 'refine' as const, instruction: 'Shorter', body: BODY };
        const port = seen.transport?.refineNode as (slug: string, r: typeof request) => Promise<unknown>;
        await expect(port('home', request)).resolves.toBe(decision);
        expect(refineNode).toHaveBeenCalledWith('e1', request);
    });

    it('leaves the canvas without refineNode, and without the control, when the client does not supply it', async () => {
        client.current = { loadBody: vi.fn().mockResolvedValue({ body: BODY }), saveBody: vi.fn() };
        render(<PageEditor slug="home" entryId="e1" />);
        await waitFor(() => expect(screen.getByTestId('canvas')).toBeTruthy());

        expect(seen.transport && 'refineNode' in seen.transport).toBe(false);
        expect(screen.queryByRole('region', { name: 'Refine this block' })).toBeNull();
    });

    it('does not offer it for an entry with no row to address', async () => {
        client.current = { loadBody: vi.fn(), saveBody: vi.fn(), refineNode: vi.fn() };
        render(<PageEditor slug="home" entryId={null} />);
        await waitFor(() => expect(screen.getByTestId('canvas')).toBeTruthy());

        expect(seen.transport && 'refineNode' in seen.transport).toBe(false);
    });
});
