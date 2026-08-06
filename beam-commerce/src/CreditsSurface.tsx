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
    Input,
    Label,
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@schemastud/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, ArrowDownRight, ArrowUpRight, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { errorMessage, formatDate, formatUsd } from './format';
import { useCreditTopupCheckout, useWallet } from './commerce-hooks';
import type { CreditLedgerEntry, WalletBalance } from './commerce-types';

/**
 * Prepaid credits & wallet (Frame OS ticket 21 — promoted from the app's `features/credits`). The
 * derived prepaid balance headline → credit ledger, with the top-up flow deferred into an overlay
 * Sheet. Balance is the honest derived math (credited − LIFETIME-debited), NOT the per-period
 * spending cap — it never reuses the cap's Progress-bar grammar.
 *
 * ADR-0116 CAVEAT: this surface lands in beam-commerce as the current tier verdict; ADR-0116 leaves
 * its final home open. It owns its react-query data logic, DTO typing, and presentation; the host
 * supplies only the transport (via <CommerceProvider>).
 */

// ── Balance headline — the ONE object of attention. Honest derived math, LIFETIME. ──
function BalanceHeadline({
    wallet,
    pendingCreditUsd,
}: {
    wallet: WalletBalance;
    pendingCreditUsd: number | null;
}) {
    const pending = pendingCreditUsd !== null;
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <CardTitle>Prepaid balance</CardTitle>
                        <Badge variant="outline">Lifetime prepaid wallet</Badge>
                    </div>
                </div>
                <CardDescription>
                    Credits are drawn down as you generate. This is your remaining balance, not a
                    per-period cap.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                    <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight">
                        {formatUsd(wallet.balanceUsd)}
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">remaining</span>
                    {pending && (
                        <span className="mb-1 inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-[12px] text-warning-foreground">
                            <Loader2 className="size-3.5 animate-spin" />
                            Crediting {formatUsd(pendingCreditUsd ?? 0)}…
                        </span>
                    )}
                </div>

                {/* The honest derivation — NO Progress bar (that's the per-period cap's grammar). */}
                <div className="grid max-w-md grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 rounded-md border bg-muted/30 p-3 font-mono text-sm tabular-nums">
                    <span className="text-muted-foreground">Credited (lifetime)</span>
                    <span className="text-right">{formatUsd(wallet.creditedUsd)}</span>
                    <span className="text-muted-foreground">− Debited (lifetime)</span>
                    <span className="text-right">−{formatUsd(wallet.debitedUsd)}</span>
                    <span className="col-span-2 border-t border-border/70" />
                    <span className="font-medium text-foreground">= Balance</span>
                    <span className="text-right font-medium">{formatUsd(wallet.balanceUsd)}</span>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Credit ledger — the DataTable, inline ColumnDef. ──
const ledgerColumns: ColumnDef<CreditLedgerEntry, unknown>[] = [
    {
        header: 'Date',
        cell: ({ row }) => (
            <span className="text-muted-foreground">{formatDate(row.original.at)}</span>
        ),
    },
    {
        header: 'Type',
        cell: ({ row }) => {
            const credit = row.original.type === 'credit';
            return (
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px]',
                        credit
                            ? 'border-primary/25 bg-primary/5 text-foreground'
                            : 'border-border bg-muted/40 text-muted-foreground',
                    )}
                >
                    {credit ? (
                        <ArrowUpRight className="size-3.5 text-primary" />
                    ) : (
                        <ArrowDownRight className="size-3.5" />
                    )}
                    {credit ? 'Credit' : 'Debit'}
                </span>
            );
        },
    },
    {
        header: 'Reason',
        cell: ({ row }) => (
            <div className="min-w-0">
                <div className="truncate">{row.original.reason}</div>
                {row.original.purchaseRef && (
                    <div className="font-mono text-[11px] text-muted-foreground">
                        {row.original.purchaseRef}
                    </div>
                )}
            </div>
        ),
    },
    {
        header: 'Amount',
        cell: ({ row }) => {
            const credit = row.original.type === 'credit';
            return (
                <span
                    className={cn(
                        'font-mono tabular-nums',
                        credit ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    {credit ? '+' : ''}
                    {formatUsd(row.original.amountUsd)}
                </span>
            );
        },
    },
    {
        header: 'Balance',
        cell: ({ row }) => (
            <span className="font-mono tabular-nums text-muted-foreground">
                {formatUsd(row.original.runningUsd)}
            </span>
        ),
    },
];

function CreditLedger({ data, loading }: { data: CreditLedgerEntry[]; loading: boolean }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Credit ledger</CardTitle>
                <CardDescription>
                    Append-only — every top-up and metered draw, with running balance.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable
                    columns={ledgerColumns}
                    data={data}
                    loading={loading}
                    clientPageSize={25}
                    emptyMessage="No credit activity yet — add credits to get started."
                />
            </CardContent>
        </Card>
    );
}

