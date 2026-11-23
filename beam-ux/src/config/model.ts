/**
 * The Config area's view model over the `beam-config` row (laravel-beam ADR-0245 §8). Pure functions only: every wire
 * type comes from the generated `@splicewire/beam-resources/types/config` slice, and nothing here adds a field the row
 * does not carry. What a row will gain later (sparse overrides, drafts, pins, locks, the tenant realm) is ticket 10b's.
 */
import type { SchemaNode } from '@schemastud/seam';
import type { BeamUxMessageKey } from '../messages.js';
import { notice, type Notice } from '../message-descriptor.js';
import type {
    ConfigEffect,
    ConfigKeyData,
    ConfigLayerData,
    ConfigLockData,
    ConfigOverrideData,
    ConfigOverrideOp,
    ConfigPinsData,
    ConfigSectionData,
    ConfigTier,
    ConfigVersionData,
    ConfigVersionsData,
} from '@splicewire/beam-resources/types/config';

export type {
    ConfigEffect,
    ConfigKeyData,
    ConfigLayerData,
    ConfigLockData,
    ConfigOverrideData,
    ConfigOverrideOp,
    ConfigPinsData,
    ConfigSectionData,
    ConfigTier,
    ConfigVersionData,
    ConfigVersionsData,
};

/** The ladder, bottom-up, in the order laravel-beam's `ConfigTier` declares it. */
export const TIER_ORDER: readonly ConfigTier[] = ['package', 'host', 'provider', 'operator', 'tenant'];

/** A tier as a pill names it (catalog keys; render with the reader's messages). */
export const TIER_LABEL: Record<ConfigTier, BeamUxMessageKey> = {
    package: 'splicewire-beam-ux::messages.config_tier_package',
    host: 'splicewire-beam-ux::messages.config_tier_host',
    provider: 'splicewire-beam-ux::messages.config_tier_provider',
    operator: 'splicewire-beam-ux::messages.config_tier_operator',
    tenant: 'splicewire-beam-ux::messages.config_tier_tenant',
};

/** A tier in a sentence ("set by the host file"). */
export const TIER_WORD: Record<ConfigTier, BeamUxMessageKey> = {
    package: 'splicewire-beam-ux::messages.config_tier_word_package',
    host: 'splicewire-beam-ux::messages.config_tier_word_host',
    provider: 'splicewire-beam-ux::messages.config_tier_word_provider',
    operator: 'splicewire-beam-ux::messages.config_tier_word_operator',
    tenant: 'splicewire-beam-ux::messages.config_tier_word_tenant',
};

/** When a change applies, as the Applies column and the inspector say it. */
export const EFFECT_COPY: Record<ConfigEffect, { labelKey: BeamUxMessageKey; longKey: BeamUxMessageKey }> = {
    live: { labelKey: 'splicewire-beam-ux::messages.config_effect_live', longKey: 'splicewire-beam-ux::messages.config_effect_live_long' },
    reload: { labelKey: 'splicewire-beam-ux::messages.config_effect_reload', longKey: 'splicewire-beam-ux::messages.config_effect_reload_long' },
    deploy: { labelKey: 'splicewire-beam-ux::messages.config_effect_deploy', longKey: 'splicewire-beam-ux::messages.config_effect_deploy_long' },
};

/** The key-table filters: each reads only what the row carries. */
export const KEY_FILTERS = ['all', 'changeable', 'deploy', 'env', 'secrets'] as const;
export type KeyFilter = (typeof KEY_FILTERS)[number];

export const KEY_FILTER_LABEL: Record<KeyFilter, BeamUxMessageKey> = {
    all: 'splicewire-beam-ux::messages.config_filter_all',
    changeable: 'splicewire-beam-ux::messages.config_filter_changeable',
    deploy: 'splicewire-beam-ux::messages.config_filter_deploy',
    env: 'splicewire-beam-ux::messages.config_filter_env',
    secrets: 'splicewire-beam-ux::messages.config_filter_secrets',
};

export function matchesFilter(key: ConfigKeyData, filter: KeyFilter): boolean {
    switch (filter) {
        case 'changeable':
            return key.overridable;
        case 'deploy':
            return key.effect === 'deploy';
        case 'env':
            return key.env !== null;
        case 'secrets':
            return key.secret;
        default:
            return true;
    }
}

/** A section's family is its root's first segment (`beam.ux` → `beam`); the rail groups by it. */
export function family(root: string): string {
    return root.split('.')[0] ?? root;
}

