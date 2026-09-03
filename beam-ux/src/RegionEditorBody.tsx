import { Link2 } from 'lucide-react';
import { useState } from 'react';
import { SchemaForm, type SchemaNode } from '@schemastud/seam';
import { Badge, Button, Input, Textarea, cn } from '@schemastud/ui';
import type { Region } from './types';
import { UX_BUILDER_CSS } from './css';

/**
 * The kind-driven editor body — the concrete thing mounted for an engaged region. `form` renders the
 * REAL @schemastud/seam SchemaForm over the loaded `body` + `schema`; `richtext` renders the body's
 * MDX source. `frame` and `list` are preview editors that are NOT bound to `body`.
 *
 * ## Why the commit row lives here and not inside one editor (beam-docs-satellite 64)
 *
 * It used to live inside {@link FormEditor}, which made Save reachable only on the `form` branch. With
 * every real entry's body returning `schema: null` — the two shapes a host actually produces are
 * `kind: schema != null ? 'form' : 'richtext'` — that put the whole write leg behind a branch nothing
 * took, and the `richtext` branch rendered a propless mock instead. Save is a property of an editor
 * BOUND to the body, not of the SchemaForm, so it wraps every such editor from out here.
 *
 * `frame` and `list` deliberately get no commit row. Neither reads `body` or calls `onChange`: the
 * frame preview's own label states it "self-loads/saves via FrameProvider" (an opaque island owning
 * its own persistence) and the list preview edits a route slug in local state. A Save on either would
 * write the untouched loaded body straight back and bump a particle version for nothing.
 */
export function RegionEditorBody({
    region,
    schema,
    body,
    onChange,
    onSave,
    onDiscard,
    saving,
}: {
    region: Region;
    schema: SchemaNode | null;
    body: Record<string, unknown>;
    onChange: (body: Record<string, unknown>) => void;
    onSave: () => void;
    /** Drop the in-flight edit buffer. Omitted ⇒ the Discard control renders disabled. */
    onDiscard?: () => void;
    saving?: boolean;
}) {
    switch (region.kind) {
        case 'form':
            return (
                <>
                    <FormEditor schema={schema} body={body} onChange={onChange} />
                    <EditorActions
                        onSave={onSave}
                        onDiscard={onDiscard}
                        saving={saving}
                        hint="REAL @schemastud/seam SchemaForm → EditShell on ship"
                    />
                </>
            );
        case 'richtext':
            return (
                <>
                    <RichtextEditor body={body} onChange={onChange} />
                    <EditorActions
                        onSave={onSave}
                        onDiscard={onDiscard}
                        saving={saving}
                        hint="MDX source · content + preserved frontmatter"
                    />
                </>
            );
        case 'frame':
            return <FrameEditor />;
        case 'list':
            return <ListEditor />;
    }
}

/** The commit row every body-bound editor wears — see {@link RegionEditorBody}'s docblock. */
function EditorActions({
    onSave,
    onDiscard,
    saving,
    hint,
}: {
    onSave: () => void;
    onDiscard?: () => void;
    saving?: boolean;
    hint: string;
}) {
    return (
        <div className="mt-4 flex items-center gap-2 border-t pt-4">
            <Button size="sm" onClick={onSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDiscard} disabled={saving || !onDiscard}>
                Discard
            </Button>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{hint}</span>
        </div>
    );
}

function FormEditor({
    schema,
    body,
    onChange,
}: {
    schema: SchemaNode | null;
    body: Record<string, unknown>;
    onChange: (body: Record<string, unknown>) => void;
}) {
    if (!schema) {
        return (
            <div className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                This region has no schema.
            </div>
        );
    }

    return (
        <SchemaForm
            schema={schema}
            formData={body}
            uiSchema={{
                'ui:options': { label: false },
                'ui:submitButtonOptions': { norender: true },
            }}
            onChange={(e: { formData?: Record<string, unknown> }) => onChange(e.formData ?? {})}
        />
    );
}

/**
 * The particle-body key holding the MDX content, and the one holding the parsed frontmatter —
 * `Splicewire\Beam\Mdx\MdxBody::CONTENT_KEY` / `::FRONTMATTER_KEY`, the shape every schema-less entry
 * body on the wire carries. Both body layouts the estate produces are covered: the codec's nested
 * `{frontmatter, content}` and `enrich-page-schemas`' flattened `{...frontmatterFields, content}`.
 */
const CONTENT_KEY = 'content';
const FRONTMATTER_KEY = 'frontmatter';

