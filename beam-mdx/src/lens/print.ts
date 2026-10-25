import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import { mdxToMarkdown } from 'mdast-util-mdx';
import { toMarkdown } from 'mdast-util-to-markdown';
import type { BlockContent, ListItem, PhrasingContent, Root, RootContent, Table, TableCell, TableRow } from 'mdast';
import { jsxAttributes, type JsonBlock, type JsonDoc, type JsonNode, type JsonProp } from '@splicewire/beam-ux/jsondoc';

/**
 * The MDX Lens's printing half (ux-0233 d2): a JsonDoc → canonical MDX. The mirror and every compile read its
 * output.
 *
 * - A block Markdown can express prints as Markdown, one line per paragraph.
 * - Anything else prints as JSX: a component, a prop Markdown has no syntax for, and the lens-owned fields, whose
 *   attributes print exactly as the TSX printer prints them (`jsxAttributes`). A tag whose content is inline
 *   prints it on the tag's own line; flow content prints on lines of its own.
 * - An Opaque Island prints its source verbatim.
 *
 * Printing is canonical: for any body the lens reads, `printMdx(readMdx(printMdx(readMdx(x).doc)).doc)` is
 * `printMdx(readMdx(x).doc)`. Ids are never printed.
 */
export function printMdx(doc: JsonDoc): string {
    const root: Root = { type: 'root', children: flowOf(doc) };
    return toMarkdown(root, {
        extensions: [mdxToMarkdown(), gfmTableToMarkdown()],
        bullet: '-',
        emphasis: '_',
        strong: '*',
        fence: '`',
        fences: true,
        rule: '-',
        listItemIndent: 'one',
        resourceLink: true,
    });
}

const HEADINGS: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = { h1: 1, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 };
const INLINE_TAGS = new Set(['strong', 'em', 'code', 'a', 'img', 'br']);

const raw = (value: string) => ({ type: 'html', value }) as const;

/** A block Markdown can carry: an HTML-profile tag with no lens-owned field, no slot and only Markdown's props. */
function plain(node: JsonBlock, allowed: string[] = []): boolean {
    return !node.isComponent && !node.style && !node.repeat && !node.when && !node.slots && !node.dynamic
        && node.props.every((prop) => allowed.includes(prop.name) && prop.kind === 'string');
}

const propOf = (node: JsonBlock, name: string): JsonProp | undefined => node.props.find((prop) => prop.name === name);

/** Whether a node prints in a paragraph's flow of text (text, inline tags, inline JSX, an island). */
function isPhrasing(node: JsonNode): boolean {
    if (node.kind !== 'block') return true;
    if (node.name !== null && (INLINE_TAGS.has(node.name) || node.isComponent)) {
        return node.children.every(isPhrasing);
    }
    return false;
}

/** Nodes in a flow position: blocks print as blocks, and each run of inline content becomes one paragraph. */
function flowOf(nodes: JsonNode[]): RootContent[] {
    const out: RootContent[] = [];
    let run: JsonNode[] = [];
    const flush = () => {
        if (run.length) out.push({ type: 'paragraph', children: phrasingOf(run) });
        run = [];
    };
    for (const node of nodes) {
        if (node.kind === 'opaque') {
            flush();
            out.push(raw(node.source));
        } else if (node.kind === 'block' && !isInlineOnly(node)) {
            flush();
            out.push(...blockOf(node));
        } else {
            run.push(node);
        }
    }
    flush();
    return out;
}

/** A text or inline tag (never a component: a component in a flow position is a block of its own). */
function isInlineOnly(node: JsonNode): boolean {
    return node.kind === 'text' || (node.kind === 'block' && node.name !== null && INLINE_TAGS.has(node.name) && !node.isComponent);
}

