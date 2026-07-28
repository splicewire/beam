import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    cn,
    Input,
    Label,
    Switch,
} from '@schemastud/ui';
import {
    AlertTriangle,
    ArrowUpCircle,
    CreditCard,
    KeyRound,
    ShieldCheck,
    Target,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { errorMessage, formatUsd } from './format';
import { useUpdateAutoReloadConfig } from './hooks';
import { useSavePaymentMethod } from './provider';
import type { AutoReloadConfig, AutoReloadConfigUpdate, AutoReloadStatus } from './types';

// ── The status pill — auto-reload's own {off|active|suspended|needs_payment_method} vocabulary. ──
function StatusPill({ status }: { status: AutoReloadStatus }) {
    const map: Record<string, { label: string; cls: string; dot: string }> = {
        active: {
            label: 'Active',
            cls: 'border-primary/25 bg-primary/5 text-foreground',
            dot: 'bg-primary',
        },
        suspended: {
            label: 'Suspended',
            cls: 'border-destructive/30 bg-destructive/5 text-foreground',
            dot: 'bg-destructive',
        },
        needs_payment_method: {
            label: 'Needs a card',
            cls: 'border-warning/40 bg-warning/10 text-warning-foreground',
            dot: 'bg-warning',
        },
        off: {
            label: 'Off',
            cls: 'border-border bg-muted/50 text-muted-foreground',
            dot: 'bg-muted-foreground/50',
        },
    };
    const s = map[status] ?? map.off;
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px] font-medium',
                s.cls,
            )}
        >
            <span className={cn('size-1.5 rounded-full', s.dot)} />
            {s.label}
        </span>
    );
}

// A labelled numeric field with a $ adornment + a clamp-aware ceiling helper line.
function MoneyField({
    id,
    label,
    value,
    onChange,
    help,
    disabled,
}: {
    id: string;
    label: string;
    value: number | null;
    onChange: (value: number | null) => void;
    help?: ReactNode;
    disabled?: boolean;
}) {
    return (
        <div className="grid gap-1.5">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative max-w-[12rem]">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                </span>
                <Input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    className="pl-6 font-mono tabular-nums"
                    value={value ?? ''}
                    disabled={disabled}
                    onChange={(e) =>
                        onChange(e.target.value === '' ? null : Number(e.target.value))
                    }
                />
            </div>
            {help && <p className="text-[11px] text-muted-foreground">{help}</p>}
        </div>
    );
}

// A "Platform max $X" helper line that turns into a "clamped to $X" hint when the raw value
// exceeds the ceiling — the effective (clamped) value is what the engine actually applies.
function ClampHelp({
    raw,
    ceiling,
    effective,
    format = formatUsd,
}: {
    raw: number | null;
    ceiling: number;
    effective: number;
    format?: (n: number) => string;
}) {
    const clamped = raw != null && raw > ceiling;
    return (
        <>
            Platform max {format(ceiling)}.
            {clamped && (
                <span className="font-medium text-warning-foreground">
                    {' '}
                    Clamped to {format(effective)}.
                </span>
            )}
        </>
    );
}

function SegBtn({
    active,
    icon,
    onClick,
    children,
}: {
    active: boolean;
    icon: ReactNode;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors',
                active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            {icon}
            {children}
        </button>
    );
}

