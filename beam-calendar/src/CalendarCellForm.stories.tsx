import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect, fn } from 'storybook/test';
import { CalendarCellForm } from './CalendarCellForm';
import { CalendarCellFormProvider } from './cell-provider';
import type {
    CalendarCell,
    CalendarCellClient,
    CalendarCellFormServices,
    CellContentPickerProps,
} from './cell-types';
import { WithQuery } from './story-harness';

/**
 * Calendar/CalendarCellForm (frame-canonical-forms ticket 27→02). The rehomed purpose-built
 * calendar item editor — a pre-packaged, DTO-first data-surface (rehome-ui / ADR-0116) typed off
 * the `@splicewire/_resources` CompositionCell DTO. It replaces the raw JSON-schema cell dump with
 * intuitive controls, posting the exact same `slots` to the same endpoints via the INJECTED client.
 * Rendered here over an in-memory `CalendarCellClient` + a demo content-picker slot (the four-kind
 * injection: `client` REQUIRED / `notify` / `renderContentPicker` renderX / no `subscribe`).
 *
 * TREATMENT axes (treatment-axes.md). The form's component-defined **variant** = its two Kinds
 * (`release` = one-off, `series` = recurring) — the keystone axis. **states** covers `create`
 * (a fresh cell, the Kind toggle shown) vs `edit` (an existing resident cell, Kind pinned). The
 * multi-channel branch (`showChannel`) surfaces the SimpleSelect lane picker — its own story. Per
 * the rule of sanction the form exposes no size/tone/density, so those are absent-not-a-gap. Ambient
 * token + light⊗dark are wired globally by the beam workbench.
 */

// ── A pure CompositionCell fixture (the projection DTO, slots as the object map) ────────
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
        compositionId: 'cal-demo',
        createdAt: null,
        updatedAt: null,
        children: null,
        ...over,
    };
}

/** An in-memory client — the host `client` seam; writes resolve, reads serve the demo corpus. */
function demoClient(over: Partial<CalendarCellClient> = {}): CalendarCellClient {
    return {
        listCells: () =>
            Promise.resolve([
                cell({ id: 'c1', slots: { kind: 'https://schemas.test/kind/composition-ref', channel: 'default' } }),
                cell({ id: 'c2', slots: { kind: 'https://schemas.test/kind/composition-ref', channel: 'social' } }),
            ]),
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
        saveCell: fn(() => Promise.resolve()),
        ...over,
    };
}

/** The demo content-picker slot (the app injects its real ContentPicker over a combobox here). */
function demoPicker(props: CellContentPickerProps) {
    return (
        <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm hover:bg-muted/50"
            onClick={() => props.onSelect({ id: 'picked-comp', title: 'Summer Drop teaser' })}
        >
            {props.value ? 'Summer Drop teaser' : 'Choose content to publish…'}
        </button>
    );
}

function services(over: Partial<CalendarCellFormServices> = {}): CalendarCellFormServices {
    return {
        client: demoClient(),
        notify: fn(),
        renderContentPicker: demoPicker,
        ...over,
    };
}

const meta = {
    title: 'Calendar/CalendarCellForm',
    parameters: { layout: 'centered' },
    decorators: [
        (Story) => (
            <WithQuery>
                <div className="w-[28rem] max-w-full">
                    <Story />
                </div>
            </WithQuery>
        ),
    ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** variant = release + state = create (the flagship: the Kind toggle + content picker + date). */
export const CreateRelease: Story = {
    render: () => (
        <CalendarCellFormProvider services={services({ client: demoClient({ listCells: () => Promise.resolve([]) }) })}>
            <CalendarCellForm compositionId="cal-demo" initialDate={new Date(2026, 6, 20)} onSaved={() => {}} />
        </CalendarCellFormProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // The Kind toggle is present on create; picking content clears the validation error.
        await userEvent.click(await canvas.findByRole('button', { name: /Choose content/i }));
        await userEvent.click(canvas.getByRole('button', { name: 'Schedule release' }));
    },
};

/** variant = release + state = edit (an existing resident cell — the Kind is pinned, Save shown). */
export const EditRelease: Story = {
    render: () => (
        <CalendarCellFormProvider services={services()}>
            <CalendarCellForm compositionId="cal-demo" initialCell={cell()} onSaved={() => {}} />
        </CalendarCellFormProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(await canvas.findByRole('button', { name: 'Save' })).toBeInTheDocument();
    },
};

/** variant = series + state = create (the recurrence builder: repeats / ends / each-occurrence). */
export const CreateSeries: Story = {
    render: () => (
        <CalendarCellFormProvider services={services({ client: demoClient({ listCells: () => Promise.resolve([]) }) })}>
            <CalendarCellForm compositionId="cal-demo" initialDate={new Date(2026, 6, 20)} onSaved={() => {}} />
        </CalendarCellFormProvider>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(await canvas.findByRole('button', { name: 'Recurring' }));
        await expect(canvas.getByText('Repeats')).toBeInTheDocument();
    },
};

/** states = multi-channel: >1 placed channel surfaces the SimpleSelect lane picker. */
export const MultiChannel: Story = {
    render: () => (
        <CalendarCellFormProvider services={services()}>
            <CalendarCellForm compositionId="cal-demo" initialCell={cell()} onSaved={() => {}} />
        </CalendarCellFormProvider>
    ),
};
