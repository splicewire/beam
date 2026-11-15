import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAt, type JsonDoc, type JsonNode } from '../blockdoc/json';
import { NodeActionControl } from './NodeActionControl';
import { candidateOf, pathSegments, refusalOf, type NodeActionDecision, type RefineNodePort } from './node-action';

afterEach(cleanup);

/**
 * node-actions-and-takes 04 (client half): the inspector's Refine control against a test double of the host port.
 * The decision fixtures have the composition spine's NodeActionDecisionData shape; texts and references are fixtures.
 */

const text = (value: string): JsonNode => ({ kind: 'text', value }) as JsonNode;
const block = (name: string, ...children: JsonNode[]): JsonNode =>
    ({ kind: 'block', name, isComponent: false, dynamic: false, props: [], children }) as JsonNode;

const DOC: JsonDoc = [block('main', block('h2', text('Fixture heading')), block('p', text('Fixture paragraph.')))];

const decision = (over: Partial<NodeActionDecision> & { node?: JsonNode } = {}): NodeActionDecision => ({
    decision: 'kept',
    revision: {
        reference: 'fixture-ref-1',
        // The operation's real shape (laravel-beam-ux CanvasNodePreview + tests/CanvasNodePreviewTest.php:148-150):
        // `truth` is the node itself, addressed by a JSON pointer when it has no id.
        before: { address: '/0/children/1', truth: block('p', text('Fixture paragraph.')), standing: [] },
        after: { address: '/0/children/1', truth: over.node ?? block('p', text('A sharper fixture paragraph.')), standing: [] },
    },
    verdict: { hardFail: false, softWorse: false, reasons: [] },
    ...over,
});

/** The editor's side, reduced: one document and an undo stack, where every apply is one step. */
function Editor({ refine, path = '0.1' }: { refine: RefineNodePort; path?: string }) {
    const [doc, setDoc] = useState<JsonDoc>(DOC);
    const [history, setHistory] = useState<JsonDoc[]>([]);
    return (
        <div>
            <output data-testid="paragraph">{JSON.stringify(doc)}</output>
            <output data-testid="steps">{history.length}</output>
            <button type="button" onClick={() => { setDoc(history.at(-1) ?? doc); setHistory(history.slice(0, -1)); }}>
                Undo
            </button>
            <NodeActionControl
                slug="fixture-page"
                doc={doc}
                path={path}
                refine={refine}
                onApply={(next) => {
                    setHistory([...history, doc]);
                    setDoc(next);
                }}
            />
        </div>
    );
}

const docText = () => screen.getByTestId('paragraph').textContent ?? '';

describe('the request path', () => {
    // The server's own spelling (laravel-beam-ux): `CanvasNodePreview::locate` appends `children` before a child index
    // and `slots`, <name> before a slot's index; its tests address a top-level node as [0] (CanvasNodePreviewTest.php:147)
    // and a nested one as [0, 'children', 0] (:120). No server test addresses a slot; the slot cases follow locate().
    it('spells the canvas dotted path the way the operation locates nodes', () => {
        expect(pathSegments('0')).toEqual([0]);
        expect(pathSegments('0.0')).toEqual([0, 'children', 0]);
        expect(pathSegments('0.2.1')).toEqual([0, 'children', 2, 'children', 1]);
        expect(pathSegments('0.slots.aside.0')).toEqual([0, 'slots', 'aside', 0]);
        // A slot inside a child, and a child of a slotted block.
        expect(pathSegments('0.1.slots.aside.0.2')).toEqual([0, 'children', 1, 'slots', 'aside', 0, 'children', 2]);
        expect(pathSegments('')).toEqual([]);
    });

    it('addresses the node the canvas path names: following the segments reaches the same node getAt does', () => {
        const slotted = [{ ...(block('section', block('p', text('Child'))) as object), slots: { aside: [block('div', text('a'), block('em', text('Deep')))] } }] as unknown as JsonDoc;
        // locate()'s walk, read literally: an int indexes the current list, 'children' / 'slots', <name> pick the next.
        const follow = (segments: Array<string | number>): unknown => {
            let list: unknown = slotted;
            let node: unknown = null;
            for (let i = 0; i < segments.length; i++) {
                const s = segments[i];
                if (typeof s === 'number') { node = (list as unknown[])[s]; continue; }
                list = s === 'slots' ? (node as { slots: Record<string, unknown> }).slots[segments[++i] as string] : (node as { children: unknown }).children;
            }
            return node;
        };
        for (const path of ['0', '0.0', '0.slots.aside.0', '0.slots.aside.0.1']) {
            expect(follow(pathSegments(path)), path).toBe(getAt(slotted, path));
        }
    });
});

