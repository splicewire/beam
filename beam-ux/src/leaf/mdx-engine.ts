/**
 * The DEFAULT inline leaf engine: `engine: 'mdx'` — the inline-markup ⟷ doc binding the manifest's
 * `{ kind: 'richtext', engine: 'mdx' }` field selects.
 *
 * This engine's editor doc is the {@link InlineDoc} (an ordered list of marked text runs). Its markup
 * dialect is the INLINE subset of Markdown/MDX — exactly the marks a `@mdxeditor/editor` inline surface
 * emits: `**strong**`, `*em*` / `_em_`, `` `inlineCode` ``, and `[text](href)` links. It owns INLINE
 * marks ONLY — no headings, lists, or block structure (that's the AST/BlockDoc's job, ticket 02). This
 * keeps beam-ux dependency-free of `@mdxeditor/editor`/Lexical: the heavy React WYSIWYG widget lives
 * host-side (audiostud `mdx-field.tsx`); THIS is the pure text↔doc kernel that widget round-trips
 * through, and what the seam patches back into `.tsx`.
 *
 * Degrade-not-lose: any inline construct this parser doesn't classify (an unknown/exotic mark, a
 * malformed span) is preserved as LITERAL text in an unmarked run, so `fromDoc(toDoc(s))` never drops
 * an author's characters — it just doesn't promote them to a mark.
 */

import type { InlineDoc, InlineLeafEditor, InlineMark, InlineRun } from './types.js';

// ---------------------------------------------------------------------------
// Parse: inline markup → InlineDoc
// ---------------------------------------------------------------------------

/**
 * Delimiter marks the parser recognizes, longest-first so `**` beats `*`. Each entry is a paired
 * inline delimiter and the mark it applies; `inlineCode` is handled specially (its content is opaque —
 * no nested parsing). Links (`[text](href)`) are matched by a dedicated scanner, not a delimiter pair.
 */
const DELIMS: Array<{ open: string; close: string; mark: InlineMark; opaque?: boolean }> = [
    { open: '`', close: '`', mark: 'inlineCode', opaque: true },
    { open: '**', close: '**', mark: 'strong' },
    { open: '__', close: '__', mark: 'strong' },
    { open: '*', close: '*', mark: 'em' },
    { open: '_', close: '_', mark: 'em' },
];

/** Parse an inline-markup string into a flat list of marked runs. */
export function parseInline(text: string): InlineDoc {
    const runs = parseSpan(text, []);
    return coalesce(runs);
}

/**
 * Recursive-descent over an inline span, accumulating the `marks` in scope. Scans left-to-right; at
 * each position it tries (a) an inline-code span, (b) a link, (c) each delimiter pair, and otherwise
 * consumes one literal character. Unmatched delimiter characters fall through to literal text — that's
 * the degrade path.
 */
function parseSpan(text: string, marks: InlineMark[]): InlineRun[] {
    const out: InlineRun[] = [];
    let i = 0;
    let literal = '';

    const flush = () => {
        if (literal) {
            out.push({ text: literal, marks: [...marks] });
            literal = '';
        }
    };

    while (i < text.length) {
        // Backslash-escape: the next char is literal, syntax-inert. Re-emitted verbatim on serialize.
        if (text[i] === '\\' && i + 1 < text.length) {
            literal += text[i] + text[i + 1];
            i += 2;
            continue;
        }

        // (a) inline code — opaque content, no nested parse.
        if (text[i] === '`') {
            const end = text.indexOf('`', i + 1);
            if (end > i) {
                flush();
                out.push({ text: text.slice(i + 1, end), marks: [...marks, 'inlineCode'] });
                i = end + 1;
                continue;
            }
        }

        // (b) link — [text](href). `text` is parsed for nested marks; `href` is opaque.
        if (text[i] === '[') {
            const link = matchLink(text, i);
            if (link) {
                flush();
                const inner = parseSpan(link.label, [...marks, 'link']);
                for (const run of inner) run.href = link.href;
                const linkFallback: InlineRun = { text: '', marks: [...marks, 'link'], href: link.href };
                out.push(...(inner.length ? inner : [linkFallback]));
                i = link.end;
                continue;
            }
        }

        // (c) paired delimiters (strong/em).
        let matched = false;
        for (const d of DELIMS) {
            if (d.mark === 'inlineCode') continue; // handled above
            if (text.startsWith(d.open, i)) {
                const close = findClose(text, i + d.open.length, d.close);
                if (close !== -1) {
                    flush();
                    out.push(...parseSpan(text.slice(i + d.open.length, close), [...marks, d.mark]));
                    i = close + d.close.length;
                    matched = true;
                    break;
                }
            }
        }
        if (matched) continue;

        // Otherwise: one literal character (this is where an unmatched `*` degrades to text).
        literal += text[i];
        i += 1;
    }

    flush();
    return out;
}