function blockOf(node: JsonBlock): RootContent[] {
    const name = node.name;
    if (name !== null && Object.hasOwn(HEADINGS, name) && plain(node)) {
        return [{ type: 'heading', depth: HEADINGS[name], children: phrasingOf(node.children) }];
    }
    // A paragraph holding only one tag or island would print as that tag alone on its line, which reads back as a
    // block of its own; such a paragraph prints as an explicit `<p>` instead.
    if (name === 'p' && plain(node) && !(node.children.length === 1 && printsRaw(node.children[0]))) {
        return [{ type: 'paragraph', children: phrasingOf(node.children) }];
    }
    if (name === 'hr' && plain(node) && node.children.length === 0) return [{ type: 'thematicBreak' }];
    if (name === 'blockquote' && plain(node)) {
        return [{ type: 'blockquote', children: flowOf(node.children) as BlockContent[] }];
    }
    if ((name === 'ul' || name === 'ol') && listable(node)) return [listOf(node)];
    if (name === 'pre' && fenced(node)) {
        const code = node.children[0] as JsonBlock;
        const language = propOf(code, 'className')?.value;
        const meta = propOf(code, 'data-meta')?.value;
        return [{
            type: 'code',
            lang: typeof language === 'string' ? language.replace(/^language-/, '') : null,
            meta: typeof meta === 'string' ? meta : null,
            value: code.children.length ? (code.children[0] as { value: string }).value : '',
        }];
    }
    if (name === 'table' && tabular(node)) return [tableOf(node)];
    return jsxFlow(node);
}

function listable(node: JsonBlock): boolean {
    const startOnly = node.props.every((prop) => node.name === 'ol' && prop.name === 'start' && prop.kind === 'number');
    return startOnly && !node.isComponent && !node.style && !node.repeat && !node.when && !node.slots && !node.dynamic
        && node.children.length > 0
        && node.children.every((item) => item.kind === 'block' && item.name === 'li' && plain(item));
}

const isList = (node: JsonNode) => node.kind === 'block' && (node.name === 'ul' || node.name === 'ol');

/** A tight item: some text, then only lists nested under it. */
function tightItem(item: JsonBlock): boolean {
    const text = item.children.findIndex(isList);
    const head = text < 0 ? item.children : item.children.slice(0, text);
    return head.length > 0 && head.every(isPhrasing) && item.children.slice(head.length).every(isList);
}

function listOf(node: JsonBlock): RootContent {
    const items = node.children as JsonBlock[];
    const tight = items.every(tightItem);
    const start = propOf(node, 'start')?.value;
    return {
        type: 'list',
        ordered: node.name === 'ol',
        start: node.name === 'ol' ? (typeof start === 'number' ? start : 1) : null,
        spread: !tight,
        children: items.map((item): ListItem => {
            if (!tight) return { type: 'listItem', spread: true, children: flowOf(item.children) as BlockContent[] };
            const nested = item.children.findIndex(isList);
            const head = nested < 0 ? item.children : item.children.slice(0, nested);
            const lists = item.children.slice(head.length) as JsonBlock[];
            return {
                type: 'listItem',
                spread: false,
                children: [{ type: 'paragraph', children: phrasingOf(head) }, ...lists.flatMap(blockOf) as BlockContent[]],
            };
        }),
    };
}

function fenced(node: JsonBlock): boolean {
    const code = node.children.length === 1 ? node.children[0] : null;
    return plain(node) && code?.kind === 'block' && code.name === 'code' && plain(code, ['className', 'data-meta'])
        && (propOf(code, 'className') === undefined || /^language-\S+$/.test(String(propOf(code, 'className')?.value)))
        && (code.children.length === 0 || (code.children.length === 1 && code.children[0].kind === 'text'
            && code.children[0].prop == null && code.children[0].field == null));
}

function tabular(node: JsonBlock): boolean {
    if (!plain(node)) return false;
    const [head, body, ...rest] = node.children;
    if (rest.length || head?.kind !== 'block' || head.name !== 'thead' || !plain(head) || head.children.length !== 1) return false;
    if (body && (body.kind !== 'block' || body.name !== 'tbody' || !plain(body))) return false;
    const rows = [...head.children, ...(body && body.kind === 'block' ? body.children : [])];
    const width = (head.children[0] as JsonBlock).children?.length ?? 0;
    return width > 0 && rows.every((row, index) => row.kind === 'block' && row.name === 'tr' && plain(row) && row.children.length === width
        && row.children.every((cell) => cell.kind === 'block' && cell.name === (index === 0 ? 'th' : 'td') && plain(cell, ['align'])
            && ['left', 'right', 'center', undefined].includes(propOf(cell, 'align')?.value as string | undefined)
            && cell.children.every(isInlineOnly)));
}

