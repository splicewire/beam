import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { JsonBlock, JsonDoc } from '../blockdoc/json.js';
import { Breadcrumb } from './Breadcrumb.js';
import { CanvasNode, edgeAt } from './CanvasNode.js';
import { ContextMenu } from './ContextMenu.js';
import { CanvasProvider, isEditGated } from './context.js';
import type { CanvasConfig } from './context.js';
import { Inspector } from './Inspector.js';
import { PageEditor } from './PageEditor.js';
import { attrsView, EDIT_GATE_ATTR, setAttrs, VIEW_GATE_ATTR } from './props.js';

// ── injected config ───────────────────────────────────────────────────────────────────────────────────
const Hero = (props: Record<string, unknown>) => <div data-testid="hero">HERO {String(props.title ?? '')}</div>;
const MdxView = ({ md }: { md?: string }) => <div data-testid="mdxview">{md}</div>;
const MdxEdit = ({ md, onChange }: { md?: string; onChange: (s: string) => void }) => (
    <textarea data-testid="mdxedit" value={md ?? ''} onChange={(e) => onChange(e.target.value)} />
);

const config: CanvasConfig = { registry: { Hero }, MdxView, MdxEdit };

const wrap = (ui: React.ReactNode) => <CanvasProvider config={config}>{ui}</CanvasProvider>;

const block = (over: Partial<JsonBlock>): JsonBlock => ({
    kind: 'block',
    name: 'div',
    isComponent: false,
    props: [],
    children: [],
    dynamic: false,
    ...over,
});

const noopDnd = { onDragStart: vi.fn(), onDragOverNode: vi.fn(), onDrop: vi.fn(), onDragEnd: vi.fn() };

// ── CanvasNode: island seal ───────────────────────────────────────────────────────────────────────────
describe('CanvasNode — opaque islands', () => {
    it('renders a registered component SEALED (pointer-events none) but selectable via data-bd-path', () => {
        const node = block({ name: 'Hero', isComponent: true, props: [{ name: 'title', kind: 'string', value: 'Hi' }] });
        const { container } = render(
            wrap(<CanvasNode node={node} path="0" editing={null} onEditText={vi.fn()} dnd={noopDnd} />),
        );
        expect(screen.getByTestId('hero').textContent).toContain('Hi');
        const island = container.querySelector('.ve-island') as HTMLElement;
        expect(island.getAttribute('data-bd-path')).toBe('0');
        // inner wrapper is pointer-events:none so a click selects the island, not the component
        const inner = island.querySelector('div') as HTMLElement;
        expect(inner.style.pointerEvents).toBe('none');
    });

    it('renders a JsonOpaque node sealed as read-only source, selectable', () => {
        const node: JsonBlock['children'][number] = { kind: 'opaque', reason: 'map', source: '{items.map(x => <li/>)}' };
        const { container } = render(
            wrap(<CanvasNode node={node} path="0" editing={null} onEditText={vi.fn()} dnd={noopDnd} />),
        );
        const opaque = container.querySelector('.ve-opaque') as HTMLElement;
        expect(opaque.getAttribute('data-bd-path')).toBe('0');
        expect(opaque.textContent).toContain('items.map');
        expect((opaque.querySelector('pre') as HTMLElement).style.pointerEvents).toBe('none');
    });
});

// ── CanvasNode: entitlement gating ────────────────────────────────────────────────────────────────────
describe('isEditGated', () => {
    const gated = block({ props: [{ name: EDIT_GATE_ATTR, kind: 'string', value: 'legal.author' }] });
    const ungated = block({});

    it('is false for a node with no edit-gate prop', () => {
        expect(isEditGated({ registry: {}, MdxView, MdxEdit }, ungated)).toBe(false);
    });

    it('is false when the host never injects a can-map — edit-gating is a no-op, not a lockout', () => {
        expect(isEditGated({ registry: {}, MdxView, MdxEdit }, gated)).toBe(false);
    });

    it('is true when the can-map is present but lacks the key (fails closed per-key)', () => {
        expect(isEditGated({ registry: {}, MdxView, MdxEdit, can: {} }, gated)).toBe(true);
        expect(isEditGated({ registry: {}, MdxView, MdxEdit, can: { 'legal.author': false } }, gated)).toBe(true);
    });

    it('is false when the can-map clears the key', () => {
        expect(isEditGated({ registry: {}, MdxView, MdxEdit, can: { 'legal.author': true } }, gated)).toBe(false);
    });
});