/** Find the matching close delimiter for a span opened at `from`, skipping escapes + code spans. */
function findClose(text: string, from: number, close: string): number {
    let i = from;
    while (i < text.length) {
        if (text[i] === '\\') {
            i += 2;
            continue;
        }
        if (text[i] === '`') {
            const end = text.indexOf('`', i + 1);
            if (end > i) {
                i = end + 1;
                continue;
            }
        }
        if (text.startsWith(close, i)) {
            // A close delimiter that immediately follows the open (empty span) doesn't count — treat the
            // opener as literal by refusing the match.
            if (i === from) return -1;
            return i;
        }
        i += 1;
    }
    return -1;
}

/** Match a `[label](href)` link starting at `at`; returns the parts + end index, or null. */
function matchLink(text: string, at: number): { label: string; href: string; end: number } | null {
    if (text[at] !== '[') return null;
    // Find the closing ] (accounting for escapes; no nested brackets in the label for v1).
    let i = at + 1;
    let label = '';
    while (i < text.length && text[i] !== ']') {
        if (text[i] === '\\' && i + 1 < text.length) {
            label += text[i + 1];
            i += 2;
            continue;
        }
        label += text[i];
        i += 1;
    }
    if (text[i] !== ']' || text[i + 1] !== '(') return null;
    // Find the closing ).
    let j = i + 2;
    let href = '';
    while (j < text.length && text[j] !== ')') {
        href += text[j];
        j += 1;
    }
    if (text[j] !== ')') return null;
    return { label, href, end: j + 1 };
}

/** Merge adjacent runs whose marks (+ href) are identical, so serialization emits minimal syntax. */
function coalesce(runs: InlineRun[]): InlineRun[] {
    const out: InlineRun[] = [];
    for (const run of runs) {
        const prev = out[out.length - 1];
        if (prev && sameMarks(prev, run)) {
            prev.text += run.text;
        } else {
            out.push({ ...run, marks: [...run.marks] });
        }
    }
    return out;
}

function sameMarks(a: InlineRun, b: InlineRun): boolean {
    return (
        a.href === b.href &&
        a.marks.length === b.marks.length &&
        a.marks.every((m, k) => m === b.marks[k])
    );
}

// ---------------------------------------------------------------------------
// Serialize: InlineDoc → inline markup
// ---------------------------------------------------------------------------

/** The canonical open/close syntax each mark serializes to (normalizes `__`→`**`, `_`→`*`). */
const SYNTAX: Record<Exclude<InlineMark, 'link'>, { open: string; close: string; opaque?: boolean }> = {
    strong: { open: '**', close: '**' },
    em: { open: '*', close: '*' },
    inlineCode: { open: '`', close: '`', opaque: true },
};

/**
 * Serialize an {@link InlineDoc} back to an inline-markup string (inverse of {@link parseInline}).
 *
 * The doc is a FLAT list of runs, but marks NEST: `**a *b* c**` parses to runs `['strong']`,
 * `['strong','em']`, `['strong']`. A naive per-run wrap would double the `**` on each run. So this
 * serializer walks the runs and emits mark delimiters at the boundaries where a mark ENTERS or LEAVES
 * scope — the classic open/close-stack over adjacent runs' mark arrays. A run whose marks are a prefix
 * extension of the previous run's opens the extra marks; a run that sheds marks closes them (LIFO).
 */
export function serializeInline(doc: InlineDoc): string {
    let out = '';
    // The stack of currently-open marks, as {mark, href, close} we must emit to close, innermost last.
    const open: Array<{ mark: InlineMark; href?: string; close: string }> = [];

    const closeDownTo = (depth: number) => {
        while (open.length > depth) {
            out += open.pop()!.close;
        }
    };

    for (const run of doc) {
        // How deep do this run's marks agree with the currently-open stack? Close anything past that,
        // then open this run's remaining marks.
        let shared = 0;
        while (
            shared < open.length &&
            shared < run.marks.length &&
            open[shared].mark === run.marks[shared] &&
            open[shared].href === (run.marks[shared] === 'link' ? run.href : undefined)
        ) {
            shared++;
        }
        closeDownTo(shared);
        for (let k = shared; k < run.marks.length; k++) {
            const mark = run.marks[k];
            if (mark === 'link') {
                out += '[';
                open.push({ mark, href: run.href, close: `](${run.href ?? ''})` });
            } else {
                const s = SYNTAX[mark];
                out += s.open;
                open.push({ mark, close: s.close });
            }
        }
        out += run.text;
    }
    closeDownTo(0);
    return out;
}

// ---------------------------------------------------------------------------
// The engine binding
// ---------------------------------------------------------------------------

/**
 * The default `mdx` inline leaf engine. Register it (`registerLeafEngine(mdxLeafEngine)`) so a manifest
 * field `{ kind: 'richtext', engine: 'mdx' }` resolves to it. `toDoc`/`fromDoc` are the pure inline
 * parser/serializer above — the seam (`bindTextNode`) wires them to `patchText` for lossless `.tsx`.
 */
export const mdxLeafEngine: InlineLeafEditor<InlineDoc> = {
    engine: 'mdx',
    toDoc: parseInline,
    fromDoc: serializeInline,
};
