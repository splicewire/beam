/**
 * A 45-page Site map fixture in the server's wire shapes (`beam-ux-site-map` rows, `traces` rows), for stories and
 * tests. It carries every state the map draws: drafts, never-published pages, members-only and unlisted pages, a page
 * under a hidden page, a Record Page, missing / changed / uncommitted files, and old addresses that answer directly,
 * through a chain (information only), loop, dead-end, leave the site or cover a prefix.
 */
import type { RedirectTrace, SiteMapFile, SiteMapInbound, SiteMapPage, SitePart } from './types';

type Spec = {
    pub?: `live:${number}` | `draft:${number}` | `unpublished:${number}`;
    search?: SiteMapPage['search']['reason'];
    urls?: number;
    file?: Partial<SiteMapFile> | null;
};

function page(id: string, title: string, url: string, parentId: string | null, spec: Spec = {}, order = 0): SiteMapPage {
    const [state, n] = (spec.pub ?? 'live:12').split(':') as ['live' | 'draft' | 'unpublished', string];
    const v = Number(n);
    const reason = spec.search ?? (state === 'unpublished' ? 'unpublished' : 'listed');
    const listed = reason === 'listed' || reason === 'record-page';
    const path = `resources/beam-ux/site/page${url === '/' ? '/home' : url}.${url.startsWith('/docs/beam') || url.startsWith('/blog/') ? 'mdx' : 'tsx'}`;
    return {
        id, title, slug: id, parentId, segment: url === '/' ? '/' : url.split('/').pop() ?? null, navOrder: order, url,
        publishedReadable: state === 'unpublished' ? null : `v${v}`,
        headReadable: state === 'draft' ? `v${v + 1}` : `v${v}`,
        draftPending: state === 'draft',
        search: { listed, reason, urlCount: listed ? spec.urls ?? 1 : 0 },
        file: spec.file === null ? null : {
            state: 'clean', path, exists: true, lastModifiedAt: 'Nov 4, 09:12', repairMemberId: `m-${id}`, repairReleaseId: 'rel-autumn', repairBlocked: null,
            ...spec.file,
        },
        redirects: { count: 0, maxHops: 0, attention: null, inbound: [] },
    };
}

const missing = { state: 'not-written', exists: false, lastModifiedAt: null } as const;
const changed = { state: 'modified', lastModifiedAt: 'today 09:12' } as const;

export const FIXTURE_SITE = 'splicewire.com';

