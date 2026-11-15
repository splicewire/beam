import { useRef, type MutableRefObject } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEditShellMountController, type EditShellMountValue } from '@schemastud/frame/editor';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MUSIC_DOC, PREPARED_VIDEO_DOC } from './fixtures';
import { layoutTimeline, type OtioTimeline } from './otio';
import { TimelinePortsProvider, type TimelinePorts, type TimelineVersion } from './ports';
import { TimelineWidget } from './TimelineWidget';
import { registerTimelineWidget, TIMELINE_WIDGET_NAME } from './widgetRegistry';
import registerDefault from './widgetRegistry';

afterEach(cleanup);

/** The music host's lane facts and ids, as an adapter would give them (the document says neither). */
const musicLayout: Pick<TimelinePorts, 'lane' | 'clipId'> = {
    lane: (track) => ({ editable: track.name === 'Lead', take: track.name === 'Takes', form: track.name === 'Form' }),
    clipId: (item) => item.name,
};

type Probe = { mount: EditShellMountValue | null; pill: string[] };

function Harness({ doc, ports, readonly = false, probe }: { doc: OtioTimeline; ports: TimelinePorts; readonly?: boolean; probe: MutableRefObject<Probe> }) {
    const mount = useEditShellMountController();
    probe.current.mount = mount;
    const face = mount.saving ? 'saving' : mount.dirty ? 'unsaved' : 'saved';
    if (probe.current.pill.at(-1) !== face) probe.current.pill.push(face);
    const stable = useRef(ports).current;
    return (
        <TimelinePortsProvider value={stable}>
            <TimelineWidget value={doc} formData={doc} editShellMount={mount} readonly={readonly} scale={10} />
        </TimelinePortsProvider>
    );
}

function mount(doc: OtioTimeline, ports: TimelinePorts, readonly = false) {
    const probe = { current: { mount: null, pill: [] } } as MutableRefObject<Probe>;
    render(<Harness doc={doc} ports={ports} readonly={readonly} probe={probe} />);
    return probe;
}

const clipButton = (name: RegExp) => screen.getByRole('button', { name });

describe('layout', () => {
    it('reads every time as value / rate and places clips by walking gaps', () => {
        const music = layoutTimeline(MUSIC_DOC, musicLayout);
        expect(music.sections.map((s) => [s.name, s.start, s.duration])).toEqual([['Verse', 0, 8], ['Chorus', 8, 8]]);
        expect(music.lanes.map((lane) => lane.name)).toEqual(['Lead', 'Takes']);
        expect(music.lanes[0].clips.map((c) => [c.id, c.start, c.duration])).toEqual([['clip-verse', 0, 6], ['clip-chorus', 8, 8]]);
        expect(music.duration).toBe(16);

        const video = layoutTimeline(PREPARED_VIDEO_DOC);
        expect(video.lanes[0].clips.map((c) => [c.id, c.start, c.duration])).toEqual([['lane:0/item:0', 0, 2], ['lane:0/item:2', 3, 3]]);
        expect(video.duration).toBe(6);
    });

    it('refuses a time with no rate instead of assuming one', () => {
        const broken = structuredClone(MUSIC_DOC);
        delete (broken.tracks.children[1].children[0].source_range!.duration as { rate?: number }).rate;
        expect(() => layoutTimeline(broken, musicLayout)).toThrow(/no rate/);
    });
});

describe('paint that survives a host CSS reset', () => {
    // A Tailwind host's preflight makes a bare <button> transparent and borderless, so the widget paints inline.
    it('gives every clip an inline background and border from beam tokens, and selection a ring', () => {
        mount(MUSIC_DOC, musicLayout);
        for (const button of [clipButton(/Lead: clip-verse/), clipButton(/Lead: clip-chorus/), ...within(screen.getByRole('group', { name: 'Takes' })).getAllByRole('button')]) {
            expect(button.style.backgroundColor).toBe('var(--beam-green-tint, #eaf6ee)');
            expect(button.style.borderStyle).toBe('solid');
            expect(button.style.borderWidth).toBe('1px');
            expect(button.style.borderColor).toBe('var(--beam-green, #14803f)');
            expect(button.style.boxShadow).toBe('none');
        }
        fireEvent.click(clipButton(/Lead: clip-chorus/));
        expect(clipButton(/Lead: clip-chorus/).style.boxShadow).toBe('inset 0 0 0 2px var(--beam-green-deep, #0f5f2e)');
    });

    it('separates ruler sections: each after the first has a visible left separator, and each keeps its colour', () => {
        mount(MUSIC_DOC, musicLayout);
        const [verse, chorus] = within(screen.getByRole('group', { name: 'Sections' })).getAllByRole('button');
        expect(verse.style.borderLeftWidth).toBe('0px');
        expect(chorus.style.borderLeftWidth).toBe('2px');
        expect(chorus.style.borderLeftStyle).toBe('solid');
        expect(chorus.style.borderLeftColor).toBe('var(--beam-paper-raised, #ffffff)');
        expect(verse.style.backgroundColor.toLowerCase()).toBe('green');
        expect(chorus.style.backgroundColor.toLowerCase()).toBe('red');
    });
});

