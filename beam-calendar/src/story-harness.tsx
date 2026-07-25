/* eslint-disable */
// =============================================================================
// story-harness — the shared Storybook fixtures for the @splicewire/beam-calendar
// catalog (component-seams map, ticket 27). NOT part of the shipped package: tsup
// builds only the `src/index.ts` graph (external peers aside), so this file —
// imported solely by *.stories.tsx — never enters `dist`. It exists so every
// beam-calendar story renders the REAL composed CompositionCalendar against a
// realistic-but-in-memory `CalendarTransport` instead of re-mocking the whole
// projection-DTO transport per story.
//
// beam-calendar is the vocab-aware SATELLITE: it binds the source-blind
// @schemastud/big-calendar foundation into the composition world. Its ONE public
// component (`CompositionCalendar`) is mounted twice (aggregate + single); the two
// mounts differ ONLY in the injected client adapter + the provenance facets. The
// host injects a `CalendarTransport` (relative-endpoint IO returning the
// slice-05 `CalendarEventData` projection DTO); the satellite maps DTO →
// FoundationCalendarEvent, resolves the hue axis, and injects the vocab renderX
// chrome. So the harness here is a MOCK TRANSPORT (not a big-calendar client) —
// one level up from ticket 22's harness, because beam-calendar owns the client.
//
// THEME: beam-calendar composes @schemastud/big-calendar, which ships its own
// `theme.css` (a retokenized RBC skin over host token-vars) layered on RBC's base
// layout CSS. A story must import ALL THREE — RBC's `react-big-calendar.css` (grid
// geometry) + the dnd addon's `styles.css` + big-calendar's `theme.css` — or the
// calendar renders as an unstyled table. They are imported ONCE here (side-effect)
// so every story that imports the harness inherits the skinned surface. Mirrors
// ticket 22's harness pattern exactly. big-calendar's `--rbc-*` chrome vars fall
// back to the SEMANTIC tokens (`--background`/`--foreground`/`--muted`/`--border`/
// `--accent`) that beam's ticket-23 `.dark` seed overrides — so the grid/toolbar/
// today-marker/borders re-skin under `.dark` for free.
//
// HONEST HEX NOTE (mirrors ticket 22 + ticket 15's Frame hex caveat). Event colour
// comes from TWO self-contained-hex sources that do NOT re-skin under `.dark`:
//   1. big-calendar's `theme.css` `--rbc-hue-*` event-bar palette (the vendored
//      RBC theme — a pre-existing property recorded in ticket 22, unchanged here).
//   2. beam-calendar's OWN `chrome.tsx` status-dot tones — the `EventBadge` status
//      dot uses literal Tailwind palette utilities (`bg-emerald-500`/`bg-sky-500`/
//      `bg-amber-500`/`bg-slate-400`/`bg-slate-300`, see `chrome.tsx#STATUS_TONE`),
//      which are fixed-lightness palette colours, NOT semantic tokens. So the status
//      dots read identically in light and dark. The rest of the satellite chrome
//      (badge title, lane header `text-muted-foreground`, facet chips
//      `border-border`/`bg-foreground`/`text-background`/`bg-muted`) IS semantic and
//      re-skins correctly. Both hex sources are token-debt for ticket 32 — recorded,
//      not fixed here.
// =============================================================================
import '@schemastud/big-calendar/theme.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import type { LaneAxis } from '@schemastud/big-calendar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import type {
    CalendarEventData,
    CalendarSummary,
    CalendarTransport,
    OverrideAction,
    RefParts,
} from './types';

// ── A stable "today" anchor ─────────────────────────────────────────────────────
// Stories anchor on a FIXED month (not `new Date()`) so a VR baseline never drifts as
// the wall clock moves. The demo events sit inside this month; `TODAY` (the 15th) is a
// day the surface paints with `.rbc-today`.
export const ANCHOR = new Date(2026, 6, 15); // 2026-07-15 → month view opens on July 2026

// ── The demo lanes (the opaque channel axis) ─────────────────────────────────────
export const DEMO_LANES: LaneAxis[] = [
    { id: 'lane-a', label: '#marketing' },
    { id: 'lane-b', label: '#newsletter' },
];

// ── The demo calendars (aggregate provenance axis) ───────────────────────────────
export const DEMO_CALENDARS: CalendarSummary[] = [
    { id: 'cal-marketing', title: '#marketing' },
    { id: 'cal-product', title: '#product' },
];

/** A DTO builder — only the fields the satellite maps + the chrome reads matter. */
function dto(overrides: Partial<CalendarEventData>): CalendarEventData {
    return {
        cell_id: 'cell-1',
        channel: 'lane-a',
        kind: 'composition-ref',
        anchor: '2026-07-15',
        composition_id: 'ref-comp-1',
        series_ref: null,
        recurrence_id: null,
        virtual: false,
        title: 'Untitled release',
        status: 'approved',
        ...overrides,
    };
}

