/**
 * The floating `?variant=` switcher — a pill bar pinned bottom-center (+ ←/→ cycling handled by the
 * host). Use for the ONE structural fork worth comparing side-by-side (rival layouts, permission
 * tiers). Brand-free: needs only `cn`. Lifted verbatim from splicewire-app's `_chrome/VariantBar`.
 */
import { cn as defaultCn, type Cn } from './cn';
import type { VariantSpec } from './types';

export type { VariantSpec };

export interface VariantBarProps {
    variants: VariantSpec[];
    active: string;
    onSelect: (key: string) => void;
    hint?: string;
    /** Override the bundled `cn` (e.g. the host's tailwind-merge `cn`). */
    cn?: Cn;
}

export function VariantBar({
    variants,
    active,
    onSelect,
    hint = 'variant ←/→',
    cn = defaultCn,
}: VariantBarProps) {
    return (
        <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-card px-2 py-1.5 text-xs shadow-lg">
            <span className="px-2 text-muted-foreground">{hint}</span>
            {variants.map((v) => (
                <button
                    key={v.key}
                    type="button"
                    onClick={() => onSelect(v.key)}
                    className={cn(
                        'rounded-full px-3 py-1 font-medium transition-colors',
                        v.key === active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted',
                    )}
                >
                    {v.label}
                </button>
            ))}
        </div>
    );
}
