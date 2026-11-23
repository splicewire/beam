import * as react from 'react';
import { ReactNode } from 'react';
import { ResourceKey } from '@schemastud/frame';
import { SchemaNode } from '@schemastud/seam';
import { a as BeamUxMessageKey } from './messages-iwWTtwOl.js';
import { ConfigLayerData, ConfigKeyData, ConfigEffect, ConfigOverrideOp, ConfigTier, ConfigSectionData, ConfigOverrideData } from '@splicewire/beam-resources/types/config';
import { R as ReleaseCommand } from './releases-Dz6icO45.js';
import '@schemastud/messages';
import '@splicewire/beam-workflows/action-form';

/**
 * The Config area's view model over the `beam-config` row (laravel-beam ADR-0245 §8). Pure functions only: every wire
 * type comes from the generated `@splicewire/beam-resources/types/config` slice, and nothing here adds a field the row
 * does not carry. What a row will gain later (sparse overrides, drafts, pins, locks, the tenant realm) is ticket 10b's.
 */

/** The ladder, bottom-up, in the order laravel-beam's `ConfigTier` declares it. */
declare const TIER_ORDER: readonly ConfigTier[];
/** A tier as a pill names it (catalog keys; render with the reader's messages). */
declare const TIER_LABEL: Record<ConfigTier, BeamUxMessageKey>;
/** When a change applies, as the Applies column and the inspector say it. */
declare const EFFECT_COPY: Record<ConfigEffect, {
    labelKey: BeamUxMessageKey;
    longKey: BeamUxMessageKey;
}>;
/** The key-table filters: each reads only what the row carries. */
declare const KEY_FILTERS: readonly ["all", "changeable", "deploy", "env", "secrets"];
type KeyFilter = (typeof KEY_FILTERS)[number];
declare function matchesFilter(key: ConfigKeyData, filter: KeyFilter): boolean;
/**
 * The section-schema node a key's pointer addresses: through `properties`, a map's `additionalProperties` and an
 * array's `items`. Undefined when the schema does not reach it; the caller then reads the value without a widget.
 */
declare function nodeAt(schema: SchemaNode, pointer: string): SchemaNode | undefined;
/** What a key is called: its section schema's `title`, else its last reference token humanized. */
declare function keyLabel(schema: SchemaNode, pointer: string): string;
/** How a layer stands in the cascade: the value that wins, one it overrides, or one the row marks out of play. */
type LayerStanding = 'wins' | 'loses' | 'shadowed' | 'removed';
interface CascadeLayer {
    layer: ConfigLayerData;
    standing: LayerStanding;
}
/**
 * The key's layers top-down, as the inspector stacks them: the highest tier first. The winner is the highest layer
 * of the key's own `tier` that is neither shadowed nor removed; every other in-play layer loses to it.
 */
declare function cascade(key: ConfigKeyData): CascadeLayer[];
/**
 * The realm a Config area is mounted in (config-sections ticket 07): the operator realm reads the central tier, the tenant
 * realm (while a tenant is initialized) the tenant tier. The host mounts one area per realm and says which.
 */
type ConfigRealm = 'operator' | 'tenant';
/** Whether a key's declared ceiling admits the tenant tier: only such keys exist in the tenant realm. */
declare function admitsTenant(key: ConfigKeyData): boolean;
/**
 * The section as a realm may see it (ticket 10's AC; 10b). The operator realm sees the row as served. The tenant realm
 * sees only the keys whose ceiling admits the tenant tier, and never an env var name or an install path: each key's
 * `env` and the section's `files` are dropped, whatever the server sent. The server already filters the keys in the
 * tenant realm (laravel-beam `ConfigSectionData`); this is the UI's own guarantee, not a second source of truth.
 */
declare function sectionForRealm(section: ConfigSectionData, realm: ConfigRealm): ConfigSectionData;
/** The key whose pointer is `pointer`, or the nearest declared key above it (a pointer into a map or list value). */
declare function keyFor(section: ConfigSectionData, pointer: string): ConfigKeyData | undefined;
/** A pointer's value in the section's effective `values`, or undefined when the values do not reach it. */
declare function valueAt(section: ConfigSectionData, pointer: string): unknown;
/** What `useConfigValue` answers for one pointer: the effective value, never a secret's, plus how it was set. */
interface ConfigValue {
    /** The effective value; always `undefined` for a secret (only `set` says whether it has one). */
    value: unknown;
    /** The declared key that owns the pointer, when the section declares one. */
    key: ConfigKeyData | undefined;
    secret: boolean;
    /** For a secret, whether it holds a value; otherwise whether the pointer resolves. */
    set: boolean;
}
/** Resolve one pointer of a section to a `ConfigValue`. A secret's value never leaves this function. */
declare function resolveConfigValue(section: ConfigSectionData, pointer: string): ConfigValue;
/** The row tier's pending draft op on a pointer, if it has one (the row's `overrides` are that tier's sparse draft). */
declare function draftFor(section: ConfigSectionData, pointer: string): ConfigOverrideData | undefined;
/** Whether the row tier holds a draft that publishing would promote. */
declare function hasPendingDraft(section: ConfigSectionData): boolean;
/** A key is locked for the tier below the operator: an operator lock with its reason (ticket 07). */
declare function isLocked(key: ConfigKeyData): boolean;
/**
 * Whether this realm may edit the key: it is overridable, not deploy-only, its ceiling admits the row's tier, and in the
 * tenant realm no operator lock holds it. The server refuses the same writes; this only decides what the UI offers.
 */
