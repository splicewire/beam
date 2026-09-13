// @vitest-environment jsdom
/**
 * The host `PageEditor` wrapper's body load (G2-BEAM-AUTHOR-ENTRY / FIRST-EDIT, beam.test 2026-09-11).
 *
 * A hand-written page passes `body={null}` — the server shares an entry REF, not a body — so without a
 * load the editor always opened on `defaultTreeFor(slug)` and a second authoring session would overwrite
 * the first one's work on Save. And the load must land BEFORE the canvas mounts: `CanvasPageEditor`
 * seeds its document once, on mount, so a body arriving afterwards can only be applied by re-seeding,
 * which discards whatever the author has already done. Measured in tools/explore-editor.mjs section A:
 * the FIRST inline edit of a session vanished when the load landed between the insert and the commit.
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';

const editMode = vi.hoisted(() => ({ value: false }));
const loadBody = vi.hoisted(() => vi.fn());
const saveBody = vi.hoisted(() => vi.fn());

vi.mock('@inertiajs/react', () => ({ usePage: () => ({ props: {} }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('./canvas-config', () => ({ canvasConfig: { registry: {} } }));
vi.mock('./defaults', () => ({ defaultTreeFor: () => [{ kind: 'text', value: 'SEED' }] }));
vi.mock('./theme', () => ({ NEUTRAL_THEME: {} }));
vi.mock('./transport', () => ({ bodyClient: { loadBody, saveBody } }));
vi.mock('@splicewire/beam-ux/canvas', () => ({
    CanvasProvider: ({ children }: { children: unknown }) => <>{children as never}</>,
    useEditMode: () => editMode.value,
    // The public canvas owns its draft after mount; incidental parent props do not reseed it.
    PageEditor: ({
        body,
        transport,
    }: {
        body: unknown;
        transport: { saveBody: (slug: string, doc: unknown) => void };
    }) => {
        const [draft] = useState(body);
        return (
            <div data-testid="canvas">
                {JSON.stringify(draft)}
                <button onClick={() => transport.saveBody('home', draft)}>Save</button>
            </div>
        );
    },
}));

import { PageEditor } from './page-editor';

const SAVED = [
    { kind: 'block', name: 'h2', isComponent: false, dynamic: false, props: [], children: [] },
];

afterEach(() => {
    cleanup();
    editMode.value = false;
    loadBody.mockReset();
    saveBody.mockReset();
});

describe('host PageEditor — the body load', () => {
    it('does not load for a reader — the read op declares ability ux.author, so it would 401 every view', async () => {
        render(<PageEditor slug="home" entryId="e1" />);

        expect(screen.getByTestId('canvas')).toBeTruthy();
        expect(loadBody).not.toHaveBeenCalled();
    });

    it('waits for the persisted body before mounting the canvas, never re-seeding it afterwards', async () => {
        let resolve: (v: unknown) => void = () => {};
        loadBody.mockReturnValue(
            new Promise((r) => {
                resolve = r;
            }),
        );
        editMode.value = true;

        render(<PageEditor slug="home" entryId="e1" />);

        // Mid-flight: no canvas at all, rather than one seeded from the default that a re-seed would
        // later replace — a re-seed discards whatever the author has already done.
        expect(screen.queryByTestId('canvas')).toBeNull();
        expect(screen.getByText('Loading editor…')).toBeTruthy();

        resolve({ body: SAVED });

        await waitFor(() => expect(screen.getByTestId('canvas')).toBeTruthy());
        expect(screen.getByTestId('canvas').textContent).toContain('"h2"');
    });

    it('withholds the canvas after a rejected persisted-body read', async () => {
        loadBody.mockRejectedValue(new Error('Forbidden'));
        editMode.value = true;

        render(<PageEditor slug="home" entryId="e1" body={SAVED} />);

        await waitFor(() => expect(screen.queryByText('Loading editor…')).toBeNull());
        expect(screen.queryByTestId('canvas')).toBeNull();
        expect(screen.getByRole('alert').textContent).toContain('Could not load');
    });

    it.each(['ready', 'refused'])(
        'withholds A during a same-slug replacement read, then handles B as %s',
        async (outcome) => {
            let resolve: (value: unknown) => void = () => {};
            let reject: (reason: Error) => void = () => {};
            loadBody.mockResolvedValueOnce({ body: SAVED }).mockReturnValueOnce(
                new Promise((yes, no) => {
                    resolve = yes;
                    reject = no;
                }),
            );
            editMode.value = true;
            const view = render(<PageEditor slug="home" entryId="a" />);
            await screen.findByRole('button', { name: 'Save' });

            view.rerender(<PageEditor slug="home" entryId="b" />);

            expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
            expect(screen.getByText('Loading editor…')).toBeTruthy();
            expect(loadBody).toHaveBeenLastCalledWith('b');
            await act(async () => {
                if (outcome === 'refused') reject(new Error('Forbidden'));
                else resolve({ body: [{ ...SAVED[0], name: 'article' }] });
            });
            if (outcome === 'refused') {
                expect(screen.queryByTestId('canvas')).toBeNull();
                expect(screen.getByRole('alert')).toBeTruthy();
                expect(saveBody).not.toHaveBeenCalled();
            } else {
                expect(screen.getByTestId('canvas').textContent).toContain('article');
                fireEvent.click(screen.getByRole('button', { name: 'Save' }));
                expect(saveBody).toHaveBeenCalledWith('b', [{ ...SAVED[0], name: 'article' }]);
            }
        },
    );

    it('falls back to the page-supplied body when the entry has none saved', async () => {
        loadBody.mockResolvedValue({ body: [] });
        editMode.value = true;

        render(<PageEditor slug="home" entryId="e1" body={SAVED} />);

        await waitFor(() => expect(screen.getByTestId('canvas')).toBeTruthy());
        expect(screen.getByTestId('canvas').textContent).toContain('"h2"');
    });

    it('mounts the canvas with no load at all when the page is bound to no entry', () => {
        editMode.value = true;

        render(<PageEditor slug="home" entryId={null} />);

        expect(screen.getByTestId('canvas')).toBeTruthy();
        expect(loadBody).not.toHaveBeenCalled();
    });
});
