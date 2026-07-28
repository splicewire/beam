import '@mdxeditor/editor/style.css';
import './editor.css';
import {
    MDXEditor,
    type MDXEditorMethods,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    linkPlugin,
    linkDialogPlugin,
    imagePlugin,
    tablePlugin,
    codeBlockPlugin,
    codeMirrorPlugin,
    frontmatterPlugin,
    diffSourcePlugin,
    jsxPlugin,
    type JsxComponentDescriptor,
    toolbarPlugin,
    DiffSourceToggleWrapper,
    UndoRedo,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    CreateLink,
    InsertTable,
    InsertThematicBreak,
    ListsToggle,
} from '@mdxeditor/editor';
import { useRef } from 'react';
import { KIT_JSX_DESCRIPTORS } from './descriptors';
import { InsertKitBlock } from './toolbar';

/**
 * The rich MDX document editor (mdxeditor.dev). Edits an entire `.mdx` string — frontmatter + body —
 * and emits the same string via `onChange`, so it's a drop-in for the host edit buffer. A CodeMirror
 * **source** mode + a rich WYSIWYG mode live in one component (diff/source toggle); the native
 * `frontmatterPlugin` owns the `---` block. Client-only (Lexical) — the app lazy-loads it on edit.
 *
 * v1 ships source-first: the standard markdown plugins are on, custom JSX components render as opaque
 * blocks (schema-driven per-component descriptors land in a later phase via `jsxPlugin`).
 */
export interface MdxDocumentEditorProps {
    /** The full raw MDX buffer (frontmatter + body). */
    value: string;
    /** Called with the next full MDX string on every edit. */
    onChange: (next: string) => void;
    /** The custom-JSX descriptors mdxeditor needs to parse the guides' components into rich mode. */
    jsxDescriptors?: JsxComponentDescriptor[];
    className?: string;
}

// A CodeMirror language token per fenced-code lang so the source/code blocks highlight.
const CODE_LANGS = { '': 'text', text: 'Text', ts: 'TypeScript', tsx: 'TSX', js: 'JavaScript', json: 'JSON', bash: 'Shell', php: 'PHP', mdx: 'MDX', md: 'Markdown', html: 'HTML', css: 'CSS' };

export function MdxDocumentEditor({
    value,
    onChange,
    jsxDescriptors = KIT_JSX_DESCRIPTORS,
    className,
}: MdxDocumentEditorProps) {
    const ref = useRef<MDXEditorMethods>(null);

    return (
        <MDXEditor
            ref={ref}
            markdown={value}
            onChange={onChange}
            className={className}
            // Style the rich content with the docs typography so WYSIWYG looks like the guide.
            contentEditableClassName="site-prose mdx-editor-prose"
            plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                thematicBreakPlugin(),
                linkPlugin(),
                linkDialogPlugin(),
                imagePlugin(),
                tablePlugin(),
                codeBlockPlugin({ defaultCodeBlockLanguage: '' }),
                codeMirrorPlugin({ codeBlockLanguages: CODE_LANGS }),
                markdownShortcutPlugin(),
                frontmatterPlugin(),
                // Register the kit's custom JSX components so rich mode can parse the guides
                // (unregistered JSX makes mdxeditor refuse rich mode). Derived from the kit manifest.
                jsxPlugin({ jsxComponentDescriptors: jsxDescriptors }),
                // Default to source in v1 — reliable for every guide (incl. custom JSX + Artifact).
                diffSourcePlugin({ viewMode: 'source' }),
                toolbarPlugin({
                    toolbarContents: () => (
                        <DiffSourceToggleWrapper>
                            <UndoRedo />
                            <BoldItalicUnderlineToggles />
                            <BlockTypeSelect />
                            <CreateLink />
                            <ListsToggle />
                            <InsertTable />
                            <InsertThematicBreak />
                            <InsertKitBlock />
                        </DiffSourceToggleWrapper>
                    ),
                }),
            ]}
        />
    );
}