describe('the music timeline', () => {
    it('draws the ruler, one lead clip per section and the take, and selects through the mount', async () => {
        const probe = mount(MUSIC_DOC, musicLayout);
        const ruler = screen.getByRole('group', { name: 'Sections' });
        expect(within(ruler).getAllByRole('button').map((b) => b.textContent)).toEqual(['Verse', 'Chorus']);
        expect(within(screen.getByRole('group', { name: 'Lead' })).getAllByRole('button')).toHaveLength(2);
        expect(within(screen.getByRole('group', { name: 'Takes' })).getAllByRole('button')).toHaveLength(1);

        fireEvent.click(clipButton(/Lead: clip-chorus/));
        expect(probe.current.mount?.selectedNodeId).toBe('clip-chorus');
        expect(clipButton(/Lead: clip-chorus/).getAttribute('aria-pressed')).toBe('true');

        fireEvent.click(within(ruler).getByRole('button', { name: /Section Verse/ }));
        expect(probe.current.mount?.selectedNodeId).toBe('section:0');

        // The inspector reads the selected node through node access. With no patchClip port nothing is editable, so a
        // lead clip offers its times as words and no field.
        expect(probe.current.mount?.getNode('clip-verse')).toMatchObject({ type: 'clip', attrs: {}, attrsSchema: { title: 'clip-verse', properties: {} } });
        expect(probe.current.mount?.getNode('section:1')).toMatchObject({ type: 'section', attrs: {}, attrsSchema: { title: 'Chorus', properties: {} } });
        expect((probe.current.mount?.getNode('section:1') as { attrsSchema: { description: string } }).attrsSchema.description).toMatch(/^From 8s to 16s\./);
        // A take offers no field to edit, only its times.
        expect(probe.current.mount?.getNode('clip-take-1')).toMatchObject({ type: 'take', attrs: {}, attrsSchema: { properties: {} } });
    });

    it('moves a lead clip by drag: sends only startSeconds, goes unsaved, saving, saved, and re-reads', async () => {
        let release!: () => void;
        const patchClip = vi.fn(() => new Promise<void>((resolve) => (release = resolve)));
        const moved = structuredClone(MUSIC_DOC);
        const load = vi.fn(async () => moved);
        const probe = mount(MUSIC_DOC, { ...musicLayout, patchClip, load });

        const verse = clipButton(/Lead: clip-verse/);
        fireEvent.mouseDown(verse, { button: 0, clientX: 100 });
        fireEvent.mouseMove(window, { clientX: 120 }); // +20 px at 10 px/s = +2 s
        expect(probe.current.pill.at(-1)).toBe('unsaved');
        fireEvent.mouseUp(window);

        await waitFor(() => expect(patchClip).toHaveBeenCalledTimes(1));
        expect(patchClip).toHaveBeenCalledWith('clip-verse', { startSeconds: 2 });
        expect(Object.keys((patchClip.mock.calls[0] as unknown[])[1] as object)).toEqual(['startSeconds']);
        expect(probe.current.pill.at(-1)).toBe('saving');

        await act(async () => release());
        await waitFor(() => expect(load).toHaveBeenCalled());
        expect(probe.current.pill).toEqual(['saved', 'unsaved', 'saving', 'saved']);
    });

    it('trims a lead clip with only durationSeconds, and an inspector edit takes the same path', async () => {
        const patchClip = vi.fn(async () => undefined);
        const probe = mount(MUSIC_DOC, { ...musicLayout, patchClip, load: async () => MUSIC_DOC });

        const trim = screen.getByRole('separator', { name: 'Trim clip-chorus' });
        fireEvent.mouseDown(trim, { button: 0, clientX: 0 });
        fireEvent.mouseMove(window, { clientX: -10 });
        fireEvent.mouseUp(window);
        await waitFor(() => expect(patchClip).toHaveBeenCalledWith('clip-chorus', { durationSeconds: 7 }));

        // With the port, a lead clip's inspector offers its two time fields.
        expect(probe.current.mount?.getNode('clip-verse')).toMatchObject({ type: 'clip', attrs: { startSeconds: 0, durationSeconds: 6 } });
        expect(Object.keys((probe.current.mount?.getNode('clip-verse') as { attrsSchema: { properties: object } }).attrsSchema.properties)).toEqual(['startSeconds', 'durationSeconds']);

        // The inspector's first-mount echo hands back the values it was given: not an edit.
        patchClip.mockClear();
        act(() => probe.current.mount!.setNodeAttrs('clip-verse', { startSeconds: 0, durationSeconds: 6 }));
        expect(patchClip).not.toHaveBeenCalled();
        act(() => probe.current.mount!.setNodeAttrs('clip-verse', { startSeconds: 1.5, durationSeconds: 6 }));
        await waitFor(() => expect(patchClip).toHaveBeenCalledWith('clip-verse', { startSeconds: 1.5 }));
    });

    it('never moves a take or a marker, and never writes when readonly', async () => {
        const patchClip = vi.fn(async () => undefined);
        mount(MUSIC_DOC, { ...musicLayout, patchClip });
        fireEvent.mouseDown(clipButton(/Takes: clip-take-1/), { button: 0, clientX: 0 });
        fireEvent.mouseMove(window, { clientX: 50 });
        fireEvent.mouseUp(window);
        expect(screen.queryByRole('separator', { name: 'Trim clip-take-1' })).toBeNull();
        cleanup();

        const probe = mount(MUSIC_DOC, { ...musicLayout, patchClip }, true);
        expect(screen.queryAllByRole('separator')).toHaveLength(0);
        fireEvent.mouseDown(clipButton(/Lead: clip-verse/), { button: 0, clientX: 0 });
        fireEvent.mouseMove(window, { clientX: 50 });
        fireEvent.mouseUp(window);
        act(() => probe.current.mount!.setNodeAttrs('clip-verse', { startSeconds: 3 }));
        expect(patchClip).not.toHaveBeenCalled();
        // Readonly still selects.
        fireEvent.click(clipButton(/Lead: clip-verse/));
        expect(probe.current.mount?.selectedNodeId).toBe('clip-verse');
    });

    it('keeps a refused move unsaved and shows the refusal in its own words', async () => {
        const patchClip = vi.fn(async () => {
            throw new Error('Fixture refusal: the clip overlaps the next one.');
        });
        const probe = mount(MUSIC_DOC, { ...musicLayout, patchClip, load: vi.fn(async () => MUSIC_DOC) });
        fireEvent.mouseDown(clipButton(/Lead: clip-verse/), { button: 0, clientX: 0 });
        fireEvent.mouseMove(window, { clientX: 30 });
        fireEvent.mouseUp(window);
        expect((await screen.findByRole('alert')).textContent).toBe('Fixture refusal: the clip overlaps the next one.');
        expect(probe.current.pill.at(-1)).toBe('unsaved');
    });
});

