import { BUILTIN_LAYOUTS, BUILTIN_TEMPLATES } from './builtins.js';
import type { ChromeComponent } from './types.js';

/**
 * The **chrome registry** — the client half of ADR-0213 §4/§7.
 *
 * An entry's `layout`/`template` column holds a NAME. Resolution order is *registered component
 * first, then another entry's slug* (§7), and this is the registered half: a plain module-scope map a
 * package populates at import time and a host adds to in one line.
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
 * ## Layouts and templates are separate maps
 *
 * They are two concepts (§1) and their names live in two columns, so one map keyed by name would let
 * a typo in `template` silently resolve to a layout and render chrome where a body should be. Two maps
 * make that a miss, and a miss is a doctor finding (`BeamUxChromeAudit`) rather than a wrong page.
 */
const layouts = new Map<string, ChromeComponent>();
const templates = new Map<string, ChromeComponent>();

export function registerLayout(name: string, component: ChromeComponent): void {
    layouts.set(name, component);
}

export function registerTemplate(name: string, component: ChromeComponent): void {
    templates.set(name, component);
}

/** Register several at once — the shape a host's `app.tsx` reaches for. */
export function registerChrome(chrome: {
    layouts?: Record<string, ChromeComponent>;
    templates?: Record<string, ChromeComponent>;
}): void {
    for (const [name, component] of Object.entries(chrome.layouts ?? {})) {
        registerLayout(name, component);
    }

    for (const [name, component] of Object.entries(chrome.templates ?? {})) {
        registerTemplate(name, component);
    }
}

/**
 * A host registration wins over the packaged one, so overriding `DocsLayout` is one `registerLayout`
 * call and never a de-registration. The packaged map is consulted HERE rather than registered at
 * import time — see `builtins.ts` for the tree-shaking failure that forced it.
 */
export function resolveLayout(name: string | null | undefined): ChromeComponent | null {
    return name ? (layouts.get(name) ?? BUILTIN_LAYOUTS[name] ?? null) : null;
}

export function resolveTemplate(name: string | null | undefined): ChromeComponent | null {
    return name ? (templates.get(name) ?? BUILTIN_TEMPLATES[name] ?? null) : null;
}

/**
 * Every resolvable name — packaged first, then whatever the host added. This is the list
 * `beam.ux.chrome.registered` has to agree with, and the reason `BeamUxChromeAudit` reads that config
 * key at all: PHP cannot see this map.
 */
export function registeredChromeNames(): { layouts: string[]; templates: string[] } {
    return {
        layouts: [...new Set([...Object.keys(BUILTIN_LAYOUTS), ...layouts.keys()])],
        templates: [...new Set([...Object.keys(BUILTIN_TEMPLATES), ...templates.keys()])],
    };
}

/** Test seam. Never called by the page — a registry that could be emptied at runtime is a blank page. */
export function clearChromeRegistry(): void {
    layouts.clear();
    templates.clear();
}
