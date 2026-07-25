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
import type { WorkflowVersionData } from '@splicewire/_resources/types/workflows';
import { toDraft } from './blueprint';
import { useNotify, useWorkflowsServices } from './provider';
import { errorMessage } from './utils';
import { WorkflowGraph } from './WorkflowGraph';

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
    const blocked = report ? blockedHeadline(report) : null;

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
            if (data.applied) {
                notify({
                    type: 'success',
                    message: `Migrated ${data.migrated} record(s) onto the target version.`,
                });
            } else if (dryRun && data.unmappable.length === 0) {
                notify({
                    type: 'success',
                    message: `Dry run: ${data.migrated} record(s) would migrate.`,
                });
            }
        } catch (error) {
            notify({ type: 'error', message: errorMessage(error, 'Migration failed') });
            onError?.(error);
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="mb-4 space-y-3 rounded-md border border-[var(--beam-amber)]/30 bg-[var(--beam-amber)]/5 p-3">
            <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-[11px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase">
                    Migrate records
                </span>
                <SimpleSelect
                    className="w-24"
                    aria-label="Migrate from version"
                    value={fromId}
                    onValueChange={setFromId}
                    options={ordered.map((v) => ({ value: v.id, label: `v${v.version}` }))}
                />
                <span className="text-[var(--beam-ink-45)]">→</span>
                <SimpleSelect
                    className="w-24"
                    aria-label="Migrate to version"
                    value={toId}
                    onValueChange={setToId}
                    options={ordered.map((v) => ({ value: v.id, label: `v${v.version}` }))}
                />
            </div>

            <p className="text-xs text-[var(--beam-ink-50)]">
                Re-pins records currently on the <b>from</b> version onto the <b>to</b> version.
                This touches only records directly on this workflow — not any <code>$ref</code>'d
                children (those are a separate cohort). The whole run is all-or-nothing.
            </p>

            {/* Before / after — the read-only graph reused as the migration render. */}
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <div className="mb-1 font-mono text-[10px] text-[var(--beam-ink-45)] uppercase">
                        From
                    </div>
                    <WorkflowGraph blueprint={fromDraft} />
                </div>
                <div>
                    <div className="mb-1 font-mono text-[10px] text-[var(--beam-ink-45)] uppercase">
                        To
                    </div>
                    <WorkflowGraph blueprint={toDraftBp} />
                </div>
            </div>

            {/* Explicit old→new place mapping — each a reviewable author choice. */}
            <div className="space-y-1.5">
                <div className="font-mono text-[10px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase">
                    Place mapping
                </div>
                {fromDraft.places.map((place) => (
                    <div key={place} className="flex items-center gap-2 text-sm">
                        <span className="w-40 font-mono text-[var(--beam-ink-60)]">{place}</span>
                        <span className="text-[var(--beam-ink-45)]">→</span>
                        <SimpleSelect
                            className="w-48"
                            aria-label={`Map ${place} to`}
                            value={map[place] ?? ''}
                            onValueChange={(value) => {
                                setMap((m) => ({ ...m, [place]: value }));
                                setReport(null);
                            }}
                            options={[
                                { value: '', label: '— choose —' },
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
                                    {u.id} — unmapped place “{u.place}”
                                </li>
                            ))}
                            {report.unmappable.length > 8 && (
                                <li>…and {report.unmappable.length - 8} more</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
            {report && !blocked && (
                <div className="rounded-md border border-[var(--beam-green)]/30 bg-[var(--beam-green)]/5 p-2 text-sm text-[var(--beam-ink-70)]">
                    {report.applied
                        ? `Migrated ${report.migrated} of ${report.total} record(s).`
                        : `Dry run: all ${report.total} record(s) map cleanly and would migrate.`}
                </div>
            )}

            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={running || sameVersion || !complete}
                    onClick={() => run(true)}
                >
                    {running ? 'Checking…' : 'Preview (dry run)'}
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
                    Migrate records
                </Button>
            </div>
        </div>
    );
}
