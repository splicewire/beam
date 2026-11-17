import { TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button, SimpleSelect } from '@schemastud/ui';
import {
    blockedHeadline,
    initialPlaceMap,
    mapComplete,
    type MigrationReport,
    type PlaceMap,
    resolvedMap,
} from './migratePlan';
import type { WorkflowVersionData } from '@splicewire/beam-resources/types/workflows';
import { toDraft } from './blueprint';
import { useNotify, useWorkflowsServices } from './provider';
import { errorMessage } from './utils';
import { WorkflowGraph } from './WorkflowGraph';
import { useBeamWorkflowsMessages } from './messages';
import { richMessage } from './rich-message';

type Version = WorkflowVersionData;

/**
 * The marking-migration wizard (beam-workflows-ux ticket 20, Surface 3) — the UI over the artisan-only
 * `MarkingMigrator`, the map's HIGHEST blast radius (a bulk write to live records' workflow state). It
 * foregrounds the two hard constraints: **(a)** all-or-nothing ("N blocked all M" reads unmistakably)
 * and **(b)** each old→new place mapping is an explicit author choice. Flow: pick from/to → map places
 * → dry-run → actuate. Before/after reuse the read-only {@see WorkflowGraph} (ticket 18).
 *
 * FLAT per-type cohort (ticket 06): this migrates only records directly on this workflow — a
 * composition's `$ref`'d children are a separate cohort on a separate lineage, invisible here.
 */
