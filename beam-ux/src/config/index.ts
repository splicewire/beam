/**
 * `@splicewire/beam-ux/config` — the Config area (config-sections tickets 10a and 10b), beside the theme editor.
 *
 * 10a ships the read half over the `beam-config` resource (laravel-beam ADR-0245 §8): the all-sections index, the
 * section rail, the key table and the Cascade inspector, typed from `@splicewire/beam-resources/types/config`.
 */
export { ConfigArea, SectionRail, SectionsIndex, SectionView, CascadeInspector, type ConfigAreaProps } from './ConfigArea';
export { TierPill, EffectTag, FedBy, KeyValue, ReadValue, SecretValue } from './parts';
export { useConfigValue, ConfigFields, type UseConfigValueResult, type ConfigFieldsProps } from './bind';
export {
    TIER_ORDER,
    TIER_LABEL,
    admitsTenant,
    keyFor,
    resolveConfigValue,
    sectionForRealm,
    valueAt,
    type ConfigRealm,
    type ConfigValue,
    EFFECT_COPY,
    KEY_FILTERS,
    cascade,
    keyLabel,
    matchesFilter,
    nodeAt,
    type CascadeLayer,
    type KeyFilter,
    type LayerStanding,
} from './model';
