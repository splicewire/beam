import { createElement, Fragment, type ReactNode } from 'react';
import { fromMarkdown } from 'mdast-util-from-markdown';

/** ADR-0229 d13: only element construction, never HTML insertion or MDX evaluation. */
function safeUrl(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    try {
        const url = new URL(value, 'https://binding.invalid');
        return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? value : undefined;
    } catch { return undefined; }
}

interface MarkdownNode {
    type: string; value?: string; children?: MarkdownNode[]; url?: string;
    title?: string | null; alt?: string | null; depth?: number; ordered?: boolean;
    start?: number | null; identifier?: string;
}

export function RichMarkdown({ content }: { content?: unknown }): ReactNode {
    if (typeof content !== 'string') return null;
    const root = fromMarkdown(content) as MarkdownNode;
    const definitions = new Map<string, MarkdownNode>();
    const collect = (node: MarkdownNode): void => {
        if (node.type === 'definition' && node.identifier) definitions.set(node.identifier, node);
        node.children?.forEach(collect);
    };
    collect(root);
    const render = (node: MarkdownNode, key: number): ReactNode => {
        const children = node.children?.map(render);
        const element = (tag: string, props: object = {}, body: ReactNode = children) => createElement(tag, { key, ...props }, body);
        switch (node.type) {
            case 'root': return createElement(Fragment, { key }, children);
            case 'text': return node.value;
            case 'paragraph': return element('p');
            case 'heading': return element(`h${Math.min(6, Math.max(1, node.depth ?? 1))}`);
            case 'strong': return element('strong');
            case 'emphasis': return element('em');
            case 'inlineCode': return element('code', {}, node.value);
            case 'code': return element('pre', {}, createElement('code', null, node.value));
            case 'blockquote': return element('blockquote');
            case 'list': return element(node.ordered ? 'ol' : 'ul', node.ordered ? { start: node.start ?? 1 } : {});
            case 'listItem': return element('li');
            case 'break': return createElement('br', { key });
            case 'thematicBreak': return createElement('hr', { key });
            case 'link': case 'linkReference': {
                const target = node.type === 'link' ? node : definitions.get(node.identifier ?? '');
                const href = safeUrl(target?.url);
                return href ? element('a', { href, title: target?.title ?? undefined }) : createElement(Fragment, { key }, children);
            }
            case 'image': case 'imageReference': {
                const target = node.type === 'image' ? node : definitions.get(node.identifier ?? '');
                const src = safeUrl(target?.url);
                return src ? createElement('img', { key, src, alt: node.alt ?? '', title: target?.title ?? undefined }) : null;
            }
            // Raw HTML is deliberately omitted. Unknown syntax is never interpreted as a component.
            case 'html': case 'definition': return null;
            default: return createElement(Fragment, { key }, children);
        }
    };
    return render(root, 0);
}

type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject | undefined {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : undefined;
}

export function RichBlockdoc({ content }: { content?: unknown }): ReactNode {
    const render = (value: unknown, key: number, depth = 0): ReactNode => {
        const node = object(value);
        if (!node || depth > 100) return null;
        const attrs = object(node.attrs) ?? {};
        const children = Array.isArray(node.content) ? node.content.map((child, index) => render(child, index, depth + 1)) : [];
        if (node.type === 'text') {
            let text: ReactNode = typeof node.text === 'string' ? node.text : '';
            for (const mark of Array.isArray(node.marks) ? node.marks : []) {
                const data = object(mark);
                const tag = ({ strong: 'strong', bold: 'strong', em: 'em', italic: 'em', code: 'code', strike: 's', underline: 'u' } as Record<string, string>)[String(data?.type)];
                if (typeof tag === 'string') text = createElement(tag, null, text);
                else if (data?.type === 'link') {
                    const href = safeUrl(object(data.attrs)?.href);
                    if (href) text = createElement('a', { href }, text);
                }
            }
            return createElement(Fragment, { key }, text);
        }
        if (node.type === 'doc') return createElement(Fragment, { key }, children);
        if (node.type === 'heading') {
            const level = Number.isInteger(attrs.level) ? Math.min(6, Math.max(1, attrs.level as number)) : 1;
            return createElement(`h${level}`, { key }, children);
        }
        const tag = ({ paragraph: 'p', p: 'p', blockquote: 'blockquote', bullet_list: 'ul', bulletList: 'ul',
            ordered_list: 'ol', orderedList: 'ol', list_item: 'li', listItem: 'li',
            code_block: 'pre', codeBlock: 'pre' } as Record<string, string>)[String(node.type)];
        if (typeof tag === 'string') return createElement(tag, { key }, children);
        if (node.type === 'hard_break' || node.type === 'hardBreak') return createElement('br', { key });
        if (node.type === 'horizontal_rule' || node.type === 'horizontalRule') return createElement('hr', { key });
        // Custom node views and arbitrary attributes are code, not rich-field prose.
        return createElement(Fragment, { key }, children);
    };
    return render(content, 0);
}

export const richFieldComponents = { RichMarkdown, RichBlockdoc };
