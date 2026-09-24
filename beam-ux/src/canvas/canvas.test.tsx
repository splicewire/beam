import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { JsonBlock, JsonDoc } from '../blockdoc/json.js';
import { attrsSchemaFor } from './attrsSchema.js';
import { Breadcrumb } from './Breadcrumb.js';
import { CanvasNode, edgeAt } from './CanvasNode.js';
import { CanvasWidget } from './CanvasWidget.js';
import { ContextMenu } from './ContextMenu.js';
import { CanvasProvider, isEditGated } from './context.js';
import type { CanvasConfig } from './context.js';
import { insertRelativeTo } from './insert.js';
import { PageEditor, __resetEditMode, useEditMode } from './PageEditor.js';
import type { EntryPublicationState, EntryVersion } from '../types.js';
import { EDIT_GATE_ATTR, VIEW_GATE_ATTR } from './props.js';
import { ClassChipsWidget, StyleRowsWidget } from './widgets.js';

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

// ── attrsSchemaFor: the JsonBlock -> JSON Schema translation frame's Inspector renders ─────────────────
describe('attrsSchemaFor', () => {
    const target = block({
        name: 'section',
        props: [
            { name: 'className', kind: 'string', value: 'hero big' },
            { name: 'style', kind: 'string', value: 'color:red' },
            { name: 'md', kind: 'string', value: 'body' },
            { name: 'id', kind: 'string', value: 'top' },
        ],
    });

    it('excludes md from the schema (the MDX body, edited in-canvas) but includes className/style/id', () => {
        const { schema, attrs } = attrsSchemaFor(target);
        expect(schema.properties).not.toHaveProperty('md');
        expect(schema.properties).toHaveProperty('className');
        expect(schema.properties).toHaveProperty('style');
        expect(schema.properties).toHaveProperty('id');
        expect(attrs).not.toHaveProperty('md');
        expect(attrs.id).toBe('top');
    });

    it('className/style get the class-chips/style-rows custom widgets, grouped under the Style tab', () => {
        const { schema } = attrsSchemaFor(target);
        const props = schema.properties as Record<string, Record<string, unknown>>;
        expect(props.className['x-widget']).toBe('class-chips');
        expect(props.className['x-group']).toBe('Classes');
        expect(props.className['x-tab']).toBe('Style');
        expect(props.style['x-widget']).toBe('style-rows');
        expect(props.style['x-group']).toBe('Style');
        expect(props.style['x-tab']).toBe('Style');
    });

    it('the two gate attrs are forced-select enum fields grouped under Access, on the Advanced tab', () => {
        const { schema } = attrsSchemaFor(target, ['ux.author', 'os.enter']);
        const props = schema.properties as Record<string, Record<string, unknown>>;
        expect(props[EDIT_GATE_ATTR]['x-widget']).toBe('select');
        expect(props[EDIT_GATE_ATTR]['x-group']).toBe('Access');
        expect(props[EDIT_GATE_ATTR]['x-tab']).toBe('Advanced');
        expect(props[EDIT_GATE_ATTR].enum).toEqual(['', 'ux.author', 'os.enter']);
        expect(props[VIEW_GATE_ATTR].enum).toEqual(['', 'ux.author', 'os.enter']);
    });

    it('a gate value already set but absent from the known-key pool stays representable in the enum', () => {
        const bespoke = block({ props: [{ name: EDIT_GATE_ATTR, kind: 'string', value: 'legal.author' }] });
        const { schema } = attrsSchemaFor(bespoke, ['ux.author']);
        const props = schema.properties as Record<string, Record<string, unknown>>;
        expect(props[EDIT_GATE_ATTR].enum).toContain('legal.author');
    });

    it('additionalProperties covers arbitrary/new attrs (the old "+ attribute" section), grouped Attributes on Advanced', () => {
        const { schema } = attrsSchemaFor(target);
        const additional = schema.additionalProperties as Record<string, unknown>;
        expect(additional['x-group']).toBe('Attributes');
        expect(additional['x-tab']).toBe('Advanced');
        const props = schema.properties as Record<string, Record<string, unknown>>;
        expect(props.id['x-group']).toBe('Attributes');
        expect(props.id['x-tab']).toBe('Advanced');
    });
});

