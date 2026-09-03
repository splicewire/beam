import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// `<Head>` reads Inertia's head manager off the app context `createInertiaApp` installs, so it throws
// outside a mounted Inertia app. Mounting one to assert chrome COMPOSITION would be testing Inertia;
// the title itself is asserted where it belongs (the browser check on a real host, ticket 26's
// acceptance bar). Only the head manager is stubbed — nothing else in the module is touched.
vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title?: string }) => <title>{title}</title>,
}));
// An entry-backed chrome (ADR-0213 §7) is a compiled artifact the page IMPORTS by URL. jsdom cannot
// `import()` a route, so the loader is stubbed at the one seam the page reaches it through: a known
// address resolves to a body that frames its children, an unknown one fails exactly as the real
// loader does. `EntryBody`'s own internal call is untouched — the page body still reports uncompiled.
vi.mock('../site/EntryBody.js', async (importOriginal) => {
    const original = await importOriginal<typeof import('../site/EntryBody.js')>();
    const shells: Record<string, string> = {
        '/artifacts/site-shell/v1.js': 'site-shell',
        '/artifacts/site-tpl/v1.js': 'site-tpl',
    };

    return {
        ...original,
        useEntryArtifact: (url: string) =>
            shells[url]
                ? {
                      Body: ({ children }: { children?: unknown }) => (
                          <div data-entry-chrome={shells[url]}>{children as never}</div>
                      ),
                      failed: false,
                  }
                : { Body: null, failed: true },
    };
});
import { RealmNav } from '../nav/RealmNav.js';
import SiteEntry from '../pages/SiteEntry.js';
import { configureEntryPage, resetEntryPageConfig } from './config.js';
import { DocsLayout } from './DocsLayout.js';
import {
    clearChromeRegistry,
    registerChrome,
    registeredChromeNames,
    resolveLayout,
    resolveTemplate,
} from './registry.js';
import { SpreadTemplate } from './templates.js';

/**
 * ADR-0213 §3/§4/§7/§8, the client half. The cases are the ones the ADR argued for and the ones the
 * five host copies of this page got wrong, not incidental coverage.
 */

beforeEach(() => {
    // Emptied, NOT seeded: the packaged chrome must resolve with an empty host registry, because
    // `sideEffects: false` means a bundler may drop an import-time registration — and did, on the beam
    // starter, where `/docs/mcp` rendered with its inherited `DocsLayout` resolving to nothing behind
    // a 200. Seeding here would have hidden exactly that.
    clearChromeRegistry();
    resetEntryPageConfig();
});

const entry = {
    id: 'e1',
    slug: 'api-keys',
    title: 'API keys',
    type: 'page',
    format: 'mdx',
    url: '/docs/api-keys',
    layout: null as string | null,
    template: null as string | null,
};

const artifact = { url: '', version: null };

describe('the chrome registry', () => {
    it('resolves a registered name and answers null for anything else', () => {
        expect(resolveLayout('DocsLayout')).toBe(DocsLayout);
        expect(resolveTemplate('SpreadTemplate')).toBe(SpreadTemplate);

        // Not "throw" and not "guess": an unresolvable name is a doctor finding (`BeamUxChromeAudit`),
        // and the page falls back rather than 500ing. A crash here would make a typo in a CMS field
        // take a docs site down.
        expect(resolveLayout('DcosLayout')).toBeNull();
        expect(resolveLayout(null)).toBeNull();
    });

    it('lets a host registration of the same name win over the packaged one', () => {
        const Custom = ({ children }: { children?: unknown }) => <div data-custom="">{children as never}</div>;
        registerChrome({ layouts: { DocsLayout: Custom as never } });

        expect(resolveLayout('DocsLayout')).toBe(Custom);
    });

    it('keeps layouts and templates in separate maps', () => {
        // One map keyed by name would let a `template: DocsLayout` typo resolve to a layout and render
        // chrome where a body belongs. Two maps make it a miss, and a miss is reported.
        expect(resolveTemplate('DocsLayout')).toBeNull();
        expect(resolveLayout('ProseTemplate')).toBeNull();

        expect(registeredChromeNames()).toEqual({
            layouts: ['DocsLayout'],
            templates: ['ProseTemplate', 'SpreadTemplate'],
        });
    });
});