/** Decode one RFC 6901 reference token. */
function unescapeToken(token: string): string {
    return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

/** The pointer's reference tokens (`/google.cse.query/limit` → `['google.cse.query', 'limit']`). Keys may hold dots. */
export function pointerTokens(pointer: string): string[] {
    if (pointer === '' || pointer === '/') return [];
    return pointer.replace(/^\//, '').split('/').map(unescapeToken);
}

function isNode(value: unknown): value is SchemaNode {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The section-schema node a key's pointer addresses: through `properties`, a map's `additionalProperties` and an
 * array's `items`. Undefined when the schema does not reach it; the caller then reads the value without a widget.
 */
export function nodeAt(schema: SchemaNode, pointer: string): SchemaNode | undefined {
    let node: unknown = schema;
    for (const token of pointerTokens(pointer)) {
        if (!isNode(node)) return undefined;
        const properties = node.properties;
        if (isNode(properties) && isNode(properties[token])) {
            node = properties[token];
        } else if (isNode(node.additionalProperties)) {
            node = node.additionalProperties;
        } else if (isNode(node.items) && /^\d+$/.test(token)) {
            node = node.items;
        } else {
            return undefined;
        }
    }
    return isNode(node) ? node : undefined;
}

/** Humanize a reference token for a label: `max_retries` → `Max retries`, `googleCse` → `Google cse`. */
export function humanize(token: string): string {
    const words = token
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_\-.]+/g, ' ')
        .trim()
        .toLowerCase();
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : token;
}

/** What a key is called: its section schema's `title`, else its last reference token humanized. */
export function keyLabel(schema: SchemaNode, pointer: string): string {
    const title = nodeAt(schema, pointer)?.title;
    if (typeof title === 'string' && title.trim() !== '') return title;
    const tokens = pointerTokens(pointer);
    return humanize(tokens[tokens.length - 1] ?? pointer);
}

/** A key's section-schema description, when it declares one. */
export function keyDescription(schema: SchemaNode, pointer: string): string | undefined {
    const description = nodeAt(schema, pointer)?.description;
    return typeof description === 'string' && description.trim() !== '' ? description : undefined;
}

/** How a layer stands in the cascade: the value that wins, one it overrides, or one the row marks out of play. */
export type LayerStanding = 'wins' | 'loses' | 'shadowed' | 'removed';

export interface CascadeLayer {
    layer: ConfigLayerData;
    standing: LayerStanding;
}

/**
 * The key's layers top-down, as the inspector stacks them: the highest tier first. The winner is the highest layer
 * of the key's own `tier` that is neither shadowed nor removed; every other in-play layer loses to it.
 */
export function cascade(key: ConfigKeyData): CascadeLayer[] {
    const rank = (tier: ConfigTier) => TIER_ORDER.indexOf(tier);
    const ordered = [...key.layers].sort((a, b) => rank(b.tier) - rank(a.tier));
    const winner = ordered.find((l) => l.tier === key.tier && !l.shadowed && !l.removed);
    return ordered.map((layer) => ({
        layer,
        standing: layer.removed ? 'removed' : layer.shadowed ? 'shadowed' : layer === winner ? 'wins' : 'loses',
    }));
}

/** One row of the inspector's stack: a layer that holds a value, or a runtime tier the package closed the key to. */
export type ProvenanceRow = ({ kind: 'layer' } & CascadeLayer) | { kind: 'closed'; tier: ConfigTier };

/**
 * The cascade with each CLOSED tier in its place on the ladder (config-sections 17). A tier the package closed the key
 * to has no layer, and "not set" would be wrong: no value from that tier can ever apply. Only tiers the ceiling admits
 * are shown, since a tier above the ceiling is already out of reach and the header says so.
 */
export function provenance(key: ConfigKeyData): ProvenanceRow[] {
    const rank = (tier: ConfigTier) => TIER_ORDER.indexOf(tier);
    const closed = closedTiers(key).filter((tier) => rank(tier) <= rank(key.ceiling));
    const rows: ProvenanceRow[] = cascade(key).map((row) => ({ kind: 'layer', ...row }));
    for (const tier of closed) {
        const at = rows.findIndex((row) => rank(row.kind === 'layer' ? row.layer.tier : row.tier) < rank(tier));
        rows.splice(at < 0 ? rows.length : at, 0, { kind: 'closed', tier });
    }
    return rows;
}

/** The runtime tiers the package closed the key to (`#[ConfigKey(closed: …)]`), bottom-up. */
export function closedTiers(key: ConfigKeyData): ConfigTier[] {
    return [...(key.closed ?? [])].sort((a, b) => TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b));
}

