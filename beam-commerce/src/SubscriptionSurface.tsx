import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    cn,
} from '@schemastud/ui';
import { ArrowUpRight, CheckCircle2, ExternalLink, Sparkles, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { errorMessage } from './format';
import {
    useEntitlements,
    useSubscription,
    useSubscriptionCheckout,
    useSubscriptionPortal,
} from './commerce-hooks';
import { useCommerceNavigate } from './commerce-provider';
import type {
    EntitlementRecord,
    LifecycleState,
    SourceFacet,
    Subscription,
    SubscriptionView,
} from './commerce-types';

/**
 * Subscription & plan (Frame OS ticket 21 — promoted from the app's settings `SubscriptionPage`).
 * Single-pane, read-only for every tenant member: a resolved PlanHeaderCard (with folded lifecycle
 * badge) stacked above the resolved, faceted EntitlementGrid. Mutations delegate to Stripe (hosted
 * checkout / Customer Portal) — no in-app plan-mutation form.
 *
 * ADR-0116 CAVEAT: this surface lands in beam-commerce as the current tier verdict; ADR-0116 leaves
 * the DTO-first package placement of EntitlementGrid/UpsellSheet open. It owns its react-query data
 * logic + presentation; the host supplies the transport + navigation (via <CommerceProvider>) and
 * the optional post-checkout signal (host-router-owned) through props.
 */

/** Derive the three real lifecycle states from the resolved SubscriptionData's scopeActive window. */
function lifecycleOf(sub: Subscription | null): LifecycleState {
    if (!sub) return 'active'; // never-subscribed / free — an Active badge, no CTA (empty-of-actions).
    if (!sub.active) return 'lapsed';
    return sub.endedAt ? 'cancels_at_period_end' : 'active';
}

function LifecycleBadge({ state, endsAt }: { state: LifecycleState; endsAt: string | null }) {
    if (state === 'lapsed') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                <XCircle className="size-3.5" /> Lapsed
            </span>
        );
    }
    if (state === 'cancels_at_period_end') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-xs font-medium text-warning-foreground">
                <span className="size-1.5 rounded-full bg-warning" /> Active until {endsAt ?? '—'} ·
                cancels
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-medium text-foreground">
            <CheckCircle2 className="size-3.5 text-primary" /> Active
        </span>
    );
}

