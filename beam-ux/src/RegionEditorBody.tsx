import { Link2 } from 'lucide-react';
import { useState } from 'react';
import { SchemaForm, type SchemaNode } from '@schemastud/seam';
import { Badge, Button, Input, cn } from '@schemastud/ui';
import type { Region } from './types';

/**
 * The kind-driven editor body — the concrete thing mounted for an engaged region. `form` renders the
 * REAL @schemastud/seam SchemaForm over the loaded `body` + `schema` (the artifact that graduates to
 * a Frame EditShell on ship); the other kinds are faithful preview editors.
 */
export function RegionEditorBody({
    region,
    schema,
    body,
    onChange,
    onSave,
    saving,
}: {
    region: Region;
    schema: SchemaNode | null;
    body: Record<string, unknown>;
    onChange: (body: Record<string, unknown>) => void;
    onSave: () => void;
    saving?: boolean;
}) {
    switch (region.kind) {
        case 'form':
            return (
                <FormEditor
                    schema={schema}
                    body={body}
                    onChange={onChange}
                    onSave={onSave}
                    saving={saving}
                />
            );
        case 'richtext':
            return <RichtextEditor />;
        case 'frame':
            return <FrameEditor />;
        case 'list':
            return <ListEditor />;
    }
}

function FormEditor({
    schema,
    body,
    onChange,
    onSave,
    saving,
}: {
    schema: SchemaNode | null;
    body: Record<string, unknown>;
    onChange: (body: Record<string, unknown>) => void;
    onSave: () => void;
    saving?: boolean;
}) {
    return (
        <>
            {schema ? (
                <SchemaForm
                    schema={schema}
                    formData={body}
                    uiSchema={{
                        'ui:options': { label: false },
                        'ui:submitButtonOptions': { norender: true },
                    }}
                    onChange={(e: { formData?: Record<string, unknown> }) =>
                        onChange(e.formData ?? {})
                    }
                />
            ) : (
                <div className="rounded-md border border-dashed bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                    This region has no schema.
                </div>
            )}
            <div className="mt-4 flex items-center gap-2 border-t pt-4">
                <Button size="sm" onClick={onSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button size="sm" variant="ghost" disabled={saving}>
                    Discard
                </Button>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    REAL @schemastud/seam SchemaForm → EditShell on ship
                </span>
            </div>
        </>
    );
}

function RichtextEditor() {
    return (
        <div className="space-y-2">
            <div className="rounded-md border bg-background p-3">
                <div className="text-lg font-semibold tracking-tight">Build things that ship.</div>
                <div className="mt-1 text-sm text-muted-foreground">
                    Cohort-based programs for teams who&rsquo;d rather practice than watch.
                </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">H1</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">&para;</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">&#65291; block</span>
                <span className="ml-auto font-mono text-[10px]">
                    blockdoc &middot; value+onChange &asymp; FileEditSurface
                </span>
            </div>
        </div>
    );
}

function FrameEditor() {
    return (
        <div className="relative overflow-hidden rounded-md border">
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
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-background/70 to-transparent p-2">
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