describe('CanvasNode — entitlement-gated blocks render sealed', () => {
    it('renders an edit-gated block sealed (real content, read-only, not drillable/editable)', () => {
        const gatedConfig: CanvasConfig = { ...config, can: { 'legal.author': false } };
        const node = block({
            name: 'section',
            props: [{ name: EDIT_GATE_ATTR, kind: 'string', value: 'legal.author' }],
            children: [block({ name: 'p', children: [{ kind: 'text', value: 'Confidential' }] })],
        });
        const { container } = render(
            <CanvasProvider config={gatedConfig}>
                <CanvasNode node={node} path="0" editing={null} onEditText={vi.fn()} dnd={noopDnd} />
            </CanvasProvider>,
        );
        const sealed = container.querySelector('.ve-gated') as HTMLElement;
        expect(sealed).not.toBeNull();
        expect(sealed.getAttribute('data-bd-path')).toBe('0');
        // the real content still renders (this isn't a view-gate) — just read-only underneath
        expect(sealed.textContent).toContain('Confidential');
        const inner = sealed.querySelector('div') as HTMLElement;
        expect(inner.style.pointerEvents).toBe('none');
        // sealed nodes are still draggable (movable/deletable) — only editing is blocked
        expect(sealed.getAttribute('draggable')).toBe('true');
    });

    it('renders a block normally (editable) once the can-map clears its edit-gate key', () => {
        const clearedConfig: CanvasConfig = { ...config, can: { 'legal.author': true } };
        const node = block({
            name: 'section',
            props: [{ name: EDIT_GATE_ATTR, kind: 'string', value: 'legal.author' }],
            children: [block({ name: 'p', children: [{ kind: 'text', value: 'Editable now' }] })],
        });
        const { container } = render(
            <CanvasProvider config={clearedConfig}>
                <CanvasNode node={node} path="0" editing={null} onEditText={vi.fn()} dnd={noopDnd} />
            </CanvasProvider>,
        );
        expect(container.querySelector('.ve-gated')).toBeNull();
        expect(container.querySelector('section')?.getAttribute('data-bd-path')).toBe('0');
    });
});

