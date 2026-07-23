import type { BlueprintTransition, GuardCatalogEntry } from './blueprint';

/**
 * Pure state helpers for authoring per-effect params (beam-workflows-ux ticket 16). Effects are
 * PLURAL per transition, so their params are keyed under `metadata.effect_params[<ref>]` — exactly the
 * shape the runtime reads (`TransitionBlueprint::effectParams($ref)`) — unlike the singular guard's
 * `metadata.guardParams`. Kept out of the component so the attach/detach/write/needs-setup logic is
 * unit-testable without a DOM.
 */

export type ParamBag = Record<string, unknown>;
type EffectParamsMap = Record<string, ParamBag>;
type ParamProperties = Record<string, { type?: string; title?: string; default?: unknown }>;

/** The `effect_params` map on a transition (`{}` when absent). */
export function effectParamsMap(transition: BlueprintTransition): EffectParamsMap {
    return ((transition.metadata?.effect_params as EffectParamsMap | undefined) ??
        {}) as EffectParamsMap;
}

/** The param bag for one effect ref (`{}` when the effect has none yet). */
export function effectParamsOf(transition: BlueprintTransition, ref: string): ParamBag {
    return effectParamsMap(transition)[ref] ?? {};
}

/** Attach an effect by name (idempotent). No bag is created — it's written lazily on first param edit. */
export function attachEffect(transition: BlueprintTransition, ref: string): BlueprintTransition {
    if (transition.effects.includes(ref)) return transition;

    return { ...transition, effects: [...transition.effects, ref] };
}

/** Detach an effect: drop it from `effects` AND delete its whole `effect_params[<ref>]` bag. */
export function detachEffect(transition: BlueprintTransition, ref: string): BlueprintTransition {
    const map = { ...effectParamsMap(transition) };
    delete map[ref];

    return {
        ...transition,
        effects: transition.effects.filter((x) => x !== ref),
        metadata: writeEffectParamsMap(transition.metadata, map),
    };
}

/** Write one effect's param bag under `effect_params[<ref>]`. */
export function setEffectParams(
    transition: BlueprintTransition,
    ref: string,
    params: ParamBag,
): BlueprintTransition {
    const map = { ...effectParamsMap(transition), [ref]: params };

    return { ...transition, metadata: writeEffectParamsMap(transition.metadata, map) };
}

/** Merge the effect-params map back into `metadata`, pruning the key (and metadata) when empty. */
function writeEffectParamsMap(
    metadata: BlueprintTransition['metadata'],
    map: EffectParamsMap,
): BlueprintTransition['metadata'] {
    const next: Record<string, unknown> = { ...(metadata ?? {}) };

    if (Object.keys(map).length === 0) {
        delete next.effect_params;
    } else {
        next.effect_params = map;
    }

    return Object.keys(next).length === 0 ? null : next;
}

/** Whether an effect declares any authorable params (else the row is toggle-only — no chevron). */
export function effectHasParams(effect: GuardCatalogEntry): boolean {
    return Object.keys(paramProperties(effect)).length > 0;
}

/**
 * The "needs setup" flag: an ON effect whose schema-`required` param is still empty. Booleans (which
 * default to `false`) never read as empty; a string/number is empty when unset/blank.
 */
export function effectNeedsSetup(effect: GuardCatalogEntry, params: ParamBag): boolean {
    const props = paramProperties(effect);
    const required = (effect.paramsSchema?.required as string[] | undefined) ?? [];

    return required.some((key) => {
        const value = params[key] ?? props[key]?.default;

        // Empty is: unset, blank, or an empty array (an unfilled recipient picker — ticket 17).
        return (
            value === undefined ||
            value === null ||
            value === '' ||
            (Array.isArray(value) && value.length === 0)
        );
    });
}

function paramProperties(effect: GuardCatalogEntry): ParamProperties {
    return (effect.paramsSchema?.properties ?? {}) as ParamProperties;
}
