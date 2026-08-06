import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    cn,
    DataTable,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@schemastud/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { errorMessage, formatDate, formatUsd } from './format';
import { useBillPreview, useBills, useBudget, useUsageSummary } from './commerce-hooks';
import { useCommerceCan } from './commerce-provider';
import type { Bill, BudgetVerdict, UsageModelBreakdown } from './commerce-types';

/**
 * Billing / spend control (Frame OS ticket 21 — promoted from the app's settings `BillingPage`). The
 * single vertical scrolling spend pane answering "what am I spending / what will I owe":
 *   Section 1 — BudgetMeter   (no perm; always renders)
 *   Section 2 — UsageSummary  (view-usage)
 *   Section 3 — Bill preview + Bills roster (view-billing) with a line-items drill dialog.
 * Adding a permission only extends the scroll downward; the page never restructures per role, so no
 * gated section ever 403s on click.
 *
 * ADR-0116 CAVEAT: this surface lands in beam-commerce as the current tier verdict; ADR-0116 leaves
 * its final home open. It owns its react-query data logic + presentation; the host supplies the
 * transport and the `can()` permission gate (both via <CommerceProvider>).
 */

// ── A minimal, dependency-free progress bar — the package's own (the app's ui/progress is host-local). ──
function Progress({
    value,
    indicatorClassName,
}: {
    value: number;
    indicatorClassName?: string;
}) {
    const clamped = Math.min(100, Math.max(0, value));
    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(clamped)}
            className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
        >
            <div
                className={cn('h-full bg-primary transition-all', indicatorClassName)}
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}

// ── The bill-status pill — the package's own vocabulary (the app's StatusBadge is host-local). ──
function BillStatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        finalized: 'border-primary/25 bg-primary/5 text-foreground',
        paid: 'border-primary/25 bg-primary/5 text-foreground',
        open: 'border-warning/40 bg-warning/10 text-warning-foreground',
        draft: 'border-border bg-muted/50 text-muted-foreground',
        void: 'border-destructive/30 bg-destructive/5 text-foreground',
    };
    const cls = map[status] ?? 'border-border bg-muted/50 text-muted-foreground';
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium capitalize',
                cls,
            )}
        >
            {status}
        </span>
    );
}

function currentMonth(): string {
    return new Date().toISOString().slice(0, 7);
}

const modelColumns: ColumnDef<UsageModelBreakdown, unknown>[] = [
    { header: 'Model', accessorKey: 'model' },
    { header: 'Prompt tokens', cell: ({ row }) => row.original.promptTokens.toLocaleString() },
    {
        header: 'Completion tokens',
        cell: ({ row }) => row.original.completionTokens.toLocaleString(),
    },
    { header: 'Total tokens', cell: ({ row }) => row.original.totalTokens.toLocaleString() },
    { header: 'Cost', cell: ({ row }) => formatUsd(row.original.costUsd) },
];

const billColumns: ColumnDef<Bill, unknown>[] = [
    { header: 'Period', accessorKey: 'billingPeriod' },
    { header: 'Status', cell: ({ row }) => <BillStatusBadge status={row.original.status} /> },
    { header: 'Total', cell: ({ row }) => formatUsd(row.original.totalUsd) },
    {
        header: 'Finalized',
        cell: ({ row }) => (
            <span className="text-muted-foreground">{formatDate(row.original.finalizedAt)}</span>
        ),
    },
];

