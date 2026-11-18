import { OnKeyDuplicate, createRegistry, type Registry } from '@schemastud/registry';

import { BUILTIN_LAYOUTS, BUILTIN_TEMPLATES } from './builtins.js';
import type { ChromeComponent } from './types.js';

/**
 * The **chrome registry** — the client half of ADR-0213 §4/§7.
 *
 * An entry's `layout`/`template` column holds a NAME. Resolution order is *registered component
 * first, then another entry's slug* (§7), and this is the registered half: two module-scope registries a
 * host or capability package populates explicitly before the first render. The entry half is
 * `ArtifactChrome`, which the page reaches for only when this registry answers null.
 *
 * ## Why a mutable module registry rather than a prop
 *
 * The thing that resolves a name is an Inertia page shipped by this package (§3's page map), and an
 * Inertia page receives its props from the SERVER. There is no prop channel from the host's
 * `app.tsx` into a package-supplied page — so anything the host wants that page to know has to be
 * registered before the first render, which is exactly what `app.tsx` is. Making the registry a prop
 * would force every host back into shipping its own copy of the page to pass it, which is the failure
 * §3 exists to end.
 *
 * The registry is deliberately NOT a React context for the same reason: a context needs a provider
 * above the page, and the page is the top of the tree Inertia renders.
 *
 * ## Layouts and templates are separate registries
 *
 * They are two concepts (§1) and their names live in two columns, so one map keyed by name would let
 * a typo in `template` silently resolve to a layout and render chrome where a body should be. Two
 * registries make that a miss, and a miss is a doctor finding (`BeamUxChromeAudit`) rather than a
 * wrong page.
 *
 * ## The two registries
 *
 * Each is a `@schemastud/registry` registry: layouts at the root `beam.ux.chrome.layouts`, templates
 * at `beam.ux.chrome.templates`. A chrome name (`DocsLayout`) is not a legal registry key, so it goes
 * through `keyFor` and is carried as one segment under its root: the layout `DocsLayout` is the key
 * `beam.ux.chrome.layouts.DocsLayout`, and a template of the same name is a different key.
 *
 * Both declare `OnKeyDuplicate.Supersede`: registering a taken name replaces the component, keeps the
 * name's place in `registeredChromeNames()`, and records what was displaced and by whom. A host
 * overriding a packaged layout relies on that (`configureDocs({ layout })` in `@splicewire/beam-docs`).
 *
 * Only registrations live in the registries. The packaged defaults in `builtins.ts` are a fallback read
 * after a registry misses, so they have no key and no registrant.
 */
export const CHROME_LAYOUTS_ROOT = 'beam.ux.chrome.layouts';
export const CHROME_TEMPLATES_ROOT = 'beam.ux.chrome.templates';

function createLayouts(): Registry<ChromeComponent> {
    return createRegistry<ChromeComponent>({
        root: CHROME_LAYOUTS_ROOT,
        onKeyDuplicate: OnKeyDuplicate.Supersede,
        description: 'Layouts an entry names in its `layout` column.',
    });
}

function createTemplates(): Registry<ChromeComponent> {
    return createRegistry<ChromeComponent>({
        root: CHROME_TEMPLATES_ROOT,
        onKeyDuplicate: OnKeyDuplicate.Supersede,
        description: 'Templates an entry names in its `template` column.',
    });
}

// `let`, because the kernel has no way to remove an entry: `clearChromeRegistry()` starts two new registries.
let layouts = createLayouts();
let templates = createTemplates();

/** The registered component for a name, or undefined. `has` is exact, so a name that is only a prefix of others misses. */
function registered(registry: Registry<ChromeComponent>, name: string): ChromeComponent | undefined {
    const key = registry.keyFor(name);

    return registry.has(key) ? registry.resolve(key) : undefined;
}

/**
 * Register a layout. A taken name is replaced (Supersede). `by` names who is registering it, a package
 * name such as `@splicewire/beam-docs`; it is read back with `layoutRegistrant(name)`.
 */
export function registerLayout(name: string, component: ChromeComponent, by?: string | null): void {
    layouts.register(layouts.keyFor(name), component, typeof by === 'string' ? by : null);
}

/** Register a template. The same rules as `registerLayout`; read the registrant back with `templateRegistrant(name)`. */
export function registerTemplate(name: string, component: ChromeComponent, by?: string | null): void {
    templates.register(templates.keyFor(name), component, typeof by === 'string' ? by : null);
}

/** Register several at once — the shape a host's `app.tsx` reaches for. `by` is recorded on every one. */
export function registerChrome(
    chrome: {
        layouts?: Record<string, ChromeComponent>;
        templates?: Record<string, ChromeComponent>;
    },
    by?: string | null,
): void {
    for (const [name, component] of Object.entries(chrome.layouts ?? {})) {
        registerLayout(name, component, by);
    }

    for (const [name, component] of Object.entries(chrome.templates ?? {})) {
        registerTemplate(name, component, by);
    }
}

/**
 * Explicit registrations win over generic builtins. Capability packages register their own layouts;
 * this resolver never imports optional presentation packages.
 */
export function resolveLayout(name: string | null | undefined): ChromeComponent | null {
    return name ? (registered(layouts, name) ?? BUILTIN_LAYOUTS[name] ?? null) : null;
}

export function resolveTemplate(name: string | null | undefined): ChromeComponent | null {
    return name ? (registered(templates, name) ?? BUILTIN_TEMPLATES[name] ?? null) : null;
}

/**
 * Who registered the layout that `resolveLayout(name)` answers with. Null when the name is not
 * registered, when it resolves to a packaged builtin, or when it was registered without a `by`.
 */
export function layoutRegistrant(name: string): string | null {
    return layouts.registrantOf(layouts.keyFor(name));
}

/** Who registered the template that `resolveTemplate(name)` answers with. Null as for `layoutRegistrant`. */
export function templateRegistrant(name: string): string | null {
    return templates.registrantOf(templates.keyFor(name));
}

/**
 * Every resolvable name — packaged first, then whatever the host added. This is the list
 * `beam.ux.chrome.registered` has to agree with, and the reason `BeamUxChromeAudit` reads that config
 * key at all: PHP cannot see these registries.
 */
export function registeredChromeNames(): { layouts: string[]; templates: string[] } {
    return {
        layouts: [...new Set([...Object.keys(BUILTIN_LAYOUTS), ...layouts.names()])],
        templates: [...new Set([...Object.keys(BUILTIN_TEMPLATES), ...templates.names()])],
    };
}

/**
 * The two registries as they are now. Not exported from the package (`./index.ts` leaves it out): it is
 * the seam this package's own tests read keys, registrants and superseded entries through. Call it each
 * time: `clearChromeRegistry()` replaces both, so a held reference goes stale.
 */
export function chromeRegistries(): { layouts: Registry<ChromeComponent>; templates: Registry<ChromeComponent> } {
    return { layouts, templates };
}

/** Test seam. Never called by the page — a registry that could be emptied at runtime is a blank page. */
export function clearChromeRegistry(): void {
    layouts = createLayouts();
    templates = createTemplates();
}
