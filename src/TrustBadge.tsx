import { Badge, cn } from '@schemastud/ui';
import { Lock, ShieldCheck, ShieldQuestion } from 'lucide-react';
import type { TrustTier } from './types';

/**
 * The Official/Verified/Standard trust badge (ticket 07/08) — the ONE place a `trustTier` string
 * becomes a visual affordance, used identically in the catalog grid and the detail sheet.
 */
export function TrustBadge({ tier, className }: { tier: TrustTier; className?: string }) {
    const config =
        tier === 'Official'
            ? { label: 'Official', icon: ShieldCheck, className: 'bg-primary/10 text-primary border-primary/20' }
            : tier === 'Verified'
              ? { label: 'Verified', icon: ShieldCheck, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' }
              : { label: 'Standard', icon: ShieldQuestion, className: 'bg-muted text-muted-foreground border-transparent' };

    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn('gap-1 font-normal', config.className, className)}>
            <Icon className="size-3" aria-hidden="true" />
            {config.label}
        </Badge>
    );
}

/** The `requires_splicewire` lock badge — a Beam Extension facet, never a third listing kind. */
export function RequiresSplicewireBadge({ className }: { className?: string }) {
    return (
        <Badge variant="outline" className={cn('gap-1 font-normal text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10', className)}>
            <Lock className="size-3" aria-hidden="true" />
            Requires Splicewire
        </Badge>
    );
}
