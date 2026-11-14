/**
 * The Config area's read half (config-sections ticket 10a): the owner's Ledger, with the Cascade inspector as its
 * per-key pane (ticket 01's pick). It reads the `beam-config` resource through frame, one row per Config Section
 * (laravel-beam ADR-0245 §8), typed from the generated `@splicewire/beam-resources/types/config` slice:
 *
 * - the all-sections index on frame's `ListShell`, and the section rail;
 * - per section: the key table (Key · Value · Set by · Fed by · Applies) under filter chips;
 * - the Cascade inspector: the key's layers top-down, with shadowed and removed layers and the losing values struck
 *   through;
 * - the deploy-only state naming its env var or file, the reload and live states, and the secret state (set or not
 *   set, never a value).
 *
 * Not here (ticket 10b): drafts, the edit slot, diff, publish, versions, restore, validation errors, locks, the tenant
 * realm, the Release link, `ConfigFields` and `useConfigValue`. Each reads a field the row does not carry yet.
 *
 * Mount it inside a frame kit's `Provider` (`createFrameKit`), which supplies the transport, the widget registry and
 * the shells' slots.
 */
import { useMemo, useState, type ReactNode } from 'react';
import {
    ListShell,
    useResourceList,
    useResourceRecord,
    type FieldOf,
    type FrameColumn,
    type ResourceKey,
    type RowOf,
} from '@schemastud/frame';
import type { SchemaNode } from '@schemastud/seam';
import { Button, Input, cn } from '@schemastud/ui';
import { AlertTriangle, Search, X } from 'lucide-react';
import {
    asConfigSection,
    cascade,
    deploySource,
    EFFECT_COPY,
    family,
    KEY_FILTER_LABEL,
    KEY_FILTERS,
    keyDescription,
    keyLabel,
    matchesFilter,
    TIER_WORD,
    type ConfigKeyData,
    type ConfigSectionData,
    type KeyFilter,
} from './model';
import { EffectTag, envState, FedBy, KeyValue, PlainValue, SecretValue, TierPill } from './parts';

export interface ConfigAreaProps<K extends ResourceKey = ResourceKey> {
    /** The `beam-config` resource as the host mounts it (laravel-beam: `Particle::mount('beam-config', …)`). */
    resource: K;
    /** The open section's id; `null` shows the all-sections index. Uncontrolled when omitted. */
    section?: string | null;
    onSectionChange?: (id: string | null) => void;
    className?: string;
}

export function ConfigArea<K extends ResourceKey = ResourceKey>({ resource, section, onSectionChange, className }: ConfigAreaProps<K>) {
    const [own, setOwn] = useState<string | null>(null);
    const active = section === undefined ? own : section;
    const pick = (id: string | null) => {
        setOwn(id);
        onSectionChange?.(id);
    };
    return (
        <div data-beam-config-area className={cn('flex min-h-0 flex-col md:flex-row', className)}>
            <aside className="flex-none border-b bg-card/50 md:w-64 md:border-b-0 md:border-r">
                <SectionRail resource={resource} active={active} onPick={pick} />
            </aside>
            <div className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
                {active === null ? <SectionsIndex resource={resource} onPick={pick} /> : <SectionView resource={resource} id={active} onBack={() => pick(null)} />}
            </div>
        </div>
    );
}

/* ───────────────────────────── the rail ───────────────────────────── */

const RAIL_PARAMS = { perPage: '100' };

