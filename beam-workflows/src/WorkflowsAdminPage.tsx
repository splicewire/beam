import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
    cn,
} from '@schemastud/ui';
import type {
    WorkflowLineageData,
    WorkflowTypeOptionData,
} from '@splicewire/_resources/types/workflows';
import { toDraft, type BlueprintDraft, type GuardCatalogEntry } from './blueprint';
import { useNotify, useWorkflowsServices } from './provider';
import { errorMessage } from './utils';
import { WorkflowDiff } from './WorkflowDiff';
import { WorkflowEditor } from './WorkflowEditor';
import { WorkflowMigrate } from './WorkflowMigrate';

/**
 * The Workflows admin home (beam-workflows v2 ticket 09) + the `<WorkflowEditor>` host (ticket 08).
 * Lists every definition lineage, its versions + active pointer, and the types bound to it; opening
 * a lineage loads its active version into the schema-form editor. Saving forks a new immutable
 * version server-side (existing pins untouched).
 *
 * The per-type binding control (ticket 09) is rendered per lineage: enable = bind a type to this
 * lineage; disable = unbind (the type falls back to unmanaged; live objects keep their pinned
 * marking until migrated).
 */

// Aliased to the generated projection DTO — the admin list stays in lockstep with the backend shape.
type WorkflowLineage = WorkflowLineageData;

