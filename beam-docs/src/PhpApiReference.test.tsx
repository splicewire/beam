import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { entryPageConfig, resetEntryPageConfig } from '@splicewire/beam-ux/docs';
import { configureDocs } from './configure.js';
import { docsConfiguration, setDocsConfiguration } from './config.js';
import { PhpApiReference, readPhpApiIndex, readPhpApiSymbol, symbolHref } from './PhpApiReference.js';
import { safeHref } from './PhpApiProse.js';
import type { DocsTransport } from './publications.js';
import wire from '../tests/fixtures/php-api-wire.json';

/**
 * php-api-reference slice 3 (PRD §3). The fixture is REAL producer output: laravel-beam-docs 2a1dc5af's generator over
 * its committed PHP fixtures (pkg-a, pkg-e, pkg-f, pkg-g) in both audiences, shaped as its read ops answer
 * (`tests/fixtures/php-api-wire.json`, provenance in its `producer` field). The server is the only gate: a 404 (the
 * surface off for this reader) renders nothing.
 */
type Audience = 'public' | 'internal';
const BASE = '/beam/docs';
let calls: string[];

function serving(audience: Audience, override: Record<string, unknown> = {}): DocsTransport {
    const { index, symbols } = (wire as any).audiences[audience];
    return async (url) => {
        calls.push(url);
        if (url in override) {
            const value = override[url];
            if (value instanceof Error) throw value;
            return value;
        }
        if (url === `${BASE}/php-api-index`) return { data: index };
        const fqn = new URL(url, 'http://x').searchParams.get('fqn');
        if (url.startsWith(`${BASE}/php-api-symbol?`) && fqn && symbols[fqn]) return { data: symbols[fqn] };
        throw new Error('404');
    };
}

const symbolUrl = (fqn: string) => `${BASE}/php-api-symbol?${new URLSearchParams({ fqn })}`;
const at = (search = '') => window.history.replaceState(null, '', `/docs/php${search}`);

beforeEach(() => {
    calls = [];
    window.localStorage.clear();
    at();
    setDocsConfiguration({ registryLinkEndpoint: null, phpApiEndpoint: BASE });
});
afterEach(() => resetEntryPageConfig());

async function mounted(audience: Audience = 'public', override: Record<string, unknown> = {}) {
    const view = render(<PhpApiReference transport={serving(audience, override)} />);
    await screen.findByRole('searchbox', { name: 'Filter symbols' });
    return view;
}

async function openSymbol(fqn: string) {
    const title = await screen.findByRole('heading', { level: 2, name: new RegExp(fqn.replace(/\\/g, '\\\\')) });
    return title.closest('article') as HTMLElement;
}

describe('wiring', () => {
    it('is contributed beside ApiReference by configureDocs, reading /beam/docs by default', () => {
        configureDocs();
        const components = entryPageConfig().components as Record<string, unknown>;
        expect(components.PhpApiReference).toBe(PhpApiReference);
        expect(components.ApiReference).toBeDefined();
        expect(docsConfiguration().phpApiEndpoint).toBe('/beam/docs');
        configureDocs({ phpApiEndpoint: '/elsewhere' });
        expect(docsConfiguration().phpApiEndpoint).toBe('/elsewhere');
    });

    it('renders nothing and asks nothing when its endpoint is null', async () => {
        const { container } = render(<PhpApiReference endpoint={null} transport={serving('public')} />);
        await act(async () => {});
        expect(container.innerHTML).toBe('');
        expect(calls).toEqual([]);
    });

    it('renders nothing when the server refuses (off for this reader) or answers an unreadable index', async () => {
        for (const answer of [new Error('404'), { data: { audience: 'public', packages: 'nope' } }, null, 'html']) {
            calls = [];
            const { container, unmount } = render(<PhpApiReference transport={serving('public', { [`${BASE}/php-api-index`]: answer })} />);
            await waitFor(() => expect(calls).toEqual([`${BASE}/php-api-index`]));
            await act(async () => {});
            expect(container.innerHTML).toBe('');
            unmount();
        }
    });

    it('reads the bare and the enveloped answer, and refuses another symbol\'s document', () => {
        const { index, symbols } = (wire as any).audiences.public;
        expect(readPhpApiIndex(index)).not.toBeNull();
        expect(readPhpApiIndex({ data: index })).not.toBeNull();
        expect(readPhpApiSymbol({ data: symbols['Fixture\\ApiA\\Box'] }, 'Fixture\\ApiA\\Box')).not.toBeNull();
        expect(readPhpApiSymbol(symbols['Fixture\\ApiA\\Box'], 'Fixture\\ApiA\\Kind')).toBeNull();
        expect(readPhpApiSymbol({ ...symbols['Fixture\\ApiA\\Box'], methods: { named: {} } }, 'Fixture\\ApiA\\Box')).toBeNull();
        for (const [fqn, s] of Object.entries(symbols)) expect(readPhpApiSymbol(s, fqn), fqn).not.toBeNull();
        for (const [fqn, s] of Object.entries((wire as any).audiences.internal.symbols)) expect(readPhpApiSymbol(s, fqn), fqn).not.toBeNull();
    });
});

