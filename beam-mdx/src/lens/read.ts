import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table';
import { mdxFromMarkdown } from 'mdast-util-mdx';
import { gfmTable } from 'micromark-extension-gfm-table';
import { mdxjs } from 'micromark-extension-mdxjs';
import type { Nodes, Parents, PhrasingContent, Root, RootContent, Table } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import type { MdxFlowExpression, MdxTextExpression } from 'mdast-util-mdx-expression';
import type { JsonBlock, JsonDoc, JsonNode, JsonProp } from '@splicewire/beam-ux/jsondoc';
import { parse as parseTsx, toJson, type LensContext } from '@splicewire/beam-ux/tsx-lens';

/**
 * The MDX Lens's reading half (ux-0233 d2): an MDX page body → a JsonDoc, the same shape the TSX Lens
 * produces, so an MDX page holds blocks as a `tsx` page does.
 *
 * - Markdown reads as the HTML profile's own nodes (`p`, `h1`–`h6`, `ul`/`ol`/`li`, `blockquote`, `pre` > `code`,
 *   `strong`, `em`, `code`, `a`, `img`, `hr`, `br` and the table elements). A soft line break inside a paragraph
 *   becomes a space.
 * - JSX reads as components. A tag's attributes are read by the TSX Lens itself, so a prop, a literal in braces,
 *   a named slot the profile declares, `bdField` and the lens-owned `bdStyle` / `bdRepeat` / `bdWhen` mean exactly
 *   what they mean in a `.tsx` page. Its children are Markdown, read here.
 * - A comment, and any other expression, becomes an Opaque Island, carried verbatim. So does a tag with a spread
 *   attribute, which only source can hold.
 * - Code outside the JSX isn't a page: an `import` or an `export` refuses, except schemastud's
 *   `export const meta = {…}`, which is returned beside the body for its conversion to frontmatter (d9).
 *
 * The input is the body only, without frontmatter: frontmatter is a page's settings, never its body (d3). Ids are
 * not read; the server reattaches them against the Working Head by content, as for the TSX Lens.
 */
export interface MdxRead {
    doc: JsonDoc;
    /** The verbatim source of an `export const meta = {…}` statement, when the body has one. */
    meta: string | null;
    /**
     * That statement's value when it is static (literals, arrays and objects of them), which a host's conversion writes
     * as frontmatter (ux-0233 d9); null when there is no meta, or when only running code could give its value.
     */
    metaData: Record<string, unknown> | null;
}

export class MdxLensError extends Error {
    override name = 'MdxLensError';
}

/** Read an MDX body into a JsonDoc. Throws {@link MdxLensError} when the body isn't a page. */
export function readMdx(mdx: string, context: LensContext = {}): MdxRead {
    let tree: Root;
    try {
        tree = fromMarkdown(mdx, {
            extensions: [mdxjs(), gfmTable()],
            mdastExtensions: [mdxFromMarkdown(), gfmTableFromMarkdown()],
        });
    } catch (error) {
        throw new MdxLensError(`The MDX does not parse: ${(error as Error).message}`);
    }
    const reader = new Reader(mdx, context, definitionsOf(tree));
    const doc: JsonDoc = [];
    let meta: string | null = null;
    let metaData: Record<string, unknown> | null = null;
    for (const node of tree.children) {
        if (node.type === 'mdxjsEsm') {
            if (meta === null && isMetaExport(node)) {
                meta = reader.source(node);
                metaData = metaValue(node);
                continue;
            }
            throw new MdxLensError('An MDX page holds no code outside its JSX: only `export const meta = {…}` is read (ux-0233 d2).');
        }
        doc.push(...reader.flow(node));
    }
    return { doc, meta, metaData };
}

type Definitions = Map<string, { url: string; title: string | null }>;

