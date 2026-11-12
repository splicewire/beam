import { Fragment, type ReactNode } from 'react';

/**
 * Docblock prose for the PHP API reference (php-api-reference slice 3, PRD §3): **escaped** Markdown.
 *
 * The generator hands over paragraphs as plain text that was written in PHPDoc, so it is rendered here as React text
 * nodes only, never through `dangerouslySetInnerHTML`. Raw HTML in a docblock therefore shows as its literal text.
 * The supported subset is the one docblocks use: paragraphs, `-` / `*` lists, fenced code, inline `code`, `**strong**`,
 * `*em*`, `[text](url)` and `{@see Target}`.
 *
 * Links are the one place a docblock reaches the browser's navigation, so a URL is allowed only when it is plainly
 * safe ({@link safeHref}); anything else renders as its text, unlinked.
 */

/** Resolves a symbol name (`Fq\Class`, `Fq\Class::member()`) to its reference link, or null when it is not published. */
export type SymbolLinker = (target: string) => string | null;

const SAFE_SCHEMES = new Set(['http', 'https', 'mailto']);

/**
 * `url` when it is safe to put in an `href`, else null:
 * `http:`, `https:`, `mailto:`, or a same-origin path (`/…` but not `//…`), fragment (`#…`) or query (`?…`).
 * Anything carrying a control character, whitespace or a backslash is refused outright, which closes the
 * obfuscated forms (`java\tscript:`, ` javascript:`, `/\evil`), and every other scheme (`javascript:`,
 * `data:`, `vbscript:`, `file:`, …) is refused whatever its case.
 */
export function safeHref(url: string): string | null {
    const value = url.trim();
    if (value === '' || /[\u0000- \u007f\\]/.test(value)) return null;
    if (value.startsWith('#') || value.startsWith('?')) return value;
    if (value.startsWith('/')) return value.startsWith('//') ? null : value;
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(value);
    if (!scheme) return null;
    return SAFE_SCHEMES.has(scheme[1].toLowerCase()) ? value : null;
}

const INLINE = /`([^`]+)`|\{@see\s+([^\s}]+)[^}]*\}|\[([^\]]+)\]\(([^)]*)\)|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*/g;

/** One line of inline Markdown as React nodes. Text is always text; only a safe URL becomes a link. */
export function inline(text: string, link: SymbolLinker): ReactNode[] {
    const out: ReactNode[] = [];
    let last = 0;
    let key = 0;
    for (const match of text.matchAll(INLINE)) {
        const at = match.index ?? 0;
        if (at > last) out.push(text.slice(last, at));
        const [whole, code, see, label, url, strong, em] = match;
        if (code !== undefined) {
            out.push(<code key={key++}>{code}</code>);
        } else if (see !== undefined) {
            const href = link(see);
            out.push(href ? <a key={key++} href={href} className="beam-php-api-link"><code>{see}</code></a> : <code key={key++}>{see}</code>);
        } else if (label !== undefined) {
            const href = safeHref(url ?? '');
            out.push(href ? <a key={key++} href={href} rel="noopener noreferrer">{label}</a> : <Fragment key={key++}>{whole}</Fragment>);
        } else if (strong !== undefined) {
            out.push(<strong key={key++}>{strong}</strong>);
        } else if (em !== undefined) {
            out.push(<em key={key++}>{em}</em>);
        }
        last = at + whole.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
}

/** One docblock paragraph (which may hold a list or a fenced block) as block nodes. */
export function Paragraph({ text, link }: { text: string; link: SymbolLinker }) {
    const blocks: ReactNode[] = [];
    const lines = text.split('\n');
    let prose: string[] = [];
    let list: string[] = [];
    const flushProse = () => {
        if (prose.length) blocks.push(<p key={blocks.length}>{inline(prose.join(' '), link)}</p>);
        prose = [];
    };
    const flushList = () => {
        if (list.length) {
            blocks.push(<ul key={blocks.length}>{list.map((item, i) => <li key={i}>{inline(item, link)}</li>)}</ul>);
        }
        list = [];
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/^\s*```/.test(line)) {
            flushProse();
            flushList();
            const code: string[] = [];
            for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) code.push(lines[i]);
            blocks.push(<pre key={blocks.length}><code>{code.join('\n')}</code></pre>);
            continue;
        }
        const item = /^\s*[-*]\s+(.*)$/.exec(line);
        if (item) {
            flushProse();
            list.push(item[1]);
            continue;
        }
        flushList();
        if (line.trim() !== '') prose.push(line.trim());
    }
    flushProse();
    flushList();

    return <>{blocks}</>;
}