function tableOf(node: JsonBlock): Table {
    const head = node.children[0] as JsonBlock;
    const body = node.children[1] as JsonBlock | undefined;
    const rows = [...head.children, ...(body?.children ?? [])] as JsonBlock[];
    const headerCells = (head.children[0] as JsonBlock).children as JsonBlock[];
    return {
        type: 'table',
        align: headerCells.map((cell) => (propOf(cell, 'align')?.value as 'left' | 'right' | 'center' | undefined) ?? null),
        children: rows.map((row): TableRow => ({
            type: 'tableRow',
            children: (row.children as JsonBlock[]).map((cell): TableCell => ({ type: 'tableCell', children: phrasingOf(cell.children) })),
        })),
    };
}

/** A tag in a flow position as JSX: inline content on the tag's own line, flow content on lines of its own. */
function jsxFlow(node: JsonBlock): RootContent[] {
    if (node.children.length === 0) return [raw(selfClosing(node))];
    if (node.children.every(isPhrasing)) {
        return [{ type: 'paragraph', children: [raw(open(node)), ...phrasingOf(node.children), raw(close(node))] }];
    }
    return [raw(open(node)), ...flowOf(node.children), raw(close(node))];
}

/** Whether an inline node prints as raw JSX or an expression rather than as Markdown. */
function printsRaw(node: JsonNode): boolean {
    const [printed] = phrasingOf([node]);
    return printed?.type === 'html';
}

function phrasingOf(nodes: JsonNode[]): PhrasingContent[] {
    return nodes.flatMap((node): PhrasingContent[] => {
        if (node.kind === 'opaque') return [raw(node.source)];
        if (node.kind === 'text') {
            if (node.prop != null) return [raw(`{${node.prop}}`)];
            if (node.field != null) return [raw(`{bdText(${JSON.stringify(node.field)}, ${JSON.stringify(node.value)})}`)];
            return [{ type: 'text', value: node.value }];
        }
        const name = node.name;
        if (name === 'strong' && plain(node)) return [{ type: 'strong', children: phrasingOf(node.children) }];
        if (name === 'em' && plain(node)) return [{ type: 'emphasis', children: phrasingOf(node.children) }];
        if (name === 'br' && plain(node) && node.children.length === 0) return [{ type: 'break' }];
        if (name === 'code' && plain(node) && node.children.length === 1 && node.children[0].kind === 'text'
            && node.children[0].prop == null && node.children[0].field == null) {
            return [{ type: 'inlineCode', value: node.children[0].value }];
        }
        if (name === 'a' && plain(node, ['href', 'title']) && propOf(node, 'href')) {
            const title = propOf(node, 'title')?.value;
            return [{ type: 'link', url: String(propOf(node, 'href')!.value), title: typeof title === 'string' ? title : null, children: phrasingOf(node.children) }];
        }
        if (name === 'img' && plain(node, ['src', 'alt', 'title']) && propOf(node, 'src') && node.children.length === 0) {
            const title = propOf(node, 'title')?.value;
            const alt = propOf(node, 'alt')?.value;
            return [{ type: 'image', url: String(propOf(node, 'src')!.value), alt: typeof alt === 'string' ? alt : '', title: typeof title === 'string' ? title : null }];
        }
        if (node.children.length === 0) return [raw(selfClosing(node))];
        return [raw(open(node)), ...phrasingOf(node.children), raw(close(node))];
    });
}

const open = (node: JsonBlock) => node.name === null ? '<>' : `<${node.name}${jsxAttributes(node)}>`;
const close = (node: JsonBlock) => node.name === null ? '</>' : `</${node.name}>`;
const selfClosing = (node: JsonBlock) => node.name === null ? '<></>' : `<${node.name}${jsxAttributes(node)} />`;