function definitionsOf(tree: Root): Definitions {
    const found: Definitions = new Map();
    const visit = (node: Nodes) => {
        if (node.type === 'definition') found.set(node.identifier, { url: node.url, title: node.title ?? null });
        if ('children' in node) for (const child of (node as Parents).children) visit(child);
    };
    visit(tree);
    return found;
}

function isMetaExport(node: MdxjsEsm): boolean {
    const program = node.data?.estree;
    if (!program || program.body.length !== 1) return false;
    const statement = program.body[0];
    if (statement.type !== 'ExportNamedDeclaration' || !statement.declaration) return false;
    const declaration = statement.declaration;
    return declaration.type === 'VariableDeclaration' && declaration.kind === 'const' && declaration.declarations.length === 1
        && declaration.declarations[0].id.type === 'Identifier' && declaration.declarations[0].id.name === 'meta'
        && declaration.declarations[0].init?.type === 'ObjectExpression';
}

/** The meta export's object, when every part of it is a literal (an `isMetaExport` node). */
function metaValue(node: MdxjsEsm): Record<string, unknown> | null {
    const statement = node.data!.estree!.body[0] as { declaration: { declarations: Array<{ init: unknown }> } };
    const value = staticValue(statement.declaration.declarations[0].init);

    return value === NOT_STATIC ? null : (value as Record<string, unknown>);
}

const NOT_STATIC = Symbol('not static');

/** An ESTree expression's value without running it, or NOT_STATIC when only running code could give it. */
function staticValue(expression: unknown): unknown {
    const node = expression as { type: string; [key: string]: unknown };
    switch (node?.type) {
        case 'Literal': {
            const value = node.value;
            return value === null || ['string', 'number', 'boolean'].includes(typeof value) ? value : NOT_STATIC;
        }
        case 'TemplateLiteral': {
            const quasis = node.quasis as Array<{ value: { cooked: string | null } }>;
            return (node.expressions as unknown[]).length === 0 && quasis[0].value.cooked !== null ? quasis[0].value.cooked : NOT_STATIC;
        }
        case 'UnaryExpression': {
            const operand = staticValue(node.argument);
            return node.operator === '-' && typeof operand === 'number' ? -operand : NOT_STATIC;
        }
        case 'ArrayExpression': {
            const values = (node.elements as unknown[]).map((element) => (element === null ? NOT_STATIC : staticValue(element)));
            return values.includes(NOT_STATIC) ? NOT_STATIC : values;
        }
        case 'ObjectExpression': {
            const out: Record<string, unknown> = {};
            for (const property of node.properties as Array<{ type: string; computed: boolean; method: boolean; kind: string; key: { type: string; name?: string; value?: unknown }; value: unknown }>) {
                if (property.type !== 'Property' || property.computed || property.method || property.kind !== 'init') return NOT_STATIC;
                const key = property.key.type === 'Identifier' ? property.key.name : property.key.type === 'Literal' ? property.key.value : undefined;
                // A literal's `__proto__:` sets its prototype and holds no data, so it has no frontmatter form.
                if ((typeof key !== 'string' && typeof key !== 'number') || key === '__proto__') return NOT_STATIC;
                const value = staticValue(property.value);
                if (value === NOT_STATIC) return NOT_STATIC;
                // An own data property, never an assignment that could reach a setter.
                Object.defineProperty(out, String(key), { value, enumerable: true, writable: true, configurable: true });
            }
            return out;
        }
        default:
            return NOT_STATIC;
    }
}

const block = (name: string, children: JsonNode[], props: JsonProp[] = []): JsonBlock =>
    ({ kind: 'block', name, isComponent: false, props, children, dynamic: false });
const text = (value: string): JsonNode => ({ kind: 'text', value });
const string = (name: string, value: string): JsonProp => ({ name, kind: 'string', value });

class Reader {
    constructor(private readonly mdx: string, private readonly context: LensContext, private readonly definitions: Definitions) {}

    source(node: { position?: { start: { offset?: number }; end: { offset?: number } } }): string {
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        if (start === undefined || end === undefined) throw new MdxLensError('The MDX parser gave a node no position.');
        return this.mdx.slice(start, end);
    }