// ── The inline card-on-file row (the prototype's recommended placement). ──
function CardOnFileRow({
    config,
    onSaveCard,
}: {
    config: AutoReloadConfig;
    onSaveCard: () => void;
}) {
    if (config.hasPaymentMethod) {
        return (
            <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 p-3">
                <span className="grid size-8 flex-none place-items-center rounded-md bg-primary/10 text-primary">
                    <CreditCard className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">
                        A card is saved for off-session reloads
                    </div>
                    <div className="text-xs text-muted-foreground">
                        We charge it automatically when your balance crosses the floor.
                    </div>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] uppercase">
                    {config.paymentMethodSource === 'subscription'
                        ? 'from subscription'
                        : 'saved card'}
                </Badge>
                <Button variant="outline" size="sm" onClick={onSaveCard}>
                    Update card
                </Button>
            </div>
        );
    }
    // No PM — the degrade / needs-a-card state.
    return (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-warning/40 bg-warning/10 p-3">
            <span className="grid size-8 flex-none place-items-center rounded-md bg-warning/20 text-warning-foreground">
                <KeyRound className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-warning-foreground">
                    A saved card is required to reload off-session
                </div>
                <div className="text-xs text-warning-foreground/80">
                    We save your card with Stripe (SetupIntent, off-session) — you're not charged
                    now.
                </div>
            </div>
            <Button size="sm" onClick={onSaveCard}>
                <CreditCard className="size-4" /> Save a card
            </Button>
        </div>
    );
}

// ── The failure banner + re-arm CTA, driven by status/disabledReason. ──
function FailureBanner({
    config,
    onSaveCard,
}: {
    config: AutoReloadConfig;
    onSaveCard: () => void;
}) {
    if (config.status !== 'suspended' && config.status !== 'needs_payment_method') return null;

    const reason = config.disabledReason;
    const isSca = reason === 'sca_required';
    const isNoPm =
        config.status === 'needs_payment_method' || reason === 'payment_method_unavailable';

    const title = isSca
        ? 'Your bank needs you to confirm this card'
        : isNoPm
          ? 'The saved card is no longer available'
          : `Auto-reload paused after ${config.consecutiveFailures} failed charges`;
    const body = isSca
        ? 'Off-session charges can’t complete a bank authentication challenge — re-authorize the card once and reloads resume.'
        : isNoPm
          ? 'Save a card to keep auto-reload on.'
          : 'We stopped retrying to avoid repeated declines. Update the card, then re-enable.';
    // Re-arm CTA per the disabled reason (sca_required → re-authorize; needs-card → save; else update).
    const cta = isSca ? 'Re-authorize card' : isNoPm ? 'Save a card' : 'Update card';

    return (
        <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 size-5 flex-none text-destructive" />
            <div className="min-w-0 flex-1 space-y-1">
                <div className="text-sm font-medium">{title}</div>
                <p className="text-sm text-muted-foreground">{body}</p>
            </div>
            <Button size="sm" className="flex-none" onClick={onSaveCard}>
                {cta}
            </Button>
        </div>
    );
}

// The editable form state — the write-shape slice of the config, seeded from the server DTO.
type FormState = {
    enabled: boolean;
    thresholdUsd: number | null;
    amountMode: 'fixed' | 'to_target';
    reloadAmountUsd: number | null;
    targetUsd: number | null;
    cooldownSeconds: number | null;
    maxReloadsPerPeriod: number | null;
    maxSpendPerPeriodUsd: number | null;
    maxPerReloadUsd: number | null;
    periodDays: number | null;
    paymentMethodSource: 'setup_intent' | 'subscription' | null;
};

function seedForm(config: AutoReloadConfig): FormState {
    return {
        enabled: config.enabled,
        thresholdUsd: config.thresholdUsd,
        amountMode: config.amountMode === 'to_target' ? 'to_target' : 'fixed',
        reloadAmountUsd: config.reloadAmountUsd,
        targetUsd: config.targetUsd,
        cooldownSeconds: config.cooldownSeconds,
        maxReloadsPerPeriod: config.maxReloadsPerPeriod,
        maxSpendPerPeriodUsd: config.maxSpendPerPeriodUsd,
        maxPerReloadUsd: config.maxPerReloadUsd,
        periodDays: config.periodDays,
        paymentMethodSource:
            config.paymentMethodSource === 'subscription'
                ? 'subscription'
                : config.paymentMethodSource === 'setup_intent'
                  ? 'setup_intent'
                  : null,
    };
}

const AMOUNT_PRESETS = [25, 50, 100];