describe('the packaged entry page', () => {
    it('frames the body in the resolved layout and template', () => {
        const { container } = render(
            <SiteEntry
                entry={{ ...entry, layout: 'DocsLayout', template: 'SpreadTemplate' }}
                artifact={artifact}
                nav={null}
            />,
        );

        // The layout put a rail and an on-this-page column on the page…
        expect(container.querySelector('aside[aria-label="Docs sections"]')).not.toBeNull();
        expect(container.querySelector('main')).not.toBeNull();
        // …and the SPREAD template framed the body full-bleed rather than in the reading measure.
        expect(container.querySelector('[data-beam-full-bleed]')).not.toBeNull();
        expect(container.querySelector('.beam-tpl-prose')).toBeNull();
        expect(container.querySelector('.beam-tpl-spread')).not.toBeNull();
    });

    it('defaults to the prose measure and to no layout at all', () => {
        // The template default is what all five host copies did with a className list. The LAYOUT
        // default is deliberately nothing: today's hosts wrap this page in their own SiteLayout via
        // app.tsx, so defaulting to DocsLayout would put a docs rail on every marketing page.
        const { container } = render(<SiteEntry entry={entry} artifact={artifact} nav={null} />);

        expect(container.querySelector('aside[aria-label="Docs sections"]')).toBeNull();
        expect(container.querySelector('[data-beam-prose]')?.className).toContain('beam-tpl-prose');

        // …and the measure is a real RULE, not a class name with nothing behind it. A host's Tailwind
        // does not scan node_modules, so the utility list the five host copies used renders
        // edge-to-edge the moment it ships inside a package — measured on the beam starter before this
        // became an injected stylesheet.
        expect(container.querySelector('style')?.textContent ?? '').toContain('--beam-measure');
    });

    it('falls back rather than crashing on a name nothing registers', () => {
        const { container } = render(
            <SiteEntry
                entry={{ ...entry, layout: 'DcosLayout', template: 'ProzeTemplate' }}
                artifact={artifact}
                nav={null}
            />,
        );

        expect(container.querySelector('[data-beam-prose]')).not.toBeNull();
    });

    it('falls to the host DEFAULT before the packaged fallback when a name resolves to nothing (55 Q3)', () => {
        // A host that declares a default has said what "nothing better" means. A typo'd slug that
        // rendered BARE would look like a deliberate bare page; rendering the host's default keeps the
        // mistake visible as chrome-that-was-not-asked-for while the audit's Warn names it.
        registerChrome({
            layouts: { HostShell: ({ children }) => <div data-host-shell>{children}</div> },
            templates: { HostTpl: ({ children }) => <div data-host-tpl>{children}</div> },
        });
        configureEntryPage({ defaultLayout: 'HostShell', defaultTemplate: 'HostTpl' });

        const { container } = render(
            <SiteEntry
                entry={{ ...entry, layout: 'DcosLayout', template: 'ProzeTemplate' }}
                artifact={artifact}
                nav={null}
            />,
        );

        expect(container.querySelector('[data-host-shell] [data-host-tpl] [data-beam-entry-uncompiled]')).not.toBeNull();
        expect(container.querySelector('.beam-tpl-prose')).toBeNull();
    });

    it('still reaches the packaged fallback when the host default is itself unresolvable', () => {
        configureEntryPage({ defaultLayout: 'AlsoMissing', defaultTemplate: 'AlsoMissing' });

        const { container } = render(
            <SiteEntry
                entry={{ ...entry, layout: 'DcosLayout', template: 'ProzeTemplate' }}
                artifact={artifact}
                nav={null}
            />,
        );

        expect(container.querySelector('[data-beam-prose] [data-beam-entry-uncompiled]')).not.toBeNull();
    });

    it('nests the body in another ENTRY when the declared layout is that entry\'s slug (§7)', () => {
        // `www` declares `layout: site` on five rows and the audit passed them by slug, while this page
        // fell through to Passthrough — the declared resolution had no consumer (ticket 55). The server
        // now carries the named entry's artifact address, and the page nests it.
        const { container } = render(
            <SiteEntry
                entry={{ ...entry, layout: 'site-shell' }}
                artifact={artifact}
                nav={null}
                chrome={{ layout: { url: '/artifacts/site-shell/v1.js', version: 'v1' } }}
            />,
        );

        const shell = container.querySelector('[data-entry-chrome="site-shell"]');
        expect(shell).not.toBeNull();
        // The page body renders INSIDE the entry-backed layout, still through the packaged loader.
        expect(shell?.querySelector('[data-beam-entry-uncompiled]')).not.toBeNull();
    });

    it('nests the body in an entry-backed TEMPLATE the same way, in place of the prose default', () => {
        const { container } = render(
            <SiteEntry
                entry={{ ...entry, template: 'site-tpl' }}
                artifact={artifact}
                nav={null}
                chrome={{ template: { url: '/artifacts/site-tpl/v1.js', version: 'v1' } }}
            />,
        );

        expect(container.querySelector('[data-entry-chrome="site-tpl"] [data-beam-entry-uncompiled]')).not.toBeNull();
        expect(container.querySelector('.beam-tpl-prose')).toBeNull();
    });

    it('lets a registered name win over an entry artifact carrying the same name', () => {
        // Resolution order is registered first, THEN entry (§7): a host that registers `DocsLayout`
        // and also happens to have an entry with that slug gets the component, not the artifact.
        const { container } = render(
            <SiteEntry
                entry={{ ...entry, layout: 'DocsLayout' }}
                artifact={artifact}
                nav={null}
                chrome={{ layout: { url: '/artifacts/site-shell/v1.js', version: 'v1' } }}
            />,
        );

        expect(container.querySelector('aside[aria-label="Docs sections"]')).not.toBeNull();
        expect(container.querySelector('[data-entry-chrome]')).toBeNull();
    });

    it('never holds the body hostage to a chrome artifact that cannot load', () => {
        const { container } = render(
            <SiteEntry
                entry={{ ...entry, layout: 'site-shell' }}
                artifact={artifact}
                nav={null}
                chrome={{ layout: { url: '/artifacts/gone.js', version: 'v0' } }}
            />,
        );

        expect(container.querySelector('[data-entry-chrome]')).toBeNull();
        expect(container.querySelector('[data-beam-entry-uncompiled]')).not.toBeNull();
    });

    it('renders the uncompiled empty state through the packaged loader, not a host re-derivation', () => {
        // Three of the five host copies re-derived the artifact loader and two still carried the
        // version that predates <EntryBody>. The packaged page uses the one implementation, so the
        // operator-facing empty state is the same on every host.
        render(<SiteEntry entry={entry} artifact={artifact} nav={null} />);

        expect(screen.getByText(/has not been compiled yet/)).toBeTruthy();
    });

    it('lets the host wrap the page in its own providers', () => {
        configureEntryPage({
            wrap: (node) => <div data-host-provider="">{node}</div>,
            classNames: { root: 'host-root' },
        });

        const { container } = render(
            <SiteEntry entry={{ ...entry, layout: 'DocsLayout' }} artifact={artifact} nav={null} />,
        );

        expect(container.querySelector('[data-host-provider] .host-root')).not.toBeNull();
    });
});

