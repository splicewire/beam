/**
 * The Config area's write half (config-sections ticket 10b), bound to laravel-beam's `beam-config` ops (tickets 05 and
 * 07) and beam-ux's Release command (ticket 08):
 *
 * - the inspector's edit slot: save a `set`, an explicit `null` or an `unset` (inherit) to the row tier's draft;
 * - the operator's lock and unlock of a key for tenants, with the reason a tenant is shown;
 * - the sticky draft bar: the key-level diff, publish, discard, and "add to Release" when a Release is open;
 * - versions, and restoring one as the draft.
 *
 * Every write goes through frame's `useResourceAction`, which refetches the section after it succeeds, so the row is the
 * single source of what is pending. A control stays disabled until its op is declared for this realm in frame's
 * manifest (the host mounts it), so nothing offers a write the server would not route. The server refuses what this UI does not offer (above the ceiling, a schema-invalid
 * value, a tenant lock); a refusal's message and field errors render beside the control.
 */
import { useContext, useId, useState, type ReactNode } from 'react';
import {
    useResourceAction,
    type ActionInputOf,
    type ActionKeyOf,
    type ResourceKey,
} from '@schemastud/frame';
import { asWidget, useRjsfRegistry, widgetProps, WidgetRegistryContext, type SchemaNode } from '@schemastud/seam';
import { Button, Input, cn } from '@schemastud/ui';
import { History, Lock, LockOpen, Rocket, Undo2 } from 'lucide-react';
import {
    allowsNull,
    canEdit,
    draftFor,
    formatValue,
    hasPendingDraft,
    isLocked,
    keyDiff,
    keyLabel,
    nodeAt,
    pointerTokens,
    toDraftValue,
    TIER_ORDER,
    type ConfigKeyData,
    type ConfigRealm,
    type ConfigSectionData,
    type ConfigVersionData,
    type ConfigVersionsData,
} from './model';
import { PlainValue, SecretValue } from './parts';
import { useBeamUxMessages } from '../messages.js';

/** beam-ux's Release member kind for a config override (laravel-beam-ux `BeamUxReleaseMember::KIND_CONFIG`). */
export const RELEASE_KIND_CONFIG = 'config-override';

/** An open Release the draft bar can add the section to: its resource as mounted, and its id. */
export interface ConfigReleaseTarget {
    resource: ResourceKey;
    id: string;
}

/** A `beam-config` op as a typed call. The op names are laravel-beam's (`src/Particle/Ops/Config`). */
function useConfigOp<K extends ResourceKey>(resource: K, name: string) {
    const call = useResourceAction(resource, name as ActionKeyOf<K>);
    return {
        ...call,
        run: (data: Record<string, unknown>) => call.invoke({ data: data as ActionInputOf<K, ActionKeyOf<K>> }),
    };
}

/** A refusal's lines: the server's field errors when it sent them, else its message. */
function RefusalNote({ error }: { error: Error | null }) {
    if (!error) return null;
    const fields = (error as { errors?: Record<string, string[]> }).errors;
    const lines = fields && Object.keys(fields).length > 0 ? Object.values(fields).flat() : [error.message];
    return (
        <ul data-config-refusal role="alert" className="space-y-0.5 text-xs text-destructive">
            {lines.map((line, i) => (
                <li key={i}>{line}</li>
            ))}
        </ul>
    );
}

/* ───────────────────────────── editing one key ───────────────────────────── */

/** How the edit slot names the key's pending draft op. */
const DRAFT_OP_LABEL = {
    set: 'splicewire-beam-ux::messages.config_draft_set',
    null: 'splicewire-beam-ux::messages.config_draft_null',
    unset: 'splicewire-beam-ux::messages.config_draft_unset',
} as const;

/** A stable `formContext` for the edit registry, as the read registry keeps one. */
const EDIT_FORM_CONTEXT: Record<string, unknown> = {};

/**
 * The value editor: the section schema's declared widget in the `form` context when the kit binds one (conformance row
 * 04-2), else a native control typed by the schema (`boolean`, `integer`/`number`, `enum`, `string`), else JSON text.
 * Labelled by the schema title, never the raw pointer.
 */