export function WorkflowMigrate({
    versions,
    lineageKey,
}: {
    versions: Version[];
    lineageKey: string;
}) {
    const ordered = useMemo(() => [...versions].sort((a, b) => a.version - b.version), [versions]);
    const [fromId, setFromId] = useState(() => ordered[0]?.id ?? '');
    const [toId, setToId] = useState(() => ordered.at(-1)?.id ?? '');
    const [map, setMap] = useState<PlaceMap>({});
    const m = useBeamWorkflowsMessages();
    const [report, setReport] = useState<MigrationReport | null>(null);
    const [running, setRunning] = useState(false);

    const { client, onError } = useWorkflowsServices();
    const notify = useNotify();

    const from = ordered.find((v) => v.id === fromId);
    const to = ordered.find((v) => v.id === toId);

    const fromDraft = useMemo(
        () =>
            from ? toDraft({ ...from.blueprint, name: from.blueprint.name ?? lineageKey }) : null,
        [from, lineageKey],
    );
    const toDraftBp = useMemo(
        () => (to ? toDraft({ ...to.blueprint, name: to.blueprint.name ?? lineageKey }) : null),
        [to, lineageKey],
    );

    // Re-seed the place map (and drop a stale report) whenever the version pair changes.
    useEffect(() => {
        if (fromDraft && toDraftBp) {
            setMap(initialPlaceMap(fromDraft.places, toDraftBp.places));
            setReport(null);
        }
    }, [fromDraft, toDraftBp]);

    if (ordered.length < 2 || !fromDraft || !toDraftBp) return null;

    const sameVersion = fromId === toId;
    const complete = mapComplete(map);
    const blocked = report ? blockedHeadline(report, m) : null;

    async function run(dryRun: boolean) {
        setRunning(true);
        try {
            const data = await client.migrate(lineageKey, {
                from: fromId,
                to: toId,
                map: resolvedMap(map),
                dryRun,
            });
            setReport(data);
            // Toasts are events handed to the host as they fire, so they are translated now. "record(s)" was never
            // pluralised; both plural forms keep it in English, and a translator gets both slots.
            if (data.applied) {
                notify({
                    type: 'success',
                    message: m.choice('splicewire-beam-workflows::messages.migrate_applied_toast', data.migrated),
                });
            } else if (dryRun && data.unmappable.length === 0) {
                notify({
                    type: 'success',
                    message: m.choice('splicewire-beam-workflows::messages.migrate_dry_run_toast', data.migrated),
                });
            }
        } catch (error) {
            // The server's message renders as it arrived; our line only when it sent none.
            notify({ type: 'error', message: errorMessage(error, m.t('splicewire-beam-workflows::messages.migrate_failed')) });
            onError?.(error);
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="mb-4 space-y-3 rounded-md border border-[var(--beam-amber)]/30 bg-[var(--beam-amber)]/5 p-3">
            <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-[11px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase">
                    {m.t('splicewire-beam-workflows::messages.migrate_records')}
                </span>
                <SimpleSelect
                    className="w-24"
                    aria-label={m.t('splicewire-beam-workflows::messages.migrate_from_version')}
                    value={fromId}
                    onValueChange={setFromId}
                    options={ordered.map((v) => ({ value: v.id, label: m.t('splicewire-beam-workflows::messages.version_label', { version: v.version }) }))}
                />
                <span className="text-[var(--beam-ink-45)]">→</span>
                <SimpleSelect
                    className="w-24"
                    aria-label={m.t('splicewire-beam-workflows::messages.migrate_to_version')}
                    value={toId}
                    onValueChange={setToId}
                    options={ordered.map((v) => ({ value: v.id, label: m.t('splicewire-beam-workflows::messages.version_label', { version: v.version }) }))}
                />
            </div>

            {/* One sentence (JSX whitespace collapsed); the bold words are copy, `$ref` is code. */}
            <p className="text-xs text-[var(--beam-ink-50)]">
                {richMessage(m, 'splicewire-beam-workflows::messages.migrate_explainer', {
                    from: <b>{m.t('splicewire-beam-workflows::messages.migrate_word_from')}</b>,
                    to: <b>{m.t('splicewire-beam-workflows::messages.migrate_word_to')}</b>,
                    ref: <code>$ref</code>,
                })}
            </p>

            {/* Before / after — the read-only graph reused as the migration render. Stacked, not side by
                side: each graph renders at a fixed legible zoom, so a half-width pane showed barely two
                places, and stacking lines up the places the versions share in the same column. */}
            <div className="grid gap-3">
                <div className="min-w-0">
                    <div className="mb-1 font-mono text-[10px] text-[var(--beam-ink-45)] uppercase">
                        {m.t('splicewire-beam-workflows::messages.from')}
                    </div>
                    <WorkflowGraph blueprint={fromDraft} />
                </div>
                <div className="min-w-0">
                    <div className="mb-1 font-mono text-[10px] text-[var(--beam-ink-45)] uppercase">
                        {m.t('splicewire-beam-workflows::messages.to')}
                    </div>
                    <WorkflowGraph blueprint={toDraftBp} />
                </div>
            </div>

            {/* Explicit old→new place mapping — each a reviewable author choice. */}
            <div className="space-y-1.5">
                <div className="font-mono text-[10px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase">
                    {m.t('splicewire-beam-workflows::messages.migrate_place_mapping')}
                </div>
                {fromDraft.places.map((place) => (
                    <div key={place} className="flex items-center gap-2 text-sm">
                        <span className="w-40 font-mono text-[var(--beam-ink-60)]">{place}</span>
                        <span className="text-[var(--beam-ink-45)]">→</span>
                        <SimpleSelect
                            className="w-48"
                            aria-label={m.t('splicewire-beam-workflows::messages.migrate_map_place', { place })}
                            value={map[place] ?? ''}
                            onValueChange={(value) => {
                                setMap((current) => ({ ...current, [place]: value }));
                                setReport(null);
                            }}
                            options={[
                                { value: '', label: m.t('splicewire-beam-workflows::messages.migrate_choose') },
                                ...toDraftBp.places.map((p) => ({ value: p, label: p })),
                            ]}
                        />
                    </div>
                ))}
            </div>

            {/* All-or-nothing report — the blocked headline reads unmistakably. */}
            {report && blocked && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <div>
                        <div className="font-medium">{blocked}</div>
                        <ul className="mt-1 font-mono text-xs">
                            {report.unmappable.slice(0, 8).map((u) => (
                                <li key={u.id}>
                                    {m.t('splicewire-beam-workflows::messages.migrate_unmapped', { id: u.id, place: u.place })}
                                </li>
                            ))}
                            {report.unmappable.length > 8 && (
                                <li>{m.t('splicewire-beam-workflows::messages.migrate_and_more', { count: report.unmappable.length - 8 })}</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
            {report && !blocked && (
                <div className="rounded-md border border-[var(--beam-green)]/30 bg-[var(--beam-green)]/5 p-2 text-sm text-[var(--beam-ink-70)]">
                    {report.applied
                        ? m.choice('splicewire-beam-workflows::messages.migrate_applied_summary', report.total, { migrated: report.migrated })
                        : m.choice('splicewire-beam-workflows::messages.migrate_dry_run_summary', report.total)}
                </div>
            )}

            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={running || sameVersion || !complete}
                    onClick={() => run(true)}
                >
                    {m.t(running ? 'splicewire-beam-workflows::messages.migrate_checking' : 'splicewire-beam-workflows::messages.migrate_preview')}
                </Button>
                <Button
                    size="sm"
                    disabled={
                        running ||
                        sameVersion ||
                        !complete ||
                        !report ||
                        blocked !== null ||
                        report.applied
                    }
                    onClick={() => run(false)}
                >
                    {m.t('splicewire-beam-workflows::messages.migrate_records')}
                </Button>
            </div>
        </div>
    );
}