// ── Section 1: Budget meter ────────────────────────────────────────────────────
function BudgetMeter({ verdict }: { verdict: BudgetVerdict }) {
    const b = verdict;

    if (b.uncapped) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Spending cap</CardTitle>
                    <CardDescription>Your spend this period across all usage.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No spending cap — {formatUsd(b.spentUsd)} spent this period.
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (b.stopKind === 'prepaid_exhausted') {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle>Prepaid wallet</CardTitle>
                        <Badge variant="outline">Lifetime prepaid · not a spending cap</Badge>
                    </div>
                    <CardDescription>
                        Credits drawn down as you generate — a lifetime balance, not a per-period
                        cap.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                        <span className="text-3xl font-semibold tabular-nums tracking-tight">
                            {formatUsd(b.remainingUsd ?? 0)}
                        </span>
                        <span className="pb-1 text-sm text-muted-foreground">remaining</span>
                    </div>
                    <p
                        className={cn(
                            'text-sm',
                            b.allowed ? 'text-muted-foreground' : 'font-medium text-destructive',
                        )}
                    >
                        {b.allowed
                            ? `${formatUsd(b.spentUsd)} drawn down (lifetime).`
                            : `Credit exhausted — ${formatUsd(b.spentUsd)} drawn down (lifetime). Generation is paused.`}
                    </p>
                    {b.offer && !b.autoReloadPending && (
                        <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                            {b.offer.message}
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    }

    const capReached = !b.allowed;
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <CardTitle>Spending cap</CardTitle>
                    <Badge variant="outline">Per-period spending cap</Badge>
                </div>
                <CardDescription>Your spend this period across all usage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Progress
                    value={(b.fractionUsed ?? 0) * 100}
                    indicatorClassName={cn(
                        capReached ? 'bg-destructive' : b.warning ? 'bg-warning' : undefined,
                    )}
                />
                <div className="flex items-center justify-between text-sm">
                    <span>
                        {formatUsd(b.spentUsd)} of {formatUsd(b.capUsd ?? 0)} used
                    </span>
                    <span
                        className={cn(
                            'text-muted-foreground',
                            capReached && 'font-medium text-destructive',
                            b.allowed && b.warning && 'font-medium text-warning-foreground',
                        )}
                    >
                        {b.allowed
                            ? `${formatUsd(b.remainingUsd ?? 0)} remaining`
                            : 'Cap reached — generation is paused'}
                    </span>
                </div>
                {b.offer && !b.autoReloadPending && (
                    <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                        {b.offer.message}
                        {b.offer.planName && b.offer.planCapUsd != null && (
                            <>
                                {' '}
                                <span className="font-medium text-foreground">
                                    {b.offer.planName} raises it to {formatUsd(b.offer.planCapUsd)}.
                                </span>
                            </>
                        )}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function BudgetSection() {
    const budget = useBudget();

    return (
        <>
            {budget.isPending && (
                <Card>
                    <CardHeader>
                        <CardTitle>Spending cap</CardTitle>
                        <CardDescription>
                            Generation budget for the current billing period.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Loading budget…</p>
                    </CardContent>
                </Card>
            )}
            {budget.isError && (
                <Card>
                    <CardHeader>
                        <CardTitle>Spending cap</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-destructive">
                            {errorMessage(budget.error, 'Could not load the budget.')}
                        </p>
                    </CardContent>
                </Card>
            )}
            {budget.data && <BudgetMeter verdict={budget.data} />}
        </>
    );
}

// ── Section 2: Usage summary (view-usage) ──────────────────────────────────────
function UsageSection() {
    const [month, setMonth] = useState(currentMonth);
    const summary = useUsageSummary(month);

    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <CardTitle>Usage summary</CardTitle>
                        <Badge variant="secondary">OpenAI-only pricing — estimates</Badge>
                    </div>
                    <CardDescription>Token spend broken down by model.</CardDescription>
                </div>
                <input
                    type="month"
                    value={month}
                    max={currentMonth()}
                    onChange={(event) => setMonth(event.target.value || currentMonth())}
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Usage month"
                />
            </CardHeader>
            <CardContent className="space-y-4">
                {summary.isError ? (
                    <p className="text-sm text-destructive">
                        {errorMessage(summary.error, 'Could not load the usage summary.')}
                    </p>
                ) : (
                    <>
                        <div className="flex gap-8">
                            <div>
                                <div className="text-2xl font-semibold">
                                    {summary.data ? formatUsd(summary.data.totalCostUsd) : '—'}
                                </div>
                                <div className="text-xs text-muted-foreground">Total cost</div>
                            </div>
                            <div>
                                <div className="text-2xl font-semibold">
                                    {summary.data ? summary.data.totalTokens.toLocaleString() : '—'}
                                </div>
                                <div className="text-xs text-muted-foreground">Total tokens</div>
                            </div>
                        </div>
                        <DataTable
                            columns={modelColumns}
                            data={summary.data?.models ?? []}
                            loading={summary.isPending}
                            emptyMessage="No usage recorded for this month."
                        />
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// ── Section 3a: Bill preview — a distinct "next bill (estimate)" artifact ───────
function BillPreviewCard() {
    const preview = useBillPreview();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <CardTitle>Next bill (estimate)</CardTitle>
                    <Badge variant="outline">live recompute</Badge>
                </div>
                <CardDescription>
                    Current period, not yet finalized — distinct from your Bills below. Nothing is
                    charged yet.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {preview.isPending && (
                    <p className="text-sm text-muted-foreground">Loading preview…</p>
                )}
                {preview.isError && (
                    <p className="text-sm text-destructive">
                        {errorMessage(preview.error, 'Could not load the bill preview.')}
                    </p>
                )}
                {preview.isSuccess &&
                    (preview.data ? (
                        <div className="divide-y rounded-md border text-sm">
                            {preview.data.line_items.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between gap-4 px-3 py-2"
                                >
                                    <div className="min-w-0">
                                        <div className="truncate">{item.description}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.component_type}
                                        </div>
                                    </div>
                                    <span className="shrink-0">{formatUsd(item.amount_usd)}</span>
                                </div>
                            ))}
                            <div className="flex items-center justify-between gap-4 bg-muted/40 px-3 py-2 font-medium">
                                <span>Estimated total</span>
                                <span>{formatUsd(preview.data.total_usd)}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Nothing billable this period.
                        </p>
                    ))}
            </CardContent>
        </Card>
    );
}

// ── Section 3b: Bills roster + line-items drill dialog ──────────────────────────
function BillsSection({ onSelect }: { onSelect: (bill: Bill) => void }) {
    const bills = useBills();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bills</CardTitle>
                <CardDescription>
                    Finalized billing periods — click a bill to see its line items.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {bills.isError ? (
                    <p className="py-12 text-center text-sm text-destructive">
                        {errorMessage(bills.error, 'Could not load bills.')}
                    </p>
                ) : (
                    <DataTable
                        columns={billColumns}
                        data={bills.data ?? []}
                        loading={bills.isPending}
                        emptyMessage="No bills yet."
                        onRowClick={onSelect}
                    />
                )}
            </CardContent>
        </Card>
    );
}

export function BillingSurface() {
    // Progressive-disclosure gate: the meter always renders (no perm); usage needs view-usage; the
    // bill preview + roster need view-billing. Gate on the actual permission — the client mirror of
    // the server's in-controller abort(403) — so a section only renders when the tenant can truly
    // read it. Adding a permission extends the scroll downward; no gated section 403s on click.
    const can = useCommerceCan();
    const canUsage = can('view-usage');
    const canBilling = can('view-billing');

    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
                    <p className="text-sm text-muted-foreground">
                        What you&apos;re spending and what you&apos;ll owe.
                    </p>
                </div>
                {canBilling && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.scrollTo({ top: 0 })}
                    >
                        Preview next bill
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                <BudgetSection />
                {canUsage && <UsageSection />}
                {canBilling && (
                    <>
                        <BillPreviewCard />
                        <BillsSection onSelect={setSelectedBill} />
                    </>
                )}
            </div>

            <Dialog
                open={selectedBill !== null}
                onOpenChange={(open) => !open && setSelectedBill(null)}
            >
                <DialogContent>
                    {selectedBill && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    Bill — {selectedBill.billingPeriod}
                                    <BillStatusBadge status={selectedBill.status} />
                                </DialogTitle>
                                <DialogDescription>
                                    {selectedBill.finalizedAt
                                        ? `Finalized ${formatDate(selectedBill.finalizedAt)}`
                                        : 'Line items for this billing period.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="divide-y rounded-md border text-sm">
                                {selectedBill.lineItems.length === 0 && (
                                    <div className="px-3 py-4 text-center text-muted-foreground">
                                        No line items.
                                    </div>
                                )}
                                {selectedBill.lineItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between gap-4 px-3 py-2"
                                    >
                                        <div className="min-w-0">
                                            <div className="truncate">{item.description}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.componentType}
                                            </div>
                                        </div>
                                        <span className="shrink-0">
                                            {formatUsd(item.amountUsd)}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between gap-4 bg-muted/40 px-3 py-2 font-medium">
                                    <span>Total</span>
                                    <span>{formatUsd(selectedBill.totalUsd)}</span>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
