import { BigCalendarProvider, BigCalendarSurface, type CalendarServices, type FoundationCalendarEvent } from '@schemastud/big-calendar';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { createAggregateClient, createSingleClient } from './client';
import { EventBadge, Filters, LaneHeader, type FacetState } from './chrome';
import { readMeta } from './mapEvent';
import type { CompositionCalendarProps } from './types';

/** The editorial statuses a facet can filter on (relocated cell status + the virtual `upcoming`). */
const STATUSES = ['approved', 'generated', 'needs_review', 'stale', 'upcoming'];

function toggle(set: Set<string>, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
}

/**
 * The ONE vocab-aware calendar component, mounted twice (PRD §3, the keystone). The two mounts
 * differ ONLY in the injected `client` adapter (aggregate fetch-all-merge / single fixed) + the
 * provenance-driven facets. It sits on the source-blind `@schemastud/big-calendar` foundation,
 * types off the `@splicewire/_resources` projection DTO, and NEVER imports react-big-calendar.
 *
 * The host injects transport + feedback + the load-bearing `renderEditPanel` (its Sheet +
 * CellFormPanel, which cannot enter a package) + real-time `subscribe`; the satellite supplies
 * the vocab chrome (event badge, provenance/status facets, lane headers) and the hue axis.
 */
export function CompositionCalendar({
    mount,
    compositionId,
    transport,
    lanes,
    calendars: calendarsProp,
    renderEditPanel,
    notify,
    onError,
    subscribe,
    defaultDate,
    height,
}: CompositionCalendarProps) {
    if (mount === 'single' && !compositionId) {
        throw new Error('CompositionCalendar single mount requires a `compositionId`.');
    }

    const isAggregate = mount === 'aggregate';

    const client = useMemo(
        () => (isAggregate ? createAggregateClient(transport) : createSingleClient(transport, compositionId!)),
        [isAggregate, transport, compositionId],
    );

    // Provenance facet needs calendar labels (aggregate only). Prefer the host-supplied list so we
    // don't duplicate its fetch; only fetch our own when it wasn't passed. A forbidden/empty list
    // must not retry (`retry: false`) — otherwise a 403 storms N× per mount.
    const calendarsQuery = useQuery({
        queryKey: ['beam-calendar', 'calendars'],
        queryFn: () => transport.listCalendars(),
        enabled: isAggregate && !calendarsProp,
        retry: false,
    });

    const [facets, setFacets] = useState<FacetState>({ statuses: new Set(), calendars: new Set() });
    const onToggleStatus = useCallback((s: string) => setFacets((f) => ({ ...f, statuses: toggle(f.statuses, s) })), []);
    const onToggleCalendar = useCallback((c: string) => setFacets((f) => ({ ...f, calendars: toggle(f.calendars, c) })), []);

    // The opaque predicate the foundation applies pre-render — no network refetch on toggle.
    const filterEvent = useMemo(() => {
        if (!isAggregate || (facets.statuses.size === 0 && facets.calendars.size === 0)) return undefined;
        return (event: FoundationCalendarEvent) => {
            const meta = readMeta(event);
            const okStatus = facets.statuses.size === 0 || facets.statuses.has(meta.status);
            const okCalendar = facets.calendars.size === 0 || facets.calendars.has(event.sourceId);
            return okStatus && okCalendar;
        };
    }, [isAggregate, facets]);

    const multiLane = (lanes?.length ?? 0) > 1;

    const services = useMemo<CalendarServices>(() => {
        const calendars = (calendarsProp ?? calendarsQuery.data ?? []).map((c) => ({ id: c.id, label: c.title ?? c.id }));
        return {
            client,
            notify,
            onError,
            subscribe,
            // Host-filled slot (its Sheet + CellFormPanel); the satellite only declares the contract.
            renderEditPanel,
            // Satellite-authored vocab chrome.
            renderEventBadge: (event) => <EventBadge event={event} />,
            renderLaneHeader: multiLane ? (lane) => <LaneHeader lane={lane} /> : undefined,
            renderFilters: isAggregate
                ? () => (
                      <Filters
                          calendars={calendars}
                          statuses={STATUSES}
                          active={facets}
                          onToggleCalendar={onToggleCalendar}
                          onToggleStatus={onToggleStatus}
                      />
                  )
                : undefined,
        };
    }, [client, notify, onError, subscribe, renderEditPanel, multiLane, isAggregate, calendarsProp, calendarsQuery.data, facets, onToggleCalendar, onToggleStatus]);

    return (
        <BigCalendarProvider services={services}>
            <BigCalendarSurface lanes={lanes} defaultDate={defaultDate} height={height} filterEvent={filterEvent} />
        </BigCalendarProvider>
    );
}
