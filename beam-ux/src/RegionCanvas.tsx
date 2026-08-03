import { Button, cn } from '@schemastud/ui';
import { KIND_ICON } from './kindIcon';
import type { Region } from './types';

const LIST_ROWS = [
    { slug: 'frontend-foundations', title: 'Frontend Foundations' },
    { slug: 'data-modeling', title: 'Data Modeling' },
    { slug: 'live-systems-design', title: 'Live Systems Design' },
];

/**
 * A single engageable region on the live page canvas — its public-facing preview as it renders on the
 * real page, wrapped in an engage affordance. A div (not a button) because regions nest real shipped
 * <Button>s in their preview; role/tabIndex keep it engageable without an invalid button-in-button.
 */
export function RegionBlock({
    region,
    engaged,
    onEngage,
}: {
    region: Region;
    engaged: boolean;
    onEngage: () => void;
}) {
    const Icon = KIND_ICON[region.kind];
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onEngage}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onEngage()}
            className={cn(
                'group relative block w-full cursor-pointer rounded-lg border bg-card p-4 text-left transition-all',
                engaged
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-transparent hover:border-primary/40 hover:ring-1 hover:ring-primary/20',
            )}
        >
            <div className={cn(!engaged && 'opacity-90')}>
                {region.kind === 'richtext' && (
                    <>
                        <div className="text-2xl font-semibold tracking-tight">
                            Build things that ship.
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Cohort-based programs for teams who&rsquo;d rather practice than watch.
                        </p>
                    </>
                )}
                {region.kind === 'form' && (
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-primary">
                                New cohort
                            </div>
                            <div className="text-lg font-semibold">Frontend Foundations</div>
                            <div className="text-xs text-muted-foreground">cohort &middot; 8 seats left</div>
                        </div>
                        <Button size="sm">Enroll</Button>
                    </div>
                )}
                {region.kind === 'frame' && (
                    <div className="text-sm text-muted-foreground">Enrollment roster &middot; 3 enrolled</div>
                )}
                {region.kind === 'list' && (
                    <div className="flex gap-2">
                        {LIST_ROWS.map((r) => (
                            <span key={r.slug} className="rounded border bg-background px-2 py-1 text-xs">
                                {r.title}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* engage affordance — the region label tab, visible on hover/engage */}
            <span
                className={cn(
                    'absolute -top-2.5 left-3 flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 font-mono text-[10px] transition-opacity',
                    engaged
                        ? 'border-primary text-primary opacity-100'
                        : 'opacity-0 group-hover:opacity-100',
                )}
            >
                <Icon className="size-3" />
                {region.id}
            </span>
        </div>
    );
}

/** The live page canvas — every region as an engageable block, top-to-bottom. */
export function RegionCanvas({
    regions,
    engaged,
    onEngage,
}: {
    regions: Region[];
    engaged: string | null;
    onEngage: (regionId: string) => void;
}) {
    return (
        <div className="space-y-4">
            {regions.map((r) => (
                <RegionBlock
                    key={r.id}
                    region={r}
                    engaged={engaged === r.id}
                    onEngage={() => onEngage(r.id)}
                />
            ))}
        </div>
    );
}