describe('the decision helpers', () => {
    it('offers a candidate only for a kept, unrefused decision with a node', () => {
        expect(candidateOf(decision())).toMatchObject({ kind: 'block', name: 'p' });
        expect(candidateOf(decision({ decision: 'reverted' }))).toBeNull();
        expect(candidateOf(decision({ verdict: { hardFail: true, softWorse: false, reasons: ['Fixture: not admitted.'] } }))).toBeNull();
        expect(refusalOf(decision({ decision: 'reverted', verdict: { hardFail: true, softWorse: false, reasons: ['Fixture: a script block is not admitted here.'] } }))).toBe('Fixture: a script block is not admitted here.');
        expect(refusalOf(decision())).toBeNull();
    });
});

describe('refine, candidate, accept, undo', () => {
    it('sends the path, the instruction and the current node; shows the candidate; accepts it as one step; undo takes it back', async () => {
        const refine = vi.fn<RefineNodePort>(async () => decision());
        render(<Editor refine={refine} />);

        fireEvent.change(screen.getByRole('textbox', { name: 'Instruction' }), { target: { value: 'Make it sharper' } });
        fireEvent.click(screen.getByRole('button', { name: 'Refine' }));

        const candidate = await screen.findByRole('group', { name: 'Candidate' });
        // The whole current body travels (the save check judges a node by its parent), with the path.
        expect(refine).toHaveBeenCalledWith('fixture-page', { path: [0, 'children', 1], mode: 'refine', instruction: 'Make it sharper', body: DOC });
        expect(within(candidate).getByText('A sharper fixture paragraph.')).toBeTruthy();
        // Seeing the candidate changes nothing.
        expect(docText()).toContain('Fixture paragraph.');
        expect(screen.getByTestId('steps').textContent).toBe('0');

        fireEvent.click(within(candidate).getByRole('button', { name: 'Accept' }));
        expect(docText()).toContain('A sharper fixture paragraph.');
        expect(docText()).toContain('Fixture heading');
        expect(screen.getByTestId('steps').textContent).toBe('1');

        fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
        expect(docText()).toContain('Fixture paragraph.');
        expect(docText()).not.toContain('A sharper');
    });

    it('regenerates without an instruction', async () => {
        const refine = vi.fn<RefineNodePort>(async () => decision());
        render(<Editor refine={refine} />);
        expect((screen.getByRole('button', { name: 'Refine' }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
        await screen.findByRole('group', { name: 'Candidate' });
        expect(refine).toHaveBeenCalledWith('fixture-page', { path: [0, 'children', 1], mode: 'regenerate', body: DOC });
    });

    it('discards a candidate and changes nothing', async () => {
        render(<Editor refine={async () => decision()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
        fireEvent.click(within(await screen.findByRole('group', { name: 'Candidate' })).getByRole('button', { name: 'Discard' }));
        expect(screen.queryByRole('group', { name: 'Candidate' })).toBeNull();
        expect(docText()).toContain('Fixture paragraph.');
        expect(screen.getByTestId('steps').textContent).toBe('0');
    });
});

describe('a block with a stable id', () => {
    const withId = (id: string, node: JsonNode): JsonNode => ({ ...(node as object), id }) as JsonNode;
    const IDDOC: JsonDoc = [block('main', block('h2', text('Fixture heading')), withId('blk-1', block('p', text('Fixture paragraph.'))))];

    it('is addressed by its id, keeps it, and is found by it at accept even after it moved', async () => {
        const refine = vi.fn<RefineNodePort>(async () => decision({ node: withId('blk-1', block('p', text('Refined by id.'))) }));
        function Host() {
            const [doc, setDoc] = useState<JsonDoc>(IDDOC);
            return (
                <div>
                    {/* Inserting a block above moves the addressed block from 0.1 to 0.2. */}
                    <button type="button" onClick={() => setDoc([block('main', block('h1', text('Inserted')), ...(doc[0] as { children: JsonNode[] }).children)])}>
                        Insert above
                    </button>
                    <output data-testid="paragraph">{JSON.stringify(doc)}</output>
                    <NodeActionControl slug="fixture-page" doc={doc} path="0.1" refine={refine} onApply={setDoc} />
                </div>
            );
        }
        render(<Host />);
        fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
        await screen.findByRole('group', { name: 'Candidate' });
        expect(refine).toHaveBeenCalledWith('fixture-page', { path: [0, 'children', 1], nodeId: 'blk-1', mode: 'regenerate', body: IDDOC });

        fireEvent.click(screen.getByRole('button', { name: 'Insert above' }));
        fireEvent.click(within(screen.getByRole('group', { name: 'Candidate' })).getByRole('button', { name: 'Accept' }));
        const after = JSON.parse(docText()) as JsonDoc;
        const main = after[0] as { children: Array<{ id?: string; children: Array<{ value: string }> }> };
        expect(main.children[2]).toMatchObject({ id: 'blk-1' });
        expect(main.children[2].children[0].value).toBe('Refined by id.');
        expect(main.children[1].children[0].value).toBe('Fixture heading');
    });

    it('does not offer a candidate that drops the block id', async () => {
        function Host() {
            const [doc, setDoc] = useState<JsonDoc>(IDDOC);
            return <NodeActionControl slug="fixture-page" doc={doc} path="0.1" refine={async () => decision({ node: block('p', text('No id.')) })} onApply={setDoc} />;
        }
        render(<Host />);
        fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
        expect((await screen.findByRole('alert')).textContent).toMatch(/did not keep this block.s id/);
        expect(screen.queryByRole('group', { name: 'Candidate' })).toBeNull();
    });
});

describe('refusals leave the session untouched and say why', () => {
    it('an illegal block', async () => {
        render(
            <Editor
                refine={async () =>
                    decision({ decision: 'reverted', verdict: { hardFail: true, softWorse: false, reasons: ['Fixture: the candidate contains a block this entry does not admit.'] } })
                }
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
        expect((await screen.findByRole('alert')).textContent).toBe('Fixture: the candidate contains a block this entry does not admit.');
        expect(screen.queryByRole('group', { name: 'Candidate' })).toBeNull();
        expect(docText()).toContain('Fixture paragraph.');
        expect(screen.getByTestId('steps').textContent).toBe('0');
    });

    it('code for a tenant entry, as a failed request, in the server words', async () => {
        render(<Editor refine={async () => { throw new Error('Fixture: this entry does not admit code.'); }} />);
        fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
        expect((await screen.findByRole('alert')).textContent).toBe('Fixture: this entry does not admit code.');
        expect(screen.getByTestId('steps').textContent).toBe('0');
    });

    it('a candidate whose node changed meanwhile is not applied', async () => {
        let release!: (value: NodeActionDecision) => void;
        function Host() {
            const [doc, setDoc] = useState<JsonDoc>(DOC);
            return (
                <div>
                    <button type="button" onClick={() => setDoc([block('main', block('h2', text('Fixture heading')), block('p', text('Edited meanwhile.')))])}>
                        Edit
                    </button>
                    <output data-testid="paragraph">{JSON.stringify(doc)}</output>
                    <NodeActionControl slug="fixture-page" doc={doc} path="0.1" refine={() => new Promise((resolve) => (release = resolve))} onApply={setDoc} />
                </div>
            );
        }
        render(<Host />);
        fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
        await act(async () => release(decision()));
        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        fireEvent.click(within(await screen.findByRole('group', { name: 'Candidate' })).getByRole('button', { name: 'Accept' }));
        await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/changed while the candidate was being made/));
        expect(docText()).toContain('Edited meanwhile.');
    });
});
