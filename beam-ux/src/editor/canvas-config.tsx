// The host's CanvasConfig for @splicewire/beam-ux/canvas — the single place that injects app specifics
// into the promoted visual editor: the island registry, the MDX view/edit components, and the host's
// insert palette + class/var suggestions. Machinery is all in the package; this is the "config, not
// machinery" surface a fresh beam host writes (frontend-surfaces.md, editor).
import type { JsonBlock } from '../blockdoc/json';
import type { BlockTemplate, CanvasConfig } from '../canvas';
import { defaultComponents } from './registry';
import { englishBeamUxMessages } from '../messages.js';

const str = (name: string, value: string) => ({
    name,
    kind: 'string' as const,
    value,
});
const el = (
    name: string,
    props: { name: string; kind: 'string'; value: string }[],
    children: JsonBlock['children'] = [],
): JsonBlock => ({
    kind: 'block',
    name,
    isComponent: /^[A-Z]/.test(name),
    props,
    children,
    dynamic: false,
});

// The insert palette — host content, authored as JsonBlocks (NEUTRAL styling).
const BLOCK_TEMPLATES: BlockTemplate[] = [
    {
        label: englishBeamUxMessages.t('splicewire-beam-ux::messages.canvas_template_section'),
        labelKey: 'splicewire-beam-ux::messages.canvas_template_section',
        make: (m = englishBeamUxMessages) =>
            el(
                'section',
                [str('style', 'padding:40px 0')],
                [el('p', [], [{ kind: 'text', value: m.t('splicewire-beam-ux::messages.canvas_template_new_section') }])],
            ),
    },
    {
        label: englishBeamUxMessages.t('splicewire-beam-ux::messages.canvas_template_heading'),
        labelKey: 'splicewire-beam-ux::messages.canvas_template_heading',
        make: (m = englishBeamUxMessages) =>
            el(
                'h2',
                [str('style', 'font-size:28px;font-weight:700;color:var(--st-fg,#0f172a)')],
                [{ kind: 'text', value: m.t('splicewire-beam-ux::messages.canvas_template_new_heading') }],
            ),
    },
    {
        label: englishBeamUxMessages.t('splicewire-beam-ux::messages.canvas_template_text'),
        labelKey: 'splicewire-beam-ux::messages.canvas_template_text',
        make: (m = englishBeamUxMessages) =>
            el(
                'p',
                [str('style', 'color:var(--st-muted,#475569);line-height:1.6')],
                [{ kind: 'text', value: m.t('splicewire-beam-ux::messages.canvas_template_new_paragraph') }],
            ),
    },
    {
        label: englishBeamUxMessages.t('splicewire-beam-ux::messages.canvas_template_button'),
        labelKey: 'splicewire-beam-ux::messages.canvas_template_button',
        make: (m = englishBeamUxMessages) =>
            el(
                'button',
                [
                    str(
                        'style',
                        'background:var(--st-accent,#0f172a);color:var(--st-accent-fg,#fff);border:none;border-radius:10px;padding:11px 18px;cursor:pointer',
                    ),
                ],
                [{ kind: 'text', value: m.t('splicewire-beam-ux::messages.canvas_template_new_button') }],
            ),
    },
    {
        label: englishBeamUxMessages.t('splicewire-beam-ux::messages.canvas_template_row'),
        labelKey: 'splicewire-beam-ux::messages.canvas_template_row',
        make: () => el('div', [str('style', 'display:flex;gap:12px')]),
    },
    {
        label: englishBeamUxMessages.t('splicewire-beam-ux::messages.canvas_template_divider'),
        labelKey: 'splicewire-beam-ux::messages.canvas_template_divider',
        make: () =>
            el('hr', [
                str(
                    'style',
                    'border:none;border-top:1px solid var(--st-card-border,#e2e8f0);margin:24px 0',
                ),
            ]),
    },
];

const CLASS_SUGGESTIONS = [
    'flex',
    'grid',
    'items-center',
    'justify-between',
    'gap-4',
    'p-4',
    'p-8',
    'mt-4',
    'mb-6',
    'text-center',
    'text-lg',
    'text-2xl',
    'font-semibold',
    'rounded-lg',
    'rounded-xl',
    'shadow',
    'w-full',
    'max-w-2xl',
];
const VAR_SUGGESTIONS = [
    'var(--shell-accent)',
    'var(--shell-fg)',
    'var(--shell-surface)',
];

export const canvasConfig: CanvasConfig = {
    get registry() { return defaultComponents(); },
    blockTemplates: BLOCK_TEMPLATES,
    classSuggestions: CLASS_SUGGESTIONS,
    varSuggestions: VAR_SUGGESTIONS,
};