// ── CanvasNode: inline text edit ──────────────────────────────────────────────────────────────────────
describe('CanvasNode — inline text edit', () => {
    it('makes a leaf editable, autofocuses it, and calls onEditText on blur', () => {
        const onEditText = vi.fn();
        const node = block({ name: 'h2', children: [{ kind: 'text', value: 'Title' }] });
        render(wrap(<CanvasNode node={node} path="0" editing="0" onEditText={onEditText} dnd={noopDnd} />));
        const h2 = document.querySelector('h2') as HTMLElement;
        expect(h2.getAttribute('contenteditable')).toBe('true');
        // entering edit mode focuses the node directly — no second click needed to place the caret
        // (the bug this guards: without this, a click to place the caret was intercepted by the
        // canvas's own selection handler and immediately exited edit mode).
        expect(document.activeElement).toBe(h2);
        h2.textContent = 'Changed';
        fireEvent.blur(h2);
        expect(onEditText).toHaveBeenCalledWith('0', 'Changed');
    });

    it('Escape reverts the text and blurs (canceling, not committing, the edit)', () => {
        const onEditText = vi.fn();
        const node = block({ name: 'h2', children: [{ kind: 'text', value: 'Title' }] });
        render(wrap(<CanvasNode node={node} path="0" editing="0" onEditText={onEditText} dnd={noopDnd} />));
        const h2 = document.querySelector('h2') as HTMLElement;
        h2.textContent = 'Half-typed nonsense';
        fireEvent.keyDown(h2, { key: 'Escape' });
        // the DOM text is reverted to the ORIGINAL block content before the (Escape-triggered) blur —
        // so onEditText, if it fires at all via the blur it triggers, commits the unchanged original.
        expect(h2.textContent).toBe('Title');
        if (onEditText.mock.calls.length > 0) {
            expect(onEditText).toHaveBeenCalledWith('0', 'Title');
        }
    });

    it('is not draggable while being text-edited (draggable would hijack text-selection drag)', () => {
        const node = block({ name: 'h2', children: [{ kind: 'text', value: 'Title' }] });
        render(wrap(<CanvasNode node={node} path="0" editing="0" onEditText={vi.fn()} dnd={noopDnd} />));
        const h2 = document.querySelector('h2') as HTMLElement;
        expect(h2.getAttribute('draggable')).toBe('false');
    });

    it('is draggable again once editing ends', () => {
        const node = block({ name: 'h2', children: [{ kind: 'text', value: 'Title' }] });
        render(wrap(<CanvasNode node={node} path="0" editing={null} onEditText={vi.fn()} dnd={noopDnd} />));
        const h2 = document.querySelector('h2') as HTMLElement;
        expect(h2.getAttribute('draggable')).toBe('true');
    });
});

// ── edgeAt: the pure drop-edge computation ────────────────────────────────────────────────────────────
describe('edgeAt', () => {
    const el = (rect: Partial<DOMRect>): HTMLElement =>
        ({ getBoundingClientRect: () => ({ top: 0, height: 100, ...rect }) }) as HTMLElement;

    it('reports "before" for the top half and "after" for the bottom half of the box', () => {
        expect(edgeAt(el({ top: 0, height: 100 }), 10)).toBe('before');
        expect(edgeAt(el({ top: 0, height: 100 }), 90)).toBe('after');
        // the midpoint itself belongs to the bottom half (strict "<" for the top half)
        expect(edgeAt(el({ top: 0, height: 100 }), 50)).toBe('after');
    });

    it('accounts for the box\'s own top offset, not just the viewport-absolute cursor position', () => {
        expect(edgeAt(el({ top: 200, height: 100 }), 210)).toBe('before');
        expect(edgeAt(el({ top: 200, height: 100 }), 290)).toBe('after');
    });
});

// ── CanvasNode: drag reorder ──────────────────────────────────────────────────────────────────────────
describe('CanvasNode — drag/drop', () => {
    it('raises onDragStart / onDragOverNode / onDrop / onDragEnd with the node path', () => {
        const dnd = { onDragStart: vi.fn(), onDragOverNode: vi.fn(), onDrop: vi.fn(), onDragEnd: vi.fn() };
        const node = block({ name: 'p', children: [{ kind: 'text', value: 'x' }] });
        render(wrap(<CanvasNode node={node} path="0.3" editing={null} onEditText={vi.fn()} dnd={dnd} />));
        const p = document.querySelector('p') as HTMLElement;

        fireEvent.dragStart(p);
        expect(dnd.onDragStart).toHaveBeenCalledWith('0.3');

        // jsdom's DragEvent doesn't reliably plumb clientY/layout through fireEvent, so this only
        // proves the wiring raises onDragOverNode for this path — edgeAt's own before/after boundary
        // math is unit-tested directly above, decoupled from jsdom's event/layout support.
        fireEvent.dragOver(p);
        expect(dnd.onDragOverNode).toHaveBeenCalledWith('0.3', expect.stringMatching(/^(before|after)$/));

        fireEvent.drop(p);
        expect(dnd.onDrop).toHaveBeenCalled();

        fireEvent.dragEnd(p);
        expect(dnd.onDragEnd).toHaveBeenCalled();
    });
});

