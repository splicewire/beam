import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
    CompositionCalendar,
    createAggregateClient,
    createSingleClient,
    decodeRef,
    encodeRef,
    isResidentRef,
    toFoundationEvent,
    type CalendarEventData,
    type CalendarTransport,
} from '../src/index';

/**
 * The isolation bar (rehome-ui §8a): CompositionCalendar mounts off PLAIN
 * `CalendarEventData` fixtures — no Laravel, no app context, no `@/`, and no direct RBC
 * import. Asserts both adapters route writes correctly (aggregate by owning calendar) and the
 * four renderX slots receive the right props. The single-instance-React recipe (vitest.config)
 * carries the foundation's RBC portals.
 */

beforeAll(() => {
    if (!('ResizeObserver' in globalThis)) {
        globalThis.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        } as unknown as typeof ResizeObserver;
    }
});

const MONTH = new Date(2026, 6, 15);

function dto(over: Partial<CalendarEventData> = {}): CalendarEventData {
    return {
        cell_id: 'cell-1',
        channel: 'default',
        kind: 'composition-ref',
        anchor: '2026-07-15',
        composition_id: 'ref-x',
        series_ref: null,
        recurrence_id: null,
        virtual: false,
        title: 'Weekly Digest #24',
        status: 'approved',
        ...over,
    };
}

function fakeTransport(over: Partial<CalendarTransport> = {}): CalendarTransport {
    const byCal: Record<string, CalendarEventData[]> = {
        'cal-a': [dto({ cell_id: 'a1', title: 'A · Digest' })],
        'cal-b': [dto({ cell_id: 'b1', title: 'B · Blog' })],
        'cal-x': [dto({ cell_id: 'x1', title: 'X · Single' })],
    };
    return {
        listCalendars: () =>
            Promise.resolve([
                { id: 'cal-a', title: 'Calendar A' },
                { id: 'cal-b', title: 'Calendar B' },
            ]),
        listEvents: (cid) => Promise.resolve(byCal[cid] ?? []),
        reAnchor: vi.fn(() => Promise.resolve()),
        createRelease: vi.fn(() => Promise.resolve(dto())),
        editCell: vi.fn(() => Promise.resolve()),
        materialize: vi.fn(() => Promise.resolve(dto())),
        override: vi.fn(() => Promise.resolve(dto())),
        ...over,
    };
}

function withQuery(children: ReactNode) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

// ── The ref + resident codec ──────────────────────────────────────────────────────

describe('ref + resident codec', () => {
    it('round-trips a resident cell and a non-resident occurrence', () => {
        const resident = { compositionId: 'cal-a', cellId: 'cell-1', seriesRef: null, recurrenceId: null };
        const virtual = { compositionId: 'cal-a', cellId: null, seriesRef: 'ser-9', recurrenceId: '2026-07-22' };

        expect(decodeRef(encodeRef(resident))).toEqual(resident);
        expect(decodeRef(encodeRef(virtual))).toEqual(virtual);
        expect(isResidentRef(encodeRef(resident))).toBe(true);
        expect(isResidentRef(encodeRef(virtual))).toBe(false);
    });
});

// ── DTO → FoundationCalendarEvent mapping ───────────────────────────────────────────

describe('projection DTO → FoundationCalendarEvent', () => {
    it('maps residence, the routable owning calendar, a resolved colour, and the meta bag', () => {
        const event = toFoundationEvent(dto({ virtual: true, cell_id: null, series_ref: 'ser-9', recurrence_id: '2026-07-22' }), 'cal-a', () => 'violet');

        expect(event.resident).toBe(false);
        expect(event.compositionId).toBe('cal-a'); // owning calendar (routable), not the referenced composition
        expect(event.colorToken).toBe('violet');
        expect(event.allDay).toBe(true);
        expect(decodeRef(event.ref)).toMatchObject({ compositionId: 'cal-a', seriesRef: 'ser-9', recurrenceId: '2026-07-22' });
        expect(event.meta).toMatchObject({ status: 'approved', referencedCompositionId: 'ref-x' });
    });
});

// ── Client adapters: both route writes correctly ────────────────────────────────────