describe('the section action', () => {
    const sectionAction = (run: TimelinePorts['actionsFor']) => ({ ...musicLayout, actionsFor: run });

    it('runs with the chosen source take, shows what the server said, and re-reads', async () => {
        const run = vi.fn(async () => ({ message: 'Queued' }));
        const load = vi.fn(async () => MUSIC_DOC);
        mount(MUSIC_DOC, {
            ...sectionAction((node) =>
                node.kind === 'section'
                    ? [{ key: 'vary', label: 'Make a new take that varies this section', choiceLabel: 'From take', choices: [{ value: 'take-1', label: 'Take 1' }, { value: 'take-2', label: 'Take 2' }], run }]
                    : [],
            ),
            load,
        });
        expect(screen.queryByRole('group', { name: 'Actions' })).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: /Section Chorus/ }));
        fireEvent.change(screen.getByRole('combobox', { name: 'From take' }), { target: { value: 'take-2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Make a new take that varies this section' }));

        await waitFor(() => expect(run).toHaveBeenCalledWith('take-2'));
        expect((await screen.findByRole('status')).textContent).toBe('Queued');
        await waitFor(() => expect(load).toHaveBeenCalled());
    });

    it('shows a refusal in its own words, and an unavailable action as its reason with no control', async () => {
        mount(MUSIC_DOC, sectionAction(() => [{ key: 'vary', label: 'Vary', run: async () => { throw new Error('Fixture: another take of this song is pending.'); } }]));
        fireEvent.click(screen.getByRole('button', { name: /Section Verse/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Vary' }));
        expect((await screen.findByRole('alert')).textContent).toBe('Fixture: another take of this song is pending.');
        cleanup();

        mount(MUSIC_DOC, sectionAction(() => [{ key: 'vary', label: 'Vary', unavailable: 'No ready take to vary from.', run: vi.fn() }]));
        fireEvent.click(screen.getByRole('button', { name: /Section Verse/ }));
        expect(screen.queryByRole('button', { name: 'Vary' })).toBeNull();
        expect(screen.getByText('Vary: No ready take to vary from.')).toBeTruthy();
    });
});

describe('versions', () => {
    it('lists, snapshots with a label, and restores: selection cleared and the document re-read', async () => {
        let list: TimelineVersion[] = [{ ref: 'v2', label: 'After the chorus', head: true }, { ref: 'v1', label: 'First draft' }];
        const versions = {
            list: vi.fn(async () => list),
            snapshot: vi.fn(async (label: string) => {
                list = [{ ref: 'v3', label, head: true }, ...list.map((v) => ({ ...v, head: false }))];
            }),
            restore: vi.fn(async () => undefined),
        };
        const restored = structuredClone(MUSIC_DOC);
        restored.tracks.children[1].children[0].source_range!.duration.value = 4;
        const load = vi.fn(async () => restored);
        const probe = mount(MUSIC_DOC, { ...musicLayout, versions, load });

        const strip = await screen.findByRole('region', { name: 'Versions' });
        expect(await within(strip).findByText(/After the chorus/)).toBeTruthy();

        fireEvent.change(within(strip).getByRole('textbox', { name: 'Version label' }), { target: { value: 'Before the bridge' } });
        fireEvent.click(within(strip).getByRole('button', { name: 'Snapshot' }));
        await waitFor(() => expect(versions.snapshot).toHaveBeenCalledWith('Before the bridge'));
        expect(await within(strip).findByText(/Before the bridge/)).toBeTruthy();

        fireEvent.click(clipButton(/Lead: clip-verse/));
        expect(probe.current.mount?.selectedNodeId).toBe('clip-verse');
        fireEvent.click(within(strip).getByRole('button', { name: 'Restore First draft' }));
        await waitFor(() => expect(versions.restore).toHaveBeenCalledWith('v1'));
        await waitFor(() => expect(load).toHaveBeenCalled());
        expect(probe.current.mount?.selectedNodeId).toBeNull();
        await waitFor(() => expect(clipButton(/Lead: clip-verse, 0s to 4s/)).toBeTruthy());
    });
});

describe('prepared video at rate 24, with no write ports', () => {
    it('draws three lanes in correct proportions and offers no edit control', () => {
        mount(PREPARED_VIDEO_DOC, {});
        const lanes = ['Video', 'Audio 1', 'Audio 2'].map((name) => screen.getByRole('group', { name }));
        expect(lanes).toHaveLength(3);

        const widthOf = (element: HTMLElement) => parseFloat(element.closest<HTMLElement>('[data-timeline-clip]')!.style.width);
        const leftOf = (element: HTMLElement) => parseFloat(element.closest<HTMLElement>('[data-timeline-clip]')!.style.left);
        const [first, second] = within(lanes[0]).getAllByRole('button');
        // 48, 24 (gap) and 72 frames at 24 fps, at 10 px per second.
        expect([leftOf(first), widthOf(first), leftOf(second), widthOf(second)]).toEqual([0, 20, 30, 30]);
        expect(widthOf(within(lanes[1]).getByRole('button'))).toBe(60);
        expect(widthOf(within(lanes[2]).getByRole('button'))).toBe(40);

        // No edit control: no trim handle, no draggable clip, no actions, no versions strip.
        expect(screen.queryAllByRole('separator')).toHaveLength(0);
        expect(document.querySelectorAll('[data-editable]')).toHaveLength(0);
        expect(screen.queryByRole('group', { name: 'Actions' })).toBeNull();
        expect(screen.queryByRole('region', { name: 'Versions' })).toBeNull();
        expect(screen.queryAllByRole('textbox')).toHaveLength(0);
    });
});

describe('registration', () => {
    it('registers by the string name otio-timeline, from the module default export too', () => {
        expect(TIMELINE_WIDGET_NAME).toBe('otio-timeline');
        // Resolved the way the shell resolves it: by the node's `x-widget` name.
        expect(registerTimelineWidget().resolveWidget({ 'x-widget': TIMELINE_WIDGET_NAME })).toBe(TimelineWidget);
        expect(registerDefault).toBe(registerTimelineWidget);
    });
});
