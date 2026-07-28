import { createElement, type ChangeEvent, type ReactElement, type ReactNode } from 'react';

import { RuntimeMdx, type MdxComponentMap, type RuntimeMdxOptions } from './runtime-mdx';

/**
 * The **authoring** twin of {@link RuntimeMdx}: an editable MDX buffer beside a live preview that
 * recompiles as you type. A developer drops `<MdxEditor value={…} onChange={…} components={kit} />`
 * and gets a text area whose edits re-render through the same runtime compile path the reader uses,
 * so what an author sees while editing is what a visitor gets.
 *
 * Deliberately **generic and unstyled** (class hooks only): it knows nothing about routes, gates,
 * tenants, or "docs" — it edits a string. The buffer is *controlled* (the host owns the value, so
 * the same buffer can also drive the page's live `main` re-render); the preview is the shipped
 * {@link RuntimeMdx} over that value, given the same kit + plugins the reader uses for fidelity.
 * Client-only, like `RuntimeMdx` (kept out of the `/vite` node entry).
 */
export interface MdxEditorProps extends RuntimeMdxOptions {
    /** The current raw MDX buffer (controlled by the host). */
    value: string;
    /** Called with the next buffer on every edit. */
    onChange: (next: string) => void;
    /** The kit component map injected into the live preview (Callout, Steps, Figure, …). */
    components?: MdxComponentMap;
    /** Hide the live preview pane (edit-only). Defaults to showing it. */
    preview?: boolean;
    /** Shown in the preview while a compile is in flight. */
    fallback?: ReactNode;
    /** Rendered in the preview when the buffer is malformed MDX; receives the error. */
    renderError?: (error: Error) => ReactNode;
    /** Class hooks — the host skins the layout, the textarea, and the preview. */
    className?: string;
    editorClassName?: string;
    previewClassName?: string;
    /** Textarea passthroughs. */
    placeholder?: string;
    spellCheck?: boolean;
    'aria-label'?: string;
}

/**
 * A controlled MDX editor + live preview. The textarea drives `onChange`; the preview is a
 * {@link RuntimeMdx} over the current `value`, so it recompiles on every edit through the kit map.
 */
export function MdxEditor({
    value,
    onChange,
    components,
    preview = true,
    fallback = null,
    renderError,
    remarkPlugins,
    rehypePlugins,
    className,
    editorClassName,
    previewClassName,
    placeholder,
    spellCheck = false,
    'aria-label': ariaLabel = 'MDX source',
}: MdxEditorProps): ReactElement {
    const textarea = createElement('textarea', {
        className: editorClassName,
        value,
        placeholder,
        spellCheck,
        'aria-label': ariaLabel,
        onChange: (event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
    });

    const previewPane = preview
        ? createElement(
              'div',
              { className: previewClassName, 'aria-live': 'polite' },
              createElement(RuntimeMdx, {
                  source: value,
                  components,
                  fallback,
                  renderError,
                  remarkPlugins,
                  rehypePlugins,
              }),
          )
        : null;

    return createElement('div', { className }, textarea, previewPane);
}
