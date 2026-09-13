// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import type { JsonDoc } from '@splicewire/beam-ux/blockdoc/json';

const loadBody = vi.hoisted(() => vi.fn());
const saveBody = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', () => ({ usePage: () => ({ props: {} }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('./canvas-config', () => ({ canvasConfig: { registry: {} } }));
vi.mock('./defaults', () => ({ defaultTreeFor: () => [{ kind: 'text', value: 'SEED' }] }));
vi.mock('./theme', () => ({ NEUTRAL_THEME: {} }));
vi.mock('./transport', () => ({ bodyClient: { loadBody, saveBody } }));
// Observe the adapter's public controlled-value and save seam; the canvas has its own owning tests.
vi.mock('@splicewire/beam-ux/canvas', () => ({
    CanvasProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    VisualEditor: ({ value, onSave }: { value: JsonDoc; onSave: () => void }) => (
        <div data-testid="canvas">
            {JSON.stringify(value)}
            <button onClick={onSave}>Save</button>
        </div>
    ),
}));
import { VisualEditorMount } from './mount';

const SAVED = [{ kind: 'text', value: 'Persisted A' }];
const ref = (id: string | null) => ({ id, slug: 'home', format: 'tsx' });
afterEach(() => {
    cleanup();
    loadBody.mockReset();
    saveBody.mockReset();
});

it('withholds replacement writes after a refused window read', async () => {
    loadBody.mockRejectedValue(new Error('Forbidden'));
    render(<VisualEditorMount entryRef={ref('a')} />);

    await waitFor(() => expect(screen.queryByText('Loading editor…')).toBeNull());
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('Could not load');
    expect(saveBody).not.toHaveBeenCalled();
});

it.each(['ready', 'refused'])(
    'withholds settled A while reading replacement B, then handles B as %s',
    async (outcome) => {
        let resolve: (value: unknown) => void = () => {};
        let reject: (reason: Error) => void = () => {};
        loadBody.mockResolvedValueOnce({ body: SAVED }).mockReturnValueOnce(
            new Promise((yes, no) => {
                resolve = yes;
                reject = no;
            }),
        );
        const view = render(<VisualEditorMount entryRef={ref('a')} />);
        await screen.findByRole('button', { name: 'Save' });

        view.rerender(<VisualEditorMount entryRef={ref('b')} />);

        expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
        expect(screen.getByText('Loading editor…')).toBeTruthy();
        await act(async () => {
            if (outcome === 'refused') reject(new Error('Forbidden'));
            else resolve({ body: [{ kind: 'text', value: 'Persisted B' }] });
        });
        if (outcome === 'refused') {
            expect(screen.queryByTestId('canvas')).toBeNull();
            expect(screen.getByRole('alert')).toBeTruthy();
            expect(saveBody).not.toHaveBeenCalled();
        } else {
            fireEvent.click(screen.getByRole('button', { name: 'Save' }));
            expect(saveBody).toHaveBeenCalledWith('b', [{ kind: 'text', value: 'Persisted B' }]);
        }
    },
);

it('keeps a successful empty window load editable from its seed', async () => {
    loadBody.mockResolvedValue({ body: [] });
    render(<VisualEditorMount entryRef={ref('a')} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    expect(saveBody).toHaveBeenCalledWith('a', [{ kind: 'text', value: 'SEED' }]);
});