function EditValue({
    schema,
    pointer,
    value,
    secret,
    onChange,
}: {
    schema: SchemaNode;
    pointer: string;
    value: unknown;
    secret: boolean;
    onChange: (value: unknown, valid: boolean) => void;
}): ReactNode {
    const registry = useContext(WidgetRegistryContext);
    const rjsfRegistry = useRjsfRegistry(schema, EDIT_FORM_CONTEXT);
    const id = useId();
    const node = nodeAt(schema, pointer);
    const label = keyLabel(schema, pointer);
    const tokens = pointerTokens(pointer);
    if (node && registry && !secret) {
        const resolved = registry.resolveEntry(node, 'form');
        const Widget = asWidget(resolved.widget);
        if (Widget) {
            return (
                <span data-config-edit="widget" className="block min-w-0">
                    <Widget
                        {...widgetProps({
                            registry: rjsfRegistry,
                            schema: node,
                            value,
                            name: tokens[tokens.length - 1] ?? '',
                            id,
                            label,
                            readonly: false,
                            disabled: false,
                            options: resolved.options,
                            onChange: (next: unknown) => onChange(next, true),
                        })}
                    />
                </span>
            );
        }
    }
    const type = Array.isArray(node?.type) ? node?.type.find((t) => t !== 'null') : node?.type;
    if (secret) {
        return <Input id={id} aria-label={label} type="password" autoComplete="off" onChange={(e) => onChange(e.target.value, e.target.value !== '')} />;
    }
    if (Array.isArray(node?.enum)) {
        return (
            <select
                id={id}
                aria-label={label}
                className="h-8 rounded-md border bg-background px-2 text-sm"
                defaultValue={value === undefined ? '' : JSON.stringify(value)}
                onChange={(e) => onChange(JSON.parse(e.target.value), true)}
            >
                {(node.enum as unknown[]).map((choice) => (
                    <option key={JSON.stringify(choice)} value={JSON.stringify(choice)}>
                        {formatValue(choice)}
                    </option>
                ))}
            </select>
        );
    }
    if (type === 'boolean') {
        return (
            <label className="inline-flex items-center gap-2 text-sm">
                <input id={id} type="checkbox" defaultChecked={value === true} onChange={(e) => onChange(e.target.checked, true)} />
                {label}
            </label>
        );
    }
    if (type === 'integer' || type === 'number') {
        return (
            <Input
                id={id}
                aria-label={label}
                type="number"
                step={type === 'integer' ? 1 : 'any'}
                min={typeof node?.minimum === 'number' ? node.minimum : undefined}
                max={typeof node?.maximum === 'number' ? node.maximum : undefined}
                defaultValue={typeof value === 'number' ? value : undefined}
                onChange={(e) => {
                    const n = e.target.valueAsNumber;
                    onChange(n, Number.isFinite(n) && (type === 'number' || Number.isInteger(n)));
                }}
            />
        );
    }
    if (type === 'string') {
        return <Input id={id} aria-label={label} defaultValue={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value, true)} />;
    }
    return (
        <textarea
            id={id}
            aria-label={label}
            className="min-h-16 w-full rounded-md border bg-background p-2 font-mono text-xs"
            defaultValue={value === undefined ? '' : JSON.stringify(value, null, 2)}
            onChange={(e) => {
                try {
                    onChange(JSON.parse(e.target.value), true);
                } catch {
                    onChange(undefined, false);
                }
            }}
        />
    );
}

/**
 * The inspector's edit slot for the row's tier: the key's pending draft, a value editor, and save / set null / inherit.
 * A key this realm may not edit renders no slot, except a tenant-locked key, which says why.
 */
export function EditSlot<K extends ResourceKey = ResourceKey>({
    resource,
    section,
    keyData,
    realm,
}: {
    resource: K;
    section: ConfigSectionData;
    keyData: ConfigKeyData;
    realm: ConfigRealm;
}) {
    const m = useBeamUxMessages();
    const save = useConfigOp(resource, 'save-draft');
    const schema = section.schema as SchemaNode;
    const draft = draftFor(section, keyData.pointer);
    const start = draft?.op === 'set' && !draft.secret ? draft.value : keyData.secret ? undefined : keyData.value;
    const [value, setValue] = useState<unknown>(start);
    const [valid, setValid] = useState(true);
    if (!canEdit(section, keyData, realm)) {
        if (realm === 'tenant' && keyData.lock) {
            return (
                <p data-config-locked className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="size-3" aria-hidden />
                    {m.t('splicewire-beam-ux::messages.config_locked_by_operator', { reason: keyData.lock.reason })}
                </p>
            );
        }
        return null;
    }
    const send = (op: 'set' | 'null' | 'unset') =>
        save.run({ root: section.root, pointer: keyData.pointer, op, value: op === 'set' ? toDraftValue(value) : null });
    return (
        <section data-config-edit-slot={keyData.pointer} aria-label={m.t('splicewire-beam-ux::messages.config_edit_slot')} className="space-y-2 rounded-lg border p-3">
            <header className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-medium">{m.t('splicewire-beam-ux::messages.config_edit_slot')}</h3>
                {draft && (
                    <span data-config-draft={draft.op} className="font-mono text-[10.5px] text-primary">
                        {m.t(DRAFT_OP_LABEL[draft.op])}
                    </span>
                )}
            </header>
            <EditValue
                schema={schema}
                pointer={keyData.pointer}
                value={value}
                secret={keyData.secret}
                onChange={(next, ok) => {
                    setValue(next);
                    setValid(ok);
                }}
            />
            {!valid && <p className="text-xs text-destructive">{m.t('splicewire-beam-ux::messages.config_value_invalid')}</p>}
            <RefusalNote error={save.error} />
            <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={!save.available || !valid || save.pending} onClick={() => send('set')}>
                    {m.t('splicewire-beam-ux::messages.config_save_draft')}
                </Button>
                {allowsNull(schema, keyData.pointer) && (
                    <Button size="sm" variant="outline" disabled={!save.available || save.pending} onClick={() => send('null')}>
                        {m.t('splicewire-beam-ux::messages.config_set_null')}
                    </Button>
                )}
                <Button size="sm" variant="ghost" disabled={!save.available || save.pending} onClick={() => send('unset')}>
                    <Undo2 className="mr-1 size-3.5" aria-hidden />
                    {m.t('splicewire-beam-ux::messages.config_inherit')}
                </Button>
            </div>
        </section>
    );
}

