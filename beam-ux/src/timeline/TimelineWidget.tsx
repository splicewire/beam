import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import type { HeavyweightWidgetProps } from '@schemastud/frame/editor';
import { layoutTimeline, OtioTimeError, type LaidClip, type LaidSection, type OtioTimeline, type TimelineLayout } from './otio.js';
import { useTimelinePorts, type ClipTimeChange, type TimelineAction, type TimelineNode, type TimelineVersion } from './ports.js';

/**
 * The timeline widget (node-actions-and-takes 08), registered as `otio-timeline`. It draws one OTIO document: a
 * section ruler from the form lane's markers, one row per other lane, clips placed by walking gaps, every time as
 * `value / rate`. It selects through the edit shell's mount, moves and trims lead-lane clips through the host's
 * `patchClip` port, runs the host's actions for a selection, and lists, snapshots and restores versions.
 *
 * Frame's full-surface contract (`HeavyweightWidgetProps`, CONFORM 04-1/04-4), optional because a host may also render
 * it directly. The lock is `readonly`: when set, the widget draws and selects and calls no write port.
 *
 * It never reads a clip's notes, never sends `status`, `mediaTargetUrl` or `payload`, never moves a marker or a clip
 * on the take lane, never creates, deletes or reorders anything, and never keeps the document as truth: after a write
 * it calls the host's `load` and redraws.
 */
export interface TimelineWidgetProps extends Partial<HeavyweightWidgetProps<OtioTimeline>> {
    /** Pixels per second. Default 48. */
    scale?: number;
}

type Drag = { clipId: string; mode: 'move' | 'trim'; originX: number; start: number; duration: number; moved: boolean };
type Times = { start: number; duration: number };

const round = (value: number) => Math.round(value * 10000) / 10000;
const formatSeconds = (value: number) => `${round(value)}s`;

// Paint is INLINE, from beam's own tokens with their light-theme values as fallbacks, because a host's CSS reset
// (Tailwind preflight) makes a bare <button> transparent and borderless, and a clip then draws as nothing. Longhand
// properties only, so a reset's shorthand cannot half-apply. Selection is an inset ring, so it never shifts layout.
const ring = (on: boolean, color: string) => (on ? `inset 0 0 0 2px ${color}` : 'none');

function clipPaint(isSelected: boolean): CSSProperties {
    return {
        boxSizing: 'border-box',
        padding: 0,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--beam-green, #14803f)',
        borderRadius: 4,
        backgroundColor: 'var(--beam-green-tint, #eaf6ee)',
        color: 'var(--beam-green-deep, #0f5f2e)',
        boxShadow: ring(isSelected, 'var(--beam-green-deep, #0f5f2e)'),
    };
}

// A ruler section reads as its own block: the marker's colour (or the tint), and from the second section on a
// separator in the paper colour, so adjacent sections of one marker colour no longer run together into one bar.
function sectionPaint(color: string | null, index: number, isSelected: boolean): CSSProperties {
    return {
        boxSizing: 'border-box',
        padding: '0 6px',
        borderWidth: 0,
        borderStyle: 'solid',
        borderLeftWidth: index > 0 ? 2 : 0,
        borderLeftColor: 'var(--beam-paper-raised, #ffffff)',
        backgroundColor: color ?? 'var(--beam-green-tint, #eaf6ee)',
        color: 'var(--beam-ink, #2e2c26)',
        textAlign: 'left',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        boxShadow: ring(isSelected, 'var(--beam-ink, #2e2c26)'),
    };
}

