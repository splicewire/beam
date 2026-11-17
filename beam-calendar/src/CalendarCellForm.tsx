import { Button, SimpleSelect, Textarea } from '@schemastud/ui';
import { CalendarClock, Loader2, Repeat, Sparkles } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useCellNotify, useCellFormServices } from './cell-provider';
import { useCompositionCells, useCompositionProfiles, useSaveCell } from './cell-hooks';
import type { CalendarCell, CellClientError, CellContentPickerProps } from './cell-types';
import { notice, say, type Notice } from './message-descriptor';
import { useBeamCalendarMessages, type BeamCalendarMessageKey } from './messages';

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
 * The last segment of a declared Kind id, separator-agnostic. Tower declares calendar Kinds as DOTTED
 * ids (`kind.series`, `kind.composition-ref`) since registry-kernel 58 D4; before it they were schema-$id
 * URLs (`…/kind/series`). Both read `series`. ONE helper drives BOTH the read (initialKind) and write
 * (kindId) paths below so they can never drift onto one separator again — the host's own
 * `calendar/services.ts` kindSegment does the same (J3, launch-00 item 1).
 */
const kindSuffix = (id: unknown): string => String(id ?? '').split(/[/.]/).pop() ?? '';

// NOTE (frame-canonical-forms ticket 03): the old `isFriendlyCalendarKind` predicate lived here
// and was re-exported so app surfaces could branch `if (friendly) <bespoke> else <generic>`. It is
// GONE — which kinds get the bespoke form is now decided by the `@schemastud/frame` form resolver
// the host registers this component against (kind `series` / `composition-ref` → this form), never a
// hardcoded predicate. The next bespoke whole-form is a `registerFormForSchema`, not another branch.

type Freq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type EndMode = 'never' | 'count' | 'until';
type SpawnMode = 'generate' | 'reference';