export function SectionRail<K extends ResourceKey = ResourceKey>({ resource, active, onPick }: { resource: K; active: string | null; onPick: (id: string | null) => void }) {
    const [q, setQ] = useState('');
    const list = useResourceList(resource, RAIL_PARAMS);
    const sections = useMemo(
        () => (list.data?.data ?? []).map((row) => asConfigSection(row)).filter((s): s is ConfigSectionData => s !== null),
        [list.data],
    );
    const needle = q.trim().toLowerCase();
    const shown = sections.filter((s) => !needle || `${s.root} ${s.title}`.toLowerCase().includes(needle));
    const families = [...new Set(shown.map((s) => family(s.root)))];
    return (
        <nav aria-label="Config sections" className="flex min-h-0 flex-col">
            <div className="relative p-3 pb-2">
                <Search className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-[40%] text-muted-foreground" aria-hidden />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a section" aria-label="Find a section" className="h-8 pl-7 text-sm" />
            </div>
            <button
                type="button"
                onClick={() => onPick(null)}
                aria-current={active === null ? 'page' : undefined}
                className={cn('mx-2 flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted', active === null && 'bg-muted font-medium')}
            >
                All sections <span className="font-mono text-[10.5px] text-muted-foreground">{sections.length}</span>
            </button>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
                {families.map((f) => (
                    <div key={f} className="mt-3">
                        <div className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">{f}</div>
                        <ul>
                            {shown
                                .filter((s) => family(s.root) === f)
                                .map((s) => (
                                    <li key={s.id}>
                                        <button
                                            type="button"
                                            onClick={() => onPick(s.id)}
                                            aria-current={active === s.id ? 'page' : undefined}
                                            className={cn(
                                                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                active === s.id && 'bg-primary/10 ring-1 ring-primary/15',
                                            )}
                                        >
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm">{s.title}</span>
                                                <span className="block truncate font-mono text-[10.5px] text-muted-foreground">{s.root}</span>
                                            </span>
                                            <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground" title={`${s.counts.keys} keys`}>
                                                {s.counts.keys}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
                {list.isSuccess && shown.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">No section matches.</p>}
            </div>
        </nav>
    );
}

/* ───────────────────────────── the index: frame's ListShell over beam-config ───────────────────────────── */

export function SectionsIndex<K extends ResourceKey = ResourceKey>({ resource, onPick }: { resource: K; onPick: (id: string) => void }) {
    const columns = useMemo<FrameColumn<RowOf<K>>[]>(() => {
        // A member of the row this area reads, as a column field. Unregistered, `FieldOf` is `string`; registered,
        // the host's row is the generated `ConfigSectionData`, which carries every member named here.
        const field = (member: keyof ConfigSectionData & string) => member as FieldOf<RowOf<K>>;
        const count = (pick: (s: ConfigSectionData) => number) => (record: RowOf<K>) => {
            const s = asConfigSection(record);
            const n = s ? pick(s) : 0;
            return <span className={cn('font-mono text-xs tabular-nums', n === 0 && 'text-muted-foreground')}>{n === 0 ? '—' : n}</span>;
        };
        return [
            {
                field: field('title'),
                header: 'Section',
                sortField: 'title',
                cell: (record) => {
                    const s = asConfigSection(record);
                    return (
                        <span className="block min-w-0">
                            <span className="block text-sm font-medium">{s?.title}</span>
                            <span className="block font-mono text-[10.5px] text-muted-foreground">{s?.root}</span>
                        </span>
                    );
                },
            },
            { field: field('owner'), header: 'Owner', cell: (record) => <span className="font-mono text-xs text-muted-foreground">{asConfigSection(record)?.owner}</span> },
            { field: field('counts'), header: 'Keys', cell: count((s) => s.counts.keys) },
            { field: field('counts'), header: 'Changeable', cell: count((s) => s.counts.overridable) },
            { field: field('counts'), header: 'Deploy-only', cell: count((s) => s.counts.deploy) },
            { field: field('counts'), header: 'Secrets', cell: count((s) => s.counts.secrets) },
        ];
    }, []);
    return (
        <div className="space-y-3">
            <header className="space-y-1">
                <h1 className="text-[17px] font-semibold tracking-tight">Config</h1>
                <p className="max-w-[68ch] text-sm text-muted-foreground">
                    Every installed package’s config, the tier that set each value, and what changing it takes.
                </p>
            </header>
            <ListShell<K>
                resource={resource}
                columns={columns}
                onOpen={(record) => {
                    const id = (record as { id: unknown }).id;
                    if (typeof id === 'string') onPick(id);
                }}
                paginationPlacement="bottom"
            />
        </div>
    );
}

/* ───────────────────────────── one section ───────────────────────────── */

export function SectionView<K extends ResourceKey = ResourceKey>({ resource, id, onBack }: { resource: K; id: string; onBack?: () => void }) {
    const record = useResourceRecord(resource, id);
    const section = asConfigSection(record.data);
    const [filter, setFilter] = useState<KeyFilter>('all');
    const [selected, setSelected] = useState<string | null>(null);
    if (record.isPending) return <p className="text-sm text-muted-foreground">Loading section…</p>;
    if (!section) return <p className="text-sm text-destructive">This section could not be read.</p>;
    const keys = section.keys.filter((k) => matchesFilter(k, filter));
    const inspected = section.keys.find((k) => k.pointer === selected) ?? null;
    return (
        <div data-config-section={section.root} className="space-y-4">
            <SectionHeader section={section} onBack={onBack} />
            <SectionNotices section={section} />
            <FilterChips section={section} filter={filter} setFilter={setFilter} />
            <div className={cn('grid gap-4', inspected && 'xl:grid-cols-[minmax(0,1fr)_22rem]')}>
                <KeyTable section={section} keys={keys} selected={selected} onSelect={setSelected} filter={filter} />
                {inspected && <CascadeInspector section={section} keyData={inspected} onClose={() => setSelected(null)} />}
            </div>
        </div>
    );
}

function SectionHeader({ section, onBack }: { section: ConfigSectionData; onBack?: () => void }) {
    return (
        <header className="space-y-2">
            {onBack && (
                <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground md:hidden">
                    ← All sections
                </button>
            )}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="text-[17px] font-semibold tracking-tight">{section.title}</h1>
                <code className="font-mono text-xs text-muted-foreground">{section.root}</code>
            </div>
            {section.description && <p className="max-w-[72ch] text-sm text-muted-foreground">{section.description}</p>}
            <dl className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted-foreground">
                <div className="flex gap-1.5">
                    <dt>owner</dt>
                    <dd className="text-foreground">{section.owner}</dd>
                </div>
                {section.files.package && (
                    <div className="flex gap-1.5">
                        <dt>package file</dt>
                        <dd className="text-foreground">{section.files.package}</dd>
                    </div>
                )}
                {section.files.host && (
                    <div className="flex gap-1.5">
                        <dt>host file</dt>
                        <dd className="text-foreground">{section.files.host}</dd>
                    </div>
                )}
                <div className="flex gap-1.5">
                    <dt>keys</dt>
                    <dd className="text-foreground">{section.counts.keys}</dd>
                </div>
            </dl>
        </header>
    );
}

function SectionNotices({ section }: { section: ConfigSectionData }) {
    const providers = section.keys.filter((k) => k.tier === 'provider');
    if (section.shadowedPackageKeys.length === 0 && providers.length === 0) return null;
    return (
        <div className="space-y-1.5">
            {section.shadowedPackageKeys.length > 0 && (
                <Notice>
                    The host file replaces {section.shadowedPackageKeys.length} package key{section.shadowedPackageKeys.length === 1 ? '' : 's'} wholesale (a top-level
                    copy hides the package’s nested defaults):{' '}
                    {section.shadowedPackageKeys.map((k) => (
                        <code key={k} className="mr-1 font-mono">
                            {k}
                        </code>
                    ))}
                </Notice>
            )}
            {providers.length > 0 && (
                <Notice>
                    {providers.length} key{providers.length === 1 ? ' is' : 's are'} written by a service provider at boot, so no file sets{' '}
                    {providers.length === 1 ? 'it' : 'them'}.
                </Notice>
            )}
        </div>
    );
}

function Notice({ children }: { children: ReactNode }) {
    return (
        <p role="note" className="flex items-start gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <AlertTriangle className="mt-px size-3.5 flex-none" aria-hidden />
            <span>{children}</span>
        </p>
    );
}

function FilterChips({ section, filter, setFilter }: { section: ConfigSectionData; filter: KeyFilter; setFilter: (f: KeyFilter) => void }) {
    return (
        <div role="tablist" aria-label="Filter keys" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {KEY_FILTERS.map((f) => {
                const n = section.keys.filter((k) => matchesFilter(k, f)).length;
                return (
                    <button
                        key={f}
                        role="tab"
                        type="button"
                        aria-selected={filter === f}
                        onClick={() => setFilter(f)}
                        disabled={n === 0 && f !== 'all'}
                        className={cn(
                            'inline-flex h-7 flex-none items-center gap-1.5 rounded-full border px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            filter === f && 'border-foreground/20 bg-card text-foreground shadow-xs',
                        )}
                    >
                        {KEY_FILTER_LABEL[f]}
                        <span className="font-mono text-[10.5px] tabular-nums">{n}</span>
                    </button>
                );
            })}
        </div>
    );
}

/* ───────────────────────────── the key table ───────────────────────────── */

function KeyTable({
    section,
    keys,
    selected,
    onSelect,
    filter,
}: {
    section: ConfigSectionData;
    keys: ConfigKeyData[];
    selected: string | null;
    onSelect: (pointer: string) => void;
    filter: KeyFilter;
}) {
    const schema = section.schema as SchemaNode;
    if (keys.length === 0) {
        return (
            <p className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                {filter === 'all' ? 'This section declares no keys.' : 'No keys match this filter.'}
            </p>
        );
    }
    return (
        <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full min-w-[44rem] table-fixed text-sm">
                <colgroup>
                    <col className="w-[27%]" />
                    <col className="w-[24%]" />
                    <col className="w-[13%]" />
                    <col className="w-[24%]" />
                    <col className="w-[12%]" />
                </colgroup>
                <thead className="border-b bg-muted/40 text-left text-[11px] font-medium text-muted-foreground">
                    <tr>
                        <th scope="col" className="py-2 pl-4 pr-3 font-medium">Key</th>
                        <th scope="col" className="py-2 pr-3 font-medium">Value</th>
                        <th scope="col" className="py-2 pr-3 font-medium">Set by</th>
                        <th scope="col" className="py-2 pr-3 font-medium">Fed by</th>
                        <th scope="col" className="py-2 pr-3 font-medium">Applies</th>
                    </tr>
                </thead>
                <tbody>
                    {keys.map((k) => {
                        const label = keyLabel(schema, k.pointer);
                        return (
                            <tr
                                key={k.pointer}
                                data-config-key={k.pointer}
                                className={cn('border-b align-top last:border-b-0', selected === k.pointer && 'bg-primary/5')}
                            >
                                <th scope="row" className="py-2 pl-4 pr-3 text-left font-normal">
                                    <button
                                        type="button"
                                        onClick={() => onSelect(k.pointer)}
                                        className="block w-full min-w-0 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <span className="block truncate text-sm font-medium leading-5">{label}</span>
                                        <span className="block truncate font-mono text-[10.5px] leading-4 text-muted-foreground">{k.pointer}</span>
                                    </button>
                                </th>
                                <td className="max-w-0 py-2 pr-3">
                                    <KeyValue section={section} keyData={k} label={label} />
                                </td>
                                <td className="py-2 pr-3">
                                    <button
                                        type="button"
                                        onClick={() => onSelect(k.pointer)}
                                        aria-label={`Where ${label} comes from`}
                                        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <TierPill tier={k.tier} />
                                    </button>
                                </td>
                                <td className="max-w-0 overflow-hidden py-2 pr-3">
                                    <FedBy section={section} keyData={k} />
                                </td>
                                <td className="py-2 pr-3">
                                    <EffectTag effect={k.effect} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ───────────────────────────── the Cascade inspector ───────────────────────────── */

const STANDING_NOTE = {
    shadowed: 'hidden by the host file’s top-level copy',
    removed: 'removed from config() by a service provider',
} as const;

export function CascadeInspector({ section, keyData, onClose }: { section: ConfigSectionData; keyData: ConfigKeyData; onClose?: () => void }) {
    const schema = section.schema as SchemaNode;
    const label = keyLabel(schema, keyData.pointer);
    const description = keyDescription(schema, keyData.pointer);
    const layers = cascade(keyData);
    return (
        <aside aria-label={`Cascade for ${label}`} data-config-inspector={keyData.pointer} className="space-y-3 rounded-lg border bg-card p-4">
            <header className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="font-mono text-[11px] text-muted-foreground">
                            {section.root}
                            {keyData.pointer}
                        </div>
                        <h2 className="text-[15px] font-semibold tracking-tight">{label}</h2>
                    </div>
                    {onClose && (
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onClose} aria-label="Close the inspector">
                            <X className="size-3.5" />
                        </Button>
                    )}
                </div>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                    <EffectTag effect={keyData.effect} />
                    <span className="font-mono text-[10.5px] text-muted-foreground">
                        {keyData.overridable ? `overridable up to ${TIER_WORD[keyData.ceiling]}` : 'not overridable'}
                    </span>
                </div>
            </header>

            <ChangeNote section={section} keyData={keyData} />

            <ol className="space-y-2" aria-label="Layers, highest tier first">
                {layers.map(({ layer, standing }, i) => (
                    <li
                        key={`${layer.tier}-${i}`}
                        data-config-layer={layer.tier}
                        data-config-standing={standing}
                        className={cn('rounded-lg border', standing === 'wins' ? 'ring-1 ring-primary/25' : 'opacity-80')}
                    >
                        <header className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
                            <TierPill tier={layer.tier} />
                            <span className="truncate font-mono text-[10.5px] text-muted-foreground" title={layer.source ?? ''}>
                                {layer.source ?? '—'}
                            </span>
                        </header>
                        <div className="space-y-0.5 px-3 py-2">
                            {keyData.secret ? (
                                standing === 'wins' ? <SecretValue set={keyData.set} /> : <span className="font-mono text-xs text-muted-foreground">withheld</span>
                            ) : (
                                <PlainValue value={layer.value} struck={standing !== 'wins'} />
                            )}
                            {(standing === 'shadowed' || standing === 'removed') && (
                                <p className="font-mono text-[10.5px] text-muted-foreground">{STANDING_NOTE[standing]}</p>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
            {keyData.env && (
                <p data-config-env-note className="font-mono text-[10.5px] text-muted-foreground">
                    {keyData.env.name}: {envState(keyData.env.set)}
                    {keyData.env.file && ` (${keyData.env.file}${keyData.env.line === null ? '' : `:${keyData.env.line}`})`}
                </p>
            )}
        </aside>
    );
}

/** What changing the key takes, by its effect: the deploy-only source it names, or when a change applies. */
function ChangeNote({ section, keyData }: { section: ConfigSectionData; keyData: ConfigKeyData }) {
    if (keyData.effect !== 'deploy') {
        return (
            <p data-config-change={keyData.effect} className="text-xs text-muted-foreground">
                {EFFECT_COPY[keyData.effect].long}
            </p>
        );
    }
    const source = deploySource(section, keyData);
    return (
        <p data-config-change="deploy" className="text-xs text-muted-foreground">
            {source.kind === 'env' ? (
                <>
                    Deploy-only. Set <code className="font-mono text-foreground">{source.name}</code> in the server environment, then deploy.
                </>
            ) : source.kind === 'provider' ? (
                <>Deploy-only. A service provider writes it at boot; change the provider and deploy.</>
            ) : (
                <>
                    Deploy-only. Edit <code className="font-mono text-foreground">{source.name}</code>, then deploy.
                </>
            )}
        </p>
    );
}