declare function canEdit(section: ConfigSectionData, key: ConfigKeyData, realm: ConfigRealm): boolean;
/** Whether the section schema lets the key hold an explicit null (`type` lists `null`, or `nullable: true`). */
declare function allowsNull(schema: SchemaNode, pointer: string): boolean;
/** One line of the key-level diff: what the draft does to a pointer, against the effective value now. */
interface KeyDiffLine {
    pointer: string;
    op: ConfigOverrideOp;
    /** The effective value now; undefined for a secret. */
    from: unknown;
    /** The value the draft sets (`set`), null (`null`); undefined for `unset`, which falls back to the tier below. */
    to: unknown;
    secret: boolean;
}
/** The draft as a key-level diff, in the order the row lists its overrides. A secret's values never appear. */
declare function keyDiff(section: ConfigSectionData): KeyDiffLine[];
/**
 * The JSON text `save-draft` takes for a `set` (laravel-beam `ConfigSaveDraftInputData::$value` is JSON, so one form
 * writes any type the section schema declares).
 */
declare function toDraftValue(value: unknown): string;

/** beam-ux's Release member kind for a config override (laravel-beam-ux `BeamUxReleaseMember::KIND_CONFIG`). */
declare const RELEASE_KIND_CONFIG = "config-override";
/**
 * An open Release the draft bar can add the section to. The host resolves which Release is open (a `draft` one in this
 * realm) and runs its `command` op through its own route, as its Release pages do: beam-ux's `ReleaseCommandOp` is not a
 * frame action, so there is no manifest entry for `useResourceAction` to find.
 */
