import * as react from 'react';
import { ComponentType, ReactNode } from 'react';
import { C as ChromeProps, E as EntryArtifactPayload, a as ChromeComponent, b as ChromeSlots, c as EntryPayload } from './types-CZ-E_FpE.js';
export { d as ChromeArtifactsPayload } from './types-CZ-E_FpE.js';
import { L as LinkComponent } from './types-Bzws8ncP.js';

/**
 * A layout or template that is **another entry** — the second half of ADR-0213 §7's resolution order
 * (*registered component first, then another entry's slug*), which the registry alone could never
 * satisfy: "the client imports the page artifact and its layout artifact and nests them."
 *
 * The named entry's body compiled to its own artifact exactly like a page's, and it frames whatever it
 * receives as `children` — an MDX layout is a body that writes `{props.children}` where the page goes.
 * It gets the same {@link ChromeProps} a registered component gets, plus the host's component map, so a
 * shell authored as an entry can place `<SiteNav />` the way a page body can.
 *
 * **The body is never held hostage by its chrome.** While the artifact is in flight, and if it never
 * arrives, the children render unframed — the same posture as a registered name nothing resolves. A
 * shell that fails to load must degrade to the page it was framing, not to a blank; the doctor
 * (`BeamUxChromeAudit`) is what names the missing artifact, and the page is what the reader came for.
 */
type ArtifactChromeProps = ChromeProps & {
    artifact: EntryArtifactPayload;
    /** The host's contribution map, so an entry-authored shell can reach the same components a body can. */
    components?: Record<string, ComponentType<never>>;
};
declare function ArtifactChrome({ artifact, components, children, ...chrome }: ArtifactChromeProps): react.JSX.Element;

/**
 * The two shipped templates — ADR-0213 §1's CSS hack, promoted to data.
 *
 * Every one of the five host copies of `site/entry.tsx` framed its body with the same rules: a reading
 * measure applied PER CHILD plus a `data-beam-full-bleed` per-child opt-out so the API reference could
 * span the viewport. That is a template selection — same layout, different fill — written as a
 * stylesheet because there was nowhere to put it. Now there is: an entry declares
 * `template: SpreadTemplate` and the rules stop being a decision each host re-derives.
 *
 * Both keep `<Prose>` (the typographic SCALE, every value a `--beam-*` token with a plain fallback)
 * and neither names a colour or a font. The measure is a *dimension*, not a look, which is why it may
 * live here while the palette may not (ADR-0213 §2 invariant i). See `css.ts` for why the rules are an
 * injected string rather than Tailwind utilities — the short version is that a host's Tailwind does not
 * scan `node_modules`, so a utility class shipped in a package's bundle has no rule behind it.
 */
/**
 * A guide: a readable column, with any child that marks itself `data-beam-full-bleed` allowed out of
 * it. The default for a `page` entry that declares no template, because it is what all five host
 * copies did.
 */
declare function ProseTemplate({ children, classNames }: ChromeProps): react.JSX.Element;
/**
 * A whole application rather than an article — the API reference, a dashboard, an editor. No measure,
 * no page padding, and the scale still applies so any prose inside it is legible.
 *
 * `data-beam-full-bleed` is stamped on the wrapper rather than left to the body, so an entry that
 * declares this template gets the full viewport whether or not whoever authored its body remembered
 * the attribute. The attribute survives on children too, because a `ProseTemplate` page may still
 * contain one full-bleed child and that case is what it is for.
 */
declare function SpreadTemplate({ children, classNames }: ChromeProps): react.JSX.Element;

declare function registerLayout(name: string, component: ChromeComponent): void;
declare function registerTemplate(name: string, component: ChromeComponent): void;
/** Register several at once — the shape a host's `app.tsx` reaches for. */
declare function registerChrome(chrome: {
    layouts?: Record<string, ChromeComponent>;
    templates?: Record<string, ChromeComponent>;
}): void;
/**
 * Explicit registrations win over generic builtins. Capability packages register their own layouts;
 * this resolver never imports optional presentation packages.
 */
declare function resolveLayout(name: string | null | undefined): ChromeComponent | null;
declare function resolveTemplate(name: string | null | undefined): ChromeComponent | null;
/**
 * Every resolvable name — packaged first, then whatever the host added. This is the list
 * `beam.ux.chrome.registered` has to agree with, and the reason `BeamUxChromeAudit` reads that config
 * key at all: PHP cannot see this map.
 */
