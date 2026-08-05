// The Puck **config/seed registry** — the generic form of beam-ux-uplift ticket 01's per-mount
// `{config, seed}` prop. A host registers each block vocabulary ONCE, keyed by realm or slug; a mount
// resolves its pair through `resolvePuck` instead of importing configs at each call site.
//
// Why a registry and not two loose props: an empty-body `seed` that emits blocks its paired `config`
// can't draw renders as "No configuration for X" (the bug ticket 01 fixed at ONE mount). Binding the
// config and its matching seed as a single {@link PuckVocabulary} makes that mismatch unrepresentable —
// you register the pair, never a stray config with the wrong seed.

import type { Config, Data } from '@measured/puck';

/**
 * One block vocabulary: a Puck `config` (its Heading/Prose/… blocks) paired with the empty-body `seed`
 * that MATCHES it. `seed` is the first-author starter Data for a page whose body isn't Puck Data yet;
 * it defaults (at the mount) to an empty doc when omitted.
 */
export interface PuckVocabulary {
    config: Config;
    seed?: (slug: string) => Data;
}

/**
 * A host's Puck vocabularies keyed by a resolution key — a **realm** or a page **slug**, the host's
 * choice — with a REQUIRED `default` used for any key that isn't registered. Generalizes ticket 01's
 * single anonymous `{config, seed}` to N keys and moves resolution off the mount call site.
 */
export interface PuckRegistry {
    default: PuckVocabulary;
    byKey?: Record<string, PuckVocabulary>;
}

/**
 * Build a {@link PuckRegistry}. A typed construction seam (identity at runtime) — the host declares its
 * vocabulary+seed pairs here ONCE, so a config is bound to its matching seed at registration, never at a
 * mount. Keeping it a named factory leaves room for dev-time validation later without a call-site change.
 */
export function createPuckRegistry(registry: PuckRegistry): PuckRegistry {
    return registry;
}

/**
 * Resolve the `{config, seed}` pair for a mount `key` (a realm or a slug). An unregistered/absent key
 * falls back to the registry's `default` — so a host that registers only the surfaces it diverges on gets
 * the default vocabulary everywhere else, and a mount can never pair a mismatched config + seed.
 */
export function resolvePuck(registry: PuckRegistry, key?: string | null): PuckVocabulary {
    if (key != null && registry.byKey && Object.prototype.hasOwnProperty.call(registry.byKey, key)) {
        return registry.byKey[key];
    }

    return registry.default;
}
