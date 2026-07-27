import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
    DefaultFormBody,
    FrameProvider,
    createFormResolver,
    createFormIntentBus,
    type FormBodySlotProps,
    type FrameInjection,
    type Row,
    type SchemaNode,
} from '@schemastud/frame';
import { describe, expect, it, vi } from 'vitest';
import {
    CalendarCellForm,
    CalendarCellFormProvider,
    type CalendarCell,
    type CalendarCellClient,
    type CalendarCellFormServices,
    type SaveCellInput,
} from '../src/index';

/**
 * The resolver bar (frame-canonical-forms ticket 03) — the isolation proof that the rehomed cell
 * form renders THROUGH `@schemastud/frame`'s `DefaultFormBody` → form resolver, with NO app. This is
 * the twin of the app's prod wiring: a FrameInjection whose `formResolver` registers the cell form
 * against its `composition-ref` / `series` kinds, and a `DefaultFormBody` handed a schema whose `$id`
 * terminates in `composition-ref` + a cell record as `formData`. If DefaultFormBody mounts the
 * bespoke form (not a generic schema dump) and its injected client saves, the seam is proven.
 */

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
        listProfiles: () =>
            Promise.resolve([
                {
                    name: 'calendar',
                    cellKinds: [
                        { kind: 'https://schemas.test/kind/composition-ref' },
                        { kind: 'https://schemas.test/kind/series' },
                    ],
                },
            ]),
        saveCell: vi.fn(() => Promise.resolve()),
        ...over,
    };
}

/** The FormBodySlotProps adapter — the same shape the app root + story-harness register. */
function CellFormBody({ formData, onSubmit }: FormBodySlotProps) {
    const record = formData as unknown as CalendarCell & { compositionId?: string };
    return (
        <CalendarCellForm
            compositionId={String(record?.compositionId ?? 'cal-x')}
            initialCell={record?.id ? record : null}
            onSaved={() => onSubmit(formData)}
        />
    );
}

/** A Frame host whose resolver maps the two calendar cell kinds to the bespoke form. */
function frameInjection(): FrameInjection {
    const formResolver = createFormResolver();
    formResolver.registerFormForSchema('series', CellFormBody);
    formResolver.registerFormForSchema('composition-ref', CellFormBody);
    // Only `formResolver` is reached on DefaultFormBody's canonical path.
    return { formResolver } as unknown as FrameInjection;
}

function mountThroughResolver(services: CalendarCellFormServices, kindUrl: string, formData: Row) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={qc}>
            <CalendarCellFormProvider services={services}>
                <FrameProvider value={frameInjection()}>
                    <DefaultFormBody
                        schema={{ $id: kindUrl, type: 'object' } as SchemaNode}
                        formData={formData}
                        intentBus={createFormIntentBus()}
                        readOnly={false}
                        form="bare"
                        onChange={() => {}}
                        onSubmit={() => {}}
                    />
                </FrameProvider>
            </CalendarCellFormProvider>
        </QueryClientProvider>,
    );
}

describe('CalendarCellForm — resolves through frame DefaultFormBody', () => {
    it('DefaultFormBody consults the resolver and mounts the bespoke form (not a generic dump)', async () => {
        const services: CalendarCellFormServices = {
            client: fakeClient(),
            renderContentPicker: (p) => <button type="button" onClick={() => p.onSelect({ id: 'x', title: 'X' })}>pick</button>,
        };

        mountThroughResolver(services, 'https://schemas.test/kind/composition-ref', cell() as unknown as Row);

        // The bespoke editor's chrome — the pinned "One-off release" chip + Save button — proves the
        // resolver picked CalendarCellForm rather than falling through to the generic SchemaForm.
        expect(await screen.findByText(/One-off release/i)).toBeDefined();
        expect(await screen.findByRole('button', { name: 'Save' })).toBeDefined();
    });

    it('a save from the resolved form flows through the injected client', async () => {
        const saveCell = vi.fn((_c: string, _i: SaveCellInput) => Promise.resolve());
        const services: CalendarCellFormServices = {
            client: fakeClient({ saveCell }),
            renderContentPicker: (p) => <button type="button" onClick={() => p.onSelect({ id: 'x', title: 'X' })}>pick</button>,
        };

        mountThroughResolver(services, 'https://schemas.test/kind/composition-ref', cell() as unknown as Row);

        const save = await screen.findByRole('button', { name: 'Save' });
        await waitFor(() => expect(services.client.listProfiles).toBeDefined());
        fireEvent.click(save);

        await waitFor(() => expect(saveCell).toHaveBeenCalled());
        const [compId, input] = saveCell.mock.calls[0];
        expect(compId).toBe('cal-x');
        expect(input.cellId).toBe('cell-1');
        expect(input.slots.kind).toBe('https://schemas.test/kind/composition-ref');
    });
});
