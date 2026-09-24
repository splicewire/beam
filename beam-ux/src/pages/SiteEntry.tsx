import { Head } from '@inertiajs/react';
import { useMemo, type ReactNode } from 'react';
import { EntryBody } from '../site/EntryBody.js';
import { ManifestTable } from '../site/ManifestTable.js';
import { SiteNav } from '../site/SiteNav.js';
import { ArtifactChrome } from '../docs/ArtifactChrome.js';
import { entryPageConfig } from '../docs/config.js';
import { resolveLayout, resolveTemplate } from '../docs/registry.js';
import { ProseTemplate } from '../docs/templates.js';
import type {
    ChromeArtifactsPayload,
    ChromeComponent,
    ChromeProps,
    EntryArtifactPayload,
    EntryPayload,
} from '../docs/types.js';
import type { SiteNavData } from '../site/types.js';

/**
 * **The packaged public entry page** — the host half of ADR-0209's renderer, shipped (ADR-0213 §3).
 *
 * `resources/js/pages/site/entry.tsx` existed FIVE times before this file: 84 byte-identical lines in
 * each of three starters, 262 independently grown on `splicewire/www`, 285 in `splicewire-app`. The
 * three long copies had each re-derived the artifact loader, and two of them still carried the version
 * of it that predates `<EntryBody>` — including an `<MDXProvider>` wrapper that is inert, because the
 * compiler runs without `providerImportSource` and the body takes its components as a prop. That is
 * ticket 11's rule with five instances: a fix written at the host is a fix the next host needs again.
 *
 * A host resolves Inertia pages from its own `import.meta.glob` first and this map second, so
 * *overriding* is still "put a file at `pages/site/entry.tsx`" — no publish step and no opt-out flag —
 * and *taking the default* is deleting that file.
 *
 * ## Where the host's half arrives from
 *
 * Not from props: the server composes those. Everything host-shaped — the component map, the router's
 * `<Link>`, the providers, the chrome slots, the classes carrying the palette — comes through
 * {@link configureEntryPage}, called once in `app.tsx`. See `../docs/config.ts` for why that is the
 * only channel available.
 *
 * ## Chrome
 *
 * `entry.layout` / `entry.template` arrive RESOLVED (the server walked the containment chain it was
 * already holding). A name resolves against the registry first, then as **another entry's slug** (§7)
 * — for which the server also sends that entry's artifact address under `chrome`, and the page nests
 * it ({@link ArtifactChrome}). A name that is neither falls back rather than crashing, and
 * `BeamUxChromeAudit` is what names it — a page that 500s because someone typo'd a layout is a worse
 * failure than one that renders plainly and is reported.
 *
 * The entry half was declared in the ADR, promised by the audit, and absent from this page for its
 * first month: the audit passed `www`'s five `layout: site` rows by slug while this line read the
 * registry and fell through to nothing (beam-docs-satellite 55). A declared resolution with no
 * consumer is the estate's most expensive shape, so the consumer is here rather than a wider audit.
 *
 * The template default is `ProseTemplate`, which is what all five copies did with a className list.
 * The layout default is *nothing*: today's hosts wrap this page in their own `SiteLayout` through
 * `app.tsx`, so defaulting to `DocsLayout` would put a docs rail on a marketing page on every host
 * that upgrades.
 *
 * ## The page-props passthrough (§6)
 *
 * A compiled artifact is a static module addressed by body hash, so there is nowhere in it for a
 * per-request value and a screen component fetches its own data. The escape hatch for the cases where
 * a round trip is silly (the current user) is that the whole Inertia page-props object reaches the
 * body under one well-known name — `page`.
 */

export type SiteEntryProps = {
    entry: EntryPayload;
    artifact: EntryArtifactPayload;
    nav: SiteNavData | null;
    /** Artifact addresses for chrome that resolved to another entry (§7). Absent from older servers. */
    chrome?: ChromeArtifactsPayload | null;
    /** Whatever else the host shares (auth, ziggy, flash) — passed through to the body under `page`. */
    [key: string]: unknown;
};