/**
 * The schema-less body editor: the MDX source, editable, over the raw particle body.
 *
 * It edits ONE key and spreads the rest, so a body's frontmatter (nested under `frontmatter`, or
 * flattened alongside `content`) round-trips through a save untouched — `MdxBody::decode()` re-emits
 * the `---` block from it, and losing it here would silently rewrite the author's file.
 *
 * A plain source surface and not a WYSIWYG one, deliberately. The estate's rich MDX editor is
 * `@splicewire/beam-mdx/editor`'s `MdxDocumentEditor` (mdxeditor.dev + Lexical), and this map already
 * refused that cargo once: ticket 39 rejected a lift on the CARGO axis, because a heavy author-only
 * dependency must not land inside a package every beam host installs HEADLESSLY. Same reasoning here,
 * so the package ships the dependency-free default — the `consoleNotify` precedent in `provider.tsx`.
 * A host wanting the rich editor supplies it; that seam does not exist yet and no host has asked.
 */
function RichtextEditor({
    body,
    onChange,
}: {
    body: Record<string, unknown>;
    onChange: (body: Record<string, unknown>) => void;
}) {
    const content = typeof body[CONTENT_KEY] === 'string' ? (body[CONTENT_KEY] as string) : '';
    const preserved = Object.keys(body).filter((key) => key !== CONTENT_KEY);
    const frontmatter = body[FRONTMATTER_KEY];
    const fields =
        frontmatter && typeof frontmatter === 'object' && !Array.isArray(frontmatter)
            ? Object.keys(frontmatter as Record<string, unknown>)
            : preserved;

    return (
        <div className="space-y-2">
            <Textarea
                value={content}
                onChange={(e) => onChange({ ...body, [CONTENT_KEY]: e.target.value })}
                rows={18}
                spellCheck={false}
                aria-label="MDX source"
                className="font-mono text-xs"
            />
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                {fields.length > 0 ? (
                    <>
                        <span className="font-mono text-[10px]">preserved</span>
                        {fields.map((key) => (
                            <span
                                key={key}
                                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
                            >
                                {key}
                            </span>
                        ))}
                    </>
                ) : (
                    <span className="font-mono text-[10px]">no frontmatter on this body</span>
                )}
                <span className="ml-auto font-mono text-[10px]">mdx source</span>
            </div>
        </div>
    );
}

function FrameEditor() {
    return (
        <div className="relative overflow-hidden rounded-md border">
            <style>{UX_BUILDER_CSS}</style>
            <div className="border-b bg-muted/40 px-3 py-2 text-xs">
                <span className="font-mono">frame:enrollment</span> &mdash; self-loading
            </div>
            <div className="divide-y">
                {['A. Mensah', 'R. Okafor', 'J. Park'].map((n) => (
                    <div key={n} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="flex-1">{n}</span>
                        <Badge variant="secondary" className="text-[10px]">
                            enrolled
                        </Badge>
                    </div>
                ))}
            </div>
            {/* the "opaque island" scrim — you cannot reach into its buffer */}
            <div className="beam-ux-scrim pointer-events-none absolute inset-0 flex items-end justify-center p-2">
                <span className="rounded bg-foreground/80 px-2 py-1 font-mono text-[10px] text-background">
                    opaque EditShell island &middot; self-loads/saves via FrameProvider
                </span>
            </div>
        </div>
    );
}

const LIST_ROWS = [
    { slug: 'frontend-foundations', title: 'Frontend Foundations', format: 'cohort', seats: 8 },
    { slug: 'data-modeling', title: 'Data Modeling', format: 'self-paced', seats: 0 },
    { slug: 'live-systems-design', title: 'Live Systems Design', format: 'live', seats: 3 },
];

function ListEditor() {
    const [slug, setSlug] = useState(LIST_ROWS[0].slug);
    return (
        <div className="space-y-3">
            <div className="rounded-md border bg-background p-3">
                <div className="flex items-center gap-2 text-xs">
                    <Link2 className="size-3.5 text-muted-foreground" />
                    <span className="font-mono">route</span>
                    <span className="font-mono text-muted-foreground">/programs/</span>
                    <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="h-7 w-48 font-mono text-xs"
                    />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                    The list component reads <span className="font-mono">{'{slug}'}</span> from the
                    route and resolves its collection &mdash; dropped into a template placement, it is
                    the page&rsquo;s data spine.
                </p>
            </div>
            <div className="divide-y rounded-md border">
                {LIST_ROWS.map((r) => (
                    <div
                        key={r.slug}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 text-sm',
                            r.slug === slug && 'bg-primary/5',
                        )}
                    >
                        <span className="flex-1 font-medium">{r.title}</span>
                        <Badge variant="outline" className="text-[10px]">
                            {r.format}
                        </Badge>
                        <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                            {r.seats > 0 ? `${r.seats} seats` : 'full'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