describe('client adapters route writes by composition', () => {
    it('aggregate merges all calendars and routes a write to the OWNING calendar', async () => {
        const reAnchor = vi.fn(() => Promise.resolve());
        const transport = fakeTransport({ reAnchor });
        const client = createAggregateClient(transport);

        const events = await client.listEvents();
        expect(events.map((e) => e.compositionId).sort()).toEqual(['cal-a', 'cal-b']);

        const evB = events.find((e) => e.compositionId === 'cal-b')!;
        await client.reAnchor(evB.ref, new Date(2026, 6, 22));

        expect(reAnchor).toHaveBeenCalledWith('cal-b', expect.objectContaining({ compositionId: 'cal-b', cellId: 'b1' }), expect.any(Date));
    });

    it('single fixes one calendar and routes writes to it', async () => {
        const editCell = vi.fn(() => Promise.resolve());
        const transport = fakeTransport({ editCell });
        const client = createSingleClient(transport, 'cal-x');

        const events = await client.listEvents();
        expect(events).toHaveLength(1);
        expect(events[0].compositionId).toBe('cal-x');

        await client.editCell(events[0].ref, { title: 'edited' });
        expect(editCell).toHaveBeenCalledWith('cal-x', expect.objectContaining({ compositionId: 'cal-x', cellId: 'x1' }), { title: 'edited' });
    });
});

// ── §8a: both mounts render off pure fixtures with the right renderX ─────────────────

describe('CompositionCalendar mounts (aggregate + single)', () => {
    it('aggregate: merges calendars, renders provenance/status facets + event badges, routes clicks by residence', async () => {
        const renderEditPanel = vi.fn((ctx) => <div data-testid="panel">{ctx.mode}</div>);
        render(
            withQuery(
                <CompositionCalendar
                    mount="aggregate"
                    transport={fakeTransport()}
                    renderEditPanel={renderEditPanel}
                    defaultDate={MONTH}
                />,
            ),
        );

        // Merged events from both calendars render (renderEventBadge → title bars).
        await waitFor(() => expect(screen.getByText('A · Digest')).toBeDefined());
        expect(screen.getByText('B · Blog')).toBeDefined();

        // renderFilters (aggregate only): provenance chips (calendar labels) + status chips.
        expect(screen.getByRole('button', { name: 'Calendar A' })).toBeDefined();
        expect(screen.getByRole('button', { name: 'approved' })).toBeDefined();

        // Clicking a resident event opens the host panel in resident-edit mode.
        fireEvent.click(screen.getByText('A · Digest'));
        await waitFor(() => expect(renderEditPanel).toHaveBeenCalledWith(expect.objectContaining({ mode: 'resident-edit' })));
    });

    it('single: scopes to one calendar and renders NO provenance facets', async () => {
        const renderEditPanel = vi.fn((ctx) => <div>{ctx.mode}</div>);
        render(
            withQuery(
                <CompositionCalendar
                    mount="single"
                    compositionId="cal-x"
                    transport={fakeTransport()}
                    renderEditPanel={renderEditPanel}
                    defaultDate={MONTH}
                />,
            ),
        );

        await waitFor(() => expect(screen.getByText('X · Single')).toBeDefined());
        // The single mount has no aggregate facets.
        expect(screen.queryByRole('button', { name: 'Calendar A' })).toBeNull();
    });

    it('routes a non-resident occurrence click to reference mode', async () => {
        const renderEditPanel = vi.fn((ctx) => <div>{ctx.mode}</div>);
        const transport = fakeTransport({
            listEvents: (cid) =>
                Promise.resolve(
                    cid === 'cal-x'
                        ? [dto({ cell_id: null, virtual: true, series_ref: 'ser-9', recurrence_id: '2026-07-20', anchor: '2026-07-20', title: 'Virtual #26' })]
                        : [],
                ),
        });
        render(
            withQuery(
                <CompositionCalendar mount="single" compositionId="cal-x" transport={transport} renderEditPanel={renderEditPanel} defaultDate={MONTH} />,
            ),
        );

        await waitFor(() => expect(screen.getByText('Virtual #26')).toBeDefined());
        fireEvent.click(screen.getByText('Virtual #26'));
        await waitFor(() => expect(renderEditPanel).toHaveBeenCalledWith(expect.objectContaining({ mode: 'reference' })));
    });

    it('renders per-lane headers when multi-channel', async () => {
        render(
            withQuery(
                <CompositionCalendar
                    mount="single"
                    compositionId="cal-x"
                    transport={fakeTransport()}
                    lanes={[
                        { id: 'default', label: 'Default' },
                        { id: 'social', label: 'Social' },
                    ]}
                    defaultDate={MONTH}
                />,
            ),
        );

        await waitFor(() => expect(screen.getByText('Social')).toBeDefined());
    });
});
