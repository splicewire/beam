import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
    CalendarCellForm,
    CalendarCellFormProvider,
    type CalendarCell,
    type CalendarCellClient,
    type CalendarCellFormServices,
    type CellContentPickerProps,
    type CellNotifyMessage,
    type SaveCellInput,
} from '../src/index';

/**
 * The isolation bar (rehome-ui §8a) for the rehomed CalendarCellForm surface: it mounts off a PURE
 * generated-DTO fixture — no Laravel, no app context, no `@/`, no axios. A save must call the
 * INJECTED client with the right SaveCellInput DTO; feedback must go to the injected `notify`; the
 * content picker must render the injected `renderContentPicker` slot. The four-kind injection is
 * exercised end-to-end against an in-memory client.
 */

// A pure CompositionCell fixture (the projection DTO shape, slots narrowed to the object map).
function cell(over: Partial<CalendarCell> = {}): CalendarCell {
    return {
        id: 'cell-1',
        profile: 'calendar',
        lane: 'default',
        segment: 0,
        slots: { kind: 'https://schemas.test/kind/composition-ref', anchor: '2026-07-15', channel: 'default', composition_id: 'ref-comp-1' },
        output: null,
        status: 'stale',
        approvedAt: null,
        provenance: null,
        parentId: null,
        order: 0,
        compositionId: 'cal-x',
        createdAt: null,
        updatedAt: null,
        children: null,
        ...over,
    };
}

function fakeClient(over: Partial<CalendarCellClient> = {}): CalendarCellClient {
    return {
        listCells: () => Promise.resolve([cell()]),
        listProfiles: vi.fn(() =>
            Promise.resolve([
                {
                    name: 'calendar',
                    cellKinds: [
                        { kind: 'https://schemas.test/kind/composition-ref' },
                        { kind: 'https://schemas.test/kind/series' },
                    ],
                },
            ]),
        ),
        saveCell: vi.fn(() => Promise.resolve()),
        ...over,
    };
}

// The injected content-picker slot (host chrome) — a trivial button that selects a fixed id.
function pickerSlot(props: CellContentPickerProps): ReactNode {
    return (
        <button type="button" onClick={() => props.onSelect({ id: 'picked-comp', title: 'Picked Composition' })}>
            {props.value ? `content: ${props.value}` : 'pick content'}
        </button>
    );
}

function mount(services: CalendarCellFormServices, cellProps: Parameters<typeof CalendarCellForm>[0]) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={qc}>
            <CalendarCellFormProvider services={services}>
                <CalendarCellForm {...cellProps} />
            </CalendarCellFormProvider>
        </QueryClientProvider>,
    );
}