// ── CanvasNode: MDX handle ────────────────────────────────────────────────────────────────────────────
describe('CanvasNode — MDX island', () => {
    it('renders a selectable handle + the injected MdxEdit, and edits emit onEditMd', () => {
        const onEditMd = vi.fn();
        const node = block({ name: 'Mdx', isComponent: true, props: [{ name: 'md', kind: 'string', value: 'hello' }] });
        const { container } = render(
            wrap(<CanvasNode node={node} path="0" editing={null} onEditText={vi.fn()} onEditMd={onEditMd} dnd={noopDnd} />),
        );
        expect(container.querySelector('.ve-mdx-block')?.getAttribute('data-bd-path')).toBe('0');
        const handle = container.querySelector('.ve-mdx-handle') as HTMLElement;
        // the handle is the block-select surface — dragging it raises onDragStart for the block
        fireEvent.dragStart(handle);
        expect(noopDnd.onDragStart).toHaveBeenCalledWith('0');
        const ta = screen.getByTestId('mdxedit') as HTMLTextAreaElement;
        expect(ta.value).toBe('hello');
        fireEvent.change(ta, { target: { value: 'world' } });
        expect(onEditMd).toHaveBeenCalledWith('0', 'world');
    });
});

// ── Inspector ─────────────────────────────────────────────────────────────────────────────────────────
describe('Inspector', () => {
    const target = block({
        name: 'section',
        props: [
            { name: 'className', kind: 'string', value: 'hero big' },
            { name: 'style', kind: 'string', value: 'color:red' },
            { name: 'md', kind: 'string', value: 'body' },
            { name: 'id', kind: 'string', value: 'top' },
        ],
    });

    it('excludes md / className / style / gate attrs from the attributes list but shows other attrs', () => {
        const gated = block({ ...target, props: [...target.props, { name: EDIT_GATE_ATTR, kind: 'string', value: 'legal.author' }] });
        render(wrap(<Inspector block={gated} onAttrs={vi.fn()} onDelete={vi.fn()} />));
        // the "other attributes" row has a readonly key input for `id`, not for md/className/style/gates
        const readonly = Array.from(document.querySelectorAll('input[readonly]')).map((i) => (i as HTMLInputElement).value);
        expect(readonly).toContain('id');
        expect(readonly).not.toContain('md');
        expect(readonly).not.toContain('className');
        expect(readonly).not.toContain('style');
        expect(readonly).not.toContain(EDIT_GATE_ATTR);
    });

    it('the Access section edits the view/edit gate attrs, emitting the full next attr set', () => {
        const onAttrs = vi.fn();
        render(wrap(<Inspector block={target} onAttrs={onAttrs} onDelete={vi.fn()} />));
        const editGateInput = document.querySelector('input[placeholder="edit gate (entitlement key)"]') as HTMLInputElement;
        fireEvent.change(editGateInput, { target: { value: 'legal.author' } });
        expect(onAttrs).toHaveBeenCalledWith(expect.objectContaining({ [EDIT_GATE_ATTR]: 'legal.author' }));
        // reserved attrs (className/style/md/id) are preserved in the emitted set, not dropped
        expect(onAttrs).toHaveBeenCalledWith(expect.objectContaining({ className: 'hero big', id: 'top' }));

        const viewGateInput = document.querySelector('input[placeholder="view gate (entitlement key)"]') as HTMLInputElement;
        fireEvent.change(viewGateInput, { target: { value: 'ux.author' } });
        expect(onAttrs).toHaveBeenCalledWith(expect.objectContaining({ [VIEW_GATE_ATTR]: 'ux.author' }));
    });

    it('editing a class chip emits the full next attr set via onAttrs', () => {
        const onAttrs = vi.fn();
        render(wrap(<Inspector block={target} onAttrs={onAttrs} onDelete={vi.fn()} />));
        // remove the "hero" class chip
        const chip = Array.from(document.querySelectorAll('.ve-chip')).find((c) => c.textContent?.startsWith('hero'))!;
        fireEvent.click(chip.querySelector('button')!);
        expect(onAttrs).toHaveBeenCalledWith(expect.objectContaining({ className: 'big' }));
    });

    it('editing a style row value emits an updated style string', () => {
        const onAttrs = vi.fn();
        render(wrap(<Inspector block={target} onAttrs={onAttrs} onDelete={vi.fn()} />));
        const valInput = document.querySelector('input[list="ve-var-suggest"]') as HTMLInputElement;
        fireEvent.change(valInput, { target: { value: 'blue' } });
        expect(onAttrs).toHaveBeenCalledWith(expect.objectContaining({ style: 'color:blue' }));
    });

    it('setAttrs round-trips the emitted attr set back onto the block', () => {
        const next = setAttrs(target, { className: 'big', style: 'color:red', md: 'body', id: 'top', title: 'New' });
        const view = attrsView(next);
        expect(view.title).toBe('New');
        expect(view.className).toBe('big');
    });
});

