import { ExpandableNav, type NavNode } from '@schemastud/nav';
import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { docsConfiguration } from './config.js';
import { fetchDocs, type DocsTransport } from './publications.js';
import { Paragraph, inline, type SymbolLinker } from './PhpApiProse.js';
import type {
    PhpApiAttributeData, PhpApiIndexData, PhpApiInheritedData, PhpApiMemberData, PhpApiParamData, PhpApiSymbolData,
    PhpApiTagData, PhpApiTemplateData,
} from './generated/types.js';

export type {
    PhpApiIndexData, PhpApiInheritedData, PhpApiMemberData, PhpApiSymbolData, PhpApiSymbolRowData,
} from './generated/types.js';

export type PhpApiReferenceProps = {
    /** Base of the PHP API ops (`{base}/php-api-index`, `{base}/php-api-symbol`). Defaults to `configureDocs({ phpApiEndpoint })`; null renders nothing. */
    endpoint?: string | null;
    transport?: DocsTransport;
    className?: string;
};

/** The query parameter that names the open symbol (`/docs/php?symbol=Vendor\Package\Thing`). */
export const PHP_API_SYMBOL_PARAM = 'symbol';

export const PHP_API_CSS = `
.beam-php-api { display: grid; grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr); gap: 2rem; align-items: start; }
@media (max-width: 48rem) { .beam-php-api { grid-template-columns: minmax(0, 1fr); } }
.beam-php-api-rail { position: sticky; top: 1rem; max-height: calc(100vh - 2rem); overflow: auto; font-size: 0.875rem; }
.beam-php-api-filter { width: 100%; box-sizing: border-box; margin-bottom: 0.75rem; padding: 0.375rem 0.5rem; font: inherit; border: 1px solid var(--border, currentColor); border-radius: var(--radius, 0.375rem); background: transparent; color: inherit; }
.beam-php-api-matches { margin: 0; padding: 0; list-style: none; }
.beam-php-api-matches li { padding-block: 0.125rem; }
.beam-php-api-track { margin: 0.75rem 0 0.25rem; font-weight: 650; }
.beam-php-api-group { margin: 0; }
.beam-php-api-header { display: flex; width: 100%; gap: 0.25rem; padding: 0.125rem 0; border: 0; background: none; color: inherit; font: inherit; text-align: start; cursor: pointer; }
.beam-php-api-item { display: block; padding: 0.125rem 0 0.125rem 1rem; }
.beam-php-api-item[aria-current="page"], .beam-php-api-matches a[aria-current="page"] { font-weight: 650; }
.beam-php-api-namespace { color: var(--muted-foreground, GrayText); overflow-wrap: anywhere; }
.beam-php-api-kind { display: inline-block; margin-inline-end: 0.5rem; padding: 0 0.375rem; border: 1px solid var(--border, currentColor); border-radius: 999px; font-size: 0.75rem; font-weight: 500; text-transform: lowercase; vertical-align: middle; }
.beam-php-api-symbol h2 { margin-top: 0; overflow-wrap: anywhere; }
.beam-php-api-signature { margin: 0 0 1rem; padding: 0.5rem 0.75rem; overflow-x: auto; border-radius: var(--radius, 0.375rem); background: var(--muted, rgba(127,127,127,0.08)); font-family: var(--font-mono, ui-monospace, monospace); font-size: 0.875rem; white-space: pre-wrap; overflow-wrap: anywhere; }
.beam-php-api-section h3 { margin: 1.5rem 0 0.5rem; font-size: 1rem; }
.beam-php-api-member { margin: 0 0 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border, rgba(127,127,127,0.25)); }
.beam-php-api-member:last-child { border-bottom: 0; }
.beam-php-api-flag { margin-inline-start: 0.5rem; color: var(--muted-foreground, GrayText); font-size: 0.8125rem; }
.beam-php-api-more > summary { cursor: pointer; color: var(--muted-foreground, GrayText); font-size: 0.875rem; }
.beam-php-api-tags { margin: 0.5rem 0 0; padding-inline-start: 1.25rem; font-size: 0.875rem; }
.beam-php-api-links { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 0.25rem 1rem; }
.beam-php-api-note { color: var(--muted-foreground, GrayText); }
`;

