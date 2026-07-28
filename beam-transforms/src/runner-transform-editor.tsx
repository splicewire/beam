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
import { useNotify, useTransformsServices } from './provider';
import type { RunnerTransform, RunnerTransformResult } from './types';

// The RunnerTransform authoring editor (popcorn-runner-substrate ticket 09 §5, ADR-0116/0141) —
// the standalone admin surface for sandboxed, user-authored transforms, promoted from the
// conduit-node-transform prototype. Portable + DTO-first: it owns its react-query data logic, types
// off the RunnerTransform wire shape, imports only the @schemastud/ui foundation, and takes its
// transport + feedback as injected services. A host renders it inside <TransformsProvider>.

const RUNTIMES = [
    { id: 'javy', label: 'Javy · JS→WASM (untrusted default)' },
    { id: 'python-wasi', label: 'CPython-WASI · pure Python' },
    { id: 'node', label: 'Node · bubble (escalation)' },
    { id: 'python', label: 'Python · bubble (escalation)' },
];
const NET = ['none', 'scoped', 'open'];
const VISIBILITY = ['private', 'tenant', 'platform'];

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

export function RunnerTransformEditor() {
    const { data: transforms = [], isLoading } = useTransforms();
    const { renderHeaderExtra } = useTransformsServices();
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg font-semibold">Transforms</h1>
                    <Button
                        size="sm"
                        onClick={() => {
                            setSelectedId(null);
                            setDraft(BLANK);
                        }}
                    >
                        New
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Sandboxed, user-authored transforms of another tool — code that runs deny-by-default in a
                    scoped sandbox.
                </p>
                {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
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
                                    <span>net: {String((t.effectiveGrant as { net?: string }).net ?? 'none')}</span>
                                    {t.visibility && <span>· {t.visibility}</span>}
                                    {!t.enabled && <span>· disabled</span>}
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

            <TransformEditorPane
                key={selectedId ?? 'new'}
                transform={selected}
                draft={draft}
                setDraft={setDraft}
                onSaved={(t) => setSelectedId(t.id)}
                headerExtra={renderHeaderExtra?.(selected) ?? null}
            />
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
    const notify = useNotify();
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
            requested_grant: { net: draft.requestedNet },
            visibility: draft.visibility,
        };
        try {
            const saved = transform
                ? await update.mutateAsync(body)
                : await create.mutateAsync(body);
            onSaved(saved);
            notify({ type: 'success', message: `Transform "${saved.name}" saved.` });
        } catch {
            notify({ type: 'error', message: 'Could not save the transform.' });
        }
    }

    async function runTest() {
        if (!transform) return;
        try {
            setResult(await test.mutateAsync(JSON.parse(sampleInput || '{}')));
        } catch {
            setResult(null);
            notify({ type: 'error', message: 'Sample input is not valid JSON.' });
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{transform ? 'Edit transform' : 'New transform'}</CardTitle>
                <div className="flex items-center gap-2">
                    {headerExtra}
                    {transform && (
                        <Button variant="destructive" size="sm" onClick={() => remove.mutate(transform.id)}>
                            Delete
                        </Button>
                    )}
                    <Button size="sm" onClick={save} disabled={!draft.name || !draft.code}>
                        {needsReview ? 'Request review & save' : 'Save'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="rt-name">Name</Label>
                        <Input
                            id="rt-name"
                            value={draft.name}
                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="rt-runtime">Runtime (picks the substrate)</Label>
                        <select
                            id="rt-runtime"
                            className={selectClass}
                            value={draft.runtime}
                            onChange={(e) => setDraft({ ...draft, runtime: e.target.value })}
                        >
                            {RUNTIMES.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <Label htmlFor="rt-code">Code</Label>
                    <Textarea
                        id="rt-code"
                        className="h-64 font-mono text-xs"
                        value={draft.code}
                        onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                        placeholder="// read { input, grant } on stdin; write one JSON object on stdout"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="rt-net">Requested network</Label>
                        <select
                            id="rt-net"
                            className={selectClass}
                            value={draft.requestedNet}
                            onChange={(e) => setDraft({ ...draft, requestedNet: e.target.value })}
                        >
                            {NET.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="rt-visibility">Sharing</Label>
                        <select
                            id="rt-visibility"
                            className={selectClass}
                            value={draft.visibility}
                            onChange={(e) => setDraft({ ...draft, visibility: e.target.value })}
                        >
                            {VISIBILITY.map((v) => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {transform && <EffectiveGrant transform={transform} />}

                {needsReview && (
                    <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                        Review required — <code>net:open</code> and <code>platform</code> publishing are
                        trust-gated (effective grant floors to deny-by-default until approved).
                    </p>
                )}

                {transform && (
                    <div className="space-y-2 border-t pt-4">
                        <Label htmlFor="rt-sample">Test — sample input</Label>
                        <Textarea
                            id="rt-sample"
                            className="h-24 font-mono text-xs"
                            value={sampleInput}
                            onChange={(e) => setSampleInput(e.target.value)}
                        />
                        <Button size="sm" variant="secondary" onClick={runTest} disabled={test.isPending}>
                            Run
                        </Button>
                        {result && <TestResult result={result} />}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function EffectiveGrant({ transform }: { transform: RunnerTransform }) {
    const reqNet = String((transform.requestedGrant as { net?: string }).net ?? 'none');
    const effNet = String((transform.effectiveGrant as { net?: string }).net ?? 'none');

    return (
        <div className="rounded-md border p-3 text-xs">
            <div className="mb-1 font-medium">Effective grant (= requested ∩ policy)</div>
            <div className="flex flex-wrap gap-2">
                <Badge variant="outline">requested net: {reqNet}</Badge>
                <Badge variant={effNet === reqNet ? 'outline' : 'destructive'}>
                    effective net: {effNet}
                </Badge>
                {transform.deniedAxes.map((axis) => (
                    <Badge key={axis} variant="destructive">
                        denied: {axis}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

function TestResult({ result }: { result: RunnerTransformResult }) {
    const ok = result.outcome === 'success';
    return (
        <div className="space-y-1 rounded-md border p-3 text-xs">
            <div className="flex items-center gap-2">
                <Badge variant={ok ? 'secondary' : 'destructive'}>{result.outcome}</Badge>
                {!result.telemetry.sandboxed && <Badge variant="destructive">unsandboxed</Badge>}
                {result.telemetry.wallMs !== null && (
                    <span className="text-muted-foreground">{result.telemetry.wallMs}ms</span>
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
