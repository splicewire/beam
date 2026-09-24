import type { FoundationCalendarEvent, LaneAxis } from '@schemastud/big-calendar';
import { Repeat } from 'lucide-react';
import { readMeta } from './mapEvent';

/**
 * The vocab-aware `renderX` chrome the satellite injects into the source-blind foundation
 * (PRD §4/§5/§7). Each reads the satellite `meta` bag off the event — the foundation never
 * does. Skinned with semantic Tailwind utilities over host token-vars (rehome-ui: the host
 * `@source`-scans the package dist), so no bespoke stylesheet travels.
 */

/**
 * Status → a dot utility (editorial cell status; a virtual occurrence ⇒ `upcoming`). `upcoming` is
 * a hollow ring in the label's own ink (`border-current`) rather than a pale fill: a `bg-slate-300`
 * dot was all but invisible on a light surface (beam VR pass 2), and the ring reads as "not yet
 * materialized" on a filled bar, a dashed chip and the page alike.
 */
export const STATUS_TONE: Record<string, string> = {
    approved: 'bg-emerald-500',
    generated: 'bg-sky-500',
    needs_review: 'bg-amber-500',
    stale: 'bg-slate-400',
    upcoming: 'border border-current bg-transparent',
};

/** renderEventBadge (PRD §4.2): series Repeat badge, Kind chrome (title), status dot. */
export function EventBadge({ event }: { event: FoundationCalendarEvent }) {
    const meta = readMeta(event);
    const isSeries = Boolean(meta.seriesRef);
    return (
        <span className="flex w-full min-w-0 items-center gap-1" title={meta.kind ?? undefined}>
            {/* `rbc-event-glyph` / `rbc-event-title` are big-calendar theme hooks: at narrow widths the
                theme wraps the title and sets the glyphs aside so a ~45px month cell stays legible. */}
            <span
                className={`rbc-event-glyph inline-block size-1.5 shrink-0 rounded-full ${STATUS_TONE[meta.status] ?? 'bg-slate-400'}`}
                data-status={meta.status}
                aria-hidden
            />
            {isSeries ? (
                <Repeat className="rbc-event-glyph size-3 shrink-0 opacity-70" aria-label="series occurrence" />
            ) : null}
            <span className="rbc-event-title min-w-0 truncate">{event.title}</span>
        </span>
    );
}

/** renderLaneHeader (PRD §4.2): the channel label per lane, as a legend chip. */
export function LaneHeader({ lane }: { lane: LaneAxis }) {
    return (
        <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground">
            {lane.label}
        </span>
    );
}

export interface FacetState {
    statuses: Set<string>;
    calendars: Set<string>;
}

function chipClass(pressed: boolean): string {
    return [
        'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
        pressed
            ? 'border-foreground bg-foreground text-background'
            : 'border-border bg-background text-muted-foreground hover:bg-muted',
    ].join(' ');
}

/**
 * renderFilters (PRD §5, aggregate only): provenance (owning calendar) + status facets. The
 * satellite holds the facet state; toggling a chip filters the merged grid client-side via the
 * foundation's opaque `filterEvent` predicate (no network refetch). An empty set = "all".
 */
export function Filters({
    calendars,
    statuses,
    active,
    onToggleCalendar,
    onToggleStatus,
}: {
    calendars: { id: string; label: string }[];
    statuses: string[];
    active: FacetState;
    onToggleCalendar: (id: string) => void;
    onToggleStatus: (status: string) => void;
}) {
    return (
        <div className="mb-3 flex flex-wrap items-center gap-3" role="group" aria-label="Calendar filters">
            {calendars.length > 1 ? (
                <div className="flex flex-wrap gap-1.5" aria-label="Calendars">
                    {calendars.map((calendar) => (
                        <button
                            key={calendar.id}
                            type="button"
                            className={chipClass(active.calendars.size === 0 || active.calendars.has(calendar.id))}
                            aria-pressed={active.calendars.size === 0 || active.calendars.has(calendar.id)}
                            onClick={() => onToggleCalendar(calendar.id)}
                        >
                            {calendar.label}
                        </button>
                    ))}
                </div>
            ) : null}
            <div className="flex flex-wrap gap-1.5" aria-label="Status">
                {statuses.map((status) => (
                    <button
                        key={status}
                        type="button"
                        className={chipClass(active.statuses.size === 0 || active.statuses.has(status))}
                        aria-pressed={active.statuses.size === 0 || active.statuses.has(status)}
                        onClick={() => onToggleStatus(status)}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>
    );
}
