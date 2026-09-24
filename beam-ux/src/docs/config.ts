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
 * providers, a plain `<a>`, and generic site components already mapped. That is what
 * makes *deleting* `pages/site/entry.tsx` the way a host takes the default (§3) rather than a
 * migration.
 */
export type EntryPageConfig = {
    /**
     * Components an authored body may name. Host entries override the generic defaults. Optional
     * capabilities contribute their components here after the host configures the page.
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
    /**
     * The host's IN-PLACE EDITOR seam for the body region. The page renders the compiled body as this
     * component's `children`; a host with an authoring layer returns its editor in their place while an
     * author is editing, and `children` otherwise. Absent ⇒ the body always renders as read.
     *
     * Why a slot and not the authoring host's generic inspector: that inspector is mounted BESIDE the
     * page, so on a rendered entry the author got the unchanged read page with a second, unframed editor
     * stacked under the footer — beam.test's `/about`, 2026-09-24 ("Edit Content doesn't work"). A
     * hand-written page (`site/home`) never had the problem because it puts the editor where its content
     * goes; this is the same placement for every rendered entry, inside its resolved layout and template.
     * The package still imports no editor (§2 invariant ii) — which editor, and for which formats, is
     * the host's call.
     */
    editableBody?: ComponentType<{ entry: EntryPayload; children: ReactNode }>;
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
