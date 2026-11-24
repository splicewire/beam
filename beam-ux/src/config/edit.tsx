/**
 * The Config area's write half (config-sections ticket 10b), bound to laravel-beam's `beam-config` ops (tickets 05 and
 * 07) and beam-ux's Release command (ticket 08):
 *
 * - the inspector's edit slot: save a `set`, an explicit `null` or an `unset` (inherit) to the row tier's draft;
 * - the operator's lock and unlock of a key for tenants, with the reason a tenant is shown;
 * - the sticky draft bar: the key-level diff, publish, discard, and "add to Release" when a Release is open;
 * - versions, and restoring one as the draft.
 *
 * Every `beam-config` write goes through frame's `useResourceAction`, which refetches the section after it succeeds, so the
 * row is the single source of what is pending. A control stays disabled until its op is declared for this realm in frame's
 * manifest (the host mounts it), so nothing offers a write the server would not route. Each op's payload is typed by its
 * generated input (`ConfigOpInputs`). The Release command is not a frame action (beam-ux's `ReleaseCommandOp` declares no
 * affordance), so the host hands the draft bar a callback that runs it, as its Release pages already do. The server refuses what this UI does not offer (above the ceiling, a schema-invalid
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
    closedToRealm,
    hasPendingDraft,
    isListKey,
    isLocked,
    keyDiff,
    keyLabel,
    nodeAt,
    pointerTokens,
    toDraftValue,
    TIER_ORDER,
    TIER_WORD,
    type ConfigKeyData,
    type ConfigRealm,
    type ConfigSectionData,
    type ConfigVersionData,
    type ConfigVersionsData,
} from './model';
import type {
    ConfigLockInputData,
    ConfigRestoreInputData,
    ConfigSaveDraftInputData,
    ConfigSectionRefInputData,
} from '@splicewire/beam-resources/types/config';
import { PlainValue, SecretValue } from './parts';
import { useBeamUxMessages } from '../messages.js';
import type { ReleaseCommand } from '../releases.js';

/** beam-ux's Release member kind for a config override (laravel-beam-ux `BeamUxReleaseMember::KIND_CONFIG`). */
export const RELEASE_KIND_CONFIG = 'config-override';

/**
 * An open Release the draft bar can add the section to. The host resolves which Release is open (a `draft` one in this
 * realm) and runs its `command` op through its own route, as its Release pages do: beam-ux's `ReleaseCommandOp` is not a
 * frame action, so there is no manifest entry for `useResourceAction` to find.
 */
export interface ConfigReleaseTarget {
    id: string;
    /** The Release's title: the draft bar names the Release a section will join, and confirms it once joined. */
    title: string;
    /** Runs the Release's `command` op. A refusal rejects with an Error carrying the server's message (and `errors`). */
    command: (command: ReleaseCommand) => Promise<unknown>;
}

/**
 * Each `beam-config` op's input, from the generated `beam-config` slice (laravel-beam's `src/Particle/Ops/Config`), so
 * a renamed or retyped field fails to compile here rather than as a 422 at runtime.
 */
export interface ConfigOpInputs {
    'save-draft': ConfigSaveDraftInputData;
    publish: ConfigSectionRefInputData;
    'discard-draft': ConfigSectionRefInputData;
    versions: ConfigSectionRefInputData;
    restore: ConfigRestoreInputData;
    lock: ConfigLockInputData;
}

/**
 * A `beam-config` op as a typed call. The caller is checked against the generated input above. The one remaining cast
 * is into frame's own key/input types, which a component generic over `K` cannot name for a concrete op.
 */
