import { type ReactNode, useMemo, useState } from 'react';
import { SimpleSelect } from '@schemastud/ui';
import type { WorkflowVersionData } from '@splicewire/_resources/types/workflows';
import { toDraft } from './blueprint';
import {
    type BlueprintDiff,
    diffBlueprints,
    isEmptyDiff,
    type TransitionDelta,
} from './workflowDelta';

type Version = WorkflowVersionData;

/**
 * A read-only structural diff of two workflow DEFINITION versions (beam-workflows-ux ticket 19,
 * Surface 2). Pick a `from` and a `to` from the lineage's versions → places ± and per-transition
 * guard/effect ~. Definition shape only — never record content, never the `$ref` graph (ref-blind,
 * ticket 06). Low blast radius (read-only); the place delta it surfaces is the migration wizard's
 * old→new mapping input (ticket 20).
 */
export function WorkflowDiff({
    versions,
    lineageKey,
}: {
    versions: Version[];
    lineageKey: string;
}) {
    const ordered = useMemo(() => [...versions].sort((a, b) => a.version - b.version), [versions]);
    const [fromId, setFromId] = useState(() => ordered.at(-2)?.id ?? ordered[0]?.id ?? '');
    const [toId, setToId] = useState(() => ordered.at(-1)?.id ?? '');

    const diff = useMemo<BlueprintDiff | null>(() => {
        const from = ordered.find((v) => v.id === fromId);
        const to = ordered.find((v) => v.id === toId);
        if (!from || !to) return null;

        return diffBlueprints(
            toDraft({ ...from.blueprint, name: from.blueprint.name ?? lineageKey }),
            toDraft({ ...to.blueprint, name: to.blueprint.name ?? lineageKey }),
        );
    }, [ordered, fromId, toId, lineageKey]);

    if (ordered.length < 2) return null;

    const options = ordered.map((v) => ({ value: v.id, label: `v${v.version}` }));

    return (
        <div className="mb-4 space-y-3 rounded-md border border-[var(--beam-ink-08)] p-3">
            <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-[11px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase">
                    Compare
                </span>
                <SimpleSelect
                    className="w-24"
                    aria-label="Diff from version"
                    value={fromId}
                    onValueChange={setFromId}
                    options={options}
                />
                <span className="text-[var(--beam-ink-45)]">→</span>
                <SimpleSelect
                    className="w-24"
                    aria-label="Diff to version"
                    value={toId}
                    onValueChange={setToId}
                    options={options}
                />
            </div>

            {diff && isEmptyDiff(diff) ? (
                <p className="text-xs text-[var(--beam-ink-50)]">
                    No structural changes between these versions.
                </p>
            ) : (
                diff && (
                    <div className="space-y-3 font-mono text-[12px]">
                        {(diff.places.added.length > 0 || diff.places.removed.length > 0) && (
                            <section className="space-y-0.5">
                                <div className="text-[10px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase">
                                    Places
                                </div>
                                {diff.places.added.map((p) => (
                                    <Line key={`+${p}`} kind="added">
                                        + {p}
                                    </Line>
                                ))}
                                {diff.places.removed.map((p) => (
                                    <Line key={`-${p}`} kind="removed">
                                        - {p}
                                    </Line>
                                ))}
                            </section>
                        )}

                        {diff.transitions.length > 0 && (
                            <section className="space-y-1">
                                <div className="text-[10px] tracking-[0.12em] text-[var(--beam-ink-45)] uppercase">
                                    Transitions
                                </div>
                                {diff.transitions.map((d) => (
                                    <TransitionRow key={d.key} delta={d} />
                                ))}
                            </section>
                        )}
                    </div>
                )
            )}

            <div className="flex gap-3 text-[10px] text-[var(--beam-ink-45)]">
                <span>
                    <Mark kind="added">+</Mark> added
                </span>
                <span>
                    <Mark kind="removed">-</Mark> removed
                </span>
                <span>
                    <Mark kind="changed">~</Mark> changed
                </span>
            </div>
        </div>
    );
}

function TransitionRow({ delta }: { delta: TransitionDelta }) {
    const route = `${delta.from.join(',') || '∅'} → ${delta.to.join(',') || '∅'}`;
    const sign = delta.status === 'added' ? '+' : delta.status === 'removed' ? '-' : '~';
    const kind = delta.status;

    return (
        <div className="space-y-0.5">
            <Line kind={kind}>
                {sign} {delta.name} <span className="text-[var(--beam-ink-45)]">{route}</span>
            </Line>
            {delta.guard && (
                <div className="pl-4 text-[var(--beam-ink-60)]">
                    guard {delta.guard.from ?? '∅'} → {delta.guard.to ?? '∅'}
                </div>
            )}
            {delta.effects &&
                delta.effects.added.map((e) => (
                    <div key={`+${e}`} className="pl-4">
                        <Mark kind="added">effect +</Mark> {e}
                    </div>
                ))}
            {delta.effects &&
                delta.effects.removed.map((e) => (
                    <div key={`-${e}`} className="pl-4">
                        <Mark kind="removed">effect -</Mark> {e}
                    </div>
                ))}
        </div>
    );
}

const KIND_CLASS = {
    added: 'text-[var(--beam-green)]',
    removed: 'text-destructive',
    changed: 'text-[var(--beam-amber)]',
} as const;

function Line({ kind, children }: { kind: keyof typeof KIND_CLASS; children: ReactNode }) {
    return <div className={KIND_CLASS[kind]}>{children}</div>;
}

function Mark({ kind, children }: { kind: keyof typeof KIND_CLASS; children: ReactNode }) {
    return <span className={KIND_CLASS[kind]}>{children}</span>;
}
