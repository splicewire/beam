import { useState } from 'react';
import { Badge } from '@schemastud/ui';
import { Button } from '@schemastud/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@schemastud/ui';
import { Input } from '@schemastud/ui';
import { Label } from '@schemastud/ui';
import { Textarea } from '@schemastud/ui';
import {
    useCreateTransform,
    useDeleteTransform,
    useTestTransform,
    useTransforms,
    useUpdateTransform,
} from './hooks';
import { useNotify, useTransformsCan, useTransformsServices } from './provider';
import type { RunnerTransform, RunnerTransformResult } from './types';
import { useBeamTransformsMessages, type BeamTransformsMessageKey, type BeamTransformsMessages } from './messages';
import { richMessage } from './rich-message';

// The RunnerTransform authoring editor (popcorn-runner-substrate ticket 09 §5, ADR-0116/0141) —
// the standalone admin surface for sandboxed, user-authored transforms, promoted from the
// conduit-node-transform prototype. Portable + DTO-first: it owns its react-query data logic, types
// off the RunnerTransform wire shape, imports only the @schemastud/ui foundation, and takes its
// transport + feedback as injected services. A host renders it inside <TransformsProvider>.

// Labels say what the author gets (APP-10, FINDINGS 21). Substrate: javy = Javy JS→WASM (the untrusted default),
// python-wasi = CPython-WASI, node/python = the bubble (escalation).
const RUNTIMES: { id: string; labelKey: BeamTransformsMessageKey }[] = [
    { id: 'javy', labelKey: 'splicewire-beam-transforms::messages.runtime_javy' },
    { id: 'python-wasi', labelKey: 'splicewire-beam-transforms::messages.runtime_python_wasi' },
    { id: 'node', labelKey: 'splicewire-beam-transforms::messages.runtime_node' },
    { id: 'python', labelKey: 'splicewire-beam-transforms::messages.runtime_python' },
];
// The grant and sharing options: the values are the wire values; the labels read the catalog.
const NET: { value: string; labelKey: BeamTransformsMessageKey }[] = [
    { value: 'none', labelKey: 'splicewire-beam-transforms::messages.net_none' },
    { value: 'scoped', labelKey: 'splicewire-beam-transforms::messages.net_scoped' },
    { value: 'open', labelKey: 'splicewire-beam-transforms::messages.net_open' },
];
const VISIBILITY: { value: string; labelKey: BeamTransformsMessageKey }[] = [
    { value: 'private', labelKey: 'splicewire-beam-transforms::messages.visibility_private' },
    { value: 'tenant', labelKey: 'splicewire-beam-transforms::messages.visibility_tenant' },
    { value: 'platform', labelKey: 'splicewire-beam-transforms::messages.visibility_platform' },
];

/** The reader's label for a wire value one of the option lists names; a value it does not name renders as given. */
function optionLabel(m: BeamTransformsMessages, options: { value: string; labelKey: BeamTransformsMessageKey }[], value: string): string {
    const option = options.find((o) => o.value === value);
    return option ? m.t(option.labelKey) : value;
}

interface Draft {
    name: string;
    runtime: string;
    code: string;
    requestedNet: string;
    visibility: string;
}
const BLANK: Draft = { name: '', runtime: 'javy', code: '', requestedNet: 'none', visibility: 'private' };

const selectClass =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

// Match the family statusOf seam without depending on beam-ux or exposing transport messages.
function transformReadStatus(error: unknown): number | null {
    if (error === null || typeof error !== 'object') return null;
    const response = 'response' in error ? error.response : null;
    if (
        response !== null &&
        typeof response === 'object' &&
        'status' in response &&
        typeof response.status === 'number'
    ) {
        return response.status;
    }
    return 'status' in error && typeof error.status === 'number' ? error.status : null;
}