// Catalog keys, translated where they render (localization 30), never English stored in module data.
const FREQ_OPTIONS: { value: Freq; labelKey: BeamCalendarMessageKey }[] = [
    { value: 'DAILY', labelKey: 'splicewire-beam-calendar::messages.form_freq_daily' },
    { value: 'WEEKLY', labelKey: 'splicewire-beam-calendar::messages.form_freq_weekly' },
    { value: 'MONTHLY', labelKey: 'splicewire-beam-calendar::messages.form_freq_monthly' },
    { value: 'YEARLY', labelKey: 'splicewire-beam-calendar::messages.form_freq_yearly' },
];
const FREQ_UNIT: Record<Freq, BeamCalendarMessageKey> = {
    DAILY: 'splicewire-beam-calendar::messages.form_unit_days',
    WEEKLY: 'splicewire-beam-calendar::messages.form_unit_weeks',
    MONTHLY: 'splicewire-beam-calendar::messages.form_unit_months',
    YEARLY: 'splicewire-beam-calendar::messages.form_unit_years',
};

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
    return (
        <div className="grid gap-1.5">
            <span className="font-mono text-[11px] font-medium tracking-wide text-[var(--beam-ink-55)]">
                {label}
                {required ? <span className="text-[var(--beam-warn-deep)]"> *</span> : null}
            </span>
            {children}
            {error ? (
                <span role="alert" className="text-xs text-[var(--beam-warn-deep)]">
                    {error}
                </span>
            ) : hint ? (
                <span className="text-xs text-[var(--beam-ink-45)]">{hint}</span>
            ) : null}
        </div>
    );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
    return (
        <div className="grid gap-3 rounded-lg border border-[var(--beam-ink-10)] bg-background p-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.12em] text-[var(--beam-ink-45)] uppercase">
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
        <div className="inline-flex overflow-hidden rounded-md border border-[var(--beam-ink-15)] text-xs">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    aria-pressed={value === o.value}
                    className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                        value === o.value
                            ? 'bg-foreground text-background'
                            : 'bg-background text-[var(--beam-ink-60)] hover:bg-[var(--beam-ink-05)]'
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
    const m = useBeamCalendarMessages();
    if (render) return <>{render(pickerProps)}</>;
    // Read by whoever opens a development build, not only its author (beam-ux's AuthorNote precedent), so it is catalogued;
    // the prop name stays code, passed into the sentence as a parameter.
    return (
        <div className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
            {m.t('splicewire-beam-calendar::messages.form_no_content_picker', { prop: 'renderContentPicker' })}
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
    const m = useBeamCalendarMessages();
    const saveCell = useSaveCell(compositionId);

    const isEdit = Boolean(initialCell?.id);
    const slots = (initialCell?.slots ?? {}) as Record<string, unknown>;
    // A stored `kind` is a declared Kind id (dotted `kind.series` today, or a legacy `…/kind/series` URL)
    // — recognize Series by its short suffix via the shared, separator-agnostic `kindSuffix`.
    const initialKind: Kind = kindSuffix(slots.kind) === 'series' ? 'series' : 'release';

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

    // The REAL Kind ids are the declared ids (dotted `kind.composition-ref` today, or a legacy
    // `…/kind/composition-ref` URL), not the short label the dropdown shows — the write path admits on
    // the id, so the wire must carry it. Match on the shared, separator-agnostic suffix (not a `/`-only
    // `endsWith`), so a dotted id resolves; fall back to the bare suffix only if the profile lacks it.
    const profiles = useCompositionProfiles();
    const calendarKinds = profiles.data?.find((p) => p.name === 'calendar')?.cellKinds ?? [];
    const kindId = (suffix: string): string =>
        calendarKinds.find((k) => kindSuffix(k.kind) === suffix)?.kind ?? suffix;

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

    // Field and form errors are stored as notices (a catalog key, or the server's own message as it arrived) and
    // translated where they render, so a live locale switch re-renders them.
    const [errors, setErrors] = useState<Record<string, Notice>>({});
    const [formError, setFormError] = useState<Notice | null>(null);
    const saving = saveCell.isPending;
    const fieldError = (field: string): string | undefined => (errors[field] ? say(m, errors[field]) : undefined);

    function validate(): Record<string, Notice> {
        const e: Record<string, Notice> = {};
        if (!date) e.date = notice('splicewire-beam-calendar::messages.form_error_date');
        if (kind === 'release' && !contentId) e.content = notice('splicewire-beam-calendar::messages.form_error_content');
        if (kind === 'series') {
            if (endMode === 'until' && !until) e.until = notice('splicewire-beam-calendar::messages.form_error_until');
            if (spawnMode === 'reference' && !refId) e.produces = notice('splicewire-beam-calendar::messages.form_error_produces');
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
            // The toast is an event handed to the host as it fires, not state this form keeps, so it is translated now.
            notify({
                kind: 'success',
                text: m.t(
                    isEdit
                        ? 'splicewire-beam-calendar::messages.form_saved'
                        : kind === 'series'
                          ? 'splicewire-beam-calendar::messages.form_series_scheduled'
                          : 'splicewire-beam-calendar::messages.form_release_scheduled',
                ),
            });
            onSaved();
        } catch (err: unknown) {
            const clientErr = err as CellClientError;
            const fieldErrors = clientErr?.fieldErrors;
            if (fieldErrors && Object.keys(fieldErrors).length) {
                // 422 field validation → map onto the fields. The server's messages render as they arrived.
                const mapped: Record<string, Notice> = {};
                for (const [key, msgs] of Object.entries(fieldErrors)) mapped[key.replace(/^slots\./, '')] = msgs[0];
                setErrors(mapped);
            } else {
                // Any other failure (e.g. an admission RuntimeException) → surface the server's own
                // message in a clear inline banner, not a raw 500 blob; the catalog line only when none came.
                setFormError(
                    clientErr?.message ?? (err instanceof Error ? err.message : notice('splicewire-beam-calendar::messages.form_save_failed')),
                );
            }
            onError?.(err);
        }
    }

    return (
        <div className="space-y-4">
            {formError ? (
                <div
                    role="alert"
                    className="rounded-md border border-[var(--beam-danger)] bg-[var(--beam-danger-tint)] px-3 py-2 text-sm text-[var(--beam-danger)]"
                >
                    {say(m, formError)}
                </div>
            ) : null}

            {/* What kind of schedule (create only; an existing cell keeps its kind). */}
            {!isEdit ? (
                <Segmented<Kind>
                    value={kind}
                    onChange={setKind}
                    options={[
                        { value: 'release', label: m.t('splicewire-beam-calendar::messages.form_kind_one_off'), icon: <CalendarClock className="size-3.5" /> },
                        { value: 'series', label: m.t('splicewire-beam-calendar::messages.form_kind_recurring'), icon: <Repeat className="size-3.5" /> },
                    ]}
                />
            ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--beam-ink-15)] px-2.5 py-0.5 font-mono text-[10.5px] text-[var(--beam-ink-55)] uppercase">
                    {kind === 'series' ? <Repeat className="size-3" /> : <CalendarClock className="size-3" />}
                    {m.t(kind === 'series' ? 'splicewire-beam-calendar::messages.form_badge_series' : 'splicewire-beam-calendar::messages.form_badge_release')}
                </div>
            )}

            {kind === 'release' ? (
                <div className="grid gap-4">
                    <Field
                        label={m.t('splicewire-beam-calendar::messages.form_content')}
                        required
                        hint={m.t('splicewire-beam-calendar::messages.form_content_hint_release')}
                        error={fieldError('content')}
                    >
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
                        <Field label={m.t('splicewire-beam-calendar::messages.form_channel')} hint={m.t('splicewire-beam-calendar::messages.form_channel_hint')}>
                            <SimpleSelect
                                value={channel}
                                onValueChange={setChannel}
                                options={channels.map((c) => ({ value: c, label: c }))}
                            />
                        </Field>
                    ) : null}

                    <Field label={m.t('splicewire-beam-calendar::messages.form_date')} required error={fieldError('date')}>
                        <input type="date" className={dateInputClass} value={date} onChange={(e) => setDate(e.target.value)} />
                    </Field>
                </div>
            ) : (
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={m.t('splicewire-beam-calendar::messages.form_starts_on')} required error={fieldError('date')}>
                            <input type="date" className={dateInputClass} value={date} onChange={(e) => setDate(e.target.value)} />
                        </Field>
                        {showChannel ? (
                            <Field label={m.t('splicewire-beam-calendar::messages.form_channel')}>
                                <SimpleSelect value={channel} onValueChange={setChannel} options={channels.map((c) => ({ value: c, label: c }))} />
                            </Field>
                        ) : null}
                    </div>

                    <Section icon={<Repeat className="size-3" />} title={m.t('splicewire-beam-calendar::messages.form_repeats')}>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-[var(--beam-ink-55)]">{m.t('splicewire-beam-calendar::messages.form_every')}</span>
                            <input
                                type="number"
                                min={1}
                                value={interval}
                                onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))}
                                className={`${dateInputClass} w-16`}
                                aria-label={m.t('splicewire-beam-calendar::messages.form_interval')}
                            />
                            <div className="min-w-[120px]">
                                <SimpleSelect
                                    value={freq}
                                    onValueChange={(v) => setFreq(v as Freq)}
                                    options={FREQ_OPTIONS.map((o) => ({ value: o.value, label: m.t(o.labelKey) }))}
                                />
                            </div>
                            {/* A stored rule's freq outside the four renders an empty unit, as before (`FREQ_UNIT[freq]` was undefined). */}
                            <span className="text-[var(--beam-ink-45)]">({Object.hasOwn(FREQ_UNIT, freq) ? m.t(FREQ_UNIT[freq]) : null})</span>
                        </div>

                        <div className="grid gap-2">
                            <span className="font-mono text-[11px] text-[var(--beam-ink-55)]">{m.t('splicewire-beam-calendar::messages.form_ends')}</span>
                            <Segmented<EndMode>
                                value={endMode}
                                onChange={setEndMode}
                                options={[
                                    { value: 'never', label: m.t('splicewire-beam-calendar::messages.form_ends_never') },
                                    { value: 'count', label: m.t('splicewire-beam-calendar::messages.form_ends_after') },
                                    { value: 'until', label: m.t('splicewire-beam-calendar::messages.form_ends_on_date') },
                                ]}
                            />
                            {endMode === 'count' ? (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-[var(--beam-ink-55)]">{m.t('splicewire-beam-calendar::messages.form_after')}</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={count}
                                        onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                                        className={`${dateInputClass} w-20`}
                                        aria-label={m.t('splicewire-beam-calendar::messages.form_occurrence_count')}
                                    />
                                    <span className="text-[var(--beam-ink-45)]">{m.t('splicewire-beam-calendar::messages.form_occurrences')}</span>
                                </div>
                            ) : null}
                            {endMode === 'until' ? (
                                <div className="grid gap-1">
                                    <input
                                        type="date"
                                        className={dateInputClass}
                                        value={until}
                                        onChange={(e) => setUntil(e.target.value)}
                                        aria-label={m.t('splicewire-beam-calendar::messages.form_end_date')}
                                    />
                                    {errors.until ? <span role="alert" className="text-xs text-[var(--beam-warn-deep)]">{fieldError('until')}</span> : null}
                                </div>
                            ) : null}
                        </div>
                    </Section>

                    <Section icon={<Sparkles className="size-3" />} title={m.t('splicewire-beam-calendar::messages.form_each_occurrence')}>
                        <Segmented<SpawnMode>
                            value={spawnMode}
                            onChange={setSpawnMode}
                            options={[
                                { value: 'generate', label: m.t('splicewire-beam-calendar::messages.form_spawn_generate') },
                                { value: 'reference', label: m.t('splicewire-beam-calendar::messages.form_spawn_reference') },
                            ]}
                        />
                        {spawnMode === 'generate' ? (
                            <Field
                                label={m.t('splicewire-beam-calendar::messages.form_instructions')}
                                hint={m.t('splicewire-beam-calendar::messages.form_instructions_hint')}
                            >
                                <Textarea
                                    rows={3}
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    placeholder={m.t('splicewire-beam-calendar::messages.form_instructions_placeholder')}
                                />
                            </Field>
                        ) : (
                            <Field
                                label={m.t('splicewire-beam-calendar::messages.form_content')}
                                required
                                hint={m.t('splicewire-beam-calendar::messages.form_content_hint_series')}
                                error={fieldError('produces')}
                            >
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
                    {m.t(
                        isEdit
                            ? 'splicewire-beam-calendar::messages.form_save'
                            : kind === 'series'
                              ? 'splicewire-beam-calendar::messages.form_schedule_series'
                              : 'splicewire-beam-calendar::messages.form_schedule_release',
                    )}
                </Button>
            </div>
        </div>
    );
}
