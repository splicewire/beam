/**
 * The Config area's provenance vocabulary: the tier pill, the effect tag, the Fed-by line, a key's read-only value
 * and the secret state. One vocabulary on purpose, so a key reads the same in the key table and the Cascade
 * inspector (config-sections ticket 01, the owner's Ledger with the Cascade inspector).
 */
import { useContext, useId, type ReactNode } from 'react';
import {
    asWidget,
    UnboundWidget,
    useRjsfRegistry,
    widgetProps,
    WidgetRegistryContext,
    type SchemaNode,
} from '@schemastud/seam';
import { cn } from '@schemastud/ui';
import { useBeamUxMessages, type BeamUxMessageKey } from '../messages.js';
import { FileCode2, KeyRound, RotateCw, Rocket, TerminalSquare, Zap } from 'lucide-react';
import {
    EFFECT_COPY,
    formatValue,
    nodeAt,
    pointerTokens,
    TIER_LABEL,
    type ConfigEffect,
    type ConfigKeyData,
    type ConfigSectionData,
    type ConfigTier,
} from './model';

const TIER_DOT: Record<ConfigTier, string> = {
    package: 'bg-muted-foreground/45',
    host: 'bg-foreground/75',
    provider: 'bg-warning',
    operator: 'bg-primary',
    tenant: 'bg-primary',
};

export function TierPill({ tier, className }: { tier: ConfigTier; className?: string }) {
    const m = useBeamUxMessages();
    return (
        <span
            data-config-tier={tier}
            className={cn(
                'inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 font-mono text-[10.5px] leading-none',
                tier === 'operator' || tier === 'tenant' ? 'border-primary/25 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground',
                tier === 'provider' && 'border-warning/40 bg-warning/10 text-warning-foreground',
                className,
            )}
        >
            <span className={cn('size-1.5 rounded-full', TIER_DOT[tier])} aria-hidden />
            {m.t(TIER_LABEL[tier])}
        </span>
    );
}

const EFFECT_ICON: Record<ConfigEffect, typeof Zap> = { live: Zap, reload: RotateCw, deploy: Rocket };

export function EffectTag({ effect, className }: { effect: ConfigEffect; className?: string }) {
    const m = useBeamUxMessages();
    const Icon = EFFECT_ICON[effect];
    return (
        <span
            data-config-effect={effect}
            title={m.t(EFFECT_COPY[effect].longKey)}
            className={cn(
                'inline-flex items-center gap-1 whitespace-nowrap font-mono text-[10.5px]',
                effect === 'live' ? 'text-primary' : effect === 'reload' ? 'text-info' : 'text-muted-foreground',
                className,
            )}
        >
            <Icon className="size-3" aria-hidden />
            {m.t(EFFECT_COPY[effect].labelKey)}
        </span>
    );
}

/** Whether the env var is set, in the three states `ConfigEnvData.set` carries. Unknown is never "file default". */
export function envState(set: boolean | null): BeamUxMessageKey {
    if (set === true) return 'splicewire-beam-ux::messages.config_env_set';
    if (set === false) return 'splicewire-beam-ux::messages.config_env_unset';
    return 'splicewire-beam-ux::messages.config_env_unknown';
}

/** The Fed-by cell: the env var feeding the key, else the provider, else the file its tier reads. */
export function FedBy({ section, keyData, compact }: { section: ConfigSectionData; keyData: ConfigKeyData; compact?: boolean }) {
    const m = useBeamUxMessages();
    const env = keyData.env;
    if (env) {
        const where = env.file ? `${env.file}${env.line === null ? '' : `:${env.line}`}` : m.t('splicewire-beam-ux::messages.config_declared_on_key');
        return (
            <span data-config-fed-by="env" className="block min-w-0 font-mono text-[11px] text-muted-foreground" title={where}>
                <span className="flex min-w-0 items-center gap-1">
                    <TerminalSquare className="size-3 flex-none" aria-hidden />
                    <span className={cn('truncate', env.set === true && 'text-info')}>{env.name}</span>
                </span>
                {!compact && <span className="block pl-4 text-[10.5px]">{m.t(envState(env.set))}</span>}
            </span>
        );
    }
    if (keyData.tier === 'provider') {
        return (
            <span data-config-fed-by="provider" className="font-mono text-[11px] text-warning-foreground">
                {m.t('splicewire-beam-ux::messages.config_written_by_provider')}
            </span>
        );
    }
    const file = keyData.tier === 'package' ? section.files.package : section.files.host ?? section.files.package;
    return (
        <span data-config-fed-by="file" className="inline-flex min-w-0 items-center gap-1 font-mono text-[11px] text-muted-foreground" title={file ?? ''}>
            <FileCode2 className="size-3 flex-none" aria-hidden />
            <span className="truncate">{file ?? '—'}</span>
        </span>
    );
}