// ── Top-up overlay — embedded Stripe Checkout. A plain amount field for the amount step. ──
function TopUpSheet({
    open,
    onOpenChange,
    crediting,
    amountUsd,
    onAmountChange,
    onPay,
    submitting,
    error,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    crediting: boolean;
    amountUsd: number;
    onAmountChange: (amount: number) => void;
    onPay: () => void;
    submitting: boolean;
    error: string | null;
}) {
    return (
        <Sheet
            open={open}
            // While crediting, the overlay REFUSES DISMISSAL (protect the "my money vanished"
            // moment). Otherwise it closes normally.
            onOpenChange={(next) => {
                if (crediting && !next) return;
                onOpenChange(next);
            }}
        >
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Add credits</SheetTitle>
                    <SheetDescription>
                        Choose an amount and pay to top up your prepaid balance.
                    </SheetDescription>
                </SheetHeader>

                {crediting ? (
                    // The non-dismissable post-return poll state.
                    <div className="mt-6 space-y-4">
                        <div className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
                            <Loader2 className="mt-0.5 size-4 flex-none animate-spin" />
                            <div className="space-y-1">
                                <div className="font-medium">
                                    Payment received — crediting your wallet…
                                </div>
                                <p className="text-warning-foreground/80">
                                    Funding is webhook-confirmed and idempotent on the session ref.
                                    This closes on its own once your balance reflects the top-up.
                                </p>
                            </div>
                        </div>
                        <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                            <AlertCircle className="size-3.5" />
                            bounded retry — no infinite spinner.
                        </p>
                    </div>
                ) : (
                    <div className="mt-6 space-y-5">
                        {/* Amount step — a labeled number field (min $1, max $10,000). */}
                        <div className="space-y-2">
                            <div className="rounded-md border bg-card p-4">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="bc-topup-amount">Amount to add (USD)</Label>
                                    <div className="relative max-w-[12rem]">
                                        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                            $
                                        </span>
                                        <Input
                                            id="bc-topup-amount"
                                            type="number"
                                            inputMode="decimal"
                                            min={1}
                                            max={10000}
                                            className="pl-6 font-mono tabular-nums"
                                            value={amountUsd}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                if (!Number.isNaN(value)) onAmountChange(value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button className="w-full" onClick={onPay} disabled={submitting}>
                            {submitting ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Plus className="size-4" />
                            )}{' '}
                            Pay &amp; add credits
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

export function CreditsSurface() {
    const wallet = useWallet();
    const topup = useCreditTopupCheckout();

    const [sheetOpen, setSheetOpen] = useState(false);
    const [amountUsd, setAmountUsd] = useState(100);
    // The webhook-async funding window: set once a top-up Checkout returns but the credit hasn't
    // settled — BalanceHeadline shows the pending badge and the overlay owns dismissal.
    const [pendingCreditUsd, setPendingCreditUsd] = useState<number | null>(null);

    const onPay = () => {
        topup.mutate(amountUsd, {
            onSuccess: () => setPendingCreditUsd(amountUsd),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Credits</h1>
                    <p className="text-sm text-muted-foreground">
                        Your prepaid generation wallet — balance, ledger, and top-ups.
                    </p>
                </div>
                <Button size="sm" onClick={() => setSheetOpen(true)}>
                    <Plus className="size-4" /> Add credits
                </Button>
            </div>

            {wallet.isPending && <p className="text-sm text-muted-foreground">Loading wallet…</p>}
            {wallet.isError && (
                <p className="py-12 text-center text-sm text-destructive">
                    {errorMessage(wallet.error, 'Could not load your wallet.')}
                </p>
            )}
            {wallet.data && (
                <>
                    <BalanceHeadline wallet={wallet.data} pendingCreditUsd={pendingCreditUsd} />
                    <CreditLedger data={wallet.data.ledger} loading={false} />
                </>
            )}

            <TopUpSheet
                open={sheetOpen || pendingCreditUsd !== null}
                onOpenChange={setSheetOpen}
                crediting={pendingCreditUsd !== null}
                amountUsd={amountUsd}
                onAmountChange={setAmountUsd}
                onPay={onPay}
                submitting={topup.isPending}
                error={topup.isError ? errorMessage(topup.error, 'Could not start checkout.') : null}
            />
        </div>
    );
}