export function WorkflowsAdminPage() {
    const qc = useQueryClient();
    const { client, onError, onSelectLineage } = useWorkflowsServices();
    const notify = useNotify();
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [showMigrate, setShowMigrate] = useState(false);
    // Lineage-index filter (admin-redesign ticket 08) — a router-agnostic filter over the already-
    // loaded lineages (the surface stays portable: no query-string / router coupling). Free-text
    // search across name+key, plus a system/custom segment.
    const [query, setQuery] = useState('');
    const [scope, setScope] = useState<'all' | 'system' | 'custom'>('all');
    // Fork-only vs fork-and-activate (admin-redesign ticket 08) — the save path already accepts an
    // `activate` flag server-side; this exposes it so an author can stage an inert draft version.
    const [activateOnSave, setActivateOnSave] = useState(true);

    const lineages = useQuery({
        queryKey: ['beam-workflows', 'lineages'],
        queryFn: () => client.listLineages(),
    });
    const catalog = useQuery({
        queryKey: ['beam-workflows', 'catalog'],
        queryFn: () => client.catalog(),
    });
    // Server-authoritative write capability (admin-redesign ticket 08): drives the surface's own
    // write affordances so a read-only member never submits into a 403 (the gate is still enforced
    // server-side on every write path).
    const canAuthor = catalog.data?.canAuthor ?? false;

    // Coverage (visibility): how many live records are actually pinned to each version — the
    // evidence the workflow is governing objects, not just configured.
    const coverage = useQuery({
        queryKey: ['beam-workflows', 'coverage', selectedKey],
        enabled: Boolean(selectedKey),
        queryFn: () => client.coverage(selectedKey as string),
    });
    const countByVersion = new Map((coverage.data?.versions ?? []).map((v) => [v.id, v.count]));

    const selected = lineages.data?.find((l) => l.key === selectedKey) ?? null;
    const activeVersion = selected?.versions.find((v) => v.isActive) ?? selected?.versions.at(-1);

    // The selection channel (ticket 08): announce the active lineage to the host so it can echo it in
    // its own chrome. One-way notification — the surface still owns selection + renders coverage inline.
    useEffect(() => {
        onSelectLineage?.(selected);
    }, [selected, onSelectLineage]);

    // The filtered master list — free-text over name+key, then the system/custom segment.
    const filteredLineages = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return (lineages.data ?? []).filter((l) => {
            if (scope === 'system' && !l.isSystem) return false;
            if (scope === 'custom' && l.isSystem) return false;
            if (!needle) return true;
            return l.name.toLowerCase().includes(needle) || l.key.toLowerCase().includes(needle);
        });
    }, [lineages.data, query, scope]);

    const invalidateLineages = () =>
        qc.invalidateQueries({ queryKey: ['beam-workflows', 'lineages'] });

    const save = useMutation({
        mutationFn: (blueprint: BlueprintDraft) =>
            client.saveVersion(selectedKey as string, blueprint, activateOnSave),
        onSuccess: () => {
            notify({ type: 'success', message: 'Saved a new version' });
            invalidateLineages();
        },
        onError: (error) => {
            notify({ type: 'error', message: errorMessage(error, 'Could not save the workflow') });
            onError?.(error);
        },
    });

    const bind = useMutation({
        mutationFn: (vars: { typeKey: string; lineageRef: string; params: Record<string, unknown> }) =>
            client.bind(vars),
        onSuccess: () => {
            notify({ type: 'success', message: 'Binding updated' });
            invalidateLineages();
        },
        onError: (error) => {
            notify({ type: 'error', message: errorMessage(error, 'Could not update the binding') });
            onError?.(error);
        },
    });

    const unbind = useMutation({
        mutationFn: (typeKey: string) => client.unbind(typeKey),
        onSuccess: () => {
            notify({ type: 'success', message: 'Type unbound — now unmanaged' });
            invalidateLineages();
        },
        onError: (error) => {
            notify({ type: 'error', message: errorMessage(error, 'Could not unbind the type') });
            onError?.(error);
        },
    });

    return (
        // Full-bleed (admin-redesign ticket 08): the desk shell owns the outer gutter, so the surface
        // drops its own `mx-auto max-w-5xl px-6 py-8` and spans the framed main.
        <div>
            <h1 className="mb-1 text-xl font-semibold">Workflows</h1>
            <p className="mb-6 text-sm text-[var(--beam-ink-55)]">
                Definition lineages, their immutable versions, and the types they govern. Editing
                forks a new version — objects already running stay on the version they started on.
            </p>

            <div className="grid grid-cols-[260px_1fr] gap-6">
                {/* Lineage list */}
                <aside className="space-y-1.5">
                    {/* Lineage-index filter (ticket 08) — router-agnostic search + system/custom segment. */}
                    <div className="mb-2 space-y-1.5">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Filter workflows…"
                            aria-label="Filter workflows"
                            className="h-8 text-sm"
                        />
                        <div className="flex gap-1">
                            {(['all', 'system', 'custom'] as const).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setScope(s)}
                                    aria-pressed={scope === s}
                                    className={cn(
                                        'rounded-md border px-2 py-0.5 text-[11px] capitalize',
                                        scope === s
                                            ? 'border-[var(--beam-green)] text-[var(--beam-green)]'
                                            : 'border-[var(--beam-ink-12)] text-[var(--beam-ink-45)] hover:bg-[var(--beam-ink-03)]',
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    {lineages.isPending && (
                        <p className="text-sm text-muted-foreground">Loading…</p>
                    )}
                    {!lineages.isPending && filteredLineages.length === 0 && (
                        <p className="text-sm text-muted-foreground">No workflows match.</p>
                    )}
                    {filteredLineages.map((lineage) => (
                        <button
                            key={lineage.key}
                            data-lineage-key={lineage.key}
                            onClick={() => setSelectedKey(lineage.key)}
                            className={cn(
                                'block w-full rounded-md border px-3 py-2 text-left text-sm',
                                selectedKey === lineage.key
                                    ? 'border-[var(--beam-green)] bg-[var(--beam-green)]/5'
                                    : 'border-[var(--beam-ink-12)] hover:bg-[var(--beam-ink-03)]',
                            )}
                        >
                            <div className="font-medium">{lineage.name}</div>
                            <div className="font-mono text-[11px] text-[var(--beam-ink-45)]">
                                {lineage.key}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                                {lineage.isSystem && (
                                    <span className="rounded bg-[var(--beam-ink-08)] px-1.5 py-0.5 uppercase">
                                        system
                                    </span>
                                )}
                                <span className="rounded bg-[var(--beam-ink-08)] px-1.5 py-0.5">
                                    v{lineage.versions.length}
                                </span>
                                {lineage.boundTypes.map((type) => (
                                    <span
                                        key={type}
                                        className="rounded bg-[var(--beam-green)]/10 px-1.5 py-0.5 text-[var(--beam-green)]"
                                    >
                                        {type}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </aside>

                {/* Editor */}
                <main>
                    {!selected ? (
                        <p className="text-sm text-muted-foreground">
                            Select a workflow to view its versions and edit it.
                        </p>
                    ) : (
                        <>
                            <BindingPanel
                                lineage={selected}
                                activeBlueprint={activeVersion?.blueprint}
                                guards={catalog.data?.guards ?? []}
                                types={catalog.data?.types ?? []}
                                binding={bind.isPending}
                                canAuthor={canAuthor}
                                onBind={(typeKey, params) =>
                                    bind.mutate({ typeKey, lineageRef: selected.key, params })
                                }
                                onUnbind={(typeKey) => unbind.mutate(typeKey)}
                            />
                            <div className="mb-4 space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    {selected.versions.map((v) => {
                                        const count = countByVersion.get(v.id) ?? 0;
                                        return (
                                            <span
                                                key={v.id}
                                                className={cn(
                                                    'rounded-md border px-2 py-1 font-mono',
                                                    v.isActive
                                                        ? 'border-[var(--beam-green)] text-[var(--beam-green)]'
                                                        : 'border-[var(--beam-ink-15)] text-[var(--beam-ink-45)]',
                                                )}
                                            >
                                                v{v.version}
                                                {v.isActive ? ' · active' : ''}
                                                {count > 0 ? ` · ${count} rec` : ''}
                                            </span>
                                        );
                                    })}
                                </div>
                                {/* The "is it active" evidence: live records pinned to this workflow. */}
                                <p className="text-xs text-[var(--beam-ink-50)]">
                                    {coverage.isPending
                                        ? 'Checking coverage…'
                                        : (coverage.data?.total ?? 0) === 0
                                          ? 'No records are running under this workflow yet.'
                                          : `Governing ${coverage.data?.total} record${coverage.data?.total === 1 ? '' : 's'} (pinned on first transition).`}
                                </p>
                            </div>
                            {/* Version diff / compare (ticket 19) — read-only structural delta. */}
                            <WorkflowDiff versions={selected.versions} lineageKey={selected.key} />

                            {/* Marking migration (ticket 20) — high blast radius, so collapsed behind an
                                explicit disclosure rather than always open. */}
                            {selected.versions.length >= 2 && canAuthor && (
                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowMigrate((s) => !s)}
                                        aria-expanded={showMigrate}
                                        className="text-xs text-[var(--beam-amber)] hover:underline"
                                    >
                                        {showMigrate
                                            ? 'Hide'
                                            : 'Migrate records to another version…'}
                                    </button>
                                    {showMigrate && (
                                        <div className="mt-2">
                                            <WorkflowMigrate
                                                versions={selected.versions}
                                                lineageKey={selected.key}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeVersion && catalog.data && (
                                <>
                                    {/* Fork-only vs fork-and-activate (ticket 08) — author-only. */}
                                    {canAuthor && (
                                        <label className="mb-3 flex items-center gap-2 text-xs text-[var(--beam-ink-60)]">
                                            <Switch
                                                checked={activateOnSave}
                                                onCheckedChange={setActivateOnSave}
                                                aria-label="Activate the new version on save"
                                            />
                                            Activate on save
                                            <span className="text-[var(--beam-ink-45)]">
                                                {activateOnSave
                                                    ? '— new subjects pin to this version'
                                                    : '— fork inert; the active version is unchanged'}
                                            </span>
                                        </label>
                                    )}
                                    <WorkflowEditor
                                        key={`${selected.key}-${activeVersion.id}`}
                                        initial={toDraft({
                                            ...activeVersion.blueprint,
                                            name: activeVersion.blueprint.name ?? selected.key,
                                        })}
                                        guards={catalog.data.guards}
                                        effects={catalog.data.effects}
                                        principals={catalog.data.principals}
                                        saving={save.isPending}
                                        canSave={canAuthor}
                                        error={
                                            save.isError
                                                ? errorMessage(save.error, 'Save failed')
                                                : null
                                        }
                                        onSave={(blueprint) => save.mutate(blueprint)}
                                    />
                                </>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

/**
 * The per-type governance control (ticket 09): "this type is governed by [this workflow] with
 * params…". Enable = bind a type to this lineage; disable = unbind (the type falls back to
 * unmanaged; live objects keep their pinned marking until migrated). The params UI is derived from
 * the guards the lineage's active version references — e.g. Composition's `require_review` toggle.
 */
function BindingPanel({
    lineage,
    activeBlueprint,
    guards,
    types,
    binding,
    canAuthor,
    onBind,
    onUnbind,
}: {
    lineage: WorkflowLineage;
    activeBlueprint?: BlueprintDraft;
    guards: GuardCatalogEntry[];
    types: WorkflowTypeOptionData[];
    binding: boolean;
    /** Whether the viewer may govern types (admin-redesign ticket 08) — disables bind/unbind when false. */
    canAuthor: boolean;
    onBind: (typeKey: string, params: Record<string, unknown>) => void;
    onUnbind: (typeKey: string) => void;
}) {
    const [typeKey, setTypeKey] = useState('');
    const [params, setParams] = useState<Record<string, unknown>>({});

    // The param knobs the bound guards accept — collected from the active version's guard refs.
    const paramFields = (() => {
        const guardByName = Object.fromEntries(guards.map((g) => [g.name, g]));
        const used = new Set(
            (activeBlueprint?.transitions ?? []).map((t) => t.guard).filter(Boolean) as string[],
        );
        const fields: { key: string; title: string; type?: string }[] = [];
        used.forEach((name) => {
            const props = (guardByName[name]?.paramsSchema?.properties ?? {}) as Record<
                string,
                { type?: string; title?: string }
            >;
            Object.entries(props).forEach(([key, schema]) =>
                fields.push({ key, title: schema.title ?? key, type: schema.type }),
            );
        });
        return fields;
    })();

    return (
        <Card className="mb-5">
            <CardHeader className="pb-3">
                <CardTitle className="font-mono text-[11px] font-medium tracking-[0.12em] text-[var(--beam-ink-45)] uppercase">
                    Governed types
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Currently-bound types with an unbind (disable) control. */}
                <div className="space-y-1.5">
                    {lineage.boundTypes.length === 0 && (
                        <p className="text-sm text-[var(--beam-ink-50)]">
                            No type is governed by this workflow yet.
                        </p>
                    )}
                    {lineage.boundTypes.map((type) => (
                        <div
                            key={type}
                            className="flex items-center justify-between rounded-md bg-[var(--beam-ink-04)] px-3 py-1.5 text-sm"
                        >
                            <span className="font-mono">{type}</span>
                            <Button
                                size="sm"
                                variant="ghost"
                                disabled={!canAuthor}
                                className="h-auto py-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => onUnbind(type)}
                            >
                                <Trash2 className="size-3" /> Unbind (→ unmanaged)
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Bind (enable) a type + fill its guard params. */}
                <div className="flex flex-wrap items-end gap-4 border-t border-[var(--beam-ink-08)] pt-3">
                    <div className="space-y-1">
                        <Label htmlFor="bind-type-key" className="text-xs text-[var(--beam-ink-50)]">
                            Type
                        </Label>
                        <Select value={typeKey || undefined} onValueChange={setTypeKey}>
                            <SelectTrigger
                                id="bind-type-key"
                                className="w-64"
                                aria-label="Type to govern"
                            >
                                <SelectValue placeholder="Select a type…" />
                            </SelectTrigger>
                            <SelectContent>
                                {types
                                    .filter((t) => !lineage.boundTypes.includes(t.key))
                                    .map((t) => (
                                        <SelectItem key={t.key} value={t.key} textValue={t.label}>
                                            <div className="flex flex-col">
                                                <span>{t.label}</span>
                                                {/* Full schema URI as small subtext under the nicename. */}
                                                {t.key.includes('://') && (
                                                    <span className="max-w-[260px] truncate text-[10px] text-[var(--beam-ink-45)]">
                                                        {t.key}
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {paramFields.map((field) =>
                        field.type === 'boolean' ? (
                            <div key={field.key} className="flex items-center gap-2 pb-2">
                                <Switch
                                    id={`bind-param-${field.key}`}
                                    checked={Boolean(params[field.key] ?? false)}
                                    onCheckedChange={(checked) =>
                                        setParams((p) => ({ ...p, [field.key]: checked }))
                                    }
                                />
                                <Label
                                    htmlFor={`bind-param-${field.key}`}
                                    className="text-sm text-[var(--beam-ink-60)]"
                                >
                                    {field.title}
                                </Label>
                            </div>
                        ) : (
                            <div key={field.key} className="space-y-1">
                                <Label
                                    htmlFor={`bind-param-${field.key}`}
                                    className="text-xs text-[var(--beam-ink-50)]"
                                >
                                    {field.title}
                                </Label>
                                <Input
                                    id={`bind-param-${field.key}`}
                                    className="w-32"
                                    value={String(params[field.key] ?? '')}
                                    onChange={(e) =>
                                        setParams((p) => ({ ...p, [field.key]: e.target.value }))
                                    }
                                />
                            </div>
                        ),
                    )}
                    <Button
                        disabled={binding || typeKey.trim() === '' || !canAuthor}
                        onClick={() => onBind(typeKey.trim(), params)}
                    >
                        Bind type
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