export function RunnerTransformEditor() {
    const m = useBeamTransformsMessages();
    const query = useTransforms();
    const transforms = query.isSuccess ? query.data : [];
    const status = transformReadStatus(query.error);
    const forbidden = query.isError && (status === 401 || status === 403);
    const retryable = status === null || status >= 500;
    const pageState = query.isPending
        ? 'loading'
        : query.isError
          ? (forbidden ? 'forbidden' : 'error')
          : transforms.length === 0 ? 'empty' : 'ready';
    const { renderHeaderExtra } = useTransformsServices();
    const can = useTransformsCan();
    const readOnly = !can.create && !can.update && !can.delete;
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draft, setDraft] = useState<Draft>(BLANK);

    const selected = transforms.find((t) => t.id === selectedId) ?? null;

    function edit(t: RunnerTransform) {
        setSelectedId(t.id);
        setDraft({
            name: t.name,
            runtime: t.runtime,
            code: t.code,
            requestedNet: String((t.requestedGrant as { net?: string }).net ?? 'none'),
            visibility: t.visibility ?? 'private',
        });
    }

    return (
        <div data-page-state={pageState} className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold">{m.t('splicewire-beam-transforms::messages.title')}</h1>
                    {query.isSuccess && can.create && (
                        <Button
                            size="sm"
                            onClick={() => {
                                setSelectedId(null);
                                setDraft(BLANK);
                            }}
                        >
                            {m.t('splicewire-beam-transforms::messages.new')}
                        </Button>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">
                    {m.t('splicewire-beam-transforms::messages.intro')}
                </p>
                {readOnly && (
                    <p className="text-sm text-muted-foreground">
                        {m.t('splicewire-beam-transforms::messages.read_only')}
                    </p>
                )}
                {query.isPending && <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-transforms::messages.loading')}</p>}
                {query.isError && (
                    <div role="alert" className="space-y-2 rounded-md border p-4 text-sm">
                        <p>
                            {forbidden
                                ? m.t('splicewire-beam-transforms::messages.forbidden')
                                : m.t('splicewire-beam-transforms::messages.load_failed')}
                        </p>
                        {!forbidden && retryable && (
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={query.isFetching}
                                onClick={() => void query.refetch()}
                            >
                                {m.t('splicewire-beam-transforms::messages.retry')}
                            </Button>
                        )}
                    </div>
                )}
                {query.isSuccess && transforms.length === 0 && (
                    <div className="rounded-md border border-dashed p-4 text-sm">
                        <p className="font-medium">{m.t('splicewire-beam-transforms::messages.empty')}</p>
                        {can.create && (
                            <p className="mt-1 text-muted-foreground">
                                {m.t('splicewire-beam-transforms::messages.empty_hint')}
                            </p>
                        )}
                    </div>
                )}
                <ul className="space-y-2">
                    {transforms.map((t) => (
                        <li key={t.id}>
                            <button
                                type="button"
                                onClick={() => edit(t)}
                                className={`w-full rounded-md border p-3 text-left hover:bg-accent ${
                                    t.id === selectedId ? 'border-primary' : 'border-border'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{t.name}</span>
                                    <Badge variant="secondary">{t.runtime}</Badge>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{m.t('splicewire-beam-transforms::messages.net', { net: optionLabel(m, NET, String((t.effectiveGrant as { net?: string }).net ?? 'none')) })}</span>
                                    {t.visibility && <span>· {optionLabel(m, VISIBILITY, t.visibility)}</span>}
                                    {!t.enabled && <span>· {m.t('splicewire-beam-transforms::messages.disabled')}</span>}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

            {query.isSuccess && (selected || can.create ? (
                <TransformEditorPane
                    key={selectedId ?? 'new'}
                    transform={selected}
                    draft={draft}
                    setDraft={setDraft}
                    onSaved={(t) => setSelectedId(t.id)}
                    headerExtra={renderHeaderExtra?.(selected) ?? null}
                />
            ) : (
                <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-transforms::messages.choose')}</p>
            ))}
        </div>
    );
}

function TransformEditorPane({
    transform,
    draft,
    setDraft,
    onSaved,
    headerExtra,
}: {
    transform: RunnerTransform | null;
    draft: Draft;
    setDraft: (d: Draft) => void;
    onSaved: (t: RunnerTransform) => void;
    headerExtra: React.ReactNode;
}) {
    const m = useBeamTransformsMessages();
    const notify = useNotify();
    const can = useTransformsCan();
    // A new draft needs create; an open transform needs update. Without it the fields are read-only.
    const editable = transform ? can.update : can.create;
    const create = useCreateTransform();
    const update = useUpdateTransform(transform?.id ?? '');
    const remove = useDeleteTransform();
    const test = useTestTransform(transform?.id ?? '');
    const [sampleInput, setSampleInput] = useState('{\n  "name": "world"\n}');
    const [result, setResult] = useState<RunnerTransformResult | null>(null);

    // net:open (or platform visibility) needs review — flip the CTA (ticket 09 §3 trust chip).
    const needsReview = draft.requestedNet === 'open' || draft.visibility === 'platform';

    async function save() {
        const body = {
            name: draft.name,
            runtime: draft.runtime,
            code: draft.code,
            requestedGrant: { net: draft.requestedNet },
            visibility: draft.visibility,
        };
        try {
            const saved = transform
                ? await update.mutateAsync(body)
                : await create.mutateAsync(body);
            onSaved(saved);
            notify({ type: 'success', message: m.t('splicewire-beam-transforms::messages.saved', { name: saved.name }) });
        } catch {
            notify({ type: 'error', message: m.t('splicewire-beam-transforms::messages.save_failed') });
        }
    }

    async function runTest() {
        if (!transform) return;
        try {
            setResult(await test.mutateAsync(JSON.parse(sampleInput || '{}')));
        } catch {
            setResult(null);
            notify({ type: 'error', message: m.t('splicewire-beam-transforms::messages.sample_invalid') });
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{!transform ? m.t('splicewire-beam-transforms::messages.pane_new') : editable ? m.t('splicewire-beam-transforms::messages.pane_edit') : m.t('splicewire-beam-transforms::messages.pane_details')}</CardTitle>
                <div className="flex items-center gap-2">
                    {headerExtra}
                    {transform && can.delete && (
                        <Button variant="destructive" size="sm" onClick={() => remove.mutate(transform.id)}>
                            {m.t('splicewire-beam-transforms::messages.delete')}
                        </Button>
                    )}
                    {editable && (
                        <Button size="sm" onClick={save} disabled={!draft.name || !draft.code}>
                            {needsReview ? m.t('splicewire-beam-transforms::messages.request_review_save') : m.t('splicewire-beam-transforms::messages.save')}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="rt-name">{m.t('splicewire-beam-transforms::messages.field_name')}</Label>
                        <Input
                            id="rt-name"
                            readOnly={!editable}
                            value={draft.name}
                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="rt-runtime">{m.t('splicewire-beam-transforms::messages.field_runtime')}</Label>
                        <select
                            id="rt-runtime"
                            className={selectClass}
                            disabled={!editable}
                            value={draft.runtime}
                            onChange={(e) => setDraft({ ...draft, runtime: e.target.value })}
                        >
                            {RUNTIMES.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {m.t(r.labelKey)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="rt-code">{m.t('splicewire-beam-transforms::messages.field_code')}</Label>
                    <Textarea
                        id="rt-code"
                        className="h-64 font-mono text-xs"
                        readOnly={!editable}
                        value={draft.code}
                        onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                        placeholder={m.t('splicewire-beam-transforms::messages.code_placeholder')}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="rt-net">{m.t('splicewire-beam-transforms::messages.field_net')}</Label>
                        <select
                            id="rt-net"
                            className={selectClass}
                            disabled={!editable}
                            value={draft.requestedNet}
                            onChange={(e) => setDraft({ ...draft, requestedNet: e.target.value })}
                        >
                            {NET.map((n) => (
                                <option key={n.value} value={n.value}>
                                    {m.t(n.labelKey)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="rt-visibility">{m.t('splicewire-beam-transforms::messages.field_visibility')}</Label>
                        <select
                            id="rt-visibility"
                            className={selectClass}
                            disabled={!editable}
                            value={draft.visibility}
                            onChange={(e) => setDraft({ ...draft, visibility: e.target.value })}
                        >
                            {VISIBILITY.map((v) => (
                                <option key={v.value} value={v.value}>
                                    {m.t(v.labelKey)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {transform && <EffectiveGrant transform={transform} />}

                {editable && needsReview && (
                    <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                        {richMessage(m, 'splicewire-beam-transforms::messages.review_required', {
                            open: <code>net:open</code>,
                            platform: <code>platform</code>,
                        })}
                    </p>
                )}

                {transform && (
                    <div className="space-y-2 border-t pt-4">
                        <Label htmlFor="rt-sample">{m.t('splicewire-beam-transforms::messages.field_sample')}</Label>
                        <Textarea
                            id="rt-sample"
                            className="h-24 font-mono text-xs"
                            value={sampleInput}
                            onChange={(e) => setSampleInput(e.target.value)}
                        />
                        <Button size="sm" variant="secondary" onClick={runTest} disabled={test.isPending}>
                            {m.t('splicewire-beam-transforms::messages.run')}
                        </Button>
                        {result && <TestResult result={result} />}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function EffectiveGrant({ transform }: { transform: RunnerTransform }) {
    const m = useBeamTransformsMessages();
    const reqNet = String((transform.requestedGrant as { net?: string }).net ?? 'none');
    const effNet = String((transform.effectiveGrant as { net?: string }).net ?? 'none');

    return (
        <div className="rounded-md border p-3 text-xs">
            <div className="mb-1 font-medium">{m.t('splicewire-beam-transforms::messages.grant_title')}</div>
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{m.t('splicewire-beam-transforms::messages.grant_requested', { net: optionLabel(m, NET, reqNet) })}</Badge>
                <Badge variant={effNet === reqNet ? 'outline' : 'destructive'}>
                    {m.t('splicewire-beam-transforms::messages.grant_effective', { net: optionLabel(m, NET, effNet) })}
                </Badge>
                {transform.deniedAxes.map((axis) => (
                    <Badge key={axis} variant="destructive">
                        {m.t('splicewire-beam-transforms::messages.grant_denied', { axis })}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

function TestResult({ result }: { result: RunnerTransformResult }) {
    const m = useBeamTransformsMessages();
    const ok = result.outcome === 'success';
    return (
        <div className="space-y-1 rounded-md border p-3 text-xs">
            <div className="flex items-center gap-2">
                <Badge variant={ok ? 'secondary' : 'destructive'}>{result.outcome}</Badge>
                {!result.telemetry.sandboxed && <Badge variant="destructive">{m.t('splicewire-beam-transforms::messages.unsandboxed')}</Badge>}
                {result.telemetry.wallMs !== null && (
                    <span className="text-muted-foreground">{m.t('splicewire-beam-transforms::messages.test_wall_ms', { wall: result.telemetry.wallMs })}</span>
                )}
            </div>
            {ok ? (
                <pre className="overflow-x-auto rounded bg-muted p-2">
                    {JSON.stringify(result.output, null, 2)}
                </pre>
            ) : (
                <p className="text-destructive">{result.error}</p>
            )}
            {result.stderr && (
                <pre className="overflow-x-auto rounded bg-muted p-2 text-muted-foreground">
                    {result.stderr}
                </pre>
            )}
        </div>
    );
}