describe('rail: packages, namespaces, filter, URL state', () => {
    it('draws each package as a track and its namespaces as groups, the global namespace included', async () => {
        await mounted();
        const rail = screen.getByRole('navigation', { name: 'PHP API' });
        for (const pkg of ['fixture/php-api-a', 'fixture/php-api-e', 'fixture/php-api-f', 'fixture/php-api-g']) {
            expect(within(rail).getByText(pkg)).toBeTruthy();
        }
        for (const ns of ['Fixture\\ApiA', 'Fixture\\ApiA\\Contracts', 'Fixture\\ApiE', '(global)']) {
            expect(within(rail).getAllByRole('button').map((b) => b.textContent?.trim())).toContain(ns);
        }
        expect(screen.getByText(/fixture\/php-api-a/, { selector: 'li code' })).toBeTruthy();
    });

    it('filters the whole index client-side, by name or kind, without asking the server', async () => {
        await mounted();
        const filter = screen.getByRole('searchbox', { name: 'Filter symbols' });
        fireEvent.change(filter, { target: { value: 'kit' } });
        const matches = screen.getByRole('list', { name: 'Matching symbols' });
        expect(within(matches).getAllByRole('link').map((a) => a.textContent)).toEqual(['classFixture\\ApiE\\Kit']);
        fireEvent.change(filter, { target: { value: 'enum' } });
        expect(within(screen.getByRole('list', { name: 'Matching symbols' })).getAllByRole('link').map((a) => a.textContent)).toContain('enumFixture\\ApiA\\Kind');
        fireEvent.change(filter, { target: { value: 'zz-nothing' } });
        expect(screen.getByText('No symbol matches “zz-nothing”.')).toBeTruthy();
        expect(calls).toEqual([`${BASE}/php-api-index`]);
    });

    it('opens a symbol in place with a linkable ?symbol= URL, and back/forward follow', async () => {
        await mounted();
        fireEvent.change(screen.getByRole('searchbox', { name: 'Filter symbols' }), { target: { value: 'Box' } });
        fireEvent.click(screen.getByRole('link', { name: /Fixture\\ApiA\\Box/ }));
        await openSymbol('Fixture\\ApiA\\Box');
        expect(window.location.pathname).toBe('/docs/php');
        expect(new URLSearchParams(window.location.search).get('symbol')).toBe('Fixture\\ApiA\\Box');
        expect(calls).toContain(symbolUrl('Fixture\\ApiA\\Box'));

        // A cross-link inside the document opens its target in place too.
        const box = await openSymbol('Fixture\\ApiA\\Box');
        fireEvent.click(within(box).getByRole('link', { name: 'Fixture\\ApiA\\Contracts\\Shape' }));
        await openSymbol('Fixture\\ApiA\\Contracts\\Shape');
        expect(new URLSearchParams(window.location.search).get('symbol')).toBe('Fixture\\ApiA\\Contracts\\Shape');

        act(() => {
            window.history.back();
        });
        await waitFor(() => expect(new URLSearchParams(window.location.search).get('symbol')).toBe('Fixture\\ApiA\\Box'));
        await openSymbol('Fixture\\ApiA\\Box');
        act(() => {
            window.history.forward();
        });
        await openSymbol('Fixture\\ApiA\\Contracts\\Shape');
    });

    it('marks the open symbol current in the tree and opens its group', async () => {
        at(`?${new URLSearchParams({ symbol: 'Fixture\\ApiE\\Kit' })}`);
        await mounted();
        await openSymbol('Fixture\\ApiE\\Kit');
        const current = screen.getByRole('navigation', { name: 'PHP API' }).querySelector('a[aria-current="page"]');
        expect(current?.getAttribute('href')).toBe(symbolHref('Fixture\\ApiE\\Kit'));
        expect(current?.textContent).toBe('Kit');
    });

    it('a deep link to a name the index does not publish asks nothing and says so, escaped', async () => {
        at(`?${new URLSearchParams({ symbol: '<img src=x onerror=alert(1)>' })}`);
        const { container } = await mounted();
        expect(screen.getByRole('status').textContent).toBe('No published symbol is named <img src=x onerror=alert(1)>.');
        expect(container.querySelector('img')).toBeNull();
        expect(calls).toEqual([`${BASE}/php-api-index`]);
    });

    it('lets a modified click open a new tab normally', async () => {
        await mounted();
        fireEvent.change(screen.getByRole('searchbox', { name: 'Filter symbols' }), { target: { value: 'Box' } });
        const link = screen.getByRole('link', { name: /Fixture\\ApiA\\Box/ });
        const event = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });
        link.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
        expect(window.location.search).toBe('');
    });
});

