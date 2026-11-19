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
 * Ticket 10b binds it to the ladder: the realm view (the tenant realm sees only tenant-reachable keys, with no env name
 * or path), the inspector's edit slot and the operator's lock, the sticky draft bar (key-level diff, publish, discard,
 * add to the open Release) and versions with restore ({@link ./edit}). `ConfigFields` and `useConfigValue` let other
 * pages bind ({@link ./bind}).
 *
 * Mount it inside a frame kit's `Provider` (`createFrameKit`), which supplies the transport, the widget registry and
 * the shells' slots.
 */
import { useMemo, useState, type ReactNode } from 'react';
import {
    ListShell,
    resourceQueryKey,
    useFrameInjection,
    useResourceRecord,
    type FieldOf,
    type FrameColumn,
    type FrameTransport,
    type ResourceKey,
    type Row,
    type RowOf,
} from '@schemastud/frame';
import { useQuery } from '@tanstack/react-query';
import type { SchemaNode } from '@schemastud/seam';
import { Button, Input, cn } from '@schemastud/ui';
import { AlertTriangle, Search, X } from 'lucide-react';
import {
    asConfigSection,
    cascade,
    sectionForRealm,
    type ConfigRealm,
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
import { DraftBar, EditSlot, LockControl, VersionsPanel, type ConfigReleaseTarget } from './edit';
import { englishBeamUxMessages, useBeamUxMessages, type BeamUxMessages } from '../messages.js';
import { say } from '../message-descriptor.js';
import { richMessage } from '../rich-message.js';

export interface ConfigAreaProps<K extends ResourceKey = ResourceKey> {
    /** The `beam-config` resource as the host mounts it (laravel-beam: `Particle::mount('beam-config', …)`). */
    resource: K;
    /** The open section's id; `null` shows the all-sections index. Uncontrolled when omitted. */
    section?: string | null;
    onSectionChange?: (id: string | null) => void;
    /** The realm the host mounts this area in: the operator realm (central tier) or a tenant's (ticket 07). */
    realm?: ConfigRealm;
    /** An open Release the draft bar can add a section's draft to (ticket 08), when beam-ux's Releases are mounted. */
    release?: ConfigReleaseTarget;
    className?: string;
}

export function ConfigArea<K extends ResourceKey = ResourceKey>({ resource, section, onSectionChange, realm = 'operator', release, className }: ConfigAreaProps<K>) {
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
                {active === null ? <SectionsIndex resource={resource} onPick={pick} /> : <SectionView resource={resource} id={active} realm={realm} release={release} onBack={() => pick(null)} />}
            </div>
        </div>
    );
}

/* ───────────────────────────── the rail ───────────────────────────── */

/** The rail's page size, in frame's own list parameter (`per_page`, as `useListPagination` writes it). */
const RAIL_PAGE_SIZE = 100;
/** A runaway guard: a transport that never ends its pages stops here with an error, not an endless loop. */
const RAIL_MAX_PAGES = 100;

/**
 * Every row of a resource, following the transport's declared page envelope (frame's `ResourcePage`): a cursor page
 * until `nextCursor` is null, a numbered page until the rows reach `total`. A transport that answers every row on the
 * first page (frame's memory transport) ends there. The rail needs the whole set, because its search is over every
 * section, and a host may register more sections than one page holds.
 */
export async function listAllRows(transport: FrameTransport, resource: string, pageSize = RAIL_PAGE_SIZE): Promise<Row[]> {
    const rows = new Map<unknown, Row>();
    const size = { per_page: String(pageSize) };
    let params: Record<string, string> = size;
    for (let pages = 0; pages < RAIL_MAX_PAGES; pages++) {
        const page = await transport.list<Row>(resource, params);
        for (const row of page.data) rows.set(row.id ?? rows.size, row);
        if ('nextCursor' in page) {
            if (page.nextCursor === null) return [...rows.values()];
            params = { ...size, cursor: page.nextCursor };
        } else {
            if (page.data.length === 0 || rows.size >= page.total) return [...rows.values()];
            params = { ...size, page: String(page.page + 1) };
        }
    }
    throw new Error(`[beam-ux/config] ${resource}: more than ${RAIL_MAX_PAGES} pages of ${pageSize}`);
}