describe('CalendarCellForm — §8a isolation mount', () => {
    it('edits a resident Release: saves the right slots via the injected client + fires notify', async () => {
        const saveCell = vi.fn((_c: string, _i: SaveCellInput) => Promise.resolve());
        const notified: CellNotifyMessage[] = [];
        const onSaved = vi.fn();
        const services: CalendarCellFormServices = {
            client: fakeClient({ saveCell }),
            notify: (m) => notified.push(m),
            renderContentPicker: pickerSlot,
        };

        mount(services, { compositionId: 'cal-x', initialCell: cell(), onSaved });

        // Resident edit → the Save button (kind is fixed on an existing cell). Wait for the async
        // profile fetch so the form can resolve the short Kind suffix to its full schema-$id URL.
        const save = await screen.findByRole('button', { name: 'Save' });
        await waitFor(() => expect(services.client.listProfiles).toHaveBeenCalled());
        fireEvent.click(save);

        await waitFor(() => expect(saveCell).toHaveBeenCalled());
        const [compId, input] = saveCell.mock.calls[0];
        expect(compId).toBe('cal-x');
        expect(input.cellId).toBe('cell-1');
        // Behaviour-preserving: the release slots carry the resolved full-URL kind + the picked ref.
        expect(input.slots.kind).toBe('https://schemas.test/kind/composition-ref');
        expect(input.slots.composition_id).toBe('ref-comp-1');
        expect(input.slots.anchor).toBe('2026-07-15');

        await waitFor(() => expect(onSaved).toHaveBeenCalled());
        expect(notified).toContainEqual({ kind: 'success', text: 'Saved.' });
    });

    it('creates a one-off Release: validates missing content, then posts with the lane', async () => {
        const saveCell = vi.fn((_c: string, _i: SaveCellInput) => Promise.resolve());
        const services: CalendarCellFormServices = {
            client: fakeClient({ saveCell, listCells: () => Promise.resolve([]) }),
            renderContentPicker: pickerSlot,
        };

        mount(services, { compositionId: 'cal-x', initialDate: new Date(2026, 6, 20), onSaved: vi.fn() });

        // No content chosen yet → validation blocks the save.
        const schedule = await screen.findByRole('button', { name: 'Schedule release' });
        fireEvent.click(schedule);
        await waitFor(() => expect(screen.getByText('Choose the content to publish.')).toBeDefined());
        expect(saveCell).not.toHaveBeenCalled();

        // Pick content via the injected slot, then save.
        fireEvent.click(screen.getByRole('button', { name: 'pick content' }));
        fireEvent.click(screen.getByRole('button', { name: 'Schedule release' }));

        await waitFor(() => expect(saveCell).toHaveBeenCalled());
        const [, input] = saveCell.mock.calls[0];
        expect(input.cellId).toBeUndefined();
        expect(input.lane).toBe('default');
        expect(input.slots.composition_id).toBe('picked-comp');
        expect(input.slots.anchor).toBe('2026-07-20');
    });

    it('maps a 422 field error from the injected client onto the field', async () => {
        const services: CalendarCellFormServices = {
            client: fakeClient({
                saveCell: () => Promise.reject({ fieldErrors: { 'slots.content': ['That content is invalid.'] } }),
            }),
            renderContentPicker: pickerSlot,
        };

        mount(services, { compositionId: 'cal-x', initialCell: cell(), onSaved: vi.fn() });
        const save = await screen.findByRole('button', { name: 'Save' });
        await waitFor(() => expect(services.client.listProfiles).toHaveBeenCalled());
        fireEvent.click(save);
        await waitFor(() => expect(screen.getByText('That content is invalid.')).toBeDefined());
    });

    // J3 "plan the calendar" (launch-00 item 1): Tower emits DOTTED Kind ids (`kind.series`,
    // `kind.composition-ref`) since registry-kernel 58 D4. The form must read AND write them — the
    // existing fixtures above use the legacy URL form, which is exactly why the suite stayed green
    // while production (dotted) could create no repeating series. These feed the real dotted shape.
    const dottedCalendarProfiles = () =>
        vi.fn(() => Promise.resolve([{ name: 'calendar', cellKinds: [{ kind: 'kind.composition-ref' }, { kind: 'kind.series' }] }]));

    it('reads a Tower dotted-id series cell as a Recurring series, not a Release', async () => {
        const services: CalendarCellFormServices = {
            client: fakeClient({ listProfiles: dottedCalendarProfiles() }),
            renderContentPicker: pickerSlot,
        };
        mount(services, {
            compositionId: 'cal-x',
            initialCell: cell({ slots: { kind: 'kind.series', anchor: '2026-07-15', channel: 'default', rule: { freq: 'weekly' }, spawn: { mode: 'generate' } } }),
            onSaved: vi.fn(),
        });
        // The dotted `kind.series` id must be recognized as Series — today the `/`-only parse misreads
        // it as a one-off Release.
        expect(await screen.findByText('Recurring series')).toBeDefined();
        expect(screen.getByText('Repeats')).toBeDefined();
        expect(screen.queryByText('One-off release')).toBeNull();
    });

    it('creates a repeating series: posts Tower\'s dotted kind.series id, not the bare suffix', async () => {
        const saveCell = vi.fn((_c: string, _i: SaveCellInput) => Promise.resolve());
        const services: CalendarCellFormServices = {
            client: fakeClient({ saveCell, listCells: () => Promise.resolve([]), listProfiles: dottedCalendarProfiles() }),
            renderContentPicker: pickerSlot,
        };
        mount(services, { compositionId: 'cal-x', initialDate: new Date(2026, 6, 20), onSaved: vi.fn() });

        // Switch to Recurring (generate mode needs no content), wait for the profile list, then schedule.
        fireEvent.click(await screen.findByText('Recurring'));
        await waitFor(() => expect(services.client.listProfiles).toHaveBeenCalled());
        fireEvent.click(screen.getByRole('button', { name: 'Schedule series' }));

        await waitFor(() => expect(saveCell).toHaveBeenCalled());
        const [, input] = saveCell.mock.calls[0];
        // The wire must carry the resolved dotted id — today kindId() falls back to the bare 'series'
        // because `endsWith('kind/series')` never matches the dotted id, which Tower then rejects.
        expect(input.slots.kind).toBe('kind.series');
    });

    it('still reads a legacy URL-style series id as a Recurring series (both separators)', async () => {
        const services: CalendarCellFormServices = {
            client: fakeClient({
                listProfiles: vi.fn(() => Promise.resolve([{ name: 'calendar', cellKinds: [{ kind: 'https://schemas.test/kind/composition-ref' }, { kind: 'https://schemas.test/kind/series' }] }])),
            }),
            renderContentPicker: pickerSlot,
        };
        mount(services, {
            compositionId: 'cal-x',
            initialCell: cell({ slots: { kind: 'https://schemas.test/kind/series', anchor: '2026-07-15', channel: 'default', rule: { freq: 'weekly' }, spawn: { mode: 'generate' } } }),
            onSaved: vi.fn(),
        });
        expect(await screen.findByText('Recurring series')).toBeDefined();
    });
});
