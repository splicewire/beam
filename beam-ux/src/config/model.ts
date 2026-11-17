/**
 * The Config area's view model over the `beam-config` row (laravel-beam ADR-0245 §8). Pure functions only: every wire
 * type comes from the generated `@splicewire/beam-resources/types/config` slice, and nothing here adds a field the row
 * does not carry. What a row will gain later (sparse overrides, drafts, pins, locks, the tenant realm) is ticket 10b's.
 */
import type { SchemaNode } from '@schemastud/seam';
import type { BeamUxMessageKey } from '../messages.js';
import type {
    ConfigEffect,
    ConfigKeyData,
    ConfigLayerData,
    ConfigSectionData,
    ConfigTier,
} from '@splicewire/beam-resources/types/config';

export type { ConfigEffect, ConfigKeyData, ConfigLayerData, ConfigSectionData, ConfigTier };

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

/** What to change, and where, for a key no override can reach: its env var, its host file, or the provider. */
export function deploySource(section: ConfigSectionData, key: ConfigKeyData): { kind: 'env' | 'file' | 'provider'; name: string } {
    if (key.env) return { kind: 'env', name: key.env.name };
    if (key.tier === 'provider') return { kind: 'provider', name: 'a service provider' };
    const file = key.tier === 'package' ? section.files.package : section.files.host ?? section.files.package;
    return { kind: 'file', name: file ?? 'the config file' };
}