interface ConfigReleaseTarget {
    id: string;
    /** The Release's title: the draft bar names the Release a section will join, and confirms it once joined. */
    title: string;
    /** Runs the Release's `command` op. A refusal rejects with an Error carrying the server's message (and `errors`). */
    command: (command: ReleaseCommand) => Promise<unknown>;
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
declare function EditSlot<K extends ResourceKey = ResourceKey>(props: {
    resource: K;
    section: ConfigSectionData;
    keyData: ConfigKeyData;
    realm: ConfigRealm;
}): react.JSX.Element;
/**
 * The operator's lock on a key the tenant tier could otherwise reach: lock it with the reason a tenant is shown, or
 * unlock it (laravel-beam's `lock` op with `locked: false`). Not rendered in the tenant realm, or for a key a tenant
 * cannot reach anyway.
 */
declare function LockControl<K extends ResourceKey = ResourceKey>({ resource, section, keyData, realm, }: {
    resource: K;
    section: ConfigSectionData;
    keyData: ConfigKeyData;
    realm: ConfigRealm;
}): react.JSX.Element | null;
/**
 * The sticky draft bar: what the row tier's draft changes, key by key, and the ways out of it: publish now, discard,
 * or add the section to the open Release (ticket 08: the Release publishes the override's pin with its page edits).
 */
declare function DraftBar<K extends ResourceKey = ResourceKey>({ resource, section, release, }: {
    resource: K;
    section: ConfigSectionData;
    release?: ConfigReleaseTarget;
}): react.JSX.Element | null;
/** The section's versions, newest first, each restorable as the draft (laravel-beam's `versions` and `restore` ops). */
declare function VersionsPanel<K extends ResourceKey = ResourceKey>({ resource, section }: {
    resource: K;
    section: ConfigSectionData;
}): react.JSX.Element;

interface ConfigAreaProps<K extends ResourceKey = ResourceKey> {
    /** The `beam-config` resource as the host mounts it (laravel-beam: `Particle::mount('beam-config', …)`). */
    resource: K;
    /** The open section's id; `null` shows the all-sections index. Uncontrolled when omitted. */
    section?: string | null;
    onSectionChange?: (id: string | null) => void;
    /** The realm the host mounts this area in: the operator realm (central tier) or a tenant's (ticket 07). */
    realm?: ConfigRealm;
    /**
     * An open Release the draft bar can add a section's draft to (ticket 08), when beam-ux's Releases are mounted: its id
     * and the host's runner for that Release's `command` op. Without it the draft bar offers no Release control.
     */
    release?: ConfigReleaseTarget;
    className?: string;
}
declare function ConfigArea<K extends ResourceKey = ResourceKey>({ resource, section, onSectionChange, realm, release, className }: ConfigAreaProps<K>): react.JSX.Element;
declare function SectionRail<K extends ResourceKey = ResourceKey>({ resource, active, onPick }: {
    resource: K;
    active: string | null;
    onPick: (id: string | null) => void;
}): react.JSX.Element;
declare function SectionsIndex<K extends ResourceKey = ResourceKey>({ resource, onPick }: {
    resource: K;
    onPick: (id: string) => void;
}): react.JSX.Element;
declare function SectionView<K extends ResourceKey = ResourceKey>({ resource, id, realm, release, onBack, }: {
    resource: K;
    id: string;
    realm?: ConfigRealm;
    release?: ConfigReleaseTarget;
    onBack?: () => void;
}): react.JSX.Element;
declare function CascadeInspector<K extends ResourceKey = ResourceKey>({ section, keyData, onClose, resource, realm, }: {
    section: ConfigSectionData;
    keyData: ConfigKeyData;
    onClose?: () => void;
    /** The `beam-config` resource: with it the inspector offers the edit slot and the operator's lock (10b). */
    resource?: K;
    realm?: ConfigRealm;
}): react.JSX.Element;

declare function TierPill({ tier, className }: {
    tier: ConfigTier;
    className?: string;
}): react.JSX.Element;
declare function EffectTag({ effect, className }: {
    effect: ConfigEffect;
    className?: string;
}): react.JSX.Element;
/** The Fed-by cell: the env var feeding the key, else the provider, else the file its tier reads. */
declare function FedBy({ section, keyData, compact }: {
    section: ConfigSectionData;
    keyData: ConfigKeyData;
    compact?: boolean;
}): react.JSX.Element;
/**
 * A secret's state: set or not set. It takes the key's `set` flag and nothing else, so a value cannot reach the DOM
 * through it even if a row carried one.
 */
declare function SecretValue({ set, className }: {
    set: boolean;
    className?: string;
}): react.JSX.Element;
/**
 * A key's effective value, read-only, drawn from its section's own schema (ADR-0235: a row's values are typed by
 * the section schema it carries). The node at the key's pointer resolves through the kit's widget registry in the
 * `detail` context: a resolved component mounts with `widgetProps` over `useRjsfRegistry` built on the section's
 * ROOT schema (conformance row 04-2); a declared name nothing binds draws seam's unbound marker (row 01-10); a miss
 * reads as plain text. A secret never reaches this component: callers render {@link SecretValue} instead.
 */
declare function ReadValue({ schema, pointer, value, label }: {
    schema: SchemaNode;
    pointer: string;
    value: unknown;
    label: string;
}): ReactNode;
/** The key's value cell: a secret's state, or its value read through the section schema. */
declare function KeyValue({ section, keyData, label }: {
    section: ConfigSectionData;
    keyData: ConfigKeyData;
    label: string;
}): react.JSX.Element;

interface UseConfigValueResult extends ConfigValue {
    /** The section as the realm sees it, once read. */
    section: ConfigSectionData | null;
    isPending: boolean;
    /** True when the row was read but is not a `beam-config` section, or the read failed. */
    failed: boolean;
}
/**
 * One pointer of one section, as the realm sees it. A pointer the realm may not see (a key whose ceiling does not admit
 * the tenant tier, read in the tenant realm) resolves like a missing one: no value and no key.
 */
declare function useConfigValue<K extends ResourceKey = ResourceKey>(resource: K, root: string, pointer: string, realm?: ConfigRealm): UseConfigValueResult;
interface ConfigFieldsProps<K extends ResourceKey = ResourceKey> {
    resource: K;
    /** The section root, which is also its `beam-config` row id. */
    root: string;
    /** The JSON pointers to show, in order (RFC 6901, relative to the root). */
    pointers: readonly string[];
    realm?: ConfigRealm;
    className?: string;
}
/**
 * A section's pointers as labelled, read-only values: each label is the section schema's `title` (else the humanized
 * token), each value is read through the schema's declared widget, and a secret shows only whether it is set.
 */
declare function ConfigFields<K extends ResourceKey = ResourceKey>({ resource, root, pointers, realm, className }: ConfigFieldsProps<K>): react.JSX.Element;

export { CascadeInspector, type CascadeLayer, ConfigArea, type ConfigAreaProps, ConfigFields, type ConfigFieldsProps, type ConfigRealm, type ConfigReleaseTarget, type ConfigValue, DraftBar, EFFECT_COPY, EditSlot, EffectTag, FedBy, KEY_FILTERS, type KeyDiffLine, type KeyFilter, KeyValue, type LayerStanding, LockControl, RELEASE_KIND_CONFIG, ReadValue, SecretValue, SectionRail, SectionView, SectionsIndex, TIER_LABEL, TIER_ORDER, TierPill, type UseConfigValueResult, VersionsPanel, admitsTenant, allowsNull, canEdit, cascade, draftFor, hasPendingDraft, isLocked, keyDiff, keyFor, keyLabel, matchesFilter, nodeAt, resolveConfigValue, sectionForRealm, toDraftValue, useConfigValue, valueAt };