// ── PageEditor: mode fork + save ──────────────────────────────────────────────────────────────────────
const doc = (): JsonDoc => [block({ name: 'div', children: [block({ name: 'h1', children: [{ kind: 'text', value: 'Hi' }] })] })];

describe('PageEditor — mode fork + transport', () => {
    it('renders read-only (TreeRender) until window mode is broadcast', () => {
        const transport = { saveBody: vi.fn().mockResolvedValue({}) };
        const { container } = render(wrap(<PageEditor slug="home" body={doc()} transport={transport} />));
        // read mode: no editing chrome (no floating bar)
        expect(container.querySelector('.pe-bar')).toBeNull();
        expect(container.querySelector('h1')?.textContent).toBe('Hi');
        // enter window mode
        fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        expect(container.querySelector('.pe-bar')).not.toBeNull();
    });

    it('Save calls the injected transport.saveBody(slug, doc) and notifies', async () => {
        const saveBody = vi.fn().mockResolvedValue({});
        const notify = { success: vi.fn(), error: vi.fn() };
        const { container } = render(
            wrap(<PageEditor slug="home" body={doc()} transport={{ saveBody }} notify={notify} />),
        );
        fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        const saveBtn = Array.from(container.querySelectorAll('.pe-btn')).find((b) => b.textContent === 'Save')!;
        fireEvent.click(saveBtn);
        await Promise.resolve();
        await Promise.resolve();
        expect(saveBody).toHaveBeenCalledWith('home', expect.any(Array));
        expect(notify.success).toHaveBeenCalledWith('Saved');
    });

    it('Exit dispatches beam-ux:exit', () => {
        const onExit = vi.fn();
        window.addEventListener('beam-ux:exit', onExit);
        const { container } = render(wrap(<PageEditor slug="home" body={doc()} transport={{ saveBody: vi.fn() }} />));
        fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        const exitBtn = Array.from(container.querySelectorAll('.pe-btn')).find((b) => b.textContent === 'Exit')!;
        fireEvent.click(exitBtn);
        expect(onExit).toHaveBeenCalled();
        window.removeEventListener('beam-ux:exit', onExit);
    });

    it('right-click opens a context menu; Duplicate clones the node, Delete removes it', async () => {
        const saveBody = vi.fn().mockResolvedValue({});
        const { container } = render(wrap(<PageEditor slug="home" body={doc()} transport={{ saveBody }} />));
        fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        const h1 = container.querySelector('h1') as HTMLElement;

        fireEvent.contextMenu(h1, { clientX: 10, clientY: 10 });
        const menuButton = (label: string) =>
            Array.from(document.querySelectorAll('.ve-menu .ve-menu-item')).find((b) => b.textContent === label)!;
        fireEvent.click(menuButton('Duplicate'));
        // duplicating "0.0" (the h1) makes it appear twice under the root div
        expect(container.querySelectorAll('h1')).toHaveLength(2);

        fireEvent.contextMenu(container.querySelectorAll('h1')[0], { clientX: 10, clientY: 10 });
        fireEvent.click(menuButton('Delete'));
        expect(container.querySelectorAll('h1')).toHaveLength(1);
    });

    it('the context menu closes on outside click without acting', () => {
        const { container } = render(wrap(<PageEditor slug="home" body={doc()} transport={{ saveBody: vi.fn() }} />));
        fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        const h1 = container.querySelector('h1') as HTMLElement;
        fireEvent.contextMenu(h1, { clientX: 10, clientY: 10 });
        expect(document.querySelector('.ve-menu')).not.toBeNull();
        fireEvent.click(document.body);
        expect(document.querySelector('.ve-menu')).toBeNull();
    });

    it('shows a breadcrumb for the selection, and clicking an ancestor crumb re-selects it', () => {
        const { container } = render(wrap(<PageEditor slug="home" body={doc()} transport={{ saveBody: vi.fn() }} />));
        fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        const h1 = container.querySelector('h1') as HTMLElement;
        fireEvent.click(h1);

        const crumbs = Array.from(container.querySelectorAll('.ve-crumb')).map((b) => b.textContent);
        expect(crumbs).toEqual(['div', 'h1']);
        // the h1 tag shown in the Inspector proves it's selected
        expect(container.querySelector('.ve-insp-tag')?.textContent).toBe('h1');

        // clicking the ancestor "div" crumb re-selects the parent
        fireEvent.click(screen.getByText('div'));
        expect(container.querySelector('.ve-insp-tag')?.textContent).toBe('div');
    });

    it('insert-palette items are draggable (drag-to-position, alongside click-to-insert)', () => {
        const { container } = render(wrap(<PageEditor slug="home" body={doc()} transport={{ saveBody: vi.fn() }} />));
        fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        const palItems = container.querySelectorAll('.pe-panel.pe-left .ve-pal-item');
        expect(palItems.length).toBeGreaterThan(0);
        palItems.forEach((el) => expect(el.getAttribute('draggable')).toBe('true'));
    });
});

