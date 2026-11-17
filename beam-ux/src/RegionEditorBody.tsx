import { Link2 } from 'lucide-react';
import { useState } from 'react';
import { SchemaForm, type SchemaNode } from '@schemastud/seam';
import { Badge, Button, Input, Textarea, cn } from '@schemastud/ui';
import type { Region } from './types';
import type { EntryBody } from './types';
import type { JsonDoc, JsonNode } from './blockdoc/json';
import { UX_BUILDER_CSS } from './css';
import { useBeamUxMessages } from './messages.js';
import { richMessage } from './rich-message.js';

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
    saveLabel,
    saveDisabled,
}: {
    region: Region;
    schema: SchemaNode | null;
    body: EntryBody;
    onChange: (body: EntryBody) => void;
    onSave: () => void;
    /** Drop the in-flight edit buffer. Omitted ⇒ the Discard control renders disabled. */
    onDiscard?: () => void;
    saving?: boolean;
    saveLabel?: string;
    saveDisabled?: boolean;
}) {
    switch (region.kind) {
        case 'form':
            return (
                <>
                    <FormEditor
                        schema={schema}
                        body={Array.isArray(body) ? {} : body}
                        onChange={(next) => onChange(next)}
                    />
                    <EditorActions
                        onSave={onSave}
                        onDiscard={onDiscard}
                        saving={saving}
                        saveLabel={saveLabel}
                        saveDisabled={saveDisabled}
                        // A real @schemastud/seam SchemaForm; graduates to EditShell (APP-10: author chrome stays out of copy).
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
                        saveLabel={saveLabel}
                        saveDisabled={saveDisabled}
                        // MDX source: content plus preserved frontmatter (APP-10).
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
    saveLabel,
    saveDisabled,
}: {
    onSave: () => void;
    onDiscard?: () => void;
    saving?: boolean;
    saveLabel?: string;
    saveDisabled?: boolean;
}) {
    const m = useBeamUxMessages();
    return (
        <div className="mt-4 flex items-center gap-2 border-t pt-4">
            <Button size="sm" onClick={onSave} disabled={saving || saveDisabled}>
                {saving ? m.t('splicewire-beam-ux::messages.region_saving') : (saveLabel ?? m.t('splicewire-beam-ux::messages.region_save'))}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDiscard} disabled={saving || !onDiscard}>
                {m.t('splicewire-beam-ux::messages.region_discard')}
            </Button>
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
    const m = useBeamUxMessages();
    if (!schema) {
        return (
            <div className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                {m.t('splicewire-beam-ux::messages.region_no_schema')}
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
    body: EntryBody;
    onChange: (body: EntryBody) => void;
}) {
    const m = useBeamUxMessages();
    const isDocument = Array.isArray(body);
    const content = isDocument
        ? firstTextValue(body)
        : (typeof body[CONTENT_KEY] === 'string' ? (body[CONTENT_KEY] as string) : '');
    const preserved = isDocument ? [] : Object.keys(body).filter((key) => key !== CONTENT_KEY);
    const frontmatter = isDocument ? undefined : body[FRONTMATTER_KEY];
    const fields =
        frontmatter && typeof frontmatter === 'object' && !Array.isArray(frontmatter)
            ? Object.keys(frontmatter as Record<string, unknown>)
            : preserved;

    return (
        <div className="space-y-2">
            <Textarea
                value={content}
                onChange={(e) => onChange(isDocument
                    ? replaceFirstTextValue(body, e.target.value)
                    : { ...body, [CONTENT_KEY]: e.target.value })}
                rows={18}
                spellCheck={false}
                aria-label={m.t('splicewire-beam-ux::messages.region_mdx_source_label')}
                placeholder={m.t('splicewire-beam-ux::messages.region_mdx_placeholder')}
                className="font-mono text-xs"
            />
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                {fields.length > 0 ? (
                    <>
                        <span className="font-mono text-[10px]">{m.t('splicewire-beam-ux::messages.region_preserved')}</span>
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
                    <span className="font-mono text-[10px]">{m.t('splicewire-beam-ux::messages.region_no_frontmatter')}</span>
                )}
                <span className="ml-auto font-mono text-[10px]">{m.t('splicewire-beam-ux::messages.region_mdx_source_tag')}</span>
            </div>
        </div>
    );
}

function findEditableTextNode(nodes: JsonDoc): Extract<JsonNode, { kind: 'text' }> | null {
    let firstText: Extract<JsonNode, { kind: 'text' }> | null = null;
    const visit = (items: JsonDoc): Extract<JsonNode, { kind: 'text' }> | null => {
        for (const node of items) {
            if (node.kind === 'text') {
                firstText ??= node;
                if (node.value !== '') return node;
            } else if (node.kind === 'block') {
                const child = visit(node.children);
                if (child?.value !== undefined && child.value !== '') return child;
                for (const slotNodes of Object.values(node.slots ?? {})) {
                    const slot = visit(slotNodes);
                    if (slot?.value !== undefined && slot.value !== '') return slot;
                }
            }
        }

        return null;
    };

    return visit(nodes) ?? firstText;
}

function firstTextValue(nodes: JsonDoc): string {
    return findEditableTextNode(nodes)?.value ?? '';
}

function replaceFirstTextValue(nodes: JsonDoc, value: string): JsonDoc {
    const target = findEditableTextNode(nodes);
    if (!target) return [...nodes, { kind: 'text', value }];

    const replace = (node: JsonNode): JsonNode => {
        if (node.kind === 'text') {
            return node === target ? { ...node, value } : node;
        }
        if (node.kind !== 'block') return node;

        const children = node.children.map(replace);
        const slots = node.slots
            ? Object.fromEntries(Object.entries(node.slots).map(([name, slotNodes]) => [name, slotNodes.map(replace)]))
            : undefined;

        return slots === undefined ? { ...node, children } : { ...node, children, slots };
    };
    return nodes.map(replace);
}

function FrameEditor() {
    const m = useBeamUxMessages();
    return (
        <div className="relative overflow-hidden rounded-md border">
            <style>{UX_BUILDER_CSS}</style>
            <div className="border-b bg-muted/40 px-3 py-2 text-xs">
                {richMessage(m, 'splicewire-beam-ux::messages.region_frame_self_loading', { frame: <span className="font-mono">{'frame:enrollment'}</span> })}
            </div>
            <div className="divide-y">
                {['A. Mensah', 'R. Okafor', 'J. Park'].map((n) => (
                    <div key={n} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="flex-1">{n}</span>
                        <Badge variant="secondary" className="text-[10px]">
                            {m.t('splicewire-beam-ux::messages.region_sample_enrolled')}
                        </Badge>
                    </div>
                ))}
            </div>
            {/* the "opaque island" scrim — you cannot reach into its buffer. It fades the rows only;
                the caption sits in flow beneath them so it never covers a row. */}
            <div className="beam-ux-scrim pointer-events-none absolute inset-0" />
            <div className="relative border-t bg-muted/40 px-3 py-1.5 text-center font-mono text-[10px] text-muted-foreground">
                {m.t('splicewire-beam-ux::messages.region_frame_island_caption')}
            </div>
        </div>
    );
}

const LIST_ROWS = [
    { slug: 'frontend-foundations', titleKey: 'splicewire-beam-ux::messages.region_sample_frontend_foundations', formatKey: 'splicewire-beam-ux::messages.region_format_cohort', seats: 8 },
    { slug: 'data-modeling', titleKey: 'splicewire-beam-ux::messages.region_sample_data_modeling', formatKey: 'splicewire-beam-ux::messages.region_format_self_paced', seats: 0 },
    { slug: 'live-systems-design', titleKey: 'splicewire-beam-ux::messages.region_sample_live_systems_design', formatKey: 'splicewire-beam-ux::messages.region_format_live', seats: 3 },
] as const;

function ListEditor() {
    const m = useBeamUxMessages();
    const [slug, setSlug] = useState<string>(LIST_ROWS[0].slug);
    return (
        <div className="space-y-3">
            <div className="rounded-md border bg-background p-3">
                <div className="flex items-center gap-2 text-xs">
                    <Link2 className="size-3.5 text-muted-foreground" />
                    <span className="font-mono">{'route'}</span>
                    <span className="font-mono text-muted-foreground">{'/programs/'}</span>
                    <Input
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="h-7 w-48 font-mono text-xs"
                    />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                    {richMessage(m, 'splicewire-beam-ux::messages.region_list_explainer', { slug: <span className="font-mono">{'{slug}'}</span> })}
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
                        <span className="flex-1 font-medium">{m.t(r.titleKey)}</span>
                        <Badge variant="outline" className="text-[10px]">
                            {m.t(r.formatKey)}
                        </Badge>
                        <span className="w-16 text-right font-mono text-xs text-muted-foreground">
                            {r.seats > 0 ? m.t('splicewire-beam-ux::messages.region_sample_seats', { count: r.seats }) : m.t('splicewire-beam-ux::messages.region_sample_full')}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