/* ----- the wire, read defensively (the readRegistrants pattern): an unreadable answer is no answer ----- */

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
const isString = (v: unknown): v is string => typeof v === 'string';
const nullableString = (v: unknown) => v === null || typeof v === 'string';
const optionalString = (v: unknown) => v === undefined || v === null || typeof v === 'string';
const stringList = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);
const listOf = (v: unknown, item: (x: Record<string, unknown>) => boolean) => Array.isArray(v) && v.every((x) => record(x) && item(x));

const attributeOk = (a: Record<string, unknown>) => isString(a.name) && stringList(a.arguments);
const tagOk = (t: Record<string, unknown>) => isString(t.tag) && optionalString(t.type) && optionalString(t.name) && optionalString(t.description);
const templateOk = (t: Record<string, unknown>) => isString(t.name) && isString(t.variance) && nullableString(t.bound) && nullableString(t.default);
const linkOk = (l: Record<string, unknown>) => isString(l.fqn) && typeof l.published === 'boolean';
const memberOk = (m: Record<string, unknown>): boolean => isString(m.name) && isString(m.visibility)
    && listOf(m.attributes, attributeOk) && stringList(m.doc) && listOf(m.tags, tagOk) && typeof m.line === 'number'
    && optionalString(m.signature) && optionalString(m.type) && optionalString(m.value) && optionalString(m.default)
    && optionalString(m.returnType) && optionalString(m.comment)
    && (m.params === undefined || listOf(m.params, (p) => isString(p.name) && nullableString(p.type) && nullableString(p.default) && listOf(p.attributes, attributeOk)))
    && (m.templates === undefined || listOf(m.templates, templateOk));
const inheritedOk = (i: Record<string, unknown>) => isString(i.kind) && isString(i.name) && isString(i.from) && nullableString(i.visibility)
    && (i.abstract === undefined || typeof i.abstract === 'boolean') && (i.original === undefined || isString(i.original))
    && (i.declaration === undefined || (record(i.declaration) && memberOk(i.declaration)));

const unwrap = (raw: unknown): unknown => (record(raw) && record(raw.data) ? raw.data : raw);

/** The index op's answer, or null when it is not the declared shape. */
export function readPhpApiIndex(raw: unknown): PhpApiIndexData | null {
    const value = unwrap(raw);
    if (!record(value) || !isString(value.audience) || !Array.isArray(value.packages)) return null;
    const ok = value.packages.every((p) => record(p) && isString(p.name) && nullableString(p.version) && typeof p.published === 'number'
        && listOf(p.symbols, (s) => isString(s.fqn) && isString(s.kind) && nullableString(s.summary)));
    return ok ? (value as unknown as PhpApiIndexData) : null;
}

/** The symbol op's answer for `fqn`, or null when it is not the declared shape (or another symbol's). */
export function readPhpApiSymbol(raw: unknown, fqn: string): PhpApiSymbolData | null {
    const s = unwrap(raw);
    if (!record(s) || s.fqn !== fqn || !isString(s.package) || !isString(s.kind) || !isString(s.file) || typeof s.line !== 'number') return null;
    const ok = stringList(s.modifiers) && stringList(s.doc) && stringList(s.implementers) && nullableString(s.backingType)
        && optionalString(s.comment) && listOf(s.templates, templateOk) && listOf(s.attributes, attributeOk) && listOf(s.tags, tagOk)
        && listOf(s.extends, linkOk) && listOf(s.implements, linkOk) && listOf(s.traits, linkOk)
        && listOf(s.see, (x) => isString(x.target) && typeof x.published === 'boolean')
        && ['constants', 'cases', 'properties', 'methods'].every((k) => listOf(s[k], memberOk)) && listOf(s.inherited, inheritedOk);
    return ok ? (s as unknown as PhpApiSymbolData) : null;
}