export function TimelineWidget({ value, formData, editShellMount: mount, readonly = false, scale = 48 }: TimelineWidgetProps) {
    const ports = useTimelinePorts();
    const given = value ?? formData ?? null;
    const [loaded, setLoaded] = useState<OtioTimeline | null>(null);
    const doc = loaded ?? given;
    const [overrides, setOverrides] = useState<Record<string, Times>>({});
    const [localSelection, setLocalSelection] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const selected = mount ? mount.selectedNodeId : localSelection;

    // A new document from the host replaces whatever the widget last loaded.
    useEffect(() => setLoaded(null), [given]);

    const layout = useMemo<{ value: TimelineLayout | null; error: string | null }>(() => {
        if (!doc) return { value: null, error: null };
        try {
            return { value: layoutTimeline(doc, ports), error: null };
        } catch (failure) {
            if (failure instanceof OtioTimeError) return { value: null, error: failure.message };
            throw failure;
        }
    }, [doc, ports]);

    // Live values for the closures the shell keeps (it holds one registration per slot) and for window listeners.
    const layoutRef = useRef(layout.value);
    layoutRef.current = layout.value;
    const portsRef = useRef(ports);
    portsRef.current = ports;
    const readonlyRef = useRef(readonly);
    readonlyRef.current = readonly;
    const mountRef = useRef(mount);
    mountRef.current = mount;
    const docRef = useRef(doc);
    docRef.current = doc;
    const dragRef = useRef<Drag | null>(null);
    const laneRefs = useRef(new Map<string, HTMLElement>());

    const select = useCallback((id: string | null) => {
        setLocalSelection(id);
        mountRef.current?.selectNode(id);
    }, []);

    const reload = useCallback(async () => {
        const load = portsRef.current.load;
        if (!load) return;
        const next = await load();
        setLoaded(next);
        setOverrides({});
    }, []);

    const findClip = (id: string | null): LaidClip | null => {
        if (!id) return null;
        for (const lane of layoutRef.current?.lanes ?? []) {
            const clip = lane.clips.find((candidate) => candidate.id === id);
            if (clip) return clip;
        }
        return null;
    };
    const findSection = (id: string | null): LaidSection | null => layoutRef.current?.sections.find((section) => section.id === id) ?? null;
    const laneOf = (clip: LaidClip) => layoutRef.current?.lanes.find((lane) => lane.index === clip.laneIndex) ?? null;
    const canEdit = (clip: LaidClip) => !readonlyRef.current && Boolean(portsRef.current.patchClip) && laneOf(clip)?.editable === true;

    const snap = (seconds: number) => {
        const step = portsRef.current.snapSeconds;
        return step && step > 0 ? Math.round(seconds / step) * step : seconds;
    };

    /** The one write path for a move or a trim: dirty, saving, the port, then saved and a re-read, or the refusal. */
    const commit = useCallback(async (clip: LaidClip, change: ClipTimeChange) => {
        const patchClip = portsRef.current.patchClip;
        if (!patchClip || !canEdit(clip)) return;
        const current = mountRef.current;
        setError(null);
        current?.markDirty(true);
        current?.markSaving(true);
        try {
            await patchClip(clip.id, change);
            mountRef.current?.markSaving(false);
            mountRef.current?.markDirty(false);
            await reload();
        } catch (failure) {
            // The edit stays unsaved, and the server's words are shown as they are.
            mountRef.current?.markSaving(false);
            setError(failure instanceof Error ? failure.message : String(failure));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload]);

    const finishDrag = useCallback(async () => {
        const drag = dragRef.current;
        dragRef.current = null;
        if (!drag || !drag.moved) return;
        const clip = findClip(drag.clipId);
        const times = clip ? overridesRef.current[drag.clipId] : undefined;
        if (!clip || !times) return;
        const change: ClipTimeChange =
            drag.mode === 'move' ? { startSeconds: round(times.start) } : { durationSeconds: round(times.duration) };
        await commit(clip, change);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [commit]);

    const overridesRef = useRef(overrides);
    overridesRef.current = overrides;

    useEffect(() => {
        const onMove = (event: MouseEvent) => {
            const drag = dragRef.current;
            if (!drag) return;
            const delta = (event.clientX - drag.originX) / scale;
            if (delta !== 0) drag.moved = true;
            const next: Times =
                drag.mode === 'move'
                    ? { start: Math.max(0, snap(drag.start + delta)), duration: drag.duration }
                    : { start: drag.start, duration: Math.max(snap(drag.duration + delta), portsRef.current.snapSeconds ?? 0.01) };
            setOverrides((previous) => ({ ...previous, [drag.clipId]: next }));
            mountRef.current?.markDirty(true);
        };
        const onUp = () => {
            if (dragRef.current) void finishDrag();
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scale, finishDrag]);

    const startDrag = (clip: LaidClip, mode: Drag['mode']) => (event: ReactMouseEvent) => {
        if (!canEdit(clip) || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const times = overrides[clip.id] ?? { start: clip.start, duration: clip.duration };
        dragRef.current = { clipId: clip.id, mode, originX: event.clientX, start: times.start, duration: times.duration, moved: false };
        select(clip.id);
    };

    // The shell's inspector: the selected node's time fields. The first-mount echo of the schema form hands back the
    // values it was given, which is not an edit, so equal values change nothing. `mount` is omitted from every
    // publishing effect below: its identity changes with its own state, so depending on it would loop.
    useEffect(() => {
        if (!mount) return;
        return mount.registerNodeAccess({
            getNode: (nodeId) => {
                const clip = findClip(nodeId);
                if (clip) {
                    const times = overridesRef.current[clip.id] ?? { start: clip.start, duration: clip.duration };
                    const take = laneOf(clip)?.take === true;
                    const span = `From ${formatSeconds(times.start)} to ${formatSeconds(times.start + times.duration)}.`;
                    // A node that cannot change gets no fields at all, only its times as words: nothing to type into.
                    if (!canEdit(clip)) {
                        return {
                            type: take ? 'take' : 'clip',
                            attrsSchema: { type: 'object', title: clip.name, description: take ? `${span} A finished recording; it is not edited here.` : span, properties: {} },
                            attrs: {},
                        };
                    }
                    return {
                        type: 'clip',
                        attrsSchema: {
                            type: 'object',
                            title: clip.name,
                            properties: {
                                startSeconds: { type: 'number', title: 'Start (seconds)', minimum: 0 },
                                durationSeconds: { type: 'number', title: 'Length (seconds)', exclusiveMinimum: 0 },
                            },
                        },
                        attrs: { startSeconds: round(times.start), durationSeconds: round(times.duration) },
                    };
                }
                const section = findSection(nodeId);
                if (!section) return null;
                return {
                    type: 'section',
                    attrsSchema: {
                        type: 'object',
                        title: section.name,
                        description: `From ${formatSeconds(section.start)} to ${formatSeconds(section.start + section.duration)}. A section is the song's structure; it is not moved here.`,
                        properties: {},
                    },
                    attrs: {},
                };
            },
            setNodeAttrs: (nodeId, attrs) => {
                const clip = findClip(nodeId);
                if (!clip || !canEdit(clip)) return;
                const times = overridesRef.current[clip.id] ?? { start: clip.start, duration: clip.duration };
                const change: ClipTimeChange = {};
                const start = typeof attrs.startSeconds === 'number' ? round(snap(attrs.startSeconds)) : undefined;
                const duration = typeof attrs.durationSeconds === 'number' ? round(snap(attrs.durationSeconds)) : undefined;
                if (start !== undefined && start !== round(times.start)) change.startSeconds = start;
                if (duration !== undefined && duration !== round(times.duration)) change.durationSeconds = duration;
                if (change.startSeconds === undefined && change.durationSeconds === undefined) return;
                setOverrides((previous) => ({
                    ...previous,
                    [clip.id]: { start: change.startSeconds ?? times.start, duration: change.durationSeconds ?? times.duration },
                }));
                void commit(clip, change);
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout.value, readonly, ports, commit]);

    useEffect(() => {
        if (!mount) return;
        return mount.registerRevealHandler((nodeId) => {
            laneRefs.current.get(nodeId)?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // A drag still in progress is committed before any write the host makes (frame's flush contract).
    useEffect(() => {
        if (!mount) return;
        return mount.registerFlush(async () => {
            if (dragRef.current) await finishDrag();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finishDrag]);

    if (!doc) return <div data-otio-timeline="empty">No timeline.</div>;
    if (layout.error || !layout.value) {
        return (
            <div data-otio-timeline="error" role="alert">
                {layout.error}
            </div>
        );
    }

    const { duration, sections, lanes } = layout.value;
    const width = Math.max(duration * scale, 1);
    const selectedNode = nodeFor(selected, layout.value);
    const actions = selectedNode && !readonly && ports.actionsFor && doc ? ports.actionsFor(selectedNode, doc) : [];

    const box = (start: number, length: number): CSSProperties => ({
        position: 'absolute',
        left: start * scale,
        width: Math.max(length * scale, 2),
        top: 2,
        bottom: 2,
    });

    return (
        <div data-otio-timeline="" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ overflowX: 'auto' }}>
                <div style={{ width, minWidth: '100%' }}>
                    {sections.length > 0 ? (
                        <div role="group" aria-label="Sections" data-timeline-ruler="" style={{ position: 'relative', height: 28 }}>
                            {sections.map((section, index) => (
                                <button
                                    key={section.id}
                                    type="button"
                                    data-timeline-section={section.id}
                                    aria-pressed={selected === section.id}
                                    aria-label={`Section ${section.name}, ${formatSeconds(section.start)} to ${formatSeconds(section.start + section.duration)}`}
                                    onClick={() => select(section.id)}
                                    style={{ ...box(section.start, section.duration), ...sectionPaint(section.color, index, selected === section.id) }}
                                >
                                    {section.name}
                                </button>
                            ))}
                        </div>
                    ) : null}
                    {lanes.map((lane) => (
                        <div key={lane.id} role="group" aria-label={lane.label} data-timeline-lane={lane.index} style={{ display: 'flex', alignItems: 'stretch' }}>
                            <div
                                style={{ position: 'relative', height: 36, width }}
                                onClick={(event) => {
                                    if (event.target === event.currentTarget) select(null);
                                }}
                            >
                                {lane.clips.map((clip) => {
                                    const times = overrides[clip.id] ?? { start: clip.start, duration: clip.duration };
                                    const editable = canEdit(clip);
                                    const peaks = ports.peaksFor?.(clip.item) ?? null;
                                    return (
                                        <div
                                            key={clip.id}
                                            ref={(element) => {
                                                if (element) laneRefs.current.set(clip.id, element);
                                                else laneRefs.current.delete(clip.id);
                                            }}
                                            data-timeline-clip={clip.id}
                                            data-editable={editable ? '' : undefined}
                                            style={box(times.start, times.duration)}
                                        >
                                            <button
                                                type="button"
                                                aria-pressed={selected === clip.id}
                                                aria-label={`${lane.label}: ${clip.name}, ${formatSeconds(times.start)} to ${formatSeconds(times.start + times.duration)}`}
                                                onClick={() => select(clip.id)}
                                                onMouseDown={editable ? startDrag(clip, 'move') : undefined}
                                                style={{ width: '100%', height: '100%', cursor: editable ? 'grab' : 'default', overflow: 'hidden', ...clipPaint(selected === clip.id) }}
                                            >
                                                {peaks ? <Peaks peaks={peaks} /> : null}
                                            </button>
                                            {editable ? (
                                                <span
                                                    role="separator"
                                                    aria-orientation="vertical"
                                                    aria-label={`Trim ${clip.name}`}
                                                    data-timeline-trim=""
                                                    onMouseDown={startDrag(clip, 'trim')}
                                                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 6, cursor: 'ew-resize' }}
                                                />
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {error ? (
                <p role="alert" data-timeline-refusal="">
                    {error}
                </p>
            ) : null}
            {notice ? (
                <p role="status" data-timeline-notice="">
                    {notice}
                </p>
            ) : null}
            {actions.length > 0 ? (
                <Actions
                    actions={actions}
                    onDone={async (message) => {
                        setError(null);
                        setNotice(message);
                        await reload();
                    }}
                    onRefused={(message) => {
                        setNotice(null);
                        setError(message);
                    }}
                />
            ) : null}
            {ports.versions ? (
                <Versions
                    readonly={readonly}
                    onRestored={async () => {
                        select(null);
                        await reload();
                    }}
                    onRefused={setError}
                />
            ) : null}
        </div>
    );
}

function nodeFor(id: string | null, layout: TimelineLayout): TimelineNode | null {
    if (!id) return null;
    for (const lane of layout.lanes) {
        const clip = lane.clips.find((candidate) => candidate.id === id);
        if (clip) return { kind: 'clip', clip, editable: lane.editable, take: lane.take };
    }
    const section = layout.sections.find((candidate) => candidate.id === id);
    return section ? { kind: 'section', section } : null;
}

/** Real peaks only. A clip without peaks is a plain bar, never a decorative waveform. */
function Peaks({ peaks }: { peaks: number[] }) {
    const top = Math.max(...peaks.map(Math.abs), 1e-9);
    return (
        <span data-timeline-peaks="" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1 }}>
            {peaks.map((peak, index) => (
                <span key={index} style={{ flex: 1, height: `${(Math.abs(peak) / top) * 100}%`, background: 'currentColor' }} />
            ))}
        </span>
    );
}

function Actions({
    actions,
    onDone,
    onRefused,
}: {
    actions: TimelineAction[];
    onDone: (message: string) => Promise<void>;
    onRefused: (message: string) => void;
}) {
    return (
        <div role="group" aria-label="Actions" data-timeline-actions="">
            {actions.map((action) => (
                <ActionControl key={action.key} action={action} onDone={onDone} onRefused={onRefused} />
            ))}
        </div>
    );
}

function ActionControl({ action, onDone, onRefused }: { action: TimelineAction; onDone: (message: string) => Promise<void>; onRefused: (message: string) => void }) {
    const [choice, setChoice] = useState<string | undefined>(action.choices?.[0]?.value);
    const [busy, setBusy] = useState(false);

    if (action.unavailable) {
        return (
            <p data-timeline-action-unavailable={action.key}>
                {action.label}: {action.unavailable}
            </p>
        );
    }

    return (
        <div data-timeline-action={action.key}>
            {action.choices ? (
                <label>
                    {action.choiceLabel ?? 'From'}{' '}
                    <select value={choice} onChange={(event) => setChoice(event.target.value)}>
                        {action.choices.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            ) : null}
            <button
                type="button"
                disabled={busy}
                onClick={async () => {
                    setBusy(true);
                    try {
                        const result = await action.run(choice);
                        await onDone(result.message);
                    } catch (failure) {
                        onRefused(failure instanceof Error ? failure.message : String(failure));
                    } finally {
                        setBusy(false);
                    }
                }}
            >
                {action.label}
            </button>
        </div>
    );
}

function Versions({ readonly, onRestored, onRefused }: { readonly: boolean; onRestored: () => Promise<void>; onRefused: (message: string) => void }) {
    const ports = useTimelinePorts();
    const port = ports.versions!;
    const [versions, setVersions] = useState<TimelineVersion[]>([]);
    const [label, setLabel] = useState('');
    const [busy, setBusy] = useState(false);

    const refresh = useCallback(async () => {
        try {
            setVersions(await port.list());
        } catch (failure) {
            onRefused(failure instanceof Error ? failure.message : String(failure));
        }
    }, [port, onRefused]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const run = async (write: () => Promise<unknown>, after?: () => Promise<void>) => {
        setBusy(true);
        try {
            await write();
            await after?.();
            await refresh();
        } catch (failure) {
            onRefused(failure instanceof Error ? failure.message : String(failure));
        } finally {
            setBusy(false);
        }
    };

    return (
        <section aria-label="Versions" data-timeline-versions="">
            <ul>
                {versions.map((version) => (
                    <li key={version.ref} data-timeline-version={version.ref}>
                        {version.label || version.ref}
                        {version.head ? ' (current)' : null}
                        {!readonly && !version.head ? (
                            <button type="button" disabled={busy} onClick={() => run(() => port.restore(version.ref), onRestored)}>
                                Restore {version.label || version.ref}
                            </button>
                        ) : null}
                    </li>
                ))}
            </ul>
            {!readonly ? (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        const name = label.trim();
                        if (!name) return;
                        void run(() => port.snapshot(name), async () => setLabel(''));
                    }}
                >
                    <label>
                        Version label <input value={label} onChange={(event) => setLabel(event.target.value)} />
                    </label>
                    <button type="submit" disabled={busy || label.trim() === ''}>
                        Snapshot
                    </button>
                </form>
            ) : null}
        </section>
    );
}
