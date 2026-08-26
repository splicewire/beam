import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import { ApiReference } from '../site/ApiReference.js';
import { EntryBody } from '../site/EntryBody.js';
import { ManifestTable } from '../site/ManifestTable.js';
import { SiteNav } from '../site/SiteNav.js';
import { entryPageConfig } from '../docs/config.js';
import { resolveLayout, resolveTemplate } from '../docs/registry.js';
import { ProseTemplate } from '../docs/templates.js';
import type { ChromeProps, EntryArtifactPayload, EntryPayload } from '../docs/types.js';
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
 * already holding). A name resolves against the registry; an unresolvable one falls back rather than
 * crashing, and `BeamUxChromeAudit` is what names it — a page that 500s because someone typo'd a
 * layout is a worse failure than one that renders plainly and is reported.
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
    // The host's map is spread LAST so a host overrides `ApiReference` (with its own themed, patched,
    // locally-bundled one) without having to re-supply `ManifestTable`.
    const components = useMemo(
        () => ({
            ApiReference,
            ManifestTable,
            SiteNav: (navProps: Parameters<typeof SiteNav>[0]) => (
                <SiteNav nav={nav} linkComponent={config.linkComponent} {...navProps} />
            ),
            ...(config.components ?? {}),
        }),
        [nav, config.components, config.linkComponent],
    );

    const Layout = resolveLayout(entry.layout ?? config.defaultLayout) ?? Passthrough;
    const Template = resolveTemplate(entry.template ?? config.defaultTemplate ?? 'ProseTemplate') ?? ProseTemplate;

    const slots = typeof config.slots === 'function' ? config.slots(entry) : config.slots;

    const chrome: Omit<ChromeProps, 'children'> = {
        entry,
        nav,
        linkComponent: config.linkComponent,
        currentHref: entry.url ?? undefined,
        slots,
        classNames: config.classNames,
    };

    const page = (
        <>
            <Head title={entry.title ?? entry.slug} />

            <Layout {...chrome}>
                <Template {...chrome}>
                    <EntryBody artifact={artifact} components={components} bodyProps={{ page: props }} />
                </Template>
            </Layout>
        </>
    );

    return <>{config.wrap ? config.wrap(page) : page}</>;
}
