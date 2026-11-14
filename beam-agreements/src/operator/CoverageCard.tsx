import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { resourceQueryKey, useFrameInjection, type ResourceKey } from '@schemastud/frame';
import { DashboardCard, type DashboardRow } from '@schemastud/frame/cards';
import { useRjsfRegistry, widgetProps, type SchemaNode } from '@schemastud/seam';

const ROOT: SchemaNode = { type: 'object' };
const NO_PARAMS: Record<string, string> = {};

/**
 * The coverage figure (agreements 17a): the resource's own summary, drawn as frame draws a dashboard's summary card.
 * It reads `summary` through the transport and hands the `SummaryPayload` to frame's `DashboardCard` as a `summary`
 * row, so the card is whatever summary widget the resource declares (frame's `StatRow` by default). The label, the
 * figures, their population and their unit are the payload's: nothing here computes or names one.
 */
export interface CoverageCardProps {
    /** The resource whose summary is the coverage figure. */
    resource: ResourceKey;
    /** Request parameters for the summary, as the host's resource reads them. */
    params?: Record<string, string>;
}

export function CoverageCard({ resource, params = NO_PARAMS }: CoverageCardProps) {
    const { transport } = useFrameInjection();
    const registry = useRjsfRegistry(ROOT);
    const id = useId();
    const summary = useQuery({
        queryKey: resourceQueryKey(transport, resource, 'summary', params),
        queryFn: () => transport.summary(resource, params),
    });

    if (summary.isPending) return <div data-beam-agreements="coverage" aria-busy="true" />;
    if (summary.isError) {
        return (
            <div data-beam-agreements="coverage" role="alert">
                {summary.error.message}
            </div>
        );
    }

    const payload = summary.data;
    const row: DashboardRow = { resource, context: 'summary', label: payload.label, icon: payload.icon, href: '', summary: payload };

    return (
        <div data-beam-agreements="coverage">
            <DashboardCard
                {...widgetProps({ registry, schema: ROOT, value: row, name: '', id, label: payload.label, readonly: true, disabled: true, options: {} })}
            />
        </div>
    );
}