// ── The demo DTO corpus, keyed per owning calendar ───────────────────────────────
// A representative July-2026 spread: resident (solid) + virtual (dashed, read-only)
// events across both lanes/statuses, so the hue palette + status dots all show. The
// SINGLE mount serves the `cal-marketing` set; the AGGREGATE mount merges both.
const EVENTS_BY_CALENDAR: Record<string, CalendarEventData[]> = {
    'cal-marketing': [
        dto({ cell_id: 'm1', title: 'Launch: Summer Drop', anchor: '2026-07-03', channel: 'lane-a', kind: 'composition-ref', status: 'approved' }),
        dto({ cell_id: 'm2', title: 'Preview: Behind the Scenes', anchor: '2026-07-09', channel: 'lane-a', kind: 'idea-ref', status: 'generated' }),
        dto({ cell_id: 'm3', title: 'Feature: Creator Spotlight', anchor: '2026-07-21', channel: 'lane-a', kind: 'composition-ref', status: 'needs_review' }),
        dto({ cell_id: null, title: 'Recurring: Weekly Digest', anchor: '2026-07-15', channel: 'lane-b', kind: 'series', status: 'upcoming', virtual: true, series_ref: 'series-9', recurrence_id: '2026-07-15' }),
    ],
    'cal-product': [
        dto({ cell_id: 'p1', title: 'Release Notes: v4', anchor: '2026-07-07', channel: 'lane-a', kind: 'disclosure-ref', status: 'approved' }),
        dto({ cell_id: 'p2', title: 'Deprecation: Legacy API', anchor: '2026-07-24', channel: 'lane-a', kind: 'decommission', status: 'stale' }),
        dto({ cell_id: null, title: 'Roadmap: Q4 Themes', anchor: '2026-07-28', channel: 'lane-a', kind: 'idea-ref', status: 'upcoming', virtual: true, series_ref: 'series-3', recurrence_id: '2026-07-28' }),
    ],
};

const NEVER = new Promise<never>(() => {});

// ── Transport fixtures ────────────────────────────────────────────────────────────
export interface TransportFixtures {
    /** Per-calendar DTO corpus (default: the demo spread). Empty object ⇒ no events anywhere. */
    eventsByCalendar?: Record<string, CalendarEventData[]>;
    /** The calendars the aggregate mount discovers (default: DEMO_CALENDARS). */
    calendars?: CalendarSummary[];
    /** A never-resolving `listEvents` so the composed surface parks on its loading path. */
    loading?: boolean;
}

/**
 * An in-memory `CalendarTransport` — the HOST-side seam the satellite injects. Returns the
 * slice-05 projection DTO per calendar; writes are no-ops that resolve. The satellite's own
 * client adapters map these DTOs into FoundationCalendarEvents, so exercising this transport
 * exercises the REAL map + merge + route + hue path (not a re-mock of the foundation client).
 */
export function createMockTransport(fixtures: TransportFixtures = {}): CalendarTransport {
    const byCalendar = fixtures.eventsByCalendar ?? EVENTS_BY_CALENDAR;
    const calendars = fixtures.calendars ?? DEMO_CALENDARS;
    const first = (byCalendar[calendars[0]?.id] ?? []) as CalendarEventData[];
    return {
        listCalendars: () => Promise.resolve(calendars),
        listEvents: (compositionId) => {
            if (fixtures.loading) return NEVER;
            return Promise.resolve(byCalendar[compositionId] ?? []);
        },
        reAnchor: (_c: string, _t: RefParts, _d: Date) => Promise.resolve(),
        createRelease: (_c: string, input) => Promise.resolve(dto({ cell_id: `new-${Date.now()}`, title: 'New release', anchor: input.date.toISOString().slice(0, 10) })),
        editCell: () => Promise.resolve(),
        materialize: (_c: string, _t: RefParts) => Promise.resolve(first[0] ?? dto({})),
        override: (_c: string, _t: RefParts, _a: OverrideAction) => Promise.resolve(first[0] ?? dto({})),
    };
}

// A fresh QueryClient per story tree — no retry/refetch so fixture data is deterministic.
function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, refetchOnWindowFocus: false, gcTime: Infinity },
        },
    });
}

/**
 * Wraps a story in a fresh QueryClient (CompositionCalendar uses react-query internally for
 * the aggregate provenance-calendar fetch). A fresh client per mount keeps stories isolated
 * (Storybook remounts on args change).
 */
export function WithQuery({ children }: { children: ReactNode }) {
    const queryClient = useMemo(makeQueryClient, []);
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/** A demo edit-panel chrome slot — proves the host `renderEditPanel` injection point renders. */
export function demoEditPanel(ctx: { event?: { title?: string } | null; mode?: string; close?: () => void }): ReactNode {
    return (
        <div className="rounded-md border border-border bg-card p-3 text-sm" role="dialog" aria-label="Event detail">
            <button type="button" className="text-muted-foreground" onClick={ctx.close}>
                Close
            </button>
            <div className="font-medium text-foreground">{ctx.event?.title ?? 'New release'}</div>
            <div className="text-xs text-muted-foreground">{ctx.mode}</div>
        </div>
    );
}
