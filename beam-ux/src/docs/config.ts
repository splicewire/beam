import type { ComponentType, ReactNode } from 'react';
import type { LinkComponent } from '../site/types.js';
import type { ChromeSlots, EntryPayload } from './types.js';

/**
 * What the host tells the **packaged entry page** before the first render (ADR-0213 §3).
 *
 * A package-supplied Inertia page gets its props from the server, so there is no prop channel from
 * `app.tsx` into it. Everything that is the host's — the component map a body may reach for, the
 * router's `<Link>`, the providers the page must sit inside, the chrome slots, the classes that carry
 * the palette — arrives through this one call instead:
 *
 * ```ts
 * configureEntryPage({
 *     components: MDX_COMPONENTS,
 *     linkComponent: Link,
 *     wrap: (node) => <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>,
 *     slots: { header: <DocsHeader /> },
 * });
 * ```
 *
 * Everything is optional and the unconfigured defaults are the ones a fresh starter wants: no
 * providers, a plain `<a>`, and the two contributed reference components already mapped. That is what
 * makes *deleting* `pages/site/entry.tsx` the way a host takes the default (§3) rather than a
 * migration.
 */
export type EntryPageConfig = {
    /**
     * What a body may reach for — the contribution contract from the docs side (ADR-0210 §5). The
     * package merges its own two contributed surfaces (`ApiReference`, `ManifestTable`) UNDER this, so
     * a host overrides either by name (a themed `ApiReference`, say) without losing the other.
     */
    components?: Record<string, ComponentType<never>>;
    /** The host's router link. Absent ⇒ a plain `<a>`; the package imports no router (§2 invariant ii). */
    linkComponent?: LinkComponent;
    /**
     * Providers and outer chrome the page must render inside — a `QueryClientProvider`, a theme div.
     * A function rather than a component so a host composes several without a wrapper component each.
     */
    wrap?: (node: ReactNode) => ReactNode;
    /** Host chrome a layout places but never authors. May be a function of the entry. */
    slots?: ChromeSlots | ((entry: EntryPayload) => ChromeSlots);
    /** Per-part class overrides handed to the resolved layout and template — this is the palette seam. */
    classNames?: Record<string, string | undefined>;
    /**
     * The template used when an entry's chain declares none. Defaults to `ProseTemplate`, which is what
     * all five host copies of this page did before there was a column to say so.
     */
    defaultTemplate?: string | null;
    /** The layout used when an entry's chain declares none. Defaults to none — the body renders bare. */
    defaultLayout?: string | null;
};

let config: EntryPageConfig = {};

export function configureEntryPage(next: EntryPageConfig): void {
    config = { ...config, ...next };
}

export function entryPageConfig(): EntryPageConfig {
    return config;
}

/** Test seam. */
export function resetEntryPageConfig(): void {
    config = {};
}