    flow(node: RootContent): JsonNode[] {
        switch (node.type) {
            case 'paragraph':
                // A tag alone on its line is a block of its own, not a paragraph around one inline tag. (The printer
                // writes a paragraph that holds only a tag as an explicit `<p>`, so the two never collide.)
                if (node.children.length === 1 && node.children[0].type === 'mdxJsxTextElement') {
                    return [this.jsx(node.children[0])];
                }
                return [block('p', this.phrasing(node.children))];
            case 'heading':
                return [block(`h${node.depth}`, this.phrasing(node.children))];
            case 'thematicBreak':
                return [block('hr', [])];
            case 'blockquote':
                return [block('blockquote', node.children.flatMap((child) => this.flow(child)))];
            case 'list': {
                const tight = node.spread !== true && node.children.every((item) => item.spread !== true);
                const props = node.ordered && node.start != null && node.start !== 1
                    ? [{ name: 'start', kind: 'number', value: node.start } as JsonProp] : [];
                return [block(node.ordered ? 'ol' : 'ul', node.children.map((item) => {
                    // A tight item is its text, then any lists nested under it (`<li>Text<ul>…</ul></li>`).
                    const [first, ...rest] = item.children;
                    const children = tight && first?.type === 'paragraph' && rest.every((child) => child.type === 'list')
                        ? [...this.phrasing(first.children), ...rest.flatMap((child) => this.flow(child))]
                        : item.children.flatMap((child) => this.flow(child));
                    return block('li', children);
                }), props)];
            }
            case 'code': {
                const props = [
                    ...(node.lang ? [string('className', `language-${node.lang}`)] : []),
                    ...(node.meta ? [string('data-meta', node.meta)] : []),
                ];
                return [block('pre', [block('code', [text(node.value)], props)])];
            }
            case 'table':
                return [this.table(node)];
            case 'definition':
                // Read into the links and images that use it.
                return [];
            case 'html':
                // MDX parses tags as JSX; a raw HTML node can't occur, but never drop text silently.
                return [{ kind: 'opaque', reason: 'expression', source: this.source(node) }];
            case 'mdxJsxFlowElement':
                return [this.jsx(node)];
            case 'mdxFlowExpression':
                return [this.expression(node)];
            case 'mdxjsEsm':
                throw new MdxLensError('An MDX page holds no code outside its JSX (ux-0233 d2).');
            default:
                throw new MdxLensError(`The MDX Lens can't read a \`${node.type}\` here.`);
        }
    }

    phrasing(nodes: PhrasingContent[]): JsonNode[] {
        const out: JsonNode[] = [];
        for (const node of nodes) {
            const read = this.inline(node);
            for (const child of read) {
                const last = out[out.length - 1];
                if (child.kind === 'text' && last?.kind === 'text' && last.prop == null && last.field == null && child.prop == null && child.field == null) {
                    out[out.length - 1] = text(last.value + child.value);
                } else out.push(child);
            }
        }
        return out;
    }

    inline(node: PhrasingContent): JsonNode[] {
        switch (node.type) {
            case 'text':
                // A soft line break inside a paragraph becomes a space (d2).
                return [text(node.value.replace(/[ \t]*\r?\n[ \t]*/g, ' '))];
            case 'strong':
                return [block('strong', this.phrasing(node.children))];
            case 'emphasis':
                return [block('em', this.phrasing(node.children))];
            case 'inlineCode':
                return [block('code', [text(node.value)])];
            case 'break':
                return [block('br', [])];
            case 'link':
                return [block('a', this.phrasing(node.children), linkProps(node.url, node.title))];
            case 'linkReference': {
                const target = this.definitions.get(node.identifier);
                if (!target) return [text(this.source(node))];
                return [block('a', this.phrasing(node.children), linkProps(target.url, target.title))];
            }
            case 'image':
                return [block('img', [], imageProps(node.url, node.alt, node.title))];
            case 'imageReference': {
                const target = this.definitions.get(node.identifier);
                if (!target) return [text(this.source(node))];
                return [block('img', [], imageProps(target.url, node.alt, target.title))];
            }
            case 'html':
                return [{ kind: 'opaque', reason: 'expression', source: this.source(node) }];
            case 'mdxJsxTextElement':
                return [this.jsx(node)];
            case 'mdxTextExpression':
                return [this.expression(node)];
            default:
                throw new MdxLensError(`The MDX Lens can't read an inline \`${node.type}\`.`);
        }
    }