/** Whether the key is closed to the tier a realm writes (the operator realm writes `operator`, the tenant realm `tenant`). */
export function closedToRealm(key: ConfigKeyData, realm: ConfigRealm): boolean {
    return (key.closed ?? []).includes(realm);
}

/**
 * Whether the key holds a LIST (config-sections 21). A list is one key: it is saved whole, and no tier may override one
 * item, because an index names a position, not a record, and positions move when the list changes.
 */
export function isListKey(schema: SchemaNode, pointer: string): boolean {
    const type = nodeAt(schema, pointer)?.type;
    return type === 'array' || (Array.isArray(type) && type.includes('array'));
}

/** A non-secret value as plain text, for the fallback read and a layer line. */
export function formatValue(value: unknown): string {
    // A JSON null renders as its JSON token, like every other JSON value here: a value, not copy.
    if (value === null) return JSON.stringify(null);
    if (value === undefined) return '—';
    if (typeof value === 'string') return value === '' ? '""' : value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.length === 0 ? '[]' : JSON.stringify(value);
    if (typeof value === 'object') return Object.keys(value).length === 0 ? '{}' : JSON.stringify(value);
    return String(value);
}

/**
 * Narrow a resource row to the `beam-config` section row. A host that registers its resource map gets the row typed
 * already; an unregistered host gets `Row`, and this checks the members the area reads before it renders any.
 */
export function asConfigSection(row: unknown): ConfigSectionData | null {
    if (typeof row !== 'object' || row === null) return null;
    const r = row as Partial<ConfigSectionData>;
    return typeof r.id === 'string' && typeof r.root === 'string' && Array.isArray(r.keys) && isNode(r.schema)
        ? (row as ConfigSectionData)
        : null;
}

/**
 * The realm a Config area is mounted in (config-sections ticket 07): the operator realm reads the central tier, the tenant
 * realm (while a tenant is initialized) the tenant tier. The host mounts one area per realm and says which.
 */
export type ConfigRealm = 'operator' | 'tenant';

/** Whether a key's declared ceiling admits the tenant tier: only such keys exist in the tenant realm. */
export function admitsTenant(key: ConfigKeyData): boolean {
    return TIER_ORDER.indexOf(key.ceiling) >= TIER_ORDER.indexOf('tenant');
}

/**
 * The section as a realm may see it (ticket 10's AC; 10b). The operator realm sees the row as served. The tenant realm
 * sees only the keys whose ceiling admits the tenant tier, and never an env var name or an install path: each key's
 * `env` and the section's `files` are dropped, whatever the server sent. The server already filters the keys in the
 * tenant realm (laravel-beam `ConfigSectionData`); this is the UI's own guarantee, not a second source of truth.
 */
export function sectionForRealm(section: ConfigSectionData, realm: ConfigRealm): ConfigSectionData {
    if (realm === 'operator') return section;
    return {
        ...section,
        // A layer's `source` names a file or env reference, so it goes too.
        files: { package: null, host: null },
        keys: section.keys
            .filter(admitsTenant)
            .map((key) => ({ ...key, env: null, layers: key.layers.map((layer) => ({ ...layer, source: null })) })),
    };
}

/** The key whose pointer is `pointer`, or the nearest declared key above it (a pointer into a map or list value). */
export function keyFor(section: ConfigSectionData, pointer: string): ConfigKeyData | undefined {
    const exact = section.keys.find((k) => k.pointer === pointer);
    if (exact) return exact;
    const tokens = pointerTokens(pointer);
    let owner: ConfigKeyData | undefined;
    for (const key of section.keys) {
        const own = pointerTokens(key.pointer);
        if (own.length < tokens.length && own.every((t, i) => t === tokens[i]) && (!owner || own.length > pointerTokens(owner.pointer).length)) {
            owner = key;
        }
    }
    return owner;
}

/** A pointer's value in the section's effective `values`, or undefined when the values do not reach it. */
export function valueAt(section: ConfigSectionData, pointer: string): unknown {
    let node: unknown = section.values;
    for (const token of pointerTokens(pointer)) {
        if (Array.isArray(node) && /^\d+$/.test(token)) node = node[Number(token)];
        else if (typeof node === 'object' && node !== null && token in node) node = (node as Record<string, unknown>)[token];
        else return undefined;
    }
    return node;
}