export function phpApiIndexUrl(base: string): string {
    return `${base.replace(/\/$/, '')}/php-api-index`;
}

export function phpApiSymbolUrl(base: string, fqn: string): string {
    return `${base.replace(/\/$/, '')}/php-api-symbol?${new URLSearchParams({ fqn })}`;
}

/** The linkable href of a symbol: the current page with `?symbol=`. One spelling, so the rail can match it. */
export function symbolHref(fqn: string): string {
    return `?${new URLSearchParams({ [PHP_API_SYMBOL_PARAM]: fqn })}`;
}

function currentSymbol(): string | null {
    if (typeof window === 'undefined') return null;
    const value = new URLSearchParams(window.location.search).get(PHP_API_SYMBOL_PARAM);
    return value && value.trim() !== '' ? value : null;
}

const namespaceOf = (fqn: string) => (fqn.includes('\\') ? fqn.slice(0, fqn.lastIndexOf('\\')) : '(global)');
const shortName = (fqn: string) => fqn.slice(fqn.lastIndexOf('\\') + 1);

/**
 * `PhpApiReference` — the browsable PHP API reference (php-api-reference slice 3, PRD §3), the component the seeded
 * `docs-php-api` page places (`<PhpApiReference />`). It reads the generated artifact through laravel-beam-docs'
 * `php-api-index` and `php-api-symbol` ops, which answer 404 whenever the surface is off for this reader; then it
 * renders nothing, as the server's gate is the only gate.
 *
 * - **Rail:** package → namespace tree (`@schemastud/nav` `ExpandableNav`, as `RegistryIndexNav` draws its tree) with a
 *   client-side filter over the whole symbol index.
 * - **Symbol:** signature, the docblock's first paragraph with the rest behind an expander, members, inherited members
 *   (with an abstract requirement and an alias's original shown), implementers and `@see` links. A link is drawn only
 *   to a symbol this index publishes; any other name is plain code.
 * - **URL state:** `?symbol=` via the History API, so a symbol is linkable and back/forward follow; no beam-ux route.
 * - **Prose:** escaped Markdown ({@link Paragraph}); raw HTML and unsafe link schemes never render.
 */