    table(node: Table): JsonBlock {
        const rows = node.children.map((row, rowIndex) => block('tr', row.children.map((cell, column) => {
            const align = node.align?.[column];
            return block(rowIndex === 0 ? 'th' : 'td', this.phrasing(cell.children), align ? [string('align', align)] : []);
        })));
        const [head, ...body] = rows;
        return block('table', [block('thead', head ? [head] : []), ...(body.length ? [block('tbody', body)] : [])]);
    }

    /**
     * A JSX tag. Its attributes go through the TSX Lens, rebuilt as a self-closing tag from their own source, so
     * every attribute reads as it does in a `.tsx` page. Its children are Markdown and read here.
     */
    jsx(node: MdxJsxFlowElement | MdxJsxTextElement): JsonNode {
        if (node.attributes.some((attribute) => attribute.type === 'mdxJsxExpressionAttribute')) {
            return { kind: 'opaque', reason: 'spread', source: this.source(node) };
        }
        const name = node.name;
        let element: JsonBlock;
        if (name === null) {
            element = { kind: 'block', name: null, isComponent: false, props: [], children: [], dynamic: false };
        } else {
            const attributes = node.attributes.map((attribute) => this.source(attribute)).join(' ');
            const tag = `<${name}${attributes ? ` ${attributes}` : ''} />`;
            const roots = toJson(parseTsx(tag, this.context));
            const root = roots[0];
            if (roots.length !== 1 || root?.kind !== 'block') throw new MdxLensError(`The tag \`${name}\` does not read as one element.`);
            element = root;
        }
        let children: JsonNode[];
        if (node.type === 'mdxJsxTextElement') {
            children = this.phrasing(node.children as PhrasingContent[]);
        } else {
            const flow = node.children as RootContent[];
            // Content on the opening tag's own line is the tag's inline content (`<Button>Go</Button>`), which MDX
            // wraps in a paragraph; content on lines of its own is flow (`<Callout>`, a blank line, paragraphs).
            const only = flow.length === 1 && flow[0].type === 'paragraph' ? flow[0] : null;
            children = only && only.position?.start.line === node.position?.start.line
                ? this.phrasing(only.children)
                : flow.flatMap((child) => this.flow(child));
        }
        return { ...element, children };
    }

    /** `{…}`: a comment or any other expression is an Opaque Island; a string literal or `bdText` is text. */
    expression(node: MdxFlowExpression | MdxTextExpression): JsonNode {
        const source = this.source(node);
        const program = node.data?.estree;
        if (!program || program.body.length === 0) return { kind: 'opaque', reason: 'expression', source };
        const read = toJson(parseTsx(`<>${source}</>`, this.context))[0];
        const child = read?.kind === 'block' && read.children.length === 1 ? read.children[0] : null;
        if (child?.kind === 'text') return child;
        if (child?.kind === 'opaque') return { kind: 'opaque', reason: child.reason, source };
        return { kind: 'opaque', reason: 'expression', source };
    }
}

function linkProps(url: string, title: string | null | undefined): JsonProp[] {
    return [string('href', url), ...(title ? [string('title', title)] : [])];
}

function imageProps(url: string, alt: string | null | undefined, title: string | null | undefined): JsonProp[] {
    return [string('src', url), string('alt', alt ?? ''), ...(title ? [string('title', title)] : [])];
}