/**
 * The operator's lock on a key the tenant tier could otherwise reach: lock it with the reason a tenant is shown, or
 * unlock it (laravel-beam's `lock` op with `locked: false`). Not rendered in the tenant realm, or for a key a tenant
 * cannot reach anyway.
 */
export function LockControl<K extends ResourceKey = ResourceKey>({
    resource,
    section,
    keyData,
    realm,
}: {
    resource: K;
    section: ConfigSectionData;
    keyData: ConfigKeyData;
    realm: ConfigRealm;
}) {
    const m = useBeamUxMessages();
    const lock = useConfigOp(resource, 'lock');
    const [reason, setReason] = useState('');
    if (realm !== 'operator' || TIER_ORDER.indexOf(keyData.ceiling) < TIER_ORDER.indexOf('tenant')) return null;
    const locked = isLocked(keyData);
    return (
        <section data-config-lock={locked ? 'locked' : 'open'} className="space-y-2 rounded-lg border p-3">
            {locked ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs">
                        <Lock className="size-3" aria-hidden />
                        {m.t('splicewire-beam-ux::messages.config_locked_for_tenants', { reason: keyData.lock?.reason ?? '' })}
                    </p>
                    <Button size="sm" variant="outline" disabled={!lock.available || lock.pending} onClick={() => lock.run({ root: section.root, pointer: keyData.pointer, locked: false })}>
                        <LockOpen className="mr-1 size-3.5" aria-hidden />
                        {m.t('splicewire-beam-ux::messages.config_unlock')}
                    </Button>
                </div>
            ) : (
                <div className="flex flex-wrap items-end gap-2">
                    <Input
                        aria-label={m.t('splicewire-beam-ux::messages.config_lock_reason')}
                        placeholder={m.t('splicewire-beam-ux::messages.config_lock_reason')}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="h-8 min-w-0 flex-1"
                    />
                    <Button size="sm" variant="outline" disabled={!lock.available || lock.pending || reason.trim() === ''} onClick={() => lock.run({ root: section.root, pointer: keyData.pointer, locked: true, reason })}>
                        <Lock className="mr-1 size-3.5" aria-hidden />
                        {m.t('splicewire-beam-ux::messages.config_lock_for_tenants')}
                    </Button>
                </div>
            )}
            <RefusalNote error={lock.error} />
        </section>
    );
}

/* ───────────────────────────── the draft bar ───────────────────────────── */

/** One diff value: a secret's state, a JSON null, the tier below (inherit), or the value. */
function DiffValue({ value, secret, inherit, struck }: { value: unknown; secret: boolean; inherit?: boolean; struck?: boolean }) {
    const m = useBeamUxMessages();
    if (secret) return <SecretValue set />;
    if (inherit) return <span className="font-mono text-xs text-muted-foreground">{m.t('splicewire-beam-ux::messages.config_diff_inherit')}</span>;
    return <PlainValue value={value} struck={struck} />;
}

/**
 * The sticky draft bar: what the row tier's draft changes, key by key, and the ways out of it: publish now, discard,
 * or add the section to the open Release (ticket 08: the Release publishes the override's pin with its page edits).
 */
