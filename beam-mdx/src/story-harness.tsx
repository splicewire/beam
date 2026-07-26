// =============================================================================
// beam-mdx Storybook harness (component-seams ticket 40) — shared, NON-shipped.
//
// The beam-mdx kit + citation components render inside a docs-site article: their skin
// lives entirely in `.site-prose` + `kit.css` (token-driven, `bkit-*` classes scoped
// UNDER `.site-prose`). So every story mounts under `.site-prose` — nothing in the kit
// draws correctly outside it (the `bkit-*` rules are `.site-prose .bkit-*`). This harness
// provides that mount, the standalone `--sr-*` token seed (story-harness.css), and the
// fixtures the citation kit reads from context/page-props.
//
// Mirrors the ticket 15/16 shared-harness pattern (one non-shipped `story-harness.tsx`
// per package, excluded from `dist` by the tsup index-only entry). Imported by every
// beam-mdx `*.stories.tsx`; never by shipped source.
// =============================================================================
import type { ReactNode } from 'react';

import { BeamMdxProvider } from './context';
import type { ContentModule } from './content';
import type { Reference } from './references';

import './story-harness.css';

// The beam Storybook aliases `@inertiajs/react` to a stub (.storybook/inertia-react.stub.tsx)
// whose `usePage()` reads its page props off this `globalThis` slot. The harness writes the
// slot (no cross-module import — the stub lives outside beam-mdx's `src` tsconfig scope), so
// the citation kit's `useLinks()` → `usePage().props.links` resolves the fixture links at
// render time. The two modules meet ONLY on this string key.
const PAGE_KEY = '__beamMdxStubPage__';

function setStubPage(props: Record<string, unknown>, url = '/'): void {
    (globalThis as Record<string, unknown>)[PAGE_KEY] = { props, url };
}

/**
 * Mount a story under `.site-prose` (+ the `bmdx-story` island), the real docs-article
 * context every kit/citation component needs to render skinned. Use as the decorator or
 * wrap directly.
 */
export function SiteProse({ children }: { children: ReactNode }) {
    return (
        <div className="site-prose bmdx-story">{children}</div>
    );
}

/** Storybook decorator form of {@link SiteProse}. */
export const withSiteProse = (Story: () => ReactNode) => (
    <SiteProse>
        <Story />
    </SiteProse>
);

// --- Citation-kit fixtures ----------------------------------------------------------
// `Ref`/`Receipts` read the references manifest from `<BeamMdxProvider>` and the env-driven
// `links` base-URL map from Inertia page props. `Content` reads the resolver from the
// provider. These fixtures stand in for a satellite's real manifest/module-map (the ticket:
// "story these over fixture content/manifests … the way ticket 21 fixtured blockdoc").

/** A fixture `links` map (site key → base URL) for the stubbed page props. */
export const fixtureLinks = {
    guides: 'https://guides.splicewire.test',
    stories: 'https://stories.splicewire.test',
    insights: 'https://insights.splicewire.test',
};

/** A fixture citation manifest exercising every kind + both statuses. */
export const fixtureReferences: Reference[] = [
    {
        key: 'binding-network-locality',
        site: 'guides',
        path: '/guides/binding-is-network-locality',
        kind: 'guide',
        title: 'Binding is network locality',
        summary: 'Why a binding is a locality claim, not a transport detail.',
        status: 'live',
    },
    {
        key: 'acme-migration',
        site: 'stories',
        path: '/stories/acme-cuts-latency',
        kind: 'story',
        title: 'Acme cuts p99 latency 40%',
        summary: 'A customer story on the locality migration in production.',
        status: 'live',
    },
    {
        key: 'retrieval-first',
        site: 'insights',
        path: '/insights/retrieval-first',
        kind: 'insight',
        title: 'Retrieval-first architectures',
        summary: 'An insight piece on retrieval as the primary seam.',
        status: 'live',
    },
    {
        // A pending entry — degrades to plain child text inline, dropped from Receipts.
        key: 'unpublished-draft',
        site: 'guides',
        path: '/guides/not-yet',
        kind: 'guide',
        title: 'Not yet published',
        status: 'pending',
    },
];

/**
 * A fixture content resolver for `<Content name>` — an in-memory module map, standing in
 * for a satellite's `virtual:beam-mdx/content` map (the ticket: no real build-time module
 * map). Returns simple prose components so the embed reads on-brand under `.site-prose`.
 */
const fixtureModules: Record<string, ContentModule> = {
    'fragments/callout-note': {
        Component: () => (
            <p>
                This is an embedded fragment resolved by <code>&lt;Content name&gt;</code>
                — a shared block of prose dropped inline, bare, its own layout ignored.
            </p>
        ),
        frontmatter: { title: 'Callout note fragment', layout: 'bare' },
    },
    'fragments/pricing-blurb': {
        Component: () => (
            <p>
                Beam is the <strong>free-tier arm</strong> of Splicewire — this shared
                blurb rides one file, embedded across many pages.
            </p>
        ),
        frontmatter: { title: 'Pricing blurb', layout: 'bare' },
    },
};

/** The fixture `resolve` a `<BeamMdxProvider>` supplies to `<Content>`. */
export function fixtureResolve(name: string): ContentModule | undefined {
    return fixtureModules[name];
}

/**
 * Wrap the citation/embed surfaces in their runtime context: seed the stubbed Inertia page
 * props (the `links` map) and provide the manifest + resolver via `<BeamMdxProvider>`. Sets
 * the page synchronously at module-eval so the first render already sees it.
 *
 * @param references — override the fixture manifest (e.g. an empty array to prove no-op paths).
 */
export function CitationHarness({
    references = fixtureReferences,
    links = fixtureLinks,
    children,
}: {
    references?: Reference[];
    links?: Record<string, string>;
    children: ReactNode;
}) {
    setStubPage({ links });

    return (
        <BeamMdxProvider references={references} resolve={fixtureResolve}>
            {children}
        </BeamMdxProvider>
    );
}
