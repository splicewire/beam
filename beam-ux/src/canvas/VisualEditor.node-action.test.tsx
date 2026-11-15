// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
// The canvas reduced to one gesture: select the first node through the shell's mount, as a click on it would.
vi.mock('./CanvasWidget', () => ({
    CanvasWidget: ({ editShellMount }: { editShellMount: { selectNode(id: string | null): void } }) => (
        <button onClick={() => editShellMount.selectNode('0')}>Select the first block</button>
    ),
}));
vi.mock('./CanvasPalette', () => ({ CanvasPalette: () => null }));
vi.mock('./BlockInspector', () => ({ BlockInspector: () => null }));
import { VisualEditor } from './VisualEditor';
import type { JsonDoc } from '../blockdoc/json';
import type { NodeActionDecision, RefineNodePort } from './node-action';

/**
 * node-actions-and-takes 04 in the VisualEditor, the canvas the editor kit's Site section mounts (VisualEditorMount):
 * the Refine control appears for the selected node only when the host binds a node-action port, and an accepted
 * candidate is the editor's ordinary change, one undoable step. Texts are fixtures.
 */

afterEach(cleanup);

const doc: JsonDoc = [{ kind: 'text', value: 'Fixture server text' }];
const kept: NodeActionDecision = {
    decision: 'kept',
    revision: {
        reference: 'fixture-ref',
        before: { address: '/0', truth: doc[0], standing: [] },
        after: { address: '/0', truth: { kind: 'text', value: 'Fixture refined text' }, standing: [] },
    },
    verdict: { hardFail: false, softWorse: false, reasons: [] },
};

/** The host's side, reduced to a Local Session: every change is one step, undo takes the last one back. */
function Host({ refine, onStep }: { refine?: RefineNodePort; onStep: (next: JsonDoc) => void }) {
    const [steps, setSteps] = useState<JsonDoc[]>([doc]);
    const value = steps[steps.length - 1];
    return (
        <>
            <output data-testid="body">{JSON.stringify(value)}</output>
            <VisualEditor
                value={value}
                onChange={(next) => { onStep(next); setSteps((s) => [...s, next]); }}
                onUndo={() => setSteps((s) => s.slice(0, -1))}
                canUndo={steps.length > 1}
                nodeAction={refine ? { slug: 'home', refine } : undefined}
            />
        </>
    );
}

it('offers Refine for the selected node and applies the accepted candidate as one undoable change', async () => {
    const refine = vi.fn(async () => kept);
    const onStep = vi.fn();
    render(<Host refine={refine} onStep={onStep} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Select the first block' }));
    const control = await screen.findByRole('region', { name: 'Refine this block' });
    fireEvent.click(within(control).getByRole('button', { name: 'Regenerate' }));
    expect(refine).toHaveBeenCalledWith('home', { path: [0], mode: 'regenerate', body: doc });

    fireEvent.click(within(await screen.findByRole('group', { name: 'Candidate' })).getByRole('button', { name: 'Accept' }));
    expect(onStep).toHaveBeenCalledTimes(1);
    expect(onStep).toHaveBeenCalledWith([{ kind: 'text', value: 'Fixture refined text' }]);
    expect(screen.getByTestId('body').textContent).toContain('Fixture refined text');

    fireEvent.click(screen.getByRole('button', { name: '↶ Undo' }));
    expect(screen.getByTestId('body').textContent).toContain('Fixture server text');
});

it('draws no Refine control when the host binds no node-action port', async () => {
    render(<Host onStep={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Select the first block' }));
    expect(screen.queryByRole('region', { name: 'Refine this block' })).toBeNull();
});