export function SectionRail<K extends ResourceKey = ResourceKey>({ resource, active, onPick }: { resource: K; active: string | null; onPick: (id: string | null) => void }) {
    const [q, setQ] = useState('');
    const { transport } = useFrameInjection();
    // Frame's own key: the resource, the rail's parts, and the transport's scope, so two sockets on one QueryClient
    // never share the rail's rows.
    const m = useBeamUxMessages();
    const list = useQuery({ queryKey: resourceQueryKey(transport, resource, 'beam-ux/config', 'rail'), queryFn: () => listAllRows(transport, resource) });
    const sections = useMemo(
        () => (list.data ?? []).map((row) => asConfigSection(row)).filter((s): s is ConfigSectionData => s !== null),
        [list.data],
    );
    const needle = q.trim().toLowerCase();
    const shown = sections.filter((s) => !needle || `${s.root} ${s.title}`.toLowerCase().includes(needle));
    const families = [...new Set(shown.map((s) => family(s.root)))];
    return (
        <nav aria-label={m.t('splicewire-beam-ux::messages.config_sections')} className="flex min-h-0 flex-col">
            <div className="relative p-3 pb-2">
                <Search className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-[40%] text-muted-foreground" aria-hidden />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={m.t('splicewire-beam-ux::messages.config_find_section')} aria-label={m.t('splicewire-beam-ux::messages.config_find_section')} className="h-8 pl-7 text-sm" />
            </div>
            <button
                type="button"
                onClick={() => onPick(null)}
                aria-current={active === null ? 'page' : undefined}
                className={cn('mx-2 flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted', active === null && 'bg-muted font-medium')}
            >
                {m.t('splicewire-beam-ux::messages.config_all_sections')} <span className="font-mono text-[10.5px] text-muted-foreground">{sections.length}</span>
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
                                            <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground" title={m.t('splicewire-beam-ux::messages.config_key_count', { count: s.counts.keys })}>
                                                {s.counts.keys}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
                {list.isSuccess && shown.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">{m.t('splicewire-beam-ux::messages.config_no_section_matches')}</p>}
                {list.isError && <p role="alert" className="px-2 py-3 text-xs text-destructive">{m.t('splicewire-beam-ux::messages.config_sections_list_failed')}</p>}
            </div>
        </nav>
    );
}

/* ───────────────────────────── the index: frame's ListShell over beam-config ───────────────────────────── */

/**
 * The index's per-field column overrides. Frame's columns seam has two modes (`resolveColumns`): with the resource's
 * ContextManifest, which a kit always supplies for a mounted `beam-config`, the MANIFEST is the column set and order
 * (`#[Column]` on `root`, `title` and `owner`) and a host column only overrides a declared field's header or cell;
 * without one, host columns pass through as the set. So these name exactly the three declared fields, each once, and
 * render the same in both modes. A section's counts have no column of their own (none is declared, and a host column
 * cannot add one), so they ride the Section cell beneath its title.
 */
/** `messages` is the reader's catalog when called in a render; English otherwise. */
export function sectionIndexColumns<K extends ResourceKey = ResourceKey>(m: BeamUxMessages = englishBeamUxMessages): FrameColumn<RowOf<K>>[] {
    // A declared member of the row, as a column field. Unregistered, `FieldOf` is `string`; registered, the host's row
    // is the generated `ConfigSectionData`, which carries each of the three.
    const field = (member: 'root' | 'title' | 'owner') => member as FieldOf<RowOf<K>>;
    return [
        // Headers repeat the declared labels, so the no-manifest fallback reads the same.
        { field: field('root'), header: m.t('splicewire-beam-ux::messages.config_column_root'), cell: (record) => <code className="font-mono text-xs text-muted-foreground">{asConfigSection(record)?.root}</code> },
        { field: field('title'), header: m.t('splicewire-beam-ux::messages.config_column_section'), cell: (record) => <SectionCell section={asConfigSection(record)} /> },
        { field: field('owner'), header: m.t('splicewire-beam-ux::messages.config_column_owner'), cell: (record) => <span className="font-mono text-xs text-muted-foreground">{asConfigSection(record)?.owner}</span> },
    ];
}

/** The Section cell: the title, then the section's counts as one line (keys, changeable, deploy-only, secrets). */
function SectionCell({ section }: { section: ConfigSectionData | null }) {
    const m = useBeamUxMessages();
    if (!section) return null;
    const { keys, overridable, deploy, secrets } = section.counts;
    // English is the pre-31 wording exactly: "1 key", "2 keys", "3 changeable", "1 deploy-only", "1 secret".
    const parts: [number, string, string][] = [
        [keys, 'keys', m.choice('splicewire-beam-ux::messages.config_count_keys', keys)],
        [overridable, 'changeable', m.t('splicewire-beam-ux::messages.config_count_changeable', { count: overridable })],
        [deploy, 'deploy', m.t('splicewire-beam-ux::messages.config_count_deploy', { count: deploy })],
        [secrets, 'secrets', m.choice('splicewire-beam-ux::messages.config_count_secrets', secrets)],
    ];
    return (
        <span className="block min-w-0">
            <span className="block text-sm font-medium">{section.title}</span>
            <span data-config-counts className="flex flex-wrap gap-x-2 font-mono text-[10.5px] text-muted-foreground">
                {parts.map(([n, kind, word]) => (
                    <span key={kind} data-config-count={kind} className={cn('tabular-nums', n > 0 && kind !== 'keys' && 'text-foreground/80')}>
                        {word}
                    </span>
                ))}
            </span>
        </span>
    );
}

export function SectionsIndex<K extends ResourceKey = ResourceKey>({ resource, onPick }: { resource: K; onPick: (id: string) => void }) {
    const m = useBeamUxMessages();
    const columns = useMemo(() => sectionIndexColumns<K>(m), [m]);
    return (
        <div className="space-y-3">
            <header className="space-y-1">
                <h1 className="text-[17px] font-semibold tracking-tight">{m.t('splicewire-beam-ux::messages.config_heading')}</h1>
                <p className="max-w-[68ch] text-sm text-muted-foreground">
                    {m.t('splicewire-beam-ux::messages.config_description')}
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

export function SectionView<K extends ResourceKey = ResourceKey>({
    resource,
    id,
    realm = 'operator',
    release,
    onBack,
}: {
    resource: K;
    id: string;
    realm?: ConfigRealm;
    release?: ConfigReleaseTarget;
    onBack?: () => void;
}) {
    const m = useBeamUxMessages();
    const record = useResourceRecord(resource, id);
    const row = asConfigSection(record.data);
    const section = row ? sectionForRealm(row, realm) : null;
    const [filter, setFilter] = useState<KeyFilter>('all');
    const [selected, setSelected] = useState<string | null>(null);
    if (record.isPending) return <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-ux::messages.config_loading_section')}</p>;
    if (!section) return <p className="text-sm text-destructive">{m.t('splicewire-beam-ux::messages.config_section_read_failed')}</p>;
    const keys = section.keys.filter((k) => matchesFilter(k, filter));
    const inspected = section.keys.find((k) => k.pointer === selected) ?? null;
    return (
        <div data-config-section={section.root} className="space-y-4">
            <SectionHeader section={section} onBack={onBack} />
            <SectionNotices section={section} />
            <DraftBar resource={resource} section={section} release={release} />
            <FilterChips section={section} filter={filter} setFilter={setFilter} />
            <div className={cn('grid gap-4', inspected && 'xl:grid-cols-[minmax(0,1fr)_22rem]')}>
                <KeyTable section={section} keys={keys} selected={selected} onSelect={setSelected} filter={filter} />
                {inspected && <CascadeInspector section={section} keyData={inspected} onClose={() => setSelected(null)} resource={resource} realm={realm} />}
            </div>
            <VersionsPanel resource={resource} section={section} />
        </div>
    );
}

function SectionHeader({ section, onBack }: { section: ConfigSectionData; onBack?: () => void }) {
    const m = useBeamUxMessages();
    return (
        <header className="space-y-2">
            {onBack && (
                <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground md:hidden">
                    {m.t('splicewire-beam-ux::messages.config_back_all_sections')}
                </button>
            )}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="text-[17px] font-semibold tracking-tight">{section.title}</h1>
                <code className="font-mono text-xs text-muted-foreground">{section.root}</code>
            </div>
            {section.description && <p className="max-w-[72ch] text-sm text-muted-foreground">{section.description}</p>}
            <dl className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted-foreground">
                <div className="flex gap-1.5">
                    <dt>{m.t('splicewire-beam-ux::messages.config_meta_owner')}</dt>
                    <dd className="text-foreground">{section.owner}</dd>
                </div>
                {section.files.package && (
                    <div className="flex gap-1.5">
                        <dt>{m.t('splicewire-beam-ux::messages.config_meta_package_file')}</dt>
                        <dd className="text-foreground">{section.files.package}</dd>
                    </div>
                )}
                {section.files.host && (
                    <div className="flex gap-1.5">
                        <dt>{m.t('splicewire-beam-ux::messages.config_meta_host_file')}</dt>
                        <dd className="text-foreground">{section.files.host}</dd>
                    </div>
                )}
                <div className="flex gap-1.5">
                    <dt>{m.t('splicewire-beam-ux::messages.config_meta_keys')}</dt>
                    <dd className="text-foreground">{section.counts.keys}</dd>
                </div>
            </dl>
        </header>
    );
}

function SectionNotices({ section }: { section: ConfigSectionData }) {
    const m = useBeamUxMessages();
    const providers = section.keys.filter((k) => k.tier === 'provider');
    if (section.shadowedPackageKeys.length === 0 && providers.length === 0) return null;
    return (
        <div className="space-y-1.5">
            {section.shadowedPackageKeys.length > 0 && (
                <Notice>
                    {m.choice('splicewire-beam-ux::messages.config_host_replaces_keys', section.shadowedPackageKeys.length)}{' '}
                    {section.shadowedPackageKeys.map((k) => (
                        <code key={k} className="mr-1 font-mono">
                            {k}
                        </code>
                    ))}
                </Notice>
            )}
            {providers.length > 0 && (
                <Notice>
                    {m.choice('splicewire-beam-ux::messages.config_provider_written_keys', providers.length)}
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
    const m = useBeamUxMessages();
    return (
        <div role="tablist" aria-label={m.t('splicewire-beam-ux::messages.config_filter_keys')} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
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
                        {m.t(KEY_FILTER_LABEL[f])}
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
    const m = useBeamUxMessages();
    const schema = section.schema as SchemaNode;
    if (keys.length === 0) {
        return (
            <p className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                {filter === 'all' ? m.t('splicewire-beam-ux::messages.config_no_keys') : m.t('splicewire-beam-ux::messages.config_no_keys_match')}
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
                        <th scope="col" className="py-2 pl-4 pr-3 font-medium">{m.t('splicewire-beam-ux::messages.config_column_key')}</th>
                        <th scope="col" className="py-2 pr-3 font-medium">{m.t('splicewire-beam-ux::messages.config_column_value')}</th>
                        <th scope="col" className="py-2 pr-3 font-medium">{m.t('splicewire-beam-ux::messages.config_column_set_by')}</th>
                        <th scope="col" className="py-2 pr-3 font-medium">{m.t('splicewire-beam-ux::messages.config_column_fed_by')}</th>
                        <th scope="col" className="py-2 pr-3 font-medium">{m.t('splicewire-beam-ux::messages.config_column_applies')}</th>
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
                                        aria-label={m.t('splicewire-beam-ux::messages.config_where_from', { label })}
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
    shadowed: 'splicewire-beam-ux::messages.config_standing_shadowed',
    removed: 'splicewire-beam-ux::messages.config_standing_removed',
} as const;

export function CascadeInspector<K extends ResourceKey = ResourceKey>({
    section,
    keyData,
    onClose,
    resource,
    realm = 'operator',
}: {
    section: ConfigSectionData;
    keyData: ConfigKeyData;
    onClose?: () => void;
    /** The `beam-config` resource: with it the inspector offers the edit slot and the operator's lock (10b). */
    resource?: K;
    realm?: ConfigRealm;
}) {
    const m = useBeamUxMessages();
    const schema = section.schema as SchemaNode;
    const label = keyLabel(schema, keyData.pointer);
    const description = keyDescription(schema, keyData.pointer);
    const layers = cascade(keyData);
    return (
        <aside aria-label={m.t('splicewire-beam-ux::messages.config_cascade_for', { label })} data-config-inspector={keyData.pointer} className="space-y-3 rounded-lg border bg-card p-4">
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
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onClose} aria-label={m.t('splicewire-beam-ux::messages.config_close_inspector')}>
                            <X className="size-3.5" />
                        </Button>
                    )}
                </div>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                    <EffectTag effect={keyData.effect} />
                    <span className="font-mono text-[10.5px] text-muted-foreground">
                        {keyData.overridable ? m.t('splicewire-beam-ux::messages.config_overridable_up_to', { tier: m.t(TIER_WORD[keyData.ceiling]) }) : m.t('splicewire-beam-ux::messages.config_not_overridable')}
                    </span>
                </div>
            </header>

            <ChangeNote section={section} keyData={keyData} />
            {resource !== undefined && (
                <>
                    <EditSlot key={keyData.pointer} resource={resource} section={section} keyData={keyData} realm={realm} />
                    <LockControl resource={resource} section={section} keyData={keyData} realm={realm} />
                </>
            )}

            <ol className="space-y-2" aria-label={m.t('splicewire-beam-ux::messages.config_layers')}>
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
                                standing === 'wins' ? <SecretValue set={keyData.set} /> : <span className="font-mono text-xs text-muted-foreground">{m.t('splicewire-beam-ux::messages.config_withheld')}</span>
                            ) : (
                                <PlainValue value={layer.value} struck={standing !== 'wins'} />
                            )}
                            {(standing === 'shadowed' || standing === 'removed') && (
                                <p className="font-mono text-[10.5px] text-muted-foreground">{m.t(STANDING_NOTE[standing])}</p>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
            {keyData.env && (
                <p data-config-env-note className="font-mono text-[10.5px] text-muted-foreground">
                    {keyData.env.name}: {m.t(envState(keyData.env.set))}
                    {keyData.env.file && ` (${keyData.env.file}${keyData.env.line === null ? '' : `:${keyData.env.line}`})`}
                </p>
            )}
        </aside>
    );
}

/** What changing the key takes, by its effect: the deploy-only source it names, or when a change applies. */
function ChangeNote({ section, keyData }: { section: ConfigSectionData; keyData: ConfigKeyData }) {
    const m = useBeamUxMessages();
    if (keyData.effect !== 'deploy') {
        return (
            <p data-config-change={keyData.effect} className="text-xs text-muted-foreground">
                {m.t(EFFECT_COPY[keyData.effect].longKey)}
            </p>
        );
    }
    const source = deploySource(section, keyData);
    return (
        <p data-config-change="deploy" className="text-xs text-muted-foreground">
            {source.kind === 'env' ? (
                <>
                    {richMessage(m, 'splicewire-beam-ux::messages.config_deploy_env', { name: <code className="font-mono text-foreground">{say(m, source.name)}</code> })}
                </>
            ) : source.kind === 'provider' ? (
                <>{m.t('splicewire-beam-ux::messages.config_deploy_provider')}</>
            ) : (
                <>
                    {richMessage(m, 'splicewire-beam-ux::messages.config_deploy_file', { name: <code className="font-mono text-foreground">{say(m, source.name)}</code> })}
                </>
            )}
        </p>
    );
}
