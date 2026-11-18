import * as react from 'react';
import { ReactNode } from 'react';
import { ResourceKey } from '@schemastud/frame';
import { ConfigLayerData, ConfigEffect, ConfigTier, ConfigKeyData, ConfigSectionData } from '@splicewire/beam-resources/types/config';
import { SchemaNode } from '@schemastud/seam';

/**
 * The Config area's view model over the `beam-config` row (laravel-beam ADR-0245 §8). Pure functions only: every wire
 * type comes from the generated `@splicewire/beam-resources/types/config` slice, and nothing here adds a field the row
 * does not carry. What a row will gain later (sparse overrides, drafts, pins, locks, the tenant realm) is ticket 10b's.
 */

/** The ladder, bottom-up, in the order laravel-beam's `ConfigTier` declares it. */
declare const TIER_ORDER: readonly ConfigTier[];
/** A tier as a pill names it. */
declare const TIER_LABEL: Record<ConfigTier, string>;
/** When a change applies, as the Applies column and the inspector say it. */
declare const EFFECT_COPY: Record<ConfigEffect, {
    label: string;
    long: string;
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

interface ConfigAreaProps<K extends ResourceKey = ResourceKey> {
    /** The `beam-config` resource as the host mounts it (laravel-beam: `Particle::mount('beam-config', …)`). */
    resource: K;
    /** The open section's id; `null` shows the all-sections index. Uncontrolled when omitted. */
    section?: string | null;
    onSectionChange?: (id: string | null) => void;
    className?: string;
}
declare function ConfigArea<K extends ResourceKey = ResourceKey>({ resource, section, onSectionChange, className }: ConfigAreaProps<K>): react.JSX.Element;
declare function SectionRail<K extends ResourceKey = ResourceKey>({ resource, active, onPick }: {
    resource: K;
    active: string | null;
    onPick: (id: string | null) => void;
}): react.JSX.Element;
declare function SectionsIndex<K extends ResourceKey = ResourceKey>({ resource, onPick }: {
    resource: K;
    onPick: (id: string) => void;
}): react.JSX.Element;
declare function SectionView<K extends ResourceKey = ResourceKey>({ resource, id, onBack }: {
    resource: K;
    id: string;
    onBack?: () => void;
}): react.JSX.Element;
declare function CascadeInspector({ section, keyData, onClose }: {
    section: ConfigSectionData;
    keyData: ConfigKeyData;
    onClose?: () => void;
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

export { CascadeInspector, type CascadeLayer, ConfigArea, type ConfigAreaProps, EFFECT_COPY, EffectTag, FedBy, KEY_FILTERS, type KeyFilter, KeyValue, type LayerStanding, ReadValue, SecretValue, SectionRail, SectionView, SectionsIndex, TIER_LABEL, TIER_ORDER, TierPill, cascade, keyLabel, matchesFilter, nodeAt };