function PlanHeaderCard({ view }: { view: SubscriptionView }) {
    const sub = view.subscription;
    const state = lifecycleOf(sub);
    const lapsed = state === 'lapsed';
    const free = view.stripePriceId === null;
    const plan = sub?.plan;
    const endsAt = sub?.endedAt ? sub.endedAt.slice(0, 7) : null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <CardTitle>{plan?.name ?? 'No plan'}</CardTitle>
                            <LifecycleBadge state={state} endsAt={endsAt} />
                        </div>
                        <CardDescription>
                            {plan?.description ?? 'You have no recurring subscription.'}
                        </CardDescription>
                    </div>
                    <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                        SubscriptionData
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <div className="text-xs text-muted-foreground">Recurring price</div>
                        <div className="text-lg font-semibold">
                            {free ? (
                                <span className="text-muted-foreground">Free tier</span>
                            ) : (
                                <span className="text-muted-foreground">Managed in Stripe</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">Commitment</div>
                        <div className="text-lg font-semibold">
                            {sub?.commitmentMonths
                                ? `${sub.commitmentMonths} months`
                                : 'Month-to-month'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">
                            {lapsed ? 'Coverage ended' : 'Billable window'}
                        </div>
                        <div
                            className={cn(
                                'font-mono text-sm',
                                lapsed ? 'text-destructive' : 'text-foreground',
                            )}
                        >
                            {sub?.earliestBillablePeriod ?? '—'} → {sub?.latestBillablePeriod ?? '—'}
                        </div>
                    </div>
                </div>
                {lapsed && (
                    <p className="mt-4 flex gap-2 rounded-md border border-destructive/30 bg-destructive/[0.06] p-3 text-sm text-destructive">
                        <XCircle className="mt-0.5 size-4 flex-none" />
                        <span>
                            This subscription is outside its active window —{' '}
                            <b>entitlements and the spending cap are revoked</b> until you
                            re-subscribe. Re-activate via the Customer Portal.
                        </span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function SourceBadge({ source }: { source: string }) {
    const style =
        source === 'tenant'
            ? 'border-primary/30 bg-primary/5 text-foreground'
            : source === 'plan'
              ? 'border-border bg-muted/60 text-muted-foreground'
              : 'border-dashed border-border bg-transparent text-muted-foreground';
    return (
        <span
            className={cn(
                'inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide',
                style,
            )}
        >
            {source}
        </span>
    );
}

const FACETS: { key: SourceFacet; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'default', label: 'Default' },
    { key: 'plan', label: 'Plan' },
    { key: 'tenant', label: 'Tenant override' },
];

function EntitlementGrid({
    entitlements,
    labels,
    lapsed,
}: {
    entitlements: EntitlementRecord[];
    labels: Record<string, string>;
    lapsed: boolean;
}) {
    const [facet, setFacet] = useState<SourceFacet>('all');
    const rows = useMemo(
        () => (facet === 'all' ? entitlements : entitlements.filter((e) => e.source === facet)),
        [entitlements, facet],
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle>Resolved entitlements</CardTitle>
                        <CardDescription>
                            What&apos;s on your plan — the RESOLVED map (not plan text), cascaded{' '}
                            <span className="font-mono text-xs">default → plan → tenant</span>.
                        </CardDescription>
                    </div>
                    <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                        EntitlementData[]
                    </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {FACETS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => setFacet(f.key)}
                            className={cn(
                                'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                                facet === f.key
                                    ? 'border-primary/40 bg-primary/10 text-foreground'
                                    : 'border-border text-muted-foreground hover:bg-muted/60',
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <div className="min-w-[520px] divide-y rounded-md border">
                        <div className="grid grid-cols-[1fr_auto_auto] gap-4 bg-muted/40 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            <span>Capability</span>
                            <span className="text-right">State</span>
                            <span className="text-right">Source</span>
                        </div>
                        {rows.length === 0 && (
                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                No capabilities in this facet.
                            </div>
                        )}
                        {rows.map((e) => {
                            const on = e.enabled && !lapsed;
                            return (
                                <div
                                    key={e.capability}
                                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-3 py-2.5"
                                >
                                    <div className="min-w-0">
                                        <div
                                            className={cn(
                                                'truncate text-sm',
                                                !on && 'text-muted-foreground line-through',
                                            )}
                                        >
                                            {labels[e.capability] ?? e.capability}
                                        </div>
                                        <div className="font-mono text-[10px] text-muted-foreground">
                                            {e.capability}
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1.5 text-xs',
                                                on ? 'text-foreground' : 'text-muted-foreground',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'size-1.5 rounded-full',
                                                    on ? 'bg-primary' : 'bg-muted-foreground/40',
                                                )}
                                            />
                                            {on
                                                ? 'Enabled'
                                                : lapsed && e.enabled
                                                  ? 'Revoked'
                                                  : 'Off'}
                                        </span>
                                    </div>
                                    <div className="flex justify-end">
                                        <SourceBadge source={e.source} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * The optional post-checkout signal — host-router-owned (splicewire reads it off `?checkout=` via
 * react-router's useSearchParams). The package stays router-blind: the host reads its own URL and
 * passes the signal + a clear callback down. Omitted → no syncing / cancelled notices fire.
 */
export interface CheckoutSignalProps {
    checkoutSignal?: 'success' | 'cancelled' | null;
    onClearCheckoutSignal?: () => void;
}

export function SubscriptionSurface({
    checkoutSignal = null,
    onClearCheckoutSignal,
}: CheckoutSignalProps = {}) {
    const entitlements = useEntitlements();
    const view = useSubscription();
    const checkout = useSubscriptionCheckout();
    const portal = useSubscriptionPortal();
    const navigate = useCommerceNavigate();

    // Poll on the success signal: after a Stripe round-trip the internal Subscription syncs async, so
    // refetch until the lifecycle flips rather than trusting a confident-but-stale read. Clears the
    // signal (host-owned) once the plan lands.
    const syncing = checkoutSignal === 'success' && !view.data?.subscription?.active;
    useEffect(() => {
        if (!syncing) return;
        const t = setInterval(() => view.refetch(), 2500);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncing]);
    useEffect(() => {
        if (checkoutSignal === 'success' && view.data?.subscription?.active) {
            onClearCheckoutSignal?.();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkoutSignal, view.data?.subscription?.active]);

    const data = view.data;
    const lapsed = lifecycleOf(data?.subscription ?? null) === 'lapsed';

    const onPortal = () =>
        portal.mutate(undefined, { onSuccess: ({ url }) => navigate(url) });
    const onCheckout = () => {
        const slug = data?.subscription?.planSlug;
        if (slug) checkout.mutate(slug, { onSuccess: ({ url }) => navigate(url) });
    };

    const actions = data?.hasStripeId ? (
        <Button variant="outline" size="sm" onClick={onPortal} disabled={portal.isPending}>
            Manage subscription <ExternalLink className="size-3.5" />
        </Button>
    ) : data?.stripePriceId && data.subscription?.planSlug ? (
        <Button size="sm" onClick={onCheckout} disabled={checkout.isPending}>
            Subscribe <ArrowUpRight className="size-3.5" />
        </Button>
    ) : null;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Subscription</h1>
                    <p className="text-sm text-muted-foreground">
                        Your recurring plan and what it entitles you to.
                    </p>
                </div>
                {actions}
            </div>

            {syncing && (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
                    <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                    Syncing your plan… changes made in Stripe land here after the webhook is
                    processed — this may take a moment.
                </div>
            )}
            {checkoutSignal === 'cancelled' && (
                <div className="rounded-md border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
                    Checkout was cancelled — your plan is unchanged.
                </div>
            )}

            {view.isPending && (
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription</CardTitle>
                        <CardDescription>Loading your plan…</CardDescription>
                    </CardHeader>
                </Card>
            )}
            {view.isError && (
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-destructive">
                            {errorMessage(view.error, 'Could not load your subscription.')}
                        </p>
                    </CardContent>
                </Card>
            )}

            {data && (
                <div className="space-y-4">
                    <PlanHeaderCard view={data} />

                    {data.stripePriceId === null && (
                        <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/[0.04] p-4">
                            <Sparkles className="mt-0.5 size-4 flex-none text-primary" />
                            <div className="space-y-1 text-sm">
                                <div className="font-medium text-foreground">
                                    {data.subscription
                                        ? "You're on a free/internal plan — no recurring subscription."
                                        : "You have no subscription — you're on the free tier."}
                                </div>
                                <p className="text-muted-foreground">
                                    Free and internal plans render the resolved grid and an Active
                                    badge, but carry no Stripe price — so there&apos;s no checkout or
                                    portal handoff. Paid plans add a{' '}
                                    <b className="text-foreground">Subscribe</b> CTA.
                                </p>
                            </div>
                        </div>
                    )}

                    <EntitlementGrid
                        entitlements={entitlements.data ?? []}
                        labels={data.capabilityLabels}
                        lapsed={lapsed}
                    />
                </div>
            )}
        </div>
    );
}
