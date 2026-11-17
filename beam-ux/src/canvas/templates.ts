// Generic defaults for the canvas insert-palette + inspector autocomplete pools. A host overrides these
// through CanvasConfig with its own design-token vocabulary (audiostud passes its Analog-Studio set); the
// package ships GENERIC values only — no host-specific colors or fonts.
import type { JsonBlock } from '../blockdoc/json.js';
import type { BlockTemplate } from './context.js';
import { englishBeamUxMessages, type BeamUxMessageKey } from '../messages.js';

/** A packaged template: its English label (what a host reads) plus the catalog key the palette renders. */
const named = (labelKey: BeamUxMessageKey, make: BlockTemplate['make']): BlockTemplate => ({ label: englishBeamUxMessages.t(labelKey), labelKey, make });

/** Build an intrinsic-element JsonBlock with string-kind className/style + text children. */
const block = (
    name: string,
    props: { className?: string; style?: string } = {},
    text?: string,
): JsonBlock => ({
    kind: 'block',
    name,
    isComponent: false,
    props: [
        ...(props.className !== undefined
            ? ([{ name: 'className', kind: 'string', value: props.className }] as const)
            : []),
        ...(props.style !== undefined
            ? ([{ name: 'style', kind: 'string', value: props.style }] as const)
            : []),
    ],
    children: text !== undefined ? [{ kind: 'text', value: text }] : [],
    dynamic: false,
});

/** The MDX content block (`name:'Mdx'`) — an in-place rich-text island. */
const mdxBlock = (): JsonBlock => ({
    kind: 'block',
    name: 'Mdx',
    isComponent: true,
    props: [],
    children: [],
    dynamic: false,
});

/** Generic insert-palette templates (plain HTML vocabulary). A host may replace via CanvasConfig. */
export const DEFAULT_BLOCK_TEMPLATES: BlockTemplate[] = [
    named('splicewire-beam-ux::messages.canvas_template_section', (m = englishBeamUxMessages) => block('section', { className: 'section', style: 'padding:40px' }, m.t('splicewire-beam-ux::messages.canvas_template_new_section'))),
    named('splicewire-beam-ux::messages.canvas_template_heading', (m = englishBeamUxMessages) => block('h2', { className: 'heading', style: 'font-size:32px' }, m.t('splicewire-beam-ux::messages.canvas_template_new_heading'))),
    named('splicewire-beam-ux::messages.canvas_template_text', (m = englishBeamUxMessages) => block('p', { className: 'body' }, m.t('splicewire-beam-ux::messages.canvas_template_new_paragraph'))),
    // Rich MDX content — renders the injected MdxView/MdxEdit island.
    named('splicewire-beam-ux::messages.canvas_template_content', mdxBlock),
    named('splicewire-beam-ux::messages.canvas_template_button', (m = englishBeamUxMessages) => block('button', { className: 'btn', style: 'padding:12px 20px;cursor:pointer' }, m.t('splicewire-beam-ux::messages.canvas_template_new_button'))),
    named('splicewire-beam-ux::messages.canvas_template_row', () => block('div', { className: 'row', style: 'display:flex;gap:12px' })),
    named('splicewire-beam-ux::messages.canvas_template_divider', () => block('hr', { style: 'border:none;border-top:1px solid rgba(0,0,0,.12);margin:24px 0' })),
];

/** Generic Tailwind-flavored class autocomplete pool. */
export const DEFAULT_CLASS_SUGGESTIONS: string[] = [
    'flex', 'grid', 'block', 'hidden', 'items-center', 'justify-between', 'gap-4', 'p-4', 'p-8',
    'px-6', 'py-3', 'mt-4', 'mb-6', 'text-center', 'text-lg', 'text-2xl', 'font-semibold',
    'rounded-lg', 'rounded-xl', 'shadow', 'w-full', 'max-w-2xl',
];

/** Generic CSS-var autocomplete pool. */
export const DEFAULT_VAR_SUGGESTIONS: string[] = [
    'var(--fg)', 'var(--bg)', 'var(--surface)', 'var(--accent)', 'var(--muted)', 'var(--border)',
];