/** A layout that declares nothing frames nothing. Not a component, so it adds no element to the DOM. */
function Passthrough({ children }: ChromeProps) {
    return <>{children}</>;
}

export default function SiteEntry(props: SiteEntryProps) {
    const { entry, artifact, nav } = props;
    const config = entryPageConfig();

    // `<SiteNav>` is the one contributed component that needs DATA a body cannot pass: the projection
    // arrives as a page prop, while a body only ever writes `<SiteNav rootPath="/docs" />`. Unbound it
    // reads an absent `nav` and renders nothing at all — which is what beam-ux's own seeded docs index
    // did, silently, on every host until ticket 08 caught it.
    //
    // Host and capability components are spread last, preserving generic defaults not overridden.
    const components = useMemo(
        () => ({
            ManifestTable,
            SiteNav: (navProps: Parameters<typeof SiteNav>[0]) => (
                <SiteNav nav={nav} linkComponent={config.linkComponent} {...navProps} />
            ),
            ...(config.components ?? {}),
        }),
        [nav, config.components, config.linkComponent],
    );

    // §7's order, per axis: a registered component, then the named entry's artifact, then the HOST's
    // default, then the packaged fallback. The host-default hop is beam-docs-satellite 55 Q3: a name
    // that resolves to neither a component nor a nestable entry used to defeat `config.defaultLayout`
    // as well, so a typo'd slug rendered BARE and looked like a deliberate bare page. A host that
    // declares a default has said what "nothing better" means; `BeamUxChromeAudit` still names the
    // miss, and now the mistake is visible as chrome-that-was-not-asked-for rather than as nothing.
    const declaredLayout = resolveLayout(entry.layout ?? config.defaultLayout);
    const layoutArtifact = declaredLayout ? null : (props.chrome?.layout ?? null);
    const Layout = declaredLayout ?? (layoutArtifact ? null : resolveLayout(config.defaultLayout));
    const declaredTemplate = resolveTemplate(entry.template ?? config.defaultTemplate ?? 'ProseTemplate');
    const templateArtifact = declaredTemplate ? null : (props.chrome?.template ?? null);
    const Template =
        declaredTemplate ?? (templateArtifact ? null : resolveTemplate(config.defaultTemplate));

    const slots = typeof config.slots === 'function' ? config.slots(entry) : config.slots;

    const chrome: Omit<ChromeProps, 'children'> = {
        entry,
        nav,
        linkComponent: config.linkComponent,
        currentHref: entry.url ?? undefined,
        slots,
        classNames: config.classNames,
    };

    const frame = (
        Component: ChromeComponent | null,
        chromeArtifact: EntryArtifactPayload | null,
        fallback: ChromeComponent,
        children: ReactNode,
    ) => {
        if (Component) {
            return <Component {...chrome}>{children}</Component>;
        }

        if (chromeArtifact?.url) {
            return (
                <ArtifactChrome artifact={chromeArtifact} components={components} {...chrome}>
                    {children}
                </ArtifactChrome>
            );
        }

        const Fallback = fallback;

        return <Fallback {...chrome}>{children}</Fallback>;
    };

    // The body region is where an author's in-place editor goes (`EntryPageConfig.editableBody`): inside
    // the resolved layout and template, in place of the compiled body, never beside the page.
    const EditableBody = config.editableBody;
    const editable = (body: ReactNode) =>
        EditableBody ? <EditableBody entry={entry}>{body}</EditableBody> : body;

    const page = (
        <>
            <Head title={entry.title ?? entry.slug} />

            {frame(
                Layout,
                layoutArtifact,
                Passthrough,
                frame(
                    Template,
                    templateArtifact,
                    ProseTemplate,
                    editable(<EntryBody artifact={artifact} components={components} bodyProps={{ page: props }} />),
                ),
            )}
        </>
    );

    return <>{config.wrap ? config.wrap(page) : page}</>;
}