// ── ClassChipsWidget / StyleRowsWidget: the RJSF custom widgets preserving the old chip/row UX ─────────
describe('ClassChipsWidget', () => {
    it('renders each class as a removable chip and adds a new one on Enter', () => {
        const onChange = vi.fn();
        render(wrap(<ClassChipsWidget id="cls" value="hero big" onChange={onChange} />));
        const chips = Array.from(document.querySelectorAll('.ve-chip')).map((c) => c.textContent);
        expect(chips.some((c) => c?.startsWith('hero'))).toBe(true);
        expect(chips.some((c) => c?.startsWith('big'))).toBe(true);

        const input = document.querySelector('.ve-chip-in') as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'new-class' } });
        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onChange).toHaveBeenCalledWith('hero big new-class');
    });

    it('removing a chip emits the class string without it', () => {
        const onChange = vi.fn();
        render(wrap(<ClassChipsWidget id="cls" value="hero big" onChange={onChange} />));
        const chip = Array.from(document.querySelectorAll('.ve-chip')).find((c) => c.textContent?.startsWith('hero'))!;
        fireEvent.click(chip.querySelector('button')!);
        expect(onChange).toHaveBeenCalledWith('big');
    });
});

describe('StyleRowsWidget', () => {
    it('renders a prop/value row per declaration and emits an updated style string on edit', () => {
        const onChange = vi.fn();
        render(wrap(<StyleRowsWidget id="sty" value="color:red" onChange={onChange} />));
        const valueInput = document.querySelectorAll('.ve-kv input')[1] as HTMLInputElement;
        fireEvent.change(valueInput, { target: { value: 'blue' } });
        expect(onChange).toHaveBeenCalledWith('color:blue');
    });

    it('+ declaration appends a new row', () => {
        const onChange = vi.fn();
        render(wrap(<StyleRowsWidget id="sty" value="" onChange={onChange} />));
        fireEvent.click(screen.getByText('+ declaration'));
        expect(onChange).toHaveBeenCalledWith('color:var(--fg)');
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
        await act(async () => {
            fireEvent.click(saveBtn);
            await Promise.resolve();
        });
        expect(saveBody).toHaveBeenCalledWith('home', expect.any(Array));
        expect(notify.success).toHaveBeenCalledWith('Saved');
    });

    // ── a save that stored but did NOT compile ──────────────────────────────────────────────────────
    //
    // A Save through `save-body` is its own publish: the body is written, a version recorded, the pin
    // moved, and only THEN is the artifact compiled. When that compile fails there is no artifact at
    // the freshly-pinned address, `PageEntryRef::artifactFor()` returns null and the reader is served
    // the packaged default tree — over a body that is perfectly intact. The server already says so:
    // `EntryBodySaveOp` returns `compileError` on its response envelope precisely so the editor can
    // (splicewire/laravel-beam-ux src/Particle/EntryBodySaveOp.php:120, carried across by
    // `respond()` into `BeamUxEntryBodyData.compileError`). `publish()` has always surfaced it;
    // `save()` discarded the response and said "Saved" regardless, so the one person who could fix the
    // document was the one person not told. Nominated by the live measurement in
    // `harness/evidence/g2-double-save.log`; this is the claim it left open.
    //
    // The affordance is deliberately the SAME one publish uses — the error toast over a write that
    // really did land — not a thrown failure: the body IS stored, so the dock stays clean and the
    // canvas is not dirty; what is missing is the reader's copy.
    it('a Save whose response carries a compileError says so, and does NOT claim "Saved"', async () => {
        const saveBody = vi.fn().mockResolvedValue({ compileError: 'Unclosed <Card> on line 12' });
        const notify = { success: vi.fn(), error: vi.fn() };
        const { container } = render(
            wrap(<PageEditor slug="home" body={doc()} transport={{ saveBody }} notify={notify} />),
        );
        fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        await act(async () => {
            fireEvent.click(dockButton(container, 'Save')!);
            await Promise.resolve();
        });

        expect(saveBody).toHaveBeenCalledWith('home', expect.any(Array));
        // The diagnostic itself, not a generic failure: it names what to fix.
        expect(notify.error).toHaveBeenCalledWith('Unclosed <Card> on line 12');
        // And the success claim is withheld — "Saved" to an author means "readers have it".
        expect(notify.success).not.toHaveBeenCalled();
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

    // ── the publication affordance (G2-BEAM-DRAFT-PUBLISH) ───────────────────────────────────────────
    //
    // The dock's contract here is a gate and a seam, not a workflow: it renders the draft/publish/
    // versions controls ONLY when the transport carries all four publication methods, and every
    // control forwards to the injected one rather than deciding anything itself. What a draft MEANS
    // — versioned, uncompiled, invisible to a reader — is the server's, proved at package tier in
    // `splicewire/laravel-beam-ux`'s EntryPublicationTest and end-to-end in g2-beam-draft-publish.

    const version = (over: Partial<EntryVersion> = {}): EntryVersion => ({
        id: 'v-' + (over.readable ?? 'v1'),
        version: 1,
        readable: 'v1',
        label: null,
        createdBy: null,
        createdAt: null,
        isHead: false,
        isPublished: false,
        ...over,
    });

    const state = (over: Partial<EntryPublicationState> = {}): EntryPublicationState => ({
        id: 'entry-1',
        draftPending: false,
        publishedVersion: 'v-v1',
        publishedReadable: 'v1',
        headVersion: 'v-v1',
        headReadable: 'v1',
        versions: [version({ isHead: true, isPublished: true })],
        compileError: null,
        ...over,
    });

    /** A transport carrying the whole publication seam, with each method spied. */
    const publishingTransport = (over: Partial<EntryPublicationState> = {}) => {
        const settled = state(over);
        return {
            saveBody: vi.fn().mockResolvedValue({}),
            loadBody: vi.fn().mockResolvedValue({ body: doc() }),
            saveDraft: vi.fn().mockResolvedValue(state({ draftPending: true, headVersion: 'v-v2', headReadable: 'v2' })),
            publish: vi.fn().mockResolvedValue(state()),
            listVersions: vi.fn().mockResolvedValue(settled),
            restoreVersion: vi.fn().mockResolvedValue(settled),
        };
    };

    const enterEditMode = async (transport: object) => {
        const rendered = render(wrap(<PageEditor slug="home" body={doc()} transport={transport as never} />));
        await act(async () => {
            fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
            await Promise.resolve();
        });
        return rendered;
    };

    const dockButton = (container: HTMLElement, label: string) =>
        Array.from(container.querySelectorAll('.pe-btn')).find((b) => b.textContent === label) as
            | HTMLElement
            | undefined;

    it('offers NO draft/publish controls when the transport does not carry the seam', async () => {
        // The gate, asserted from the negative side: a host that has not mounted the operations gets
        // the dock it always had, rather than buttons that 404. Save is still there — that is the
        // point of the degrade, not an accident of it.
        const { container } = await enterEditMode({ saveBody: vi.fn().mockResolvedValue({}) });

        expect(dockButton(container, 'Save draft')).toBeUndefined();
        expect(dockButton(container, 'Publish')).toBeUndefined();
        expect(dockButton(container, 'Versions')).toBeUndefined();
        expect(dockButton(container, 'Save')).toBeDefined();
    });

    it('a partial seam is treated as no seam, so Save draft is never offered without Publish', async () => {
        const { container } = await enterEditMode({
            saveBody: vi.fn(),
            saveDraft: vi.fn(),
            listVersions: vi.fn(),
            // no publish, no restoreVersion
        });

        expect(dockButton(container, 'Save draft')).toBeUndefined();
    });

    it('Save draft sends the canvas document and reports the pending draft with what readers still see', async () => {
        const transport = publishingTransport();
        const { container } = await enterEditMode(transport);

        await act(async () => {
            fireEvent.click(dockButton(container, 'Save draft')!);
            await Promise.resolve();
        });

        expect(transport.saveDraft).toHaveBeenCalledWith('home', expect.any(Array));
        // The one thing an author cannot read off the canvas: their copy is ahead of the readers'.
        expect(container.querySelector('.pe-draft')?.textContent).toContain('Draft pending');
        expect(container.querySelector('.pe-draft')?.textContent).toContain('readers see v1');
    });

    it('Publish sends no document and clears the pending-draft badge', async () => {
        const transport = publishingTransport();
        const { container } = await enterEditMode(transport);
        await act(async () => {
            fireEvent.click(dockButton(container, 'Save draft')!);
            await Promise.resolve();
        });
        expect(container.querySelector('.pe-draft')).not.toBeNull();

        await act(async () => {
            fireEvent.click(dockButton(container, 'Publish')!);
            await Promise.resolve();
        });

        // No body argument: what a publish publishes is what the server already holds.
        expect(transport.publish).toHaveBeenCalledWith('home');
        expect(container.querySelector('.pe-draft')).toBeNull();
    });

    it('the Versions panel lists the history, flags both pins, and offers Restore only off the published one', async () => {
        const transport = publishingTransport({
            draftPending: true,
            headVersion: 'v-v2',
            headReadable: 'v2',
            versions: [
                version({ id: 'v-v2', readable: 'v2', version: 2, label: 'draft', isHead: true }),
                version({ id: 'v-v1', readable: 'v1', label: 'baseline', isPublished: true }),
            ],
        });
        const { container } = await enterEditMode(transport);

        await act(async () => {
            fireEvent.click(dockButton(container, 'Versions')!);
            await Promise.resolve();
        });

        const rows = Array.from(container.querySelectorAll('.pe-version'));
        expect(rows.map((r) => r.querySelector('.pe-version-ref')?.textContent)).toEqual(['v2', 'v1']);
        expect(container.querySelector('.pe-version-tag.published')?.textContent).toBe('published');
        expect(container.querySelector('.pe-version-tag.head')?.textContent).toBe('draft');
        // The published row has nothing to restore TO; every other row does.
        expect(container.querySelectorAll('[aria-label^="Restore "]').length).toBe(1);
        expect(container.querySelector('[aria-label="Restore v2"]')).not.toBeNull();
        // Ref and label stack in one text column, so a long ref cannot squeeze the label beside it.
        const text = rows[1].querySelector('.pe-version-text');
        expect(text?.querySelector('.pe-version-ref')?.textContent).toBe('v1');
        expect(text?.querySelector('.pe-version-label')?.textContent).toBe('baseline');
    });

    it('Restore is confirmed, and only then re-reads the body so the canvas is not left stale', async () => {
        const transport = publishingTransport({
            versions: [
                version({ id: 'v-v2', readable: 'v2', version: 2, isHead: true, isPublished: true }),
                version({ id: 'v-v1', readable: 'v1', label: 'baseline' }),
            ],
        });
        const { container } = await enterEditMode(transport);
        await act(async () => {
            fireEvent.click(dockButton(container, 'Versions')!);
            await Promise.resolve();
        });

        // One click ARMS it: restoring changes what every reader of the page is served, which is not
        // an undoable local edit.
        await act(async () => {
            fireEvent.click(container.querySelector('[aria-label="Restore v1"]') as HTMLElement);
            await Promise.resolve();
        });
        expect(transport.restoreVersion).not.toHaveBeenCalled();
        expect(container.querySelector('.pe-confirm')).not.toBeNull();

        await act(async () => {
            fireEvent.click(dockButton(container, 'Confirm restore')!);
            await Promise.resolve();
        });

        expect(transport.restoreVersion).toHaveBeenCalledWith('home', 'v1');
        // The re-read is what stops the next Save writing the pre-restore document back over it.
        expect(transport.loadBody).toHaveBeenCalledWith('home');
    });

    // ── two Saves in ONE session, no remount (the G2 double-save observation) ────────────────────────
    //
    // Observed live on beam.test 2026-09-12 (harness/evidence/g2-beam-author-entry-fix.log, "one false
    // start"): authoring a baseline heading, Saving, then editing again and Saving a SECOND time in the
    // same dock session — no reload between the two clicks — left the page showing the packaged default
    // afterwards, as if neither heading had been written. Reloading between the two Saves avoided it, so
    // the authoring spec carries a reload as a workaround. This is the client half of that observation,
    // asked as the only question this package can answer: WHAT DOES THE SECOND SAVE POST? A save is the
    // only thing the canvas sends, so if the document it sends carries both edits, nothing was lost here
    // and the loss is downstream (the version pin, the compile, or the artifact address a reader reads).
    //
    // Deliberately on the FULL publication transport (the shape the live host mounts since
    // splicewire/laravel-beam-ux d13bb15): entering edit mode then also fetches `listVersions` and the
    // dock holds publication state beside the document, so the draft/pin flow is inside the window this
    // test covers rather than outside it.
    //
    // It PASSES, and it was written before anything was changed, so that is a measurement and not a
    // regression test: the canvas does not lose the first save. Discriminating — re-seeding `doc` from
    // the `body` prop at the end of `save()` fails it on the first assertion.
    it('a SECOND Save in the same session posts the first save’s content AND the new edit', async () => {
        const transport = publishingTransport();
        const { container } = await enterEditMode(transport);

        /** Insert a heading from the palette and commit typed text into it the way an author does. */
        const authorHeading = async (text: string) => {
            const palette = Array.from(
                container.querySelectorAll('.pe-panel.pe-left .ve-pal-item'),
            ).find((el) => (el.textContent ?? '').includes('Heading')) as HTMLElement;
            await act(async () => {
                fireEvent.click(palette);
            });

            const inserted = Array.from(container.querySelectorAll('h2')).pop() as HTMLElement;
            await act(async () => {
                fireEvent.doubleClick(inserted);
            });

            // Re-query: the node re-renders as contenteditable once `editing` is set.
            const editable = Array.from(container.querySelectorAll('h2')).pop() as HTMLElement;
            editable.textContent = text;
            await act(async () => {
                fireEvent.blur(editable);
            });
        };

        const save = async () => {
            await act(async () => {
                fireEvent.click(dockButton(container, 'Save')!);
                await Promise.resolve();
            });
        };

        await authorHeading('Baseline');
        await save();

        // No reload, no remount, no re-seed — the same mounted editor takes its second edit.
        await authorHeading('Marker');
        await save();

        expect(transport.saveBody).toHaveBeenCalledTimes(2);
        const text = (call: number) => JSON.stringify(transport.saveBody.mock.calls[call][1]);
        expect(text(0)).toContain('Baseline');
        // The claim: the second save is the WHOLE document, not the delta and not a re-seeded snapshot.
        expect(text(1)).toContain('Baseline');
        expect(text(1)).toContain('Marker');
        // And the canvas still shows both, so the document the author sees is the one that was posted.
        expect(Array.from(container.querySelectorAll('h2')).map((h) => h.textContent)).toEqual([
            'Baseline',
            'Marker',
        ]);
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
        // frame's own Inspector (schema-driven, replacing the old hand-rolled one) tags the selected
        // node's type via data-node-type — proves selection actually reached the shared EditShellMount.
        expect(container.querySelector('[data-frame-region="inspector"]')?.getAttribute('data-node-type')).toBe('h1');

        // clicking the ancestor "div" crumb re-selects the parent
        fireEvent.click(screen.getByText('div'));
        expect(container.querySelector('[data-frame-region="inspector"]')?.getAttribute('data-node-type')).toBe('div');
    });

    it('takes its FIRST block on an empty document, from the palette', () => {
        // G2-BEAM-AUTHOR-EMPTY-ENTRY, measured on beam.test's never-authored /about 2026-09-11:
        // "+ Heading" flipped the status bar to Unsaved and inserted nothing — the doc stayed at 0
        // nodes with nothing selectable, so the entry could never take its first block through the UI.
        // Two causes, both fixed: `[]` passed as a persisted document (so the seed never ran), and
        // `insertRelativeTo` returned the doc unchanged when there was no root to be relative to.
        const { container } = render(wrap(<PageEditor slug="blank" body={[]} transport={{ saveBody: vi.fn() }} />));
        fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));

        const before = container.querySelectorAll('[data-bd-path]').length;
        const heading = Array.from(container.querySelectorAll('.pe-panel.pe-left .ve-pal-item')).find(
            (el) => (el.textContent ?? '').includes('Heading'),
        )!;
        expect(heading, 'the palette offers a Heading template').toBeTruthy();
        fireEvent.click(heading);

        expect(container.querySelectorAll('[data-bd-path]').length).toBeGreaterThan(before);
        expect(container.querySelector('h2')).not.toBeNull();
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

    it('a disabled action renders disabled and never fires onSelect', () => {
        const onSelect = vi.fn();
        render(
            <ContextMenu
                state={{ x: 5, y: 5, path: '0' }}
                actions={[{ label: 'Move up', onSelect, disabled: true }]}
                onClose={vi.fn()}
            />,
        );
        const button = screen.getByText('Move up').closest('button')! as HTMLButtonElement;
        expect(button.disabled).toBe(true);
        fireEvent.click(button);
        // A disabled native button never dispatches a click in a real browser; only assert the
        // handler contract (onSelect never fires) since jsdom's scripted fireEvent still bubbles
        // the event to the menu's own outside-click listener regardless of the disabled attribute.
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('a nested action opens a submenu on hover; clicking a child fires its own onSelect + closes', () => {
        const childSelect = vi.fn();
        const onClose = vi.fn();
        render(
            <ContextMenu
                state={{ x: 5, y: 5, path: '0' }}
                actions={[
                    {
                        label: 'Insert',
                        children: [{ label: 'Heading', onSelect: childSelect }],
                    },
                ]}
                onClose={onClose}
            />,
        );
        expect(screen.queryByText('Heading')).toBeNull();
        fireEvent.mouseEnter(screen.getByText('Insert', { exact: false }).closest('div')!);
        fireEvent.click(screen.getByText('Heading'));
        expect(childSelect).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });
});


// ── CanvasWidget: the dirty flag tells the truth ──────────────────────────────────────────────────────
describe('CanvasWidget — markDirty', () => {
    // The mount is the shell's channel; a stub is the only way to observe what the widget publishes
    // into it (PageEditor renders the pill from `@schemastud/frame`, not from this package).
    const stubMount = () => {
        let insert: ((candidate: unknown) => void) | null = null;
        const mount = {
            selectedNodeId: null,
            selectNode: vi.fn(),
            markDirty: vi.fn(),
            markSaving: vi.fn(),
            flush: vi.fn(),
            registerNodeAccess: vi.fn(() => () => {}),
            publishCandidates: vi.fn(),
            publishConformance: vi.fn(),
            registerInsertHandler: vi.fn((fn: (c: unknown) => void) => {
                insert = fn;
                return () => {};
            }),
        };

        return { mount, insert: (label: string) => insert?.({ nodeType: label }) };
    };

    it('marks dirty when a palette insert actually changes the document', () => {
        const { mount, insert } = stubMount();
        const onChange = vi.fn();
        render(wrap(<CanvasWidget value={doc()} onChange={onChange} editShellMount={mount as never} />));

        act(() => insert('Heading'));

        expect(onChange).toHaveBeenCalledOnce();
        expect(mount.markDirty).toHaveBeenCalledWith(true);
    });

    it('does NOT mark dirty when the insert changes nothing', () => {
        // G2-BEAM-AUTHOR-EMPTY-ENTRY's second half, measured on beam.test 2026-09-11: "+ Heading"
        // inserted nothing on the empty /about document and the status bar still said "Unsaved" — the
        // editor reported pending work that did not exist. A no-op must reach neither the host nor the
        // flag. The tree ops return the SAME object when they change nothing, so identity is the test.
        const { mount, insert } = stubMount();
        const onChange = vi.fn();
        const leafOnly: JsonDoc = [{ kind: 'text', value: 'bare' }];
        render(wrap(<CanvasWidget value={leafOnly} onChange={onChange} editShellMount={mount as never} />));

        act(() => insert('Heading'));

        expect(onChange).not.toHaveBeenCalled();
        expect(mount.markDirty).not.toHaveBeenCalled();
    });
});

// ── CanvasWidget: the registered handlers vs. the inline text commit ──────────────────────────────────
describe('CanvasWidget — the stale-snapshot race (G2-BEAM-AUTHOR-FIRST-EDIT-LOST)', () => {
    // Measured three times on beam.test 2026-09-11: the FIRST inline edit after opening the editor
    // reverts to "New heading" on click-away; the second and third commit. Diagnosed as a race between
    // the blur commit and the shell Inspector's write-back — `registerNodeAccess` closed over THAT
    // render's `doc`, and frame's RJSF/ajv `onChange` fires on first mount when normalization differs,
    // which is both the first selection and the slowest one. Reproduced deterministically here by
    // capturing the handlers registered at render N and invoking them after a commit at render N+1.
    const captureMount = () => {
        const captured: { setNodeAttrs?: (id: string, attrs: unknown) => void } = {};
        const mount = {
            selectedNodeId: '0.0',
            selectNode: vi.fn(),
            markDirty: vi.fn(),
            markSaving: vi.fn(),
            flush: vi.fn(),
            publishCandidates: vi.fn(),
            publishConformance: vi.fn(),
            registerInsertHandler: vi.fn(() => () => {}),
            registerNodeAccess: vi.fn((access: { setNodeAttrs: (id: string, attrs: unknown) => void }) => {
                // FIRST registration only — the stale one, exactly what the Inspector holds across the
                // commit that happens between mount and its first onChange.
                captured.setNodeAttrs ??= access.setNodeAttrs;
                return () => {};
            }),
        };

        return { mount, captured };
    };

    const typed = 'Via click-away';

    it('a stale Inspector write-back does not revert the inline text committed after it registered', () => {
        const { mount, captured } = captureMount();
        let current: JsonDoc = doc();
        const onChange = vi.fn((next: JsonDoc) => {
            current = next;
        });

        const { rerender } = render(
            wrap(<CanvasWidget value={current} onChange={onChange} editShellMount={mount as never} />),
        );

        // 1. The author types into the contenteditable and clicks away: the blur commits the text.
        const h1 = document.querySelector('h1') as HTMLElement;
        fireEvent.doubleClick(h1);
        rerender(wrap(<CanvasWidget value={current} onChange={onChange} editShellMount={mount as never} />));
        const editable = document.querySelector('h1') as HTMLElement;
        editable.textContent = typed;
        fireEvent.blur(editable);
        expect(onChange).toHaveBeenCalled();
        rerender(wrap(<CanvasWidget value={current} onChange={onChange} editShellMount={mount as never} />));

        // 2. NOW the Inspector's first-mount onChange lands, through the handler it captured earlier.
        act(() => captured.setNodeAttrs?.('0.0', { className: 'lead' }));
        rerender(wrap(<CanvasWidget value={current} onChange={onChange} editShellMount={mount as never} />));

        // The text edit must survive: the attrs write applies to the CURRENT document, not the snapshot
        // the handler closed over.
        expect(document.querySelector('h1')?.textContent).toBe(typed);
    });

    it('an attrs write-back that changes nothing never emits — the first-mount normalization echo', () => {
        // The trigger itself. RJSF fires onChange on first mount whenever ajv's normalization differs
        // from the seed, carrying the SAME attrs back. That echo is not an edit and must not reach the
        // document, the host, or the dirty flag.
        const { mount, captured } = captureMount();
        const onChange = vi.fn();
        render(wrap(<CanvasWidget value={doc()} onChange={onChange} editShellMount={mount as never} />));

        act(() => captured.setNodeAttrs?.('0.0', {}));

        expect(onChange).not.toHaveBeenCalled();
        expect(mount.markDirty).not.toHaveBeenCalled();
    });

    it('a REAL attrs change still emits', () => {
        const { mount, captured } = captureMount();
        const onChange = vi.fn();
        render(wrap(<CanvasWidget value={doc()} onChange={onChange} editShellMount={mount as never} />));

        act(() => captured.setNodeAttrs?.('0.0', { className: 'lead' }));

        expect(onChange).toHaveBeenCalledOnce();
        expect(mount.markDirty).toHaveBeenCalledWith(true);
    });
});

// ── insertRelativeTo: where a new block lands ─────────────────────────────────────────────────────────
describe('insertRelativeTo', () => {
    const make = (): JsonBlock => block({ name: 'h2', children: [{ kind: 'text', value: 'New heading' }] });

    it('appends at the ROOT ARRAY when the document is empty — the first-block case', () => {
        // Before this, `getAt([], '0')` was null and the function returned the doc unchanged, so a
        // never-authored entry could not take its first block (G2-BEAM-AUTHOR-EMPTY-ENTRY).
        const next = insertRelativeTo([], null, make);

        expect(next).toHaveLength(1);
        expect((next[0] as JsonBlock).name).toBe('h2');
    });

    it('ignores a selection the empty document cannot resolve rather than refusing the insert', () => {
        expect(insertRelativeTo([], '3.7', make)).toHaveLength(1);
    });

    it('still returns the SAME doc when a non-empty document has no insertable target', () => {
        // The guard's other case is unchanged, and reference identity is what CanvasWidget's no-op
        // dirty guard reads.
        const leafOnly: JsonDoc = [{ kind: 'text', value: 'bare' }];

        expect(insertRelativeTo(leafOnly, null, make)).toBe(leafOnly);
    });

    it('appends inside the root container when the root is selected', () => {
        const tree: JsonDoc = [block({ name: 'div', children: [] })];
        const next = insertRelativeTo(tree, '0', make);

        expect((next[0] as JsonBlock).children).toHaveLength(1);
    });
});

// ── useEditMode: the mode is STATE, and the broadcast is how it changes ────────────────────────────────
describe('useEditMode', () => {
    function Probe() {
        return <span data-testid="mode">{useEditMode() ? 'window' : 'domain'}</span>;
    }

    afterEach(() => act(() => __resetEditMode()));

    it('reports window mode to a component that mounts AFTER the broadcast', () => {
        // Measured on beam.test 2026-09-11. `beam-ux:mode` is one-shot, and that was harmless only
        // while every consumer outlived every broadcast. `site/home` now FORKS on the mode — the
        // compiled artifact for a reader, the editor for an author — so entering window mode is exactly
        // what mounts the editor, and the editor subscribed one tick too late and reported read mode
        // forever: the dock said "Edit content", the page swapped, and the read tree rendered.
        act(() => {
            fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        });

        render(<Probe />);

        expect(screen.getByTestId('mode').textContent).toBe('window');
    });

    it('still tracks changes for a component mounted before the broadcast', () => {
        render(<Probe />);
        expect(screen.getByTestId('mode').textContent).toBe('domain');

        act(() => {
            fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        });
        expect(screen.getByTestId('mode').textContent).toBe('window');

        act(() => {
            fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'domain' } }));
        });
        expect(screen.getByTestId('mode').textContent).toBe('domain');
    });

    it('keeps every consumer in agreement — there is one authoring mode per document', () => {
        const { rerender } = render(
            <>
                <Probe />
            </>,
        );
        act(() => {
            fireEvent(window, new CustomEvent('beam-ux:mode', { detail: { mode: 'window' } }));
        });

        rerender(
            <>
                <Probe />
                <Probe />
            </>,
        );

        expect(screen.getAllByTestId('mode').map((n) => n.textContent)).toEqual(['window', 'window']);
    });
});