export function AutoReloadConfigCard({ config }: { config: AutoReloadConfig }) {
    const update = useUpdateAutoReloadConfig();
    const onSaveCard = useSavePaymentMethod();
    const clamps = config.clamps;

    // Local editable copy, re-seeded whenever the server config changes (e.g. after a save).
    const [form, setForm] = useState<FormState>(() => seedForm(config));
    useEffect(() => {
        setForm(seedForm(config));
    }, [config]);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function onSave() {
        const body: AutoReloadConfigUpdate = {
            enabled: form.enabled,
            thresholdUsd: form.thresholdUsd ?? 0,
            amountMode: form.amountMode,
            reloadAmountUsd: form.reloadAmountUsd,
            targetUsd: form.targetUsd,
            cooldownSeconds: form.cooldownSeconds,
            maxReloadsPerPeriod: form.maxReloadsPerPeriod,
            maxSpendPerPeriodUsd: form.maxSpendPerPeriodUsd,
            maxPerReloadUsd: form.maxPerReloadUsd,
            periodDays: form.periodDays,
            paymentMethodSource: form.paymentMethodSource,
        };
        update.mutate(body);
    }

    const fixed = form.amountMode === 'fixed';

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <CardTitle>Automatic reload</CardTitle>
                        <StatusPill status={config.status} />
                    </div>
                </div>
                <CardDescription>
                    Keep generation running: when your prepaid balance runs low, top it up
                    automatically — no checkout, no waiting.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FailureBanner config={config} onSaveCard={onSaveCard} />

                {/* Master enable */}
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <div>
                        <div className="text-sm font-medium">Reload my credits automatically</div>
                        <div className="text-xs text-muted-foreground">
                            Charges the saved card off-session when the balance floor is crossed.
                        </div>
                    </div>
                    <Switch
                        checked={form.enabled}
                        onCheckedChange={(checked) => set('enabled', checked)}
                    />
                </div>

                {/* Everything below is dimmed when disabled — still visible so the tenant sees the deal. */}
                <div className={cn('space-y-6', !form.enabled && 'pointer-events-none opacity-50')}>
                    {/* Threshold — ABSOLUTE balance floor. */}
                    <MoneyField
                        id="ar-threshold"
                        label="Reload when my balance drops below"
                        value={form.thresholdUsd}
                        onChange={(v) => set('thresholdUsd', v)}
                    />

                    {/* Amount mode — a segmented control (fixed ⇄ to_target). */}
                    <div className="space-y-2">
                        <Label>Each time, reload</Label>
                        <div className="inline-flex rounded-md border p-0.5">
                            <SegBtn
                                active={fixed}
                                icon={<ArrowUpCircle className="size-3.5" />}
                                onClick={() => set('amountMode', 'fixed')}
                            >
                                A fixed amount
                            </SegBtn>
                            <SegBtn
                                active={!fixed}
                                icon={<Target className="size-3.5" />}
                                onClick={() => set('amountMode', 'to_target')}
                            >
                                Up to a target
                            </SegBtn>
                        </div>
                        {fixed ? (
                            <div className="space-y-2 pt-1">
                                <MoneyField
                                    id="ar-amount"
                                    label="Reload amount"
                                    value={form.reloadAmountUsd}
                                    onChange={(v) => set('reloadAmountUsd', v)}
                                />
                                <div className="flex flex-wrap gap-1.5">
                                    {AMOUNT_PRESETS.map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => set('reloadAmountUsd', p)}
                                            className={cn(
                                                'rounded-md border px-2 py-1 text-xs transition-colors',
                                                form.reloadAmountUsd === p
                                                    ? 'border-primary/40 bg-primary/5 text-foreground'
                                                    : 'border-border text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {formatUsd(p)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="pt-1">
                                <MoneyField
                                    id="ar-target"
                                    label="Top up to"
                                    value={form.targetUsd}
                                    onChange={(v) => set('targetUsd', v)}
                                    help="We charge the difference between your balance and this target — capped by the per-reload limit below."
                                />
                            </div>
                        )}
                    </div>

                    {/* Guardrails — tunable within policy clamps; effective = clamp(config, policy). */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Label className="text-muted-foreground">Spending limits</Label>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                                effective = clamp(config, policy)
                            </span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <MoneyField
                                id="ar-max-reload"
                                label="Max per reload"
                                value={form.maxPerReloadUsd}
                                onChange={(v) => set('maxPerReloadUsd', v)}
                                help={
                                    <ClampHelp
                                        raw={form.maxPerReloadUsd}
                                        ceiling={clamps.maxPerReloadCeilingUsd}
                                        effective={clamps.effectiveMaxPerReloadUsd}
                                    />
                                }
                            />
                            <MoneyField
                                id="ar-max-spend"
                                label={`Max spend per ${form.periodDays ?? config.periodDays} days`}
                                value={form.maxSpendPerPeriodUsd}
                                onChange={(v) => set('maxSpendPerPeriodUsd', v)}
                                help={
                                    <ClampHelp
                                        raw={form.maxSpendPerPeriodUsd}
                                        ceiling={clamps.maxSpendCeilingUsd}
                                        effective={clamps.effectiveMaxSpendPerPeriodUsd}
                                    />
                                }
                            />
                            <div className="grid gap-1.5">
                                <Label htmlFor="ar-max-count">Max reloads per period</Label>
                                <Input
                                    id="ar-max-count"
                                    type="number"
                                    inputMode="numeric"
                                    className="max-w-[12rem] font-mono tabular-nums"
                                    value={form.maxReloadsPerPeriod ?? ''}
                                    onChange={(e) =>
                                        set(
                                            'maxReloadsPerPeriod',
                                            e.target.value === '' ? null : Number(e.target.value),
                                        )
                                    }
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    <ClampHelp
                                        raw={form.maxReloadsPerPeriod}
                                        ceiling={clamps.maxReloadsCeiling}
                                        effective={clamps.effectiveMaxReloadsPerPeriod}
                                        format={(n) => String(n)}
                                    />
                                </p>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="ar-cooldown">Wait between reloads</Label>
                                <div className="relative max-w-[12rem]">
                                    <Input
                                        id="ar-cooldown"
                                        type="number"
                                        inputMode="numeric"
                                        className="pr-14 font-mono tabular-nums"
                                        value={
                                            form.cooldownSeconds != null
                                                ? form.cooldownSeconds / 60
                                                : ''
                                        }
                                        onChange={(e) =>
                                            set(
                                                'cooldownSeconds',
                                                e.target.value === ''
                                                    ? null
                                                    : Math.round(Number(e.target.value) * 60),
                                            )
                                        }
                                    />
                                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        min
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    At least {Math.round(clamps.minCooldownSeconds / 60)} min — the
                                    double-fire guard.
                                    {form.cooldownSeconds != null &&
                                        form.cooldownSeconds < clamps.minCooldownSeconds && (
                                            <span className="font-medium text-warning-foreground">
                                                {' '}
                                                Clamped to{' '}
                                                {Math.round(
                                                    clamps.effectiveCooldownSeconds / 60,
                                                )}{' '}
                                                min.
                                            </span>
                                        )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card-on-file — inline (the recommended placement). */}
                    <div className="space-y-2">
                        <Label>Payment method</Label>
                        <CardOnFileRow config={config} onSaveCard={onSaveCard} />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    {update.isError && (
                        <span className="text-sm text-destructive">
                            {errorMessage(update.error, 'Could not save auto-reload.')}
                        </span>
                    )}
                    {update.isSuccess && !update.isPending && (
                        <span className="text-sm text-muted-foreground">Saved.</span>
                    )}
                    <Button onClick={onSave} disabled={update.isPending}>
                        <ShieldCheck className="size-4" />
                        {update.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