export function PhpApiReference({ endpoint, transport, className }: PhpApiReferenceProps) {
    const docs = docsConfiguration();
    const base = endpoint === undefined ? docs.phpApiEndpoint ?? null : endpoint;
    const fetcher = transport ?? docs.transport ?? fetchDocs;
    const [index, setIndex] = useState<{ base: string; data: PhpApiIndexData | null } | null>(null);
    const [selected, setSelected] = useState<string | null>(currentSymbol);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        if (!base) return;
        const controller = new AbortController();
        fetcher(phpApiIndexUrl(base), { signal: controller.signal })
            .then((value) => !controller.signal.aborted && setIndex({ base, data: readPhpApiIndex(value) }))
            .catch(() => !controller.signal.aborted && setIndex({ base, data: null }));
        return () => controller.abort();
    }, [base, fetcher]);

    useEffect(() => {
        const follow = () => setSelected(currentSymbol());
        window.addEventListener('popstate', follow);
        return () => window.removeEventListener('popstate', follow);
    }, []);

    const data = index?.base === base ? index.data : null;
    const rows = useMemo(() => (data ? data.packages.flatMap((p) => p.symbols.map((s) => ({ ...s, package: p.name }))) : []), [data]);
    const published = useMemo(() => new Set(rows.map((r) => r.fqn)), [rows]);

    const link: SymbolLinker = useCallback((target: string) => {
        const fqn = target.replace(/^\\/, '').split('::')[0];
        return published.has(fqn) ? symbolHref(fqn) : null;
    }, [published]);

    const open = useCallback((fqn: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set(PHP_API_SYMBOL_PARAM, fqn);
        window.history.pushState(window.history.state, '', url);
        setSelected(fqn);
    }, []);

    /** A same-page symbol link: an ordinary href, opened in place unless the reader asked for a new tab or window. */
    const follow = useCallback((event: MouseEvent<HTMLElement>) => {
        const anchor = (event.target as HTMLElement).closest('a');
        const href = anchor?.getAttribute('href');
        if (!anchor || !href?.startsWith('?') || event.defaultPrevented || event.button !== 0
            || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const fqn = new URLSearchParams(href).get(PHP_API_SYMBOL_PARAM);
        if (!fqn || !published.has(fqn)) return;
        event.preventDefault();
        open(fqn);
    }, [open, published]);

    if (!base || !data) return null;

    const classes = ['beam-php-api', className].filter(Boolean).join(' ');
    const current = selected && published.has(selected) ? selected : null;
    const tree: NavNode[] = rows.map((r, order) => ({
        title: shortName(r.fqn), href: symbolHref(r.fqn), track: r.package, group: namespaceOf(r.fqn), order,
    }));
    const q = filter.trim().toLowerCase();
    const matches = q === '' ? [] : rows.filter((r) => r.fqn.toLowerCase().includes(q) || r.kind.includes(q)).slice(0, 100);

    return (
        <div className={classes} data-php-api-audience={data.audience} onClick={follow}>
            <style>{PHP_API_CSS}</style>
            <nav className="beam-php-api-rail" aria-label="PHP API">
                <input
                    type="search"
                    className="beam-php-api-filter"
                    aria-label="Filter symbols"
                    placeholder={`Filter ${rows.length} symbols`}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
                {q !== '' ? (
                    matches.length ? (
                        <ul className="beam-php-api-matches" aria-label="Matching symbols">
                            {matches.map((r) => (
                                <li key={r.fqn}>
                                    <a href={symbolHref(r.fqn)} aria-current={r.fqn === current ? 'page' : undefined}>
                                        <span className="beam-php-api-kind">{r.kind}</span>{r.fqn}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="beam-php-api-note">No symbol matches “{filter.trim()}”.</p>
                ) : (
                    <ExpandableNav
                        items={tree}
                        currentHref={current ? symbolHref(current) : undefined}
                        initialGroupState="collapsed"
                        storagePrefix="beam-docs:php-api"
                        aria-label="Packages and namespaces"
                        classes={{
                            track: 'beam-php-api-track-wrap', trackLabel: 'beam-php-api-track', group: 'beam-php-api-group',
                            header: 'beam-php-api-header', item: 'beam-php-api-item-wrap',
                        }}
                        renderLink={(item, { active }) => (
                            <a href={item.href} className="beam-php-api-item" aria-current={active ? 'page' : undefined}>{item.title}</a>
                        )}
                    />
                )}
            </nav>
            <main className="beam-php-api-main">
                {current ? (
                    <SymbolView key={current} base={base} fqn={current} fetcher={fetcher} link={link} />
                ) : selected ? (
                    <p className="beam-php-api-note" role="status">No published symbol is named <code>{selected}</code>.</p>
                ) : (
                    <Overview index={data} />
                )}
            </main>
        </div>
    );
}

function Overview({ index }: { index: PhpApiIndexData }) {
    return (
        <section className="beam-php-api-overview" aria-label="Packages">
            <ul className="beam-php-api-links">
                {index.packages.map((p) => (
                    <li key={p.name}><code>{p.name}</code>{p.version ? ` ${p.version}` : ''} · {p.published} symbol{p.published === 1 ? '' : 's'}</li>
                ))}
            </ul>
            <p className="beam-php-api-note">Choose a symbol from the list, or filter it.</p>
        </section>
    );
}

function SymbolView({ base, fqn, fetcher, link: linkIndex }: { base: string; fqn: string; fetcher: DocsTransport; link: SymbolLinker }) {
    const [loaded, setLoaded] = useState<{ data: PhpApiSymbolData | null } | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetcher(phpApiSymbolUrl(base, fqn), { signal: controller.signal })
            .then((value) => !controller.signal.aborted && setLoaded({ data: readPhpApiSymbol(value, fqn) }))
            .catch(() => !controller.signal.aborted && setLoaded({ data: null }));
        return () => controller.abort();
    }, [base, fqn, fetcher]);

    // Prose keeps a docblock's names AS WRITTEN (`{@see Hidden}`, `{@see Base::keep()}`); the producer resolved each one
    // the way PHP does (namespace and `use` imports) into this symbol's `see`, with a `published` verdict. The producer's
    // resolution is the identity (03b, review b44b3f2b); the client never re-resolves a name against the class index,
    // which would send `{@see Hidden}` in `App\Doc` to an unrelated global `Hidden`.
    //
    // - An explicit `\Fq\Name` (leading backslash) is its own identity. It links when indexed and its verdict is not false;
    //   a member (`\Fq\Name::m()`) only when that member's verdict is true.
    // - A name as written matches the `see` classes it can denote: the same name, or one ending in `\<name>`. Exactly ONE
    //   candidate identity is required; none (the producer did not resolve it for this symbol) or several (ambiguous)
    //   is refused, never guessed.
    // - Then the verdict decides: a class links when its verdict is true; a member links (to its class's page; there are
    //   no member URLs) only when `<class>::<member>`'s verdict is true. So prose and See also always agree.
    const link = useMemo<SymbolLinker>(() => {
        const verdicts = new Map((loaded?.data?.see ?? []).map((x) => [x.target, x.published] as const));
        const seeClasses = [...new Set([...verdicts.keys()].map((t) => t.split('::')[0]))];
        return (target: string) => {
            const explicit = target.startsWith('\\');
            const raw = explicit ? target.slice(1) : target;
            const at = raw.indexOf('::');
            const written = at === -1 ? raw : raw.slice(0, at);
            const member = at === -1 ? '' : raw.slice(at);
            let cls: string;
            if (explicit) {
                cls = written;
            } else {
                const candidates = seeClasses.filter((c) => c === written || c.endsWith(`\\${written}`));
                if (candidates.length !== 1) return null;
                cls = candidates[0];
            }
            const verdict = verdicts.get(`${cls}${member}`);
            if (member !== '') return verdict === true ? linkIndex(cls) : null;
            if (explicit) return verdict === false ? null : linkIndex(cls);
            return verdict === true ? linkIndex(cls) : null;
        };
    }, [loaded, linkIndex]);

    if (!loaded) return <p className="beam-php-api-note" role="status">Loading <code>{fqn}</code>…</p>;
    const s = loaded.data;
    if (!s) return <p className="beam-php-api-note" role="status"><code>{fqn}</code> could not be read.</p>;

    /**
     * A name the PRODUCER already resolved (a relation, an implementer, a `see` target, an inherited member's source):
     * linked by its own verdict to its class's page when indexed, never re-resolved through the prose rules.
     */
    const named = (resolved: string, isPublished: boolean) => {
        const href = isPublished ? linkIndex(resolved.split('::')[0]) : null;
        return href ? <a href={href} className="beam-php-api-link"><code>{resolved}</code></a> : <code>{resolved}</code>;
    };

    return (
        <article className="beam-php-api-symbol" aria-labelledby="beam-php-api-title" data-php-api-symbol={s.fqn}>
            <h2 id="beam-php-api-title"><span className="beam-php-api-kind">{s.kind}</span>{s.fqn}</h2>
            <pre className="beam-php-api-signature" aria-label="Declaration">{declaration(s)}</pre>
            <p className="beam-php-api-note"><code>{s.package}</code> · <code>{s.file}:{s.line}</code></p>
            {s.extends.length || s.implements.length || s.traits.length ? (
                <dl className="beam-php-api-relations">
                    {s.extends.length > 0 && <><dt>Extends</dt><dd>{list(s.extends.map((l) => named(l.fqn, l.published)))}</dd></>}
                    {s.implements.length > 0 && <><dt>Implements</dt><dd>{list(s.implements.map((l) => named(l.fqn, l.published)))}</dd></>}
                    {s.traits.length > 0 && <><dt>Uses</dt><dd>{list(s.traits.map((l) => named(l.fqn, l.published)))}</dd></>}
                </dl>
            ) : null}
            <Templates templates={s.templates} />
            <Attributes attributes={s.attributes} />
            <Docs doc={s.doc} tags={s.tags} comment={s.comment} link={link} />
            <Members title="Cases" kind="case" members={s.cases} link={link} />
            <Members title="Constants" kind="constant" members={s.constants} link={link} />
            <Members title="Properties" kind="property" members={s.properties} link={link} />
            <Members title="Methods" kind="method" members={s.methods} link={link} />
            <Inherited rows={s.inherited} named={named} link={link} />
            {s.implementers.length > 0 && (
                <section className="beam-php-api-section" aria-label="Implemented by">
                    <h3>Implemented by</h3>
                    {list(s.implementers.map((f) => named(f, true)))}
                </section>
            )}
            {s.see.length > 0 && (
                <section className="beam-php-api-section" aria-label="See also">
                    <h3>See also</h3>
                    {list(s.see.map((x) => named(x.target, x.published)))}
                </section>
            )}
        </article>
    );
}

function list(items: ReactNode[]) {
    return <ul className="beam-php-api-links">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
}

/** `final class Box extends Base implements Shape`, from the symbol's parts (the generator's names, unaltered). */
function declaration(s: PhpApiSymbolData): string {
    const parts = [...s.modifiers, s.kind, shortName(s.fqn)];
    if (s.backingType) parts[parts.length - 1] += `: ${s.backingType}`;
    if (s.extends.length) parts.push('extends', s.extends.map((l) => shortName(l.fqn)).join(', '));
    if (s.implements.length) parts.push('implements', s.implements.map((l) => shortName(l.fqn)).join(', '));
    return parts.join(' ');
}

function memberSignature(kind: string, m: PhpApiMemberData): string {
    if (kind === 'method') return m.signature ?? `${m.visibility} function ${m.name}()`;
    if (kind === 'case') return `case ${m.name}${m.value != null ? ` = ${m.value}` : ''}`;
    if (kind === 'constant') {
        return [m.visibility, m.final ? 'final' : null, 'const', m.type ?? null, m.name].filter(Boolean).join(' ')
            + (m.value != null ? ` = ${m.value}` : '');
    }
    return [m.visibility, m.static ? 'static' : null, m.readonly ? 'readonly' : null, m.type ?? null].filter(Boolean).join(' ')
        + ` $${m.name}${m.default != null ? ` = ${m.default}` : ''}`;
}

/** The first paragraph, shown; the rest, the tags and (internal audience) the whole comment behind an expander. */
function Docs({ doc, tags, comment, link }: { doc: string[]; tags: PhpApiTagData[]; comment?: string; link: SymbolLinker }) {
    const [first, ...rest] = doc;
    const more = rest.length > 0 || tags.length > 0;
    return (
        <div className="beam-php-api-doc">
            {first !== undefined && <Paragraph text={first} link={link} />}
            {more && (
                <details className="beam-php-api-more">
                    <summary>More</summary>
                    {rest.map((p, i) => <Paragraph key={i} text={p} link={link} />)}
                    {tags.length > 0 && (
                        <ul className="beam-php-api-tags" aria-label="Tags">
                            {tags.map((t, i) => (
                                <li key={i}>
                                    <code>{[t.tag, t.type, t.name].filter(Boolean).join(' ')}</code>
                                    {t.description ? <> {inline(t.description, link)}</> : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </details>
            )}
            {comment !== undefined && (
                <details className="beam-php-api-more">
                    <summary>Full comment</summary>
                    <pre className="beam-php-api-signature">{comment}</pre>
                </details>
            )}
        </div>
    );
}

function Templates({ templates }: { templates: PhpApiTemplateData[] }) {
    if (!templates.length) return null;
    return (
        <p className="beam-php-api-note" aria-label="Templates">
            Templates: {templates.map((t, i) => (
                <code key={i}>
                    {i > 0 ? ', ' : ''}
                    {t.variance !== 'invariant' ? `${t.variance} ` : ''}{t.name}{t.bound ? ` of ${t.bound}` : ''}{t.default ? ` = ${t.default}` : ''}
                </code>
            ))}
        </p>
    );
}

const attributeText = (a: PhpApiAttributeData) => `#[${a.name}${a.arguments.length ? `(${a.arguments.join(', ')})` : ''}]`;

function Attributes({ attributes }: { attributes: PhpApiAttributeData[] }) {
    if (!attributes.length) return null;
    return (
        <p className="beam-php-api-note" aria-label="Attributes">
            {attributes.map((a, i) => <code key={i}>{attributeText(a)} </code>)}
        </p>
    );
}

/** Each parameter's own attributes (`$x #[Tagged('x')]`), which a method's signature string does not carry. */
function ParameterAttributes({ params }: { params: PhpApiParamData[] }) {
    const attributed = params.filter((p) => p.attributes.length > 0);
    if (!attributed.length) return null;
    return (
        <ul className="beam-php-api-tags" aria-label="Parameter attributes">
            {attributed.map((p) => (
                <li key={p.name}><code>{`$${p.name}`}</code> <code>{p.attributes.map(attributeText).join(' ')}</code></li>
            ))}
        </ul>
    );
}

/**
 * One member's complete effective declaration (slice 3 amend, review e5a010df): its signature, a method's templates,
 * the member's attributes, each parameter's attributes, and its docs. The ONE path for a member and for an adapted
 * inherited declaration, so neither can drop a part the generator wrote.
 */
function Declaration({ kind, member, link }: { kind: string; member: PhpApiMemberData; link: SymbolLinker }) {
    return (
        <>
            <pre className="beam-php-api-signature">{memberSignature(kind, member)}</pre>
            <Templates templates={member.templates ?? []} />
            <Attributes attributes={member.attributes} />
            <ParameterAttributes params={member.params ?? []} />
            <Docs doc={member.doc} tags={member.tags} comment={member.comment} link={link} />
        </>
    );
}

function Members({ title, kind, members, link }: { title: string; kind: string; members: PhpApiMemberData[]; link: SymbolLinker }) {
    if (!members.length) return null;
    return (
        <section className="beam-php-api-section" aria-label={title}>
            <h3>{title}</h3>
            {members.map((m) => (
                <div key={m.name} className="beam-php-api-member" data-php-api-member={m.name}>
                    <Declaration kind={kind} member={m} link={link} />
                </div>
            ))}
        </section>
    );
}

function Inherited({ rows, named, link }: {
    rows: PhpApiInheritedData[]; named: (fqn: string, published: boolean) => ReactNode; link: SymbolLinker;
}) {
    if (!rows.length) return null;
    return (
        <section className="beam-php-api-section" aria-label="Inherited members">
            <h3>Inherited</h3>
            {rows.map((r) => (
                <div key={`${r.kind} ${r.name}`} className="beam-php-api-member" data-php-api-inherited={r.name}>
                    <div>
                        <code>{r.kind === 'method' ? `${r.name}()` : r.kind === 'property' ? `$${r.name}` : r.name}</code>
                        {r.visibility ? <span className="beam-php-api-flag">{r.visibility}</span> : null}
                        {r.abstract === true ? <span className="beam-php-api-flag">abstract requirement</span> : null}
                        {r.original !== undefined ? <span className="beam-php-api-flag">alias of <code>{r.original}()</code></span> : null}
                        <span className="beam-php-api-flag">from {named(r.from, true)}</span>
                    </div>
                    {r.declaration && <Declaration kind="method" member={r.declaration} link={link} />}
                </div>
            ))}
        </section>
    );
}