/**
 * A secret's state: set or not set. It takes the key's `set` flag and nothing else, so a value cannot reach the DOM
 * through it even if a row carried one.
 */
export function SecretValue({ set, className }: { set: boolean; className?: string }) {
    const m = useBeamUxMessages();
    return (
        <span data-config-secret={set ? 'set' : 'unset'} className={cn('inline-flex items-center gap-1.5 font-mono text-xs', set ? 'text-foreground' : 'text-muted-foreground', className)}>
            <KeyRound className="size-3" aria-hidden />
            {set ? m.t('splicewire-beam-ux::messages.config_secret_set') : m.t('splicewire-beam-ux::messages.config_secret_not_set')}
        </span>
    );
}

/** A value as plain text: the read default when the section schema binds no widget for the key. */
export function PlainValue({ value, className, struck }: { value: unknown; className?: string; struck?: boolean }) {
    const text = formatValue(value);
    return (
        <span
            data-config-value="plain"
            title={text.length > 48 ? text : undefined}
            className={cn(
                'block truncate font-mono text-xs tabular-nums',
                value === null && 'text-muted-foreground',
                struck && 'text-muted-foreground line-through decoration-muted-foreground/60',
                className,
            )}
        >
            {text}
        </span>
    );
}

/** A stable `formContext` for the read registry: a module constant, so the memoized registry keeps its identity. */
const READ_FORM_CONTEXT: Record<string, unknown> = {};

/**
 * A key's effective value, read-only, drawn from its section's own schema (ADR-0235: a row's values are typed by
 * the section schema it carries). The node at the key's pointer resolves through the kit's widget registry in the
 * `detail` context: a resolved component mounts with `widgetProps` over `useRjsfRegistry` built on the section's
 * ROOT schema (conformance row 04-2); a declared name nothing binds draws seam's unbound marker (row 01-10); a miss
 * reads as plain text. A secret never reaches this component: callers render {@link SecretValue} instead.
 */
export function ReadValue({ schema, pointer, value, label }: { schema: SchemaNode; pointer: string; value: unknown; label: string }): ReactNode {
    const registry = useContext(WidgetRegistryContext);
    const rjsfRegistry = useRjsfRegistry(schema, READ_FORM_CONTEXT);
    const id = useId();
    const node = nodeAt(schema, pointer);
    if (!node || !registry) return <PlainValue value={value} />;
    const resolved = registry.resolveEntry(node, 'detail');
    if (resolved.bound === false && resolved.name !== undefined) {
        return <UnboundWidget context="detail" name={resolved.name} label={label} />;
    }
    const Widget = asWidget(resolved.widget);
    if (!Widget) return <PlainValue value={value} />;
    const tokens = pointerTokens(pointer);
    return (
        <span data-config-value="widget" className="block min-w-0">
            <Widget
                {...widgetProps({
                    registry: rjsfRegistry,
                    schema: node,
                    value,
                    name: tokens[tokens.length - 1] ?? '',
                    id,
                    label,
                    readonly: true,
                    disabled: true,
                    options: resolved.options,
                })}
            />
        </span>
    );
}

/** The key's value cell: a secret's state, or its value read through the section schema. */
export function KeyValue({ section, keyData, label }: { section: ConfigSectionData; keyData: ConfigKeyData; label: string }) {
    if (keyData.secret) return <SecretValue set={keyData.set} />;
    return <ReadValue schema={section.schema as SchemaNode} pointer={keyData.pointer} value={keyData.value} label={label} />;
}