const PAGE_LIST: SiteMapPage[] = [
    page('home', 'Home', '/', null, { pub: 'live:31' }),
    page('product', 'Product', '/product', 'home', { pub: 'live:9' }, 1),
    page('canvas', 'Canvas editor', '/product/canvas', 'product', { pub: 'draft:6' }, 1),
    page('releases', 'Releases', '/product/releases', 'product', { pub: 'live:4' }, 2),
    page('workflows', 'Workflows', '/product/workflows', 'product', { pub: 'live:3' }, 3),
    page('integrations', 'Integrations', '/product/integrations', 'product', { pub: 'live:7' }, 4),
    page('security', 'Security', '/product/security', 'product', { pub: 'live:2', file: missing }, 5),
    page('pricing', 'Pricing', '/pricing', 'home', { pub: 'draft:12', file: changed }, 2),
    page('customers', 'Customers', '/customers', 'home', { pub: 'live:5' }, 3),
    page('audiostud', 'Audiostud', '/customers/audiostud', 'customers', { pub: 'live:3' }, 1),
    page('fable', 'Fable', '/customers/fable', 'customers', { pub: 'live:2' }, 2),
    page('standwell', 'Standwell', '/customers/standwell', 'customers', { pub: 'live:1' }, 3),
    page('docs', 'Docs', '/docs', 'home', { pub: 'live:14' }, 4),
    page('start', 'Getting started', '/docs/getting-started', 'docs', { pub: 'live:6' }, 1),
    page('install', 'Install', '/docs/getting-started/install', 'start', { pub: 'live:8' }, 1),
    page('first-site', 'Your first site', '/docs/getting-started/first-site', 'start', { pub: 'live:5' }, 2),
    page('deploy', 'Deploy', '/docs/getting-started/deploy', 'start', { pub: 'live:3' }, 3),
    page('beam', 'Beam', '/docs/beam', 'docs', { pub: 'live:4' }, 2),
    page('particles', 'Particles', '/docs/beam/particles', 'beam', { pub: 'draft:11' }, 1),
    page('resources', 'Resources', '/docs/beam/resources', 'beam', { pub: 'live:7' }, 2),
    page('ops', 'Operations', '/docs/beam/operations', 'beam', { pub: 'live:5' }, 3),
    page('realms', 'Realms', '/docs/beam/realms', 'beam', { pub: 'live:3', file: changed }, 4),
    page('frame', 'Frame', '/docs/frame', 'docs', { pub: 'live:4' }, 3),
    page('forms', 'Forms', '/docs/frame/forms', 'frame', { pub: 'live:9' }, 1),
    page('lists', 'Lists', '/docs/frame/lists', 'frame', { pub: 'live:4' }, 2),
    page('widgets', 'Widgets', '/docs/frame/widgets', 'frame', { pub: 'live:2', file: { ...missing, repairMemberId: null, repairReleaseId: null, repairBlocked: 'pin-moved' } }, 3),
    page('changelog', 'Changelog', '/docs/changelog', 'docs', { pub: 'live:40' }, 4),
    page('blog', 'Blog', '/blog', 'home', { pub: 'live:3' }, 5),
    page('post', 'Blog post', '/blog/{slug}', 'blog', { pub: 'live:2', search: 'record-page', urls: 18 }, 1),
    page('redirects-post', 'Redirects done right', '/blog/redirects-done-right', 'blog', { pub: 'unpublished:3', file: { state: 'untracked' } }, 2),
    page('company', 'Company', '/company', 'home', { pub: 'live:4' }, 6),
    page('about', 'About', '/company/about', 'company', { pub: 'live:6' }, 1),
    page('careers', 'Careers', '/company/careers', 'company', { pub: 'unpublished:5' }, 2),
    page('design-engineer', 'Design engineer', '/company/careers/design-engineer', 'careers', { pub: 'live:2', search: 'hidden-ancestor' }, 1),
    page('contact', 'Contact', '/company/contact', 'company', { pub: 'live:3' }, 3),
    page('press', 'Press kit', '/company/press', 'company', { pub: 'live:2', file: missing }, 4),
    page('members', 'Members area', '/members', 'home', { pub: 'live:3', search: 'not-listable' }, 7),
    page('roadmap', 'Roadmap', '/members/roadmap', 'members', { pub: 'live:8', search: 'not-listable' }, 1),
    page('office-hours', 'Office hours', '/members/office-hours', 'members', { pub: 'live:2', search: 'not-listable' }, 2),
    page('legal', 'Legal', '/legal', 'home', { pub: 'live:2' }, 8),
    page('terms', 'Terms', '/legal/terms', 'legal', { pub: 'live:5' }, 1),
    page('privacy', 'Privacy', '/legal/privacy', 'legal', { pub: 'live:6' }, 2),
    page('cookies', 'Cookie settings', '/legal/cookies', 'legal', { pub: 'live:2', search: 'not-listable' }, 3),
    page('style-guide', 'Style guide', '/style-guide', 'home', { pub: 'live:7', search: 'not-listable' }, 9),
    page('partners', 'Partners', '/partners', 'home', { pub: 'live:1', search: 'not-public' }, 10),
];

type Walk = { id: string; path: string; end: RedirectTrace['end']; steps: string[]; to?: string | null; pageId: string | null; match?: string; permanent?: boolean; origin?: string };