describe('symbol view', () => {
    it('shows the declaration, the first paragraph, and the rest behind an expander (public)', async () => {
        at(`?${new URLSearchParams({ symbol: 'Fixture\\ApiA\\Box' })}`);
        await mounted('public');
        const box = await openSymbol('Fixture\\ApiA\\Box');
        expect(within(box).getByLabelText('Declaration').textContent).toBe('class Box implements Shape');
        const doc = box.querySelector('.beam-php-api-doc') as HTMLElement;
        expect(doc.firstElementChild?.textContent).toBe('A box that holds one value.');
        const more = doc.querySelector('details') as HTMLDetailsElement;
        expect(more.open).toBe(false);
        expect(more.textContent).toContain('boxes are immutable once made.');
        expect(box.textContent).not.toContain('launch ticket 23');
        expect(within(box).queryByText('Full comment')).toBeNull();
    });

    it('carries the internal audience\'s whole text and comment', async () => {
        at(`?${new URLSearchParams({ symbol: 'Fixture\\ApiA\\Box' })}`);
        await mounted('internal');
        const box = await openSymbol('Fixture\\ApiA\\Box');
        expect((box.querySelector('.beam-php-api-doc') as HTMLElement).firstElementChild?.textContent).toBe('A box that holds one value (launch ticket 23).');
        expect((box.querySelector('.beam-php-api-doc') as HTMLElement).querySelector('details:last-of-type summary')?.textContent).toBe('Full comment');
        // The internal prose keeps `{@see Kind}` as written (unqualified); it links to the published Kind the generator
        // resolved for this symbol's `see`. It sits in the third paragraph, so behind the expander.
        const more = (box.querySelector('.beam-php-api-doc') as HTMLElement).querySelector('details') as HTMLDetailsElement;
        more.open = true;
        expect(within(more).getByRole('link', { name: 'Kind' }).getAttribute('href')).toBe(symbolHref('Fixture\\ApiA\\Kind'));
    });

    it('lists members with their signatures, and the case values and backing type of an enum', async () => {
        at(`?${new URLSearchParams({ symbol: 'Fixture\\ApiA\\Box' })}`);
        await mounted();
        const methods = within(await openSymbol('Fixture\\ApiA\\Box')).getByRole('region', { name: 'Methods' });
        expect(Array.from(methods.querySelectorAll('pre')).map((p) => p.textContent)).toContain('public static function make(?object $value = null, array $options = [\'a\' => 1]): self');
        act(() => {
            window.history.pushState(null, '', `/docs/php?${new URLSearchParams({ symbol: 'Fixture\\ApiA\\Kind' })}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
        const kind = await openSymbol('Fixture\\ApiA\\Kind');
        expect(within(kind).getByLabelText('Declaration').textContent).toBe('enum Kind: string');
        expect(Array.from(within(kind).getByRole('region', { name: 'Cases' }).querySelectorAll('pre')).map((p) => p.textContent)).toEqual(["case Circle = 'circle'", "case Square = 'square'"]);
    });

    it('shows inherited members with an alias\'s original, never a private original, and an unmet abstract requirement', async () => {
        for (const audience of ['public', 'internal'] as const) {
            at(`?${new URLSearchParams({ symbol: 'Fixture\\ApiE\\Kit' })}`);
            const { unmount } = await mounted(audience);
            const kit = within(await openSymbol('Fixture\\ApiE\\Kit')).getByRole('region', { name: 'Inherited members' });
            const loud = kit.querySelector('[data-php-api-inherited="loud"]') as HTMLElement;
            expect(loud.textContent).toContain('alias of shout()');
            expect(loud.querySelector('pre')?.textContent).toBe('protected function loud(): void');
            const revealed = kit.querySelector('[data-php-api-inherited="revealed"]') as HTMLElement;
            expect(revealed.textContent).not.toContain('alias of');
            expect(revealed.querySelector('pre')?.textContent).toBe('public function revealed(int $times = 2, ?string $label = null): void');
            expect(kit.textContent).not.toContain('secretly');
            expect(kit.textContent).not.toContain('abstract requirement');
            unmount();

            at(`?${new URLSearchParams({ symbol: 'Fixture\\ApiE\\Needs' })}`);
            const second = await mounted(audience);
            const needs = within(await openSymbol('Fixture\\ApiE\\Needs')).getByRole('region', { name: 'Inherited members' });
            expect((needs.querySelector('[data-php-api-inherited="foo"]') as HTMLElement).textContent).toContain('abstract requirement');
            expect((needs.querySelector('[data-php-api-inherited="bar"]') as HTMLElement).textContent).not.toContain('abstract requirement');
            second.unmount();
        }
    });

    it('links implementers, relations and @see targets the index publishes; an unpublished name stays code', async () => {
        at(`?${new URLSearchParams({ symbol: 'Fixture\\ApiA\\Contracts\\Shape' })}`);
        await mounted();
        const shape = await openSymbol('Fixture\\ApiA\\Contracts\\Shape');
        expect(within(within(shape).getByRole('region', { name: 'Implemented by' })).getByRole('link', { name: 'Fixture\\ApiA\\Box' }).getAttribute('href'))
            .toBe(symbolHref('Fixture\\ApiA\\Box'));

        act(() => {
            window.history.pushState(null, '', `/docs/php?${new URLSearchParams({ symbol: 'Fixture\\ApiA\\UsesMissing' })}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
        const missing = await openSymbol('Fixture\\ApiA\\UsesMissing');
        expect(within(missing).getByText('Vendor\\Uninstalled\\Base').closest('a')).toBeNull();
        expect(within(missing).getByText('Missing\\Contract').closest('a')).toBeNull();
    });

    it('draws class attributes with their arguments', async () => {
        at(`?${new URLSearchParams({ symbol: 'Fixture\\ApiG\\Shaped' })}`);
        await mounted();
        const shaped = await openSymbol('Fixture\\ApiG\\Shaped');
        expect(within(shaped).getByLabelText('Attributes').textContent).toContain("#[Fixture\\ApiG\\Tagged('shape', weight: 2)]");
    });

    it('says so when a published symbol cannot be read', async () => {
        at(`?${new URLSearchParams({ symbol: 'Fixture\\ApiA\\Box' })}`);
        await mounted('public', { [symbolUrl('Fixture\\ApiA\\Box')]: { data: { fqn: 'Fixture\\ApiA\\Box' } } });
        expect(await screen.findByText(/could not be read/)).toBeTruthy();
    });
});

describe('escaped Markdown', () => {
    const hostile = [
        'Plain <script>window.__pwned = 1</script> text and <img src=x onerror="window.__pwned = 2">.',
        '[js](javascript:alert(1)) [JS](JaVaScRiPt:alert(2)) [sp]( javascript:alert(3)) [tab](java\tscript:alert(4))',
        '[data](data:text/html;base64,PHNjcmlwdD4=) [vb](vbscript:msgbox) [file](file:///etc/passwd) [proto](//evil.example/x) [bs](/\\evil.example)',
        '[ok](https://example.com/a?b=1) [mail](mailto:dev@example.com) [rel](/docs/guide) [frag](#members) [query](?symbol=Fixture%5CApiA%5CKind)',
        '{@see javascript:alert(5)} {@see Fixture\\ApiA\\Kind} **bold** *em* `<b>code</b>`',
        '- item <u>one</u>\n- item [two](javascript:alert(6))\n```\n<script>fenced()</script>\n```',
    ];

    it('never renders raw HTML or an unsafe link, and keeps every safe one', async () => {
        const { symbols } = (wire as any).audiences.public;
        const box = { ...symbols['Fixture\\ApiA\\Box'], doc: hostile, tags: [{ tag: '@see', description: '[t](javascript:alert(7))' }] };
        at(`?${new URLSearchParams({ symbol: 'Fixture\\ApiA\\Box' })}`);
        const { container } = await mounted('public', { [symbolUrl('Fixture\\ApiA\\Box')]: { data: box } });
        const article = await openSymbol('Fixture\\ApiA\\Box');
        (article.querySelector('details') as HTMLDetailsElement).open = true;

        expect(container.querySelectorAll('script, img, iframe, object, embed, u, b').length).toBe(0);
        expect((window as any).__pwned).toBeUndefined();
        const hrefs = Array.from(article.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '');
        for (const href of hrefs) {
            expect(href, href).toMatch(/^(https:|mailto:|\/(?!\/)|#|\?)/);
            expect(href.toLowerCase()).not.toMatch(/javascript|vbscript|data:|file:/);
        }
        expect(hrefs).toEqual(expect.arrayContaining([
            'https://example.com/a?b=1', 'mailto:dev@example.com', '/docs/guide', '#members', '?symbol=Fixture%5CApiA%5CKind', symbolHref('Fixture\\ApiA\\Kind'),
        ]));
        // The refused links and the raw HTML are shown as the text they are.
        expect(article.textContent).toContain('<script>window.__pwned = 1</script>');
        expect(article.textContent).toContain('[js](javascript:alert(1))');
        expect(article.textContent).toContain('[proto](//evil.example/x)');
        expect(article.querySelector('pre code')?.textContent).toBe('<script>fenced()</script>');
        expect(article.querySelector('strong')?.textContent).toBe('bold');
        expect(article.querySelector('em')?.textContent).toBe('em');
        expect(Array.from(article.querySelectorAll('ul li')).map((li) => li.textContent)).toEqual(expect.arrayContaining(['item <u>one</u>', 'item [two](javascript:alert(6))']));
    });

    it('allows only http(s), mailto and same-origin paths, fragments and queries', () => {
        for (const ok of ['https://a.example', 'http://a.example', 'MAILTO:x@y.z', '/p', '#f', '?q=1']) expect(safeHref(ok), ok).toBe(ok);
        for (const bad of ['javascript:x', 'JAVASCRIPT:x', ' javascript:x', 'java\nscript:x', 'data:x', 'vbscript:x', 'file:x', '//x', '/\\x', 'x', '', 'ftp://x']) {
            expect(safeHref(bad), JSON.stringify(bad)).toBeNull();
        }
    });
});

/**
 * Slice 3 amend (final review REVISE e5a010df, Spec 1-2), on the same REAL producer fixture (now with pkg-d):
 * the complete effective declaration (method templates, parameter attributes, an adapted inherited declaration's own
 * attributes) is drawn, and inline `{@see Class::member}` honours the producer's member-level `published` verdict.
 */
describe('amend: complete declarations and member-level link verdicts', () => {
    const show = async (audience: Audience, fqn: string) => {
        at(`?${new URLSearchParams({ symbol: fqn })}`);
        const view = await mounted(audience);
        return { view, article: await openSymbol(fqn) };
    };
    const member = (article: HTMLElement, name: string) => article.querySelector(`[data-php-api-member="${name}"]`) as HTMLElement;

    for (const audience of ['public', 'internal'] as const) {
        it(`draws a method's templates (${audience})`, async () => {
            const { article, view } = await show(audience, 'Fixture\\ApiA\\Box');
            const map = member(article, 'map');
            expect(within(map).getByLabelText('Templates').textContent).toBe('Templates: U');
            expect(member(article, 'area').querySelector('[aria-label="Templates"]')).toBeNull();
            view.unmount();
        });

        it(`draws each parameter's attributes (${audience})`, async () => {
            const { article, view } = await show(audience, 'Fixture\\ApiG\\Shaped');
            const params = within(member(article, 'place')).getByLabelText('Parameter attributes');
            expect(Array.from(params.querySelectorAll('li')).map((li) => li.textContent)).toEqual([
                "$x #[Fixture\\ApiG\\Tagged('x')]",
                "$y #[Fixture\\ApiG\\Tagged('y', weight: 1)]",
                '$label #[Fixture\\ApiG\\Plain]',
            ]);
            view.unmount();
        });

        it(`draws an adapted inherited declaration's own attributes, never a private original (${audience})`, async () => {
            const { article, view } = await show(audience, 'Fixture\\ApiE\\Kit');
            const revealed = article.querySelector('[data-php-api-inherited="revealed"]') as HTMLElement;
            expect(within(revealed).getByLabelText('Attributes').textContent).toContain("#[Fixture\\ApiE\\Marker('quietly')]");
            expect(revealed.querySelector('[aria-label="Parameter attributes"]')).toBeNull();
            expect(article.textContent).not.toContain('secretly');
            const loud = article.querySelector('[data-php-api-inherited="loud"]') as HTMLElement;
            expect(loud.textContent).toContain('alias of shout()');
            view.unmount();
        });

        it(`inline {@see Class::member} links only where the producer published that member (${audience})`, async () => {
            const { article, view } = await show(audience, 'Fixture\\ApiD\\Links');
            const prose = article.querySelector('.beam-php-api-doc') as HTMLElement;
            const linked = Array.from(prose.querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')]);
            expect(linked).toEqual([
                ['Base::keep()', symbolHref('Fixture\\ApiD\\Base')],
                ['Base::run()', symbolHref('Fixture\\ApiD\\Base')],
                ['Made::$name', symbolHref('Fixture\\ApiD\\Made')],
            ]);
            // The producer said false: a missing member and one Derived does not publish stay code, although both
            // classes are in the index.
            const code = Array.from(prose.querySelectorAll('code')).filter((c) => !c.closest('a')).map((c) => c.textContent);
            expect(code).toEqual(expect.arrayContaining(['Base::missing()', 'Derived::run()']));
            // The See also section agrees with the prose, member for member.
            const see = within(article).getByRole('region', { name: 'See also' });
            expect(Array.from(see.querySelectorAll('a')).map((a) => a.textContent)).toEqual([
                'Fixture\\ApiD\\Base::keep()', 'Fixture\\ApiD\\Base::run()', 'Fixture\\ApiD\\Made::$name',
            ]);
            view.unmount();
        });
    }

    it('a member target the producer did not resolve for this symbol is not linked by class alone', async () => {
        const { symbols } = (wire as any).audiences.public;
        const box = { ...symbols['Fixture\\ApiA\\Box'], doc: ['See {@see Kind::Circle} and {@see Kind}.'] };
        at(`?${new URLSearchParams({ symbol: 'Fixture\\ApiA\\Box' })}`);
        await mounted('public', { [symbolUrl('Fixture\\ApiA\\Box')]: { data: box } });
        const prose = (await openSymbol('Fixture\\ApiA\\Box')).querySelector('.beam-php-api-doc') as HTMLElement;
        expect(Array.from(prose.querySelectorAll('a')).map((a) => a.textContent)).toEqual(['Kind']);
        expect(within(prose).getByText('Kind::Circle').closest('a')).toBeNull();
    });
});

/**
 * 03b (owner commission 05:19Z; slice 3 final review REVISE b44b3f2b): a prose name links to the identity the PRODUCER
 * resolved for it, never to an indexed class that merely shares its short name. Fixture pkg-h (beam-docs
 * `tests/fixtures/php-api-src/pkg-h`, generated by laravel-beam-docs 2a1dc5af): `Fixture\ApiH\Doc\Page` says
 * `{@see Hidden}`, which PHP resolves to `Fixture\ApiH\Doc\Hidden` (unmarked: unpublished under public, published under
 * internal), while an unrelated public GLOBAL `Hidden` is in the index.
 */
describe('03b: resolved link identity', () => {
    const show = async (audience: Audience, fqn: string) => {
        at(`?${new URLSearchParams({ symbol: fqn })}`);
        const view = await mounted(audience);
        return { view, article: await openSymbol(fqn) };
    };
    const proseLinks = (article: HTMLElement) =>
        Array.from((article.querySelector('.beam-php-api-doc') as HTMLElement).querySelectorAll(':scope > p a, :scope > ul a'))
            .map((a) => [a.textContent, a.getAttribute('href')]);
    const GLOBAL = symbolHref('Hidden');
    const SIBLING = symbolHref('Fixture\\ApiH\\Doc\\Hidden');

    it('the collision: an unpublished resolved sibling is NOT linked to the indexed global of the same name (public)', async () => {
        const { article, view } = await show('public', 'Fixture\\ApiH\\Doc\\Page');
        expect(proseLinks(article)).toEqual([]);
        expect(Array.from(article.querySelectorAll('a')).map((a) => a.getAttribute('href'))).not.toContain(GLOBAL);
        const see = within(article).getByRole('region', { name: 'See also' });
        expect(see.querySelectorAll('a').length).toBe(0);
        view.unmount();
    });

    it('the same prose links the resolved sibling once the producer publishes it (internal)', async () => {
        const { article, view } = await show('internal', 'Fixture\\ApiH\\Doc\\Page');
        expect(proseLinks(article)).toEqual([['Hidden', SIBLING], ['Hidden::open()', SIBLING]]);
        expect(Array.from(article.querySelectorAll('a')).map((a) => a.getAttribute('href'))).not.toContain(GLOBAL);
        view.unmount();
    });

    for (const audience of ['public', 'internal'] as const) {
        it(`an explicit \\FQN keeps its own identity; a bare name the producer resolved two ways is refused (${audience})`, async () => {
            const { article, view } = await show(audience, 'Fixture\\ApiH\\Doc\\Mixed');
            // `{@see Hidden}` (ambiguous here: this symbol's see holds both the sibling and the global) is refused;
            // `{@see \Hidden}` is the global; `{@see \Fixture\ApiH\Doc\Hidden}` is the sibling, linked only when published.
            const expected = [['\\Hidden', GLOBAL], ...(audience === 'internal' ? [['\\Fixture\\ApiH\\Doc\\Hidden', SIBLING]] : [])];
            expect(proseLinks(article)).toEqual(expected);
            const code = Array.from((article.querySelector('.beam-php-api-doc') as HTMLElement).querySelectorAll('p > code')).map((c) => c.textContent);
            expect(code).toContain('Hidden');
            view.unmount();
        });

        it(`a name the producer did not resolve for this symbol is not linked, even when a class of that name is indexed (${audience})`, async () => {
            const { article, view } = await show(audience, 'Fixture\\ApiH\\Doc\\Page');
            const note = article.querySelector('[data-php-api-member="note"]') as HTMLElement;
            expect(within(note).getByText('Other').closest('a')).toBeNull();
            view.unmount();
        });

        it(`relations, implementers and See also still link by their own resolved verdicts (${audience})`, async () => {
            const { article, view } = await show(audience, 'Fixture\\ApiA\\Box');
            expect(within(article).getByRole('link', { name: 'Fixture\\ApiA\\Contracts\\Shape' }).getAttribute('href')).toBe(symbolHref('Fixture\\ApiA\\Contracts\\Shape'));
            expect(within(within(article).getByRole('region', { name: 'See also' })).getByRole('link', { name: 'Fixture\\ApiA\\Kind' }).getAttribute('href'))
                .toBe(symbolHref('Fixture\\ApiA\\Kind'));
            view.unmount();
            const mixed = await show(audience, 'Fixture\\ApiH\\Doc\\Mixed');
            const see = within(mixed.article).getByRole('region', { name: 'See also' });
            expect(Array.from(see.querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')]))
                .toEqual([...(audience === 'internal' ? [['Fixture\\ApiH\\Doc\\Hidden', SIBLING]] : []), ['Hidden', GLOBAL]]);
            mixed.view.unmount();
        });
    }
});
