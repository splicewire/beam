import { Button, SimpleSelect, Textarea } from '@schemastud/ui';
import { CalendarClock, Loader2, Repeat, Sparkles } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useCellNotify, useCellFormServices } from './cell-provider';
import { useCompositionCells, useCompositionProfiles, useSaveCell } from './cell-hooks';
import type { CalendarCell, CellClientError, CellContentPickerProps } from './cell-types';

/**
 * The purpose-built calendar item editor (rehomed from the app in frame-canonical-forms ticket 02;
 * originally the big-calendar-surface UX pass) — replaces the raw JSON-schema dump (DTO class
 * headings, snake_case fields, a UUID text box) with intuitive controls: a content picker (injected
 * host chrome), a channel selector that hides when a calendar has only one channel, a native date
 * picker, and a human recurrence builder with progressive disclosure. It posts the exact same cell
 * `slots` the schema form did, to the same endpoints (via the injected `client`) — only the UX changes.
 *
 * Handles the two primary calendar Kinds — a one-off Release (`composition-ref`) and a recurring
 * Series (`series`). Rarer Kinds (idea-ref / decommission / disclosure-ref) fall back to the generic
 * schema form the host still renders (see the host's CalendarEditPanel).
 *
 * PORTABLE (rehome-ui): UI primitives come from `@schemastud/ui`, transport + feedback + the content
 * picker are INJECTED (`useCellFormServices` / `useCompositionCells` etc. read the provider), and no
 * `@/`/sonner/axios/route() ever appears here.
 */

type Kind = 'release' | 'series';

/**
 * Whether a cell's Kind is one the purpose-built calendar form handles (a Release or a Series).
 * A stored `kind` is the full schema-$id URL (…/kind/composition-ref), so match on the short
 * suffix. Shared by every calendar cell-editing surface (the calendar tab AND the Studio grid) so
 * they render one consistent form.
 */
export function isFriendlyCalendarKind(kind: unknown): boolean {
    if (typeof kind !== 'string') return false;
    const suffix = kind.split('/').pop() ?? kind;
    return suffix === 'composition-ref' || suffix === 'series';
}
type Freq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type EndMode = 'never' | 'count' | 'until';
type SpawnMode = 'generate' | 'reference';

const FREQ_OPTIONS = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'YEARLY', label: 'Yearly' },
];
const FREQ_UNIT: Record<Freq, string> = { DAILY: 'days', WEEKLY: 'weeks', MONTHLY: 'months', YEARLY: 'years' };

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
    return (
        <div className="grid gap-1.5">
            <span className="font-mono text-[11px] font-medium tracking-wide text-[var(--splice-ink-55)]">
                {label}
                {required ? <span className="text-[var(--splice-warn-deep)]"> *</span> : null}
            </span>
            {children}
            {error ? (
                <span role="alert" className="text-xs text-[var(--splice-warn-deep)]">
                    {error}
                </span>
            ) : hint ? (
                <span className="text-xs text-[var(--splice-ink-45)]">{hint}</span>
            ) : null}
        </div>
    );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
    return (
        <div className="grid gap-3 rounded-lg border border-[var(--splice-ink-10)] bg-background p-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.12em] text-[var(--splice-ink-45)] uppercase">
                {icon}
                {title}
            </div>
            {children}
        </div>
    );
}