const WALKS: Walk[] = [
    { id: 'r1', path: '/plans', end: 'answered', steps: ['/plans'], to: '/pricing', pageId: 'pricing' },
    { id: 'r2', path: '/old-pricing', end: 'answered', steps: ['/old-pricing', '/plans'], to: '/pricing', pageId: 'pricing' },
    { id: 'r3', path: '/pricing-2023', end: 'answered', steps: ['/pricing-2023', '/old-pricing', '/plans'], to: '/pricing', pageId: 'pricing' },
    { id: 'r4', path: '/docs/v1', end: 'answered', steps: ['/docs/v1'], to: '/docs', pageId: 'docs', match: 'prefix', origin: 'release' },
    { id: 'r5', path: '/beam/particles', end: 'answered', steps: ['/beam/particles'], to: '/docs/beam/particles', pageId: 'particles', origin: 'publish' },
    { id: 'r6', path: '/about-us', end: 'answered', steps: ['/about-us'], to: '/company/about', pageId: 'about' },
    { id: 'r7', path: '/team', end: 'answered', steps: ['/team', '/about-us'], to: '/company/about', pageId: 'about' },
    { id: 'r8', path: '/promo', end: 'loop', steps: ['/promo', '/launch'], pageId: null, permanent: false },
    { id: 'r9', path: '/launch', end: 'loop', steps: ['/launch', '/promo'], pageId: null, permanent: false },
    { id: 'r10', path: '/jobs/designer', end: 'dead-end', steps: ['/jobs/designer'], pageId: 'design-engineer', origin: 'takedown' },
    { id: 'r11', path: '/status', end: 'answered', steps: ['/status'], to: 'https://status.splicewire.com', pageId: null, permanent: false },
    { id: 'r12', path: '/case-studies/audiostud', end: 'answered', steps: ['/case-studies/audiostud'], to: '/customers/audiostud', pageId: 'audiostud', origin: 'publish' },
    { id: 'r13', path: '/frame/widgets', end: 'answered', steps: ['/frame/widgets'], to: '/docs/frame/widgets', pageId: 'widgets', origin: 'publish' },
    { id: 'r14', path: '/guide/install', end: 'answered', steps: ['/guide/install'], to: '/docs/getting-started/install', pageId: 'install', origin: 'release' },
];

const ATTENTION = new Set(['loop', 'too-long', 'dead-end', 'gone']);

export const FIXTURE_TRACES: RedirectTrace[] = WALKS.map((w) => ({
    id: w.id, realm: 'site', path: w.path, match: w.match ?? 'exact', targetKind: w.to?.startsWith('http') ? 'address' : 'path',
    permanent: w.permanent ?? true, origin: w.origin ?? 'author', end: w.end, to: w.to ?? null, steps: w.steps,
    hops: w.steps.length, attention: ATTENTION.has(w.end), pageId: w.pageId,
}));

/** The server's per-page join: every walk that lands on (or stops short of) the page, longest first. */
function withRedirects(pages: SiteMapPage[], traces: RedirectTrace[]): SiteMapPage[] {
    return pages.map((p) => {
        const inbound: SiteMapInbound[] = traces.filter((t) => t.pageId === p.id)
            .sort((a, b) => b.hops - a.hops || a.path.localeCompare(b.path))
            .map((t) => ({ id: t.id, path: t.path, match: t.match, end: t.end, hops: t.hops, attention: t.attention, permanent: t.permanent, origin: t.origin }));
        const worst = ['loop', 'too-long', 'dead-end', 'gone'].find((end) => inbound.some((r) => r.end === end)) ?? null;
        return { ...p, redirects: { count: inbound.length, maxHops: Math.max(0, ...inbound.map((r) => r.hops)), attention: worst, inbound } };
    });
}

export const FIXTURE_PAGES: SiteMapPage[] = withRedirects(PAGE_LIST, FIXTURE_TRACES);

/** The same site as a tenant reads it: no File column (D-37-d). */
export const FIXTURE_TENANT_PAGES: SiteMapPage[] = FIXTURE_PAGES.map((p) => ({ ...p, file: null }));

export const FIXTURE_PARTS: SitePart[] = [
    { id: 'theme', title: null, slug: 'default', type: 'theme' },
    { id: 'layout-main', title: 'Main layout', slug: 'main', type: 'layout' },
    { id: 'layout-docs', title: 'Docs layout', slug: 'docs', type: 'layout' },
    { id: 'tpl-article', title: 'Article', slug: 'article', type: 'template' },
    { id: 'cmp-hero', title: 'Hero', slug: 'hero', type: 'component' },
    { id: 'cmp-pricing', title: 'Pricing table', slug: 'pricing-table', type: 'component' },
    { id: 'cmp-cta', title: 'Call to action', slug: 'cta', type: 'component' },
];
