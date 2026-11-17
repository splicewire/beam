import { Button, cn } from '@schemastud/ui';
import { KIND_ICON } from './kindIcon';
import type { EntryBody, Region } from './types';
import type { JsonNode } from './blockdoc/json';
import { UX_BUILDER_CSS } from './css';
import { useBeamUxMessages } from './messages.js';

/** The list kind's illustrative preview rows (product sample copy, not authored records). */
const LIST_ROWS = [
    { slug: 'frontend-foundations', titleKey: 'splicewire-beam-ux::messages.region_sample_frontend_foundations' },
    { slug: 'data-modeling', titleKey: 'splicewire-beam-ux::messages.region_sample_data_modeling' },
    { slug: 'live-systems-design', titleKey: 'splicewire-beam-ux::messages.region_sample_live_systems_design' },
] as const;

/** A bounded plain-text excerpt, never HTML execution or record/component hydration. */
function bodyExcerpt(body: EntryBody | undefined): string {
    if (!body) return '';
    if (!Array.isArray(body))
        return typeof body.content === 'string' ? body.content.slice(0, 1200) : '';
    let result = '';
    let remainingNodes = 256;
    const walk = (nodes: JsonNode[]) => {
        for (const node of nodes) {
            if (remainingNodes-- <= 0 || result.length >= 1200) break;
            if (node.kind === 'text') result += `${node.value} `.slice(0, 1200 - result.length);
            else if (node.kind === 'block') walk(node.children);
        }
    };
    walk(body);
    return result.trim();
}

/**
 * A single engageable region. Richtext shows a bounded saved-body excerpt; other kinds retain their
 * prototype previews. A div (not a button) because regions nest real shipped
 * <Button>s in their preview; role/tabIndex keep it engageable without an invalid button-in-button.
 */
export function RegionBlock({
    region,
    engaged,
    onEngage,
    body,
    bodyLoading = false,
    bodyError = false,
}: {
    region: Region;
    engaged: boolean;
    onEngage: () => void;
    body?: EntryBody;
    bodyLoading?: boolean;
    bodyError?: boolean;
}) {
    const m = useBeamUxMessages();
    const Icon = KIND_ICON[region.kind];
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onEngage}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onEngage()}
            data-engaged={engaged ? '' : undefined}
            className={cn(
                'beam-ux-region relative block w-full cursor-pointer rounded-lg border bg-card p-4 text-left transition-all',
                engaged
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-transparent hover:border-primary/40'
            )}
        >
            <style>{UX_BUILDER_CSS}</style>
            <div className={cn(!engaged && 'opacity-90')}>
                {region.kind === 'richtext' && (
                    <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        {!engaged
                            ? m.t('splicewire-beam-ux::messages.region_engage_to_preview')
                            : bodyError
                            ? m.t('splicewire-beam-ux::messages.region_body_unavailable')
                            : bodyLoading
                            ? m.t('splicewire-beam-ux::messages.region_body_loading')
                            : bodyExcerpt(body) || m.t('splicewire-beam-ux::messages.region_body_no_text')}
                    </p>
                )}
                {region.kind === 'form' && (
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-primary">
                                {m.t('splicewire-beam-ux::messages.region_sample_new_cohort')}
                            </div>
                            <div className="text-lg font-semibold">{m.t('splicewire-beam-ux::messages.region_sample_frontend_foundations')}</div>
                            <div className="text-xs text-muted-foreground">
                                {m.t('splicewire-beam-ux::messages.region_sample_cohort_seats')}
                            </div>
                        </div>
                        <Button size="sm">{m.t('splicewire-beam-ux::messages.region_sample_enroll')}</Button>
                    </div>
                )}
                {region.kind === 'frame' && (
                    <div className="text-sm text-muted-foreground">
                        {m.t('splicewire-beam-ux::messages.region_sample_enrollment_roster')}
                    </div>
                )}
                {region.kind === 'list' && (
                    <div className="flex gap-2">
                        {LIST_ROWS.map((r) => (
                            <span
                                key={r.slug}
                                className="rounded border bg-background px-2 py-1 text-xs"
                            >
                                {m.t(r.titleKey)}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* engage affordance — the region label tab, visible on hover/engage (the reveal and the
                offset are sheet rules keyed by `data-engaged` on the block) */}
            <span
                className={cn(
                    'beam-ux-region-tab absolute left-3 flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 font-mono text-[10px]',
                    engaged && 'border-primary text-primary'
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
    body,
    bodyLoading,
    bodyError,
}: {
    regions: Region[];
    engaged: string | null;
    onEngage: (regionId: string) => void;
    body?: EntryBody;
    bodyLoading?: boolean;
    bodyError?: boolean;
}) {
    return (
        <div className="space-y-4">
            {regions.map((r) => (
                <RegionBlock
                    key={r.id}
                    region={r}
                    engaged={engaged === r.id}
                    onEngage={() => onEngage(r.id)}
                    body={engaged === r.id ? body : undefined}
                    bodyLoading={bodyLoading}
                    bodyError={bodyError}
                />
            ))}
        </div>
    );
}
