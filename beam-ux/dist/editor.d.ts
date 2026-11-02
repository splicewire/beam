import * as react from 'react';
import { ReactNode } from 'react';
import { U as UxBuilderClient } from './types-Cz1LnIB1.js';
import { C as CanvasTheme, a as CanvasConfig } from './css-BFisCZVy.js';
import { J as JsonDoc } from './json-CZHn4jKS.js';
import { E as EntryPayload } from './types-0rQxv9Lm.js';
import '@splicewire/beam-workflows/action-form';
import '@splicewire/beam-resources/types/beam-ux';
import './style-runtime-Bl3pudK9.js';
import './style-DwvipGPs.js';
import '@schemastud/blockdoc';
import '@babel/types';
import './types-Bzws8ncP.js';

interface EditorKitInputs {
    transport: UxBuilderClient;
    theme?: Partial<CanvasTheme>;
    canAuthor: boolean;
    /** Authenticated user id, required before editing; isolates persisted Local Sessions. */
    userId?: string;
    canvasConfig?: CanvasConfig;
    defaultTreeFor?: (slug: string) => JsonDoc | null;
    notify?: {
        success(message: string): void;
        error(message: string): void;
    };
}
declare function EditorKitProvider({ children, ...inputs }: EditorKitInputs & {
    children: ReactNode;
}): react.JSX.Element;
declare function useEditorKit(): Required<EditorKitInputs>;

/**
 * A persisted body is a JsonDoc only when it's a NON-EMPTY array of `{kind}` nodes; anything else —
 * including `[]` — returns null so the caller falls back to its seed.
 *
 * The empty case is the one that was wrong and the one that mattered. `EntryBodyShowOp` returns
 * `body: []` for an entry that has never been authored, and `[].every(…)` is vacuously true, so `[]`
 * passed as a document: `VisualEditorMount` skipped `seedFor(slug)` and opened the editor on a doc with
 * no root — nothing rendered, nothing was selectable, and "+ Heading" appeared to do nothing while
 * flipping the status to "Unsaved". Measured on beam.test's `/about` 2026-09-11
 * (G2-BEAM-AUTHOR-EMPTY-ENTRY). An author's FIRST block is exactly the case this seam must serve.
 */
declare function asDoc(body: unknown): JsonDoc | null;
interface PageEditorProps {
    slug: string;
    body?: unknown;
    /**
     * The entry's uuid — supplied by the page from its server-shared `entry` prop
     * (`App\Support\PageEntryRef`).
     *
     * The BODY transport is addressed by id (ADR-0214 §2), so without this the surface can render the
     * body it was handed but cannot persist one. `null` is the honest answer for a page whose row is
     * absent (a database that was never seeded): the default tree still renders, Save reports it.
     */
    entryId?: string | null;
}
declare function PageEditor({ slug, body, entryId: suppliedId }: PageEditorProps): react.JSX.Element;

type EntryRef$1 = {
    id: string | null;
    slug: string | null;
    format?: string | null;
    bodyKind?: string | null;
};
declare function VisualEditorMount({ entryRef }: {
    entryRef: EntryRef$1;
}): react.JSX.Element;

declare function EditableEntryBody({ entry, children }: {
    entry: EntryPayload;
    children: ReactNode;
}): react.JSX.Element;

type EntryRef = {
    format?: string | null;
    bodyKind?: string | null;
};
declare function CanvasOrRefusal({ entry, children }: {
    entry: EntryRef;
    children: ReactNode;
}): react.JSX.Element;

declare const canvasConfig: CanvasConfig;

declare const DEFAULT_TREES: Record<string, JsonDoc>;
declare function defaultTreeFor(slug: string): JsonDoc | null;

declare function DemoHero(): react.JSX.Element;
declare function DemoFeatureRow(): react.JSX.Element;

declare function RichMarkdown({ content }: {
    content?: unknown;
}): ReactNode;
declare function RichBlockdoc({ content }: {
    content?: unknown;
}): ReactNode;
declare const richFieldComponents: {
    RichMarkdown: typeof RichMarkdown;
    RichBlockdoc: typeof RichBlockdoc;
};

declare const NEUTRAL_THEME: Partial<CanvasTheme>;

export { CanvasOrRefusal, DEFAULT_TREES, DemoFeatureRow, DemoHero, EditableEntryBody, type EditorKitInputs, EditorKitProvider, NEUTRAL_THEME, PageEditor, type PageEditorProps, RichBlockdoc, RichMarkdown, VisualEditorMount, asDoc, canvasConfig as defaultCanvasConfig, defaultTreeFor, richFieldComponents, useEditorKit };
