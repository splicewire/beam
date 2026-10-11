import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    cn,
    DataTable,
} from '@schemastud/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpCircle, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate, formatUsd } from './format';
import type { AutoReloadActivity, AutoReloadAttempt } from './types';
import { reloadFailureCopy, reloadOutcomeLabel } from './vocabulary';

function OutcomeBadge({ outcome }: { outcome: string }) {
    const ok = outcome === 'succeeded';
    const label = reloadOutcomeLabel(outcome);
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px]',
                ok
                    ? 'border-primary/25 bg-primary/5 text-foreground'
                    : 'border-destructive/30 bg-destructive/5 text-foreground',
            )}
        >
            {ok ? (
                <CheckCircle2 className="size-3.5 text-primary" />
            ) : (
                <XCircle className="size-3.5 text-destructive" />
            )}
            <span>{label}</span>
            <span className="font-mono text-[10px] opacity-70">{outcome}</span>
        </span>
    );
}

const attemptColumns: ColumnDef<AutoReloadAttempt, unknown>[] = [
    {
        header: 'Date',
        cell: ({ row }) => (
            <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
    },
    {
        header: 'Outcome',
        cell: ({ row }) => <OutcomeBadge outcome={row.original.outcome} />,
    },
    {
        header: 'Amount',
        cell: ({ row }) => (
            <span className="font-mono tabular-nums">
                {row.original.amountUsd != null ? formatUsd(row.original.amountUsd) : '—'}
            </span>
        ),
    },
    {
        header: 'Details',
        // OD-B3-01 (ruling B): a failed reload leads with actionable customer copy; the exact provider
        // code (stripeErrorCode) sits behind a diagnostic disclosure, never inline.
        cell: ({ row }) => {
            const code = row.original.stripeErrorCode;
            if (!code) return <span className="text-muted-foreground">—</span>;
            return (
                <div className="space-y-1">
                    <p className="text-[12px]">{reloadFailureCopy(code)}</p>
                    <details className="text-[11px] text-muted-foreground">
                        <summary className="cursor-pointer select-none">Diagnostic details</summary>
                        <span className="font-mono">Provider code: {code}</span>
                    </details>
                </div>
            );
        },
    },
];

export function ReloadActivityCard({ activity }: { activity: AutoReloadActivity }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Reload activity</CardTitle>
                <CardDescription>Every automatic top-up, and how it went.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md border bg-muted/30 p-3 sm:max-w-xs">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ArrowUpCircle className="size-3.5" /> Last reload
                    </div>
                    <div className="mt-1 font-mono text-lg tabular-nums">
                        {activity.lastReloadAmountUsd != null
                            ? formatUsd(activity.lastReloadAmountUsd)
                            : '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {activity.lastReloadAt
                            ? formatDate(activity.lastReloadAt)
                            : 'No reloads yet'}
                    </div>
                </div>

                <DataTable
                    stackOnMobile
                    columns={attemptColumns}
                    data={activity.attempts}
                    emptyMessage="No automatic reloads yet."
                />
            </CardContent>
        </Card>
    );
}