describe('the rail reads nav_group', () => {
    it('renders an href-less heading that carries its members as a labelled group', () => {
        // This is exactly what beam-ux's PHP `NavProjector` emits for ADR-0213 §8 — a heading NavLink
        // with no href whose children are the grouped entries. Before this, `flat-with-headers` opened
        // a group and then dropped the heading's own children on the floor.
        const { container } = render(
            <RealmNav
                variant="flat-with-headers"
                items={[
                    { title: 'Overview', href: '/docs/overview' },
                    {
                        title: 'Concepts',
                        href: null,
                        children: [
                            { title: 'Agents', href: '/docs/agents' },
                            { title: 'Blocks', href: '/docs/blocks' },
                        ],
                    },
                ]}
            />,
        );

        expect(screen.getByText('Concepts')).toBeTruthy();
        expect(screen.getByText('Agents')).toBeTruthy();
        expect(screen.getByText('Blocks')).toBeTruthy();

        // The heading itself is not a link — visible, ordered, not addressable.
        expect(container.querySelector('a[href="/docs/overview"]')).not.toBeNull();
        expect([...container.querySelectorAll('a')].map((a) => a.textContent)).toEqual([
            'Overview',
            'Agents',
            'Blocks',
        ]);
    });
});

describe('DocsLayout', () => {
    it('rails the section the reader is in, not the whole realm', () => {
        // The projection is the realm's ENTIRE tree (one payload serving the header nav and the rail,
        // ADR-0210 §5), so a rail fed the raw root lists the marketing pages beside the guides.
        render(
            <DocsLayout
                entry={entry}
                currentHref="/docs/api-keys"
                nav={{
                    items: [
                        { title: 'Pricing', href: '/pricing' },
                        {
                            title: 'Docs',
                            href: '/docs',
                            children: [{ title: 'API keys', href: '/docs/api-keys' }],
                        },
                    ],
                }}
            >
                <p>body</p>
            </DocsLayout>,
        );

        expect(screen.getByText('API keys')).toBeTruthy();
        expect(screen.queryByText('Pricing')).toBeNull();
    });
});