export function DraftBar<K extends ResourceKey = ResourceKey>({
    resource,
    section,
    release,
}: {
    resource: K;
    section: ConfigSectionData;
    release?: ConfigReleaseTarget;
}) {
    const m = useBeamUxMessages();
    const publish = useConfigOp(resource, 'publish');
    const discard = useConfigOp(resource, 'discard-draft');
    const releaseCommand = useResourceAction(release?.resource ?? resource, 'command' as ActionKeyOf<ResourceKey>);
    if (!hasPendingDraft(section) && section.overrides.length === 0) return null;
    const schema = section.schema as SchemaNode;
    const lines = keyDiff(section);
    const busy = publish.pending || discard.pending || releaseCommand.pending;
    return (
        <section data-config-draft-bar aria-label={m.t('splicewire-beam-ux::messages.config_draft_bar')} className="sticky top-0 z-10 space-y-2 rounded-lg border bg-card p-3 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{m.t('splicewire-beam-ux::messages.config_changes_pending', { count: lines.length })}</p>
                <div className="flex flex-wrap gap-2">
                    {release && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={busy || !releaseCommand.available}
                            onClick={() => releaseCommand.invoke({ id: release.id, data: { action: 'member', kind: RELEASE_KIND_CONFIG, ref: section.root } as never })}
                        >
                            {m.t('splicewire-beam-ux::messages.config_add_to_release')}
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" disabled={busy || !discard.available} onClick={() => discard.run({ root: section.root })}>
                        {m.t('splicewire-beam-ux::messages.config_discard_draft')}
                    </Button>
                    <Button size="sm" disabled={busy || !publish.available} onClick={() => publish.run({ root: section.root })}>
                        <Rocket className="mr-1 size-3.5" aria-hidden />
                        {m.t('splicewire-beam-ux::messages.config_publish')}
                    </Button>
                </div>
            </header>
            <ol data-config-diff className="space-y-1">
                {lines.map((line) => (
                    <li key={line.pointer} data-config-diff-line={line.pointer} className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-xs">
                        <span className="truncate">{keyLabel(schema, line.pointer)}</span>
                        <DiffValue value={line.from} secret={line.secret} struck />
                        <span aria-hidden className="text-muted-foreground">→</span>
                        <DiffValue value={line.to} secret={line.secret} inherit={line.op === 'unset'} />
                    </li>
                ))}
            </ol>
            <RefusalNote error={publish.error ?? discard.error ?? releaseCommand.error} />
        </section>
    );
}

/* ───────────────────────────── versions ───────────────────────────── */

function asVersions(data: unknown): ConfigVersionData[] {
    const versions = (data as Partial<ConfigVersionsData> | undefined)?.versions;
    return Array.isArray(versions) ? versions : [];
}

/** The section's versions, newest first, each restorable as the draft (laravel-beam's `versions` and `restore` ops). */
export function VersionsPanel<K extends ResourceKey = ResourceKey>({ resource, section }: { resource: K; section: ConfigSectionData }) {
    const m = useBeamUxMessages();
    const versions = useConfigOp(resource, 'versions');
    const restore = useConfigOp(resource, 'restore');
    const list = asVersions(versions.result?.data);
    return (
        <section data-config-versions className="space-y-2 rounded-lg border p-3">
            <header className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-xs font-medium">
                    <History className="size-3.5" aria-hidden />
                    {m.t('splicewire-beam-ux::messages.config_versions')}
                </h3>
                <Button size="sm" variant="ghost" disabled={!versions.available || versions.pending} onClick={() => versions.run({ root: section.root })}>
                    {m.t('splicewire-beam-ux::messages.config_show_versions')}
                </Button>
            </header>
            {versions.result && list.length === 0 && <p className="text-xs text-muted-foreground">{m.t('splicewire-beam-ux::messages.config_no_versions')}</p>}
            <ol className="space-y-1">
                {[...list]
                    .sort((a, b) => b.version - a.version)
                    .map((v) => (
                        <li key={v.id} data-config-version={v.version} className={cn('flex flex-wrap items-center justify-between gap-2 text-xs', v.published && 'font-medium')}>
                            <span>
                                {m.t('splicewire-beam-ux::messages.config_version_n', { version: v.version })}
                                {v.label && ` · ${v.label}`}
                                {v.published && ` · ${m.t('splicewire-beam-ux::messages.config_version_published')}`}
                                {v.draft && ` · ${m.t('splicewire-beam-ux::messages.config_version_draft')}`}
                            </span>
                            {!v.draft && (
                                <Button size="sm" variant="outline" className="h-7" disabled={!restore.available || restore.pending} onClick={() => restore.run({ root: section.root, version: v.version })}>
                                    {m.t('splicewire-beam-ux::messages.config_restore_as_draft')}
                                </Button>
                            )}
                        </li>
                    ))}
            </ol>
            <RefusalNote error={versions.error ?? restore.error} />
        </section>
    );
}