function useConfigOp<K extends ResourceKey, N extends keyof ConfigOpInputs>(resource: K, name: N) {
    const call = useResourceAction(resource, name as unknown as ActionKeyOf<K>);
    return {
        ...call,
        run: (data: ConfigOpInputs[N]) => call.invoke({ data: data as unknown as ActionInputOf<K, ActionKeyOf<K>> }),
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
 *
 * The slot starts over whenever the section's pins move (config-sections 10b, flagship browser proof finding, lead
 * ruling 21:21Z). Its editor is uncontrolled and its value, validity and dirty flag are seeded once from the draft or
 * the live value. So without this a Discard left the DISCARDED draft in "Your value" as if it were the user's, and the
 * next Save draft or Publish could ship a value nobody meant (the flagship run published one). Discard clears the draft
 * pin, Publish moves the published pin, Restore and Save draft move the draft pin; each remounts the fields from the
 * section as it now stands. The key also carries the section's root and the realm (review r10 SHOULD-1): switching to
 * another section whose pins happen to be equal and which has a key at the same pointer must start over too, or a dirty
 * edit would Save into the NEW section's root.
 */
export function EditSlot<K extends ResourceKey = ResourceKey>(props: {
    resource: K;
    section: ConfigSectionData;
    keyData: ConfigKeyData;
    realm: ConfigRealm;
}) {
    const { root, pins } = props.section;
    return <EditSlotFields key={`${root}:${props.realm}:${pins.draft ?? '-'}:${pins.published ?? '-'}:${pins.draftPending ? 1 : 0}`} {...props} />;
}

function EditSlotFields<K extends ResourceKey = ResourceKey>({
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
    // Save writes only an edited value. A secret is never prefilled, so an untouched Save would post `null` and, once
    // published, wipe the credential; for any other key it would append a no-op revision. Clearing a secret on purpose
    // is not offered here (out of scope for 10b): `null` is "Set to null" where the schema allows it.
    const [dirty, setDirty] = useState(false);
    if (!canEdit(section, keyData, realm)) {
        // config-sections 17: the package closed the key to this realm's tier. Say so, so the operator reads why there is
        // no edit slot instead of finding none (a tenant never sees a key closed to the tenant tier: the server drops it).
        if (closedToRealm(keyData, realm)) {
            return (
                <p data-config-closed-reason={realm} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="size-3" aria-hidden />
                    {m.t('splicewire-beam-ux::messages.config_closed_reason', { tier: m.t(TIER_WORD[realm]) })}
                </p>
            );
        }
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
                    setDirty(true);
                }}
            />
            {isListKey(schema, keyData.pointer) && (
                // config-sections 21: a list is saved whole. An index is a position, not a record, so no tier overrides one item.
                <p data-config-list-rule className="text-xs text-muted-foreground">
                    {m.t('splicewire-beam-ux::messages.config_list_rule')}
                </p>
            )}
            {!valid && <p className="text-xs text-destructive">{m.t('splicewire-beam-ux::messages.config_value_invalid')}</p>}
            <RefusalNote error={save.error} />
            <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={!save.available || !dirty || !valid || save.pending} onClick={() => send('set')}>
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
                    <Button size="sm" variant="outline" disabled={!lock.available || lock.pending} onClick={() => lock.run({ root: section.root, pointer: keyData.pointer, locked: false, reason: null })}>
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
 * What the Release holds of this section, from what this bar last added and the section's pins now:
 * - `added` or `stale` are only claimed while the section HAS a pending draft. After Discard draft or a direct
 *   Publish nothing is pending, so neither is claimed: the bar shows only which Release it would join, with Add
 *   disabled, since 08 refuses a member with no draft.
 * - `added`: the pending draft is the one added.
 * - `stale`: a newer pending draft than the one added (a Save draft since). Adding again re-pins the member.
 */
function releaseState(
    joined: { release: string; root: string; draft: number | null } | null,
    release: ConfigReleaseTarget,
    section: ConfigSectionData,
): 'target' | 'added' | 'stale' {
    if (!joined || joined.release !== release.id || joined.root !== section.root || !hasPendingDraft(section)) return 'target';
    if (section.pins.draft === joined.draft) return 'added';
    return section.pins.draft !== null && joined.draft !== null && section.pins.draft > joined.draft ? 'stale' : 'target';
}

/**
 * Which Release the draft bar adds to, and what happened. The live region is ALWAYS mounted (empty until something
 * happens), so a screen reader announces the confirmation or the stale notice when it appears:
 * - `target`: not added yet. Names the Release it would join (the host's first open draft).
 * - `added`: the Release holds this section at its current draft.
 * - `stale`: the Release holds an EARLIER draft of this section (a Save draft since); adding again re-pins it.
 */
function ReleaseNote({ release, state }: { release: ConfigReleaseTarget; state: 'target' | 'added' | 'stale' }) {
    const m = useBeamUxMessages();
    return (
        <div data-config-release-target={release.id} data-config-release-state={state} className="text-xs text-muted-foreground">
            {state === 'target' && <p>{m.t('splicewire-beam-ux::messages.config_release_target', { title: release.title })}</p>}
            <p role="status" aria-live="polite" className="text-foreground">
                {state === 'added' && m.t('splicewire-beam-ux::messages.config_added_to_release', { title: release.title })}
                {state === 'stale' && m.t('splicewire-beam-ux::messages.config_release_stale', { title: release.title })}
            </p>
        </div>
    );
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
    const [adding, setAdding] = useState(false);
    const [releaseError, setReleaseError] = useState<Error | null>(null);
    // What this bar last added: the Release, the section, and the draft version the member then pinned (08's member pins
    // the section's head draft). A later Save draft moves `pins.draft`, so the Release holds an EARLIER draft until the
    // section is added again (08's `member` command re-pins an existing member to the head draft). Keyed by section, so
    // another section in the same area never shows this one's confirmation.
    const [joined, setJoined] = useState<{ release: string; root: string; draft: number | null } | null>(null);
    if (!hasPendingDraft(section) && section.overrides.length === 0) return null;
    const schema = section.schema as SchemaNode;
    const lines = keyDiff(section);
    // The headline counts what is PENDING. `lines` are the tier's overrides, which stay after a direct Publish or a
    // Discard; with no draft pending they are published, not pending (10b proof finding A: "1 change pending" after a
    // Publish). Same rule as the Add gate below.
    const pending = hasPendingDraft(section) ? lines.length : 0;
    const busy = publish.pending || discard.pending || adding;
    const addToRelease = async (target: ConfigReleaseTarget) => {
        setAdding(true);
        setReleaseError(null);
        setJoined(null);
        const draft = section.pins.draft;
        try {
            await target.command({ action: 'member', kind: RELEASE_KIND_CONFIG, ref: section.root });
            setJoined({ release: target.id, root: section.root, draft });
        } catch (reason) {
            setReleaseError(reason instanceof Error ? reason : new Error(String(reason)));
        } finally {
            setAdding(false);
        }
    };
    return (
        <section data-config-draft-bar aria-label={m.t('splicewire-beam-ux::messages.config_draft_bar')} className="sticky top-0 z-10 space-y-2 rounded-lg border bg-card p-3 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{m.choice('splicewire-beam-ux::messages.config_changes_pending', pending, { count: pending })}</p>
                <div className="flex flex-wrap gap-2">
                    {release && (
                        <Button
                            size="sm"
                            variant="outline"
                            // 08 admits a config member only while the section has a pending draft (MemberNoDraft)
                            disabled={busy || !hasPendingDraft(section)}
                            onClick={() => void addToRelease(release)}
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
            {release && <ReleaseNote release={release} state={releaseState(joined, release, section)} />}
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
            <RefusalNote error={publish.error ?? discard.error ?? releaseError} />
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