/** A small segmented control (matches the Grid | Calendar tab styling). */
function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: ReactNode }[] }) {
    return (
        <div className="inline-flex overflow-hidden rounded-md border border-[var(--splice-ink-15)] text-xs">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    aria-pressed={value === o.value}
                    className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                        value === o.value
                            ? 'bg-foreground text-background'
                            : 'bg-background text-[var(--splice-ink-60)] hover:bg-[var(--splice-ink-05)]'
                    }`}
                >
                    {o.icon}
                    {o.label}
                </button>
            ))}
        </div>
    );
}

const dateInputClass =
    'rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary';

/** Render the injected content-picker slot, or a clear inline note if the host wired none. */
function ContentSlot(props: CellContentPickerProps & { render?: (props: CellContentPickerProps) => ReactNode }) {
    const { render, ...pickerProps } = props;
    if (render) return <>{render(pickerProps)}</>;
    return (
        <div className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
            No content picker wired — inject `renderContentPicker`.
        </div>
    );
}

export function CalendarCellForm({
    compositionId,
    initialCell,
    initialDate,
    onSaved,
}: {
    compositionId: string;
    initialCell?: CalendarCell | null;
    initialDate?: Date | null;
    onSaved: () => void;
}) {
    const { renderContentPicker, onError } = useCellFormServices();
    const notify = useCellNotify();
    const saveCell = useSaveCell(compositionId);

    const isEdit = Boolean(initialCell?.id);
    const slots = (initialCell?.slots ?? {}) as Record<string, unknown>;
    // A stored `kind` is the full schema-$id URL (…/kind/series) — match on its short suffix.
    const initialKind: Kind = String(slots.kind ?? '').split('/').pop() === 'series' ? 'series' : 'release';

    const isoDate = (d?: Date | null): string =>
        d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';

    // ── Available channels: emergent from the calendar's placed cells (PRD §2.1) + the default.
    // Hidden entirely when a calendar uses only one channel — the common case.
    const cells = useCompositionCells(compositionId);
    const channels = useMemo(() => {
        const set = new Set<string>(['default']);
        for (const cell of cells.data ?? []) {
            const ch = (cell.slots as Record<string, unknown> | undefined)?.channel;
            if (typeof ch === 'string' && ch) set.add(ch);
        }
        return [...set];
    }, [cells.data]);
    const showChannel = channels.length > 1;

    // The REAL Kind ids are full schema-$id URLs (…/kind/composition-ref), not the short label
    // the dropdown shows — the write path admits on the id, so the wire must carry it.
    const profiles = useCompositionProfiles();
    const calendarKinds = profiles.data?.find((p) => p.name === 'calendar')?.cellKinds ?? [];
    const kindId = (suffix: string): string =>
        calendarKinds.find((k) => k.kind.endsWith(`kind/${suffix}`))?.kind ?? suffix;

    // ── State ────────────────────────────────────────────────────────────────────
    const [kind, setKind] = useState<Kind>(initialKind);
    const [channel, setChannel] = useState<string>((slots.channel as string) ?? 'default');
    const [date, setDate] = useState<string>((slots.anchor as string) ?? isoDate(initialDate));

    // Release
    const [contentId, setContentId] = useState<string>((slots.composition_id as string) ?? '');
    const [contentTitle, setContentTitle] = useState<string>('');

    // Series
    const rule = (slots.rule ?? {}) as Record<string, unknown>;
    const spawn = (slots.spawn ?? {}) as Record<string, unknown>;
    const [freq, setFreq] = useState<Freq>(((rule.freq as Freq) ?? 'WEEKLY') as Freq);
    const [interval, setInterval] = useState<number>((rule.interval as number) ?? 1);
    const [endMode, setEndMode] = useState<EndMode>(rule.count ? 'count' : rule.until ? 'until' : 'never');
    const [count, setCount] = useState<number>((rule.count as number) ?? 10);
    const [until, setUntil] = useState<string>((rule.until as string) ?? '');
    const [spawnMode, setSpawnMode] = useState<SpawnMode>((spawn.mode as SpawnMode) ?? 'generate');
    const [instructions, setInstructions] = useState<string>((spawn.instructions as string) ?? '');
    const [refId, setRefId] = useState<string>((spawn.composition_id as string) ?? '');
    const [refTitle, setRefTitle] = useState<string>('');

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const saving = saveCell.isPending;

    function validate(): Record<string, string> {
        const e: Record<string, string> = {};
        if (!date) e.date = 'Pick a date.';
        if (kind === 'release' && !contentId) e.content = 'Choose the content to publish.';
        if (kind === 'series') {
            if (endMode === 'until' && !until) e.until = 'Pick an end date.';
            if (spawnMode === 'reference' && !refId) e.produces = 'Choose the content to re-surface.';
        }
        return e;
    }

    function buildSlots(): Record<string, unknown> {
        if (kind === 'release') {
            return { ...slots, kind: kindId('composition-ref'), composition_id: contentId, channel, anchor: date };
        }
        const ruleOut: Record<string, unknown> = { freq };
        if (interval > 1) ruleOut.interval = interval;
        if (endMode === 'count') ruleOut.count = count;
        if (endMode === 'until') ruleOut.until = until;
        const spawnOut: Record<string, unknown> =
            spawnMode === 'generate'
                ? { mode: 'generate', ...(instructions.trim() ? { instructions: instructions.trim() } : {}) }
                : { mode: 'reference', composition_id: refId };
        return { ...slots, kind: kindId('series'), channel, anchor: date, rule: ruleOut, spawn: spawnOut };
    }

    async function submit() {
        setFormError(null);
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length) return;

        try {
            await saveCell.mutateAsync({
                cellId: isEdit ? initialCell!.id : undefined,
                ...(isEdit ? {} : { lane: channel }),
                slots: buildSlots(),
            });
            notify({ kind: 'success', text: isEdit ? 'Saved.' : kind === 'series' ? 'Series scheduled.' : 'Release scheduled.' });
            onSaved();
        } catch (err: unknown) {
            const clientErr = err as CellClientError;
            const fieldErrors = clientErr?.fieldErrors;
            if (fieldErrors && Object.keys(fieldErrors).length) {
                // 422 field validation → map onto the fields.
                const mapped: Record<string, string> = {};
                for (const [key, msgs] of Object.entries(fieldErrors)) mapped[key.replace(/^slots\./, '')] = msgs[0];
                setErrors(mapped);
            } else {
                // Any other failure (e.g. an admission RuntimeException) → surface the server's own
                // message in a clear inline banner, not a raw 500 blob.
                setFormError(clientErr?.message ?? (err instanceof Error ? err.message : 'Could not save this item.'));
            }
            onError?.(err);
        }
    }

    return (
        <div className="space-y-4">
            {formError ? (
                <div
                    role="alert"
                    className="rounded-md border border-[var(--splice-danger)] bg-[var(--splice-danger-tint)] px-3 py-2 text-sm text-[var(--splice-danger)]"
                >
                    {formError}
                </div>
            ) : null}

            {/* What kind of schedule (create only; an existing cell keeps its kind). */}
            {!isEdit ? (
                <Segmented<Kind>
                    value={kind}
                    onChange={setKind}
                    options={[
                        { value: 'release', label: 'One-off', icon: <CalendarClock className="size-3.5" /> },
                        { value: 'series', label: 'Recurring', icon: <Repeat className="size-3.5" /> },
                    ]}
                />
            ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--splice-ink-15)] px-2.5 py-0.5 font-mono text-[10.5px] text-[var(--splice-ink-55)] uppercase">
                    {kind === 'series' ? <Repeat className="size-3" /> : <CalendarClock className="size-3" />}
                    {kind === 'series' ? 'Recurring series' : 'One-off release'}
                </div>
            )}

            {kind === 'release' ? (
                <div className="grid gap-4">
                    <Field label="Content" required hint="The published composition this release points to." error={errors.content}>
                        <ContentSlot
                            render={renderContentPicker}
                            value={contentId}
                            label={contentTitle}
                            excludeId={compositionId}
                            onSelect={(o) => {
                                setContentId(o.id);
                                setContentTitle(o.title);
                            }}
                        />
                    </Field>

                    {showChannel ? (
                        <Field label="Channel" hint="Which delivery lane this goes out on.">
                            <SimpleSelect
                                value={channel}
                                onValueChange={setChannel}
                                options={channels.map((c) => ({ value: c, label: c }))}
                            />
                        </Field>
                    ) : null}

                    <Field label="Date" required error={errors.date}>
                        <input type="date" className={dateInputClass} value={date} onChange={(e) => setDate(e.target.value)} />
                    </Field>
                </div>
            ) : (
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Starts on" required error={errors.date}>
                            <input type="date" className={dateInputClass} value={date} onChange={(e) => setDate(e.target.value)} />
                        </Field>
                        {showChannel ? (
                            <Field label="Channel">
                                <SimpleSelect value={channel} onValueChange={setChannel} options={channels.map((c) => ({ value: c, label: c }))} />
                            </Field>
                        ) : null}
                    </div>

                    <Section icon={<Repeat className="size-3" />} title="Repeats">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-[var(--splice-ink-55)]">Every</span>
                            <input
                                type="number"
                                min={1}
                                value={interval}
                                onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))}
                                className={`${dateInputClass} w-16`}
                                aria-label="Interval"
                            />
                            <div className="min-w-[120px]">
                                <SimpleSelect value={freq} onValueChange={(v) => setFreq(v as Freq)} options={FREQ_OPTIONS} />
                            </div>
                            <span className="text-[var(--splice-ink-45)]">({FREQ_UNIT[freq]})</span>
                        </div>

                        <div className="grid gap-2">
                            <span className="font-mono text-[11px] text-[var(--splice-ink-55)]">Ends</span>
                            <Segmented<EndMode>
                                value={endMode}
                                onChange={setEndMode}
                                options={[
                                    { value: 'never', label: 'Never' },
                                    { value: 'count', label: 'After…' },
                                    { value: 'until', label: 'On date' },
                                ]}
                            />
                            {endMode === 'count' ? (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-[var(--splice-ink-55)]">After</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={count}
                                        onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                                        className={`${dateInputClass} w-20`}
                                        aria-label="Occurrence count"
                                    />
                                    <span className="text-[var(--splice-ink-45)]">occurrences</span>
                                </div>
                            ) : null}
                            {endMode === 'until' ? (
                                <div className="grid gap-1">
                                    <input type="date" className={dateInputClass} value={until} onChange={(e) => setUntil(e.target.value)} aria-label="End date" />
                                    {errors.until ? <span role="alert" className="text-xs text-[var(--splice-warn-deep)]">{errors.until}</span> : null}
                                </div>
                            ) : null}
                        </div>
                    </Section>

                    <Section icon={<Sparkles className="size-3" />} title="Each occurrence">
                        <Segmented<SpawnMode>
                            value={spawnMode}
                            onChange={setSpawnMode}
                            options={[
                                { value: 'generate', label: 'Generate new' },
                                { value: 'reference', label: 'Re-surface existing' },
                            ]}
                        />
                        {spawnMode === 'generate' ? (
                            <Field label="Instructions" hint="Optional — what each generated occurrence should produce.">
                                <Textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. Draft the weekly product digest" />
                            </Field>
                        ) : (
                            <Field label="Content" required hint="The fixed composition each occurrence re-surfaces." error={errors.produces}>
                                <ContentSlot
                                    render={renderContentPicker}
                                    value={refId}
                                    label={refTitle}
                                    excludeId={compositionId}
                                    onSelect={(o) => {
                                        setRefId(o.id);
                                        setRefTitle(o.title);
                                    }}
                                />
                            </Field>
                        )}
                    </Section>
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={submit} disabled={saving}>
                    {saving ? <Loader2 className="animate-spin" /> : null}
                    {isEdit ? 'Save' : kind === 'series' ? 'Schedule series' : 'Schedule release'}
                </Button>
            </div>
        </div>
    );
}