declare function registeredChromeNames(): {
    layouts: string[];
    templates: string[];
};
/** Test seam. Never called by the page — a registry that could be emptied at runtime is a blank page. */
declare function clearChromeRegistry(): void;

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
type EntryPageConfig = {
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
    editableBody?: ComponentType<{
        entry: EntryPayload;
        children: ReactNode;
    }>;
};
declare function configureEntryPage(next: EntryPageConfig): void;
declare function entryPageConfig(): EntryPageConfig;
/** Test seam. */
declare function resetEntryPageConfig(): void;

/** Generic chrome defaults. Capability packages register their layouts explicitly. */
declare const BUILTIN_LAYOUTS: Record<string, ChromeComponent>;
declare const BUILTIN_TEMPLATES: Record<string, ChromeComponent>;

/**
 * The structural CSS the `/docs` chrome injects, as a **string**.
 *
 * ## Why not Tailwind utility classes
 *
 * The first cut of these components carried the class list the five host copies of `site/entry.tsx`
 * used verbatim — `[&>*]:mx-auto [&>*]:max-w-3xl [&>*]:px-6` and friends. It rendered edge-to-edge on
 * the first host that tried it, and the reason is structural rather than a typo: a host's Tailwind
 * scans the host's own sources, not `node_modules/@splicewire/beam-ux/dist`, so a utility that exists
 * only inside a package's bundle is a class name with no rule behind it. Lifting a component into a
 * package therefore silently strips its styling unless the host adds a `@source` line — which is
 * exactly the "a fix written at the host is a fix the next host will need again" shape ticket 26 is
 * about, one layer down.
 *
 * `<Prose>` already settled this for this package: CSS as a string the component injects, because the
 * package ships no `.css` files and is `sideEffects: false`, so a stylesheet import is something a
 * bundler is entitled to drop. These follow it.
 *
 * ## Every value is a token with a plain fallback
 *
 * Same contract as `PROSE_CSS`: the package picks the ARRANGEMENT (a measure, a rail width, a gutter);
 * the host picks what those are by redefining `--beam-*` on any ancestor, and nothing here names a
 * colour or a font. The defaults are the numbers the host copies had hardcoded — `48rem` for
 * Tailwind's `max-w-3xl`, `1.5rem` for `px-6`, `3rem`/`4rem` for `pt-12`/`pb-16` — so the lift changes
 * no pixel on a host that redefines nothing.
 */
declare const DOCS_TEMPLATE_CSS = "\n.beam-tpl-prose { width: 100%; }\n/* The child box IS the text column: the gutter comes off its width rather than going on as padding-inline, because a\n   prose block's own padding (a list's indent, a code block's or blockquote's inset) is more specific and would replace\n   it, leaving list markers, the quote bar and the code block outside the column (launch ticket 05 item 6). Paragraphs\n   and headings sit exactly where they did. Scoped with the Prose root's attribute so it outranks a prose element rule\n   that sets its own width (Prose's table rule, width 100%), which would otherwise fill the template, not the column. */\n.beam-tpl-prose[data-beam-prose] > * {\n  margin-inline: auto;\n  width: calc(100% - 2 * var(--beam-gutter, 1.5rem));\n  max-width: calc(var(--beam-measure, 48rem) - 2 * var(--beam-gutter, 1.5rem));\n}\n/* A full-bleed child is a whole application rather than an article \u2014 it owns its own edges. */\n.beam-tpl-prose > [data-beam-full-bleed] {\n  max-width: none;\n  width: 100%;\n}\n.beam-tpl-prose > *:first-child { padding-block-start: var(--beam-page-top, 3rem); }\n.beam-tpl-prose > *:last-child { padding-block-end: var(--beam-page-bottom, 4rem); }\n.beam-tpl-prose > [data-beam-full-bleed]:first-child { padding-block-start: 0; }\n.beam-tpl-prose > [data-beam-full-bleed]:last-child { padding-block-end: 0; }\n\n.beam-tpl-spread { width: 100%; }\n";

export { ArtifactChrome, type ArtifactChromeProps, BUILTIN_LAYOUTS, BUILTIN_TEMPLATES, ChromeComponent, ChromeProps, ChromeSlots, DOCS_TEMPLATE_CSS, EntryArtifactPayload, type EntryPageConfig, EntryPayload, ProseTemplate, SpreadTemplate, clearChromeRegistry, configureEntryPage, entryPageConfig, registerChrome, registerLayout, registerTemplate, registeredChromeNames, resetEntryPageConfig, resolveLayout, resolveTemplate };