// ── Breadcrumb ────────────────────────────────────────────────────────────────────────────────────────
describe('Breadcrumb', () => {
    const bcDoc: JsonDoc = [
        block({
            name: 'section',
            children: [block({ name: 'p', children: [{ kind: 'text', value: 'x' }] })],
        }),
    ];

    it('renders one crumb per ancestor, labeled by tag name, deepest last', () => {
        render(<Breadcrumb doc={bcDoc} path="0.0" onSelect={vi.fn()} />);
        const labels = Array.from(document.querySelectorAll('.ve-crumb')).map((b) => b.textContent);
        expect(labels).toEqual(['section', 'p']);
    });

    it('the current (deepest) crumb is disabled; ancestors are clickable and call onSelect', () => {
        const onSelect = vi.fn();
        render(<Breadcrumb doc={bcDoc} path="0.0" onSelect={onSelect} />);
        const crumbs = Array.from(document.querySelectorAll('.ve-crumb')) as HTMLButtonElement[];
        expect(crumbs[1].disabled).toBe(true); // "p", the selected node itself
        expect(crumbs[0].disabled).toBe(false); // "section", its ancestor
        fireEvent.click(crumbs[0]);
        expect(onSelect).toHaveBeenCalledWith('0');
    });
});

// ── ContextMenu ───────────────────────────────────────────────────────────────────────────────────────
describe('ContextMenu', () => {
    it('renders the given actions and invokes onSelect + onClose when clicked', () => {
        const onSelect = vi.fn();
        const onClose = vi.fn();
        render(
            <ContextMenu
                state={{ x: 5, y: 5, path: '0' }}
                actions={[{ label: 'Duplicate', onSelect }]}
                onClose={onClose}
            />,
        );
        fireEvent.click(screen.getByText('Duplicate'));
        expect(onSelect).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('closes on Escape', () => {
        const onClose = vi.fn();
        render(<ContextMenu state={{ x: 5, y: 5, path: '0' }} actions={[]} onClose={onClose} />);
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });
});