/** What `useConfigValue` answers for one pointer: the effective value, never a secret's, plus how it was set. */
export interface ConfigValue {
    /** The effective value; always `undefined` for a secret (only `set` says whether it has one). */
    value: unknown;
    /** The declared key that owns the pointer, when the section declares one. */
    key: ConfigKeyData | undefined;
    secret: boolean;
    /** For a secret, whether it holds a value; otherwise whether the pointer resolves. */
    set: boolean;
}

/** Resolve one pointer of a section to a `ConfigValue`. A secret's value never leaves this function. */
export function resolveConfigValue(section: ConfigSectionData, pointer: string): ConfigValue {
    const key = keyFor(section, pointer);
    if (key?.secret) return { value: undefined, key, secret: true, set: key.set };
    const value = valueAt(section, pointer);
    return { value, key, secret: false, set: value !== undefined };
}

/* ─────────────── binding: drafts, the diff, locks (config-sections 10b, over 05/07's row) ─────────────── */

/** The row tier's pending draft op on a pointer, if it has one (the row's `overrides` are that tier's sparse draft). */
export function draftFor(section: ConfigSectionData, pointer: string): ConfigOverrideData | undefined {
    return section.overrides.find((o) => o.pointer === pointer);
}

/** Whether the row tier holds a draft that publishing would promote. */
export function hasPendingDraft(section: ConfigSectionData): boolean {
    return section.pins.draftPending;
}

/** A key is locked for the tier below the operator: an operator lock with its reason (ticket 07). */
export function isLocked(key: ConfigKeyData): boolean {
    return key.lock !== null;
}

/**
 * Whether this realm may edit the key: it is overridable, not deploy-only, its ceiling admits the row's tier, and in the
 * tenant realm no operator lock holds it. The server refuses the same writes; this only decides what the UI offers.
 */
export function canEdit(section: ConfigSectionData, key: ConfigKeyData, realm: ConfigRealm): boolean {
    if (!key.overridable || key.effect === 'deploy') return false;
    if (TIER_ORDER.indexOf(key.ceiling) < TIER_ORDER.indexOf(section.tier)) return false;
    if (realm === 'tenant' && isLocked(key)) return false;
    // config-sections 17: the server refuses a write from a tier the package closed the key to (ConfigTierBoundary).
    if (closedToRealm(key, realm)) return false;
    return true;
}

/** Whether the section schema lets the key hold an explicit null (`type` lists `null`, or `nullable: true`). */
export function allowsNull(schema: SchemaNode, pointer: string): boolean {
    const node = nodeAt(schema, pointer);
    if (!node) return false;
    const type = node.type;
    return node.nullable === true || type === 'null' || (Array.isArray(type) && type.includes('null'));
}

/** One line of the key-level diff: what the draft does to a pointer, against the effective value now. */
export interface KeyDiffLine {
    pointer: string;
    op: ConfigOverrideOp;
    /** The effective value now; undefined for a secret. */
    from: unknown;
    /** The value the draft sets (`set`), null (`null`); undefined for `unset`, which falls back to the tier below. */
    to: unknown;
    secret: boolean;
}

/** The draft as a key-level diff, in the order the row lists its overrides. A secret's values never appear. */
export function keyDiff(section: ConfigSectionData): KeyDiffLine[] {
    return section.overrides.map((o) => {
        const secret = o.secret || keyFor(section, o.pointer)?.secret === true;
        return {
            pointer: o.pointer,
            op: o.op,
            from: secret ? undefined : valueAt(section, o.pointer),
            to: secret || o.op === 'unset' ? undefined : o.op === 'null' ? null : o.value,
            secret,
        };
    });
}

/**
 * The JSON text `save-draft` takes for a `set` (laravel-beam `ConfigSaveDraftInputData::$value` is JSON, so one form
 * writes any type the section schema declares).
 */
export function toDraftValue(value: unknown): string {
    return JSON.stringify(value === undefined ? null : value);
}

/** What to change, and where, for a key no override can reach: its env var, its host file, or the provider. */
/** `name` is the env var or file as written, or a catalog line when there is none (render with say). */
export function deploySource(section: ConfigSectionData, key: ConfigKeyData): { kind: 'env' | 'file' | 'provider'; name: Notice } {
    if (key.env) return { kind: 'env', name: key.env.name };
    if (key.tier === 'provider') return { kind: 'provider', name: notice('splicewire-beam-ux::messages.config_tier_word_provider') };
    const file = key.tier === 'package' ? section.files.package : section.files.host ?? section.files.package;
    return { kind: 'file', name: file ?? notice('splicewire-beam-ux::messages.config_the_config_file') };
}
