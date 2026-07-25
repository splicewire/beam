import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent, expect } from 'storybook/test';
import { CompositionCalendar } from './CompositionCalendar';
import {
    ANCHOR,
    DEMO_CALENDARS,
    DEMO_LANES,
    WithQuery,
    createMockTransport,
    demoEditPanel,
} from './story-harness';

/**
 * Calendar/CompositionCalendar (component-seams ticket 27). The ONE vocab-aware calendar
 * SATELLITE component — mounted twice (aggregate + single). It binds the source-blind
 * `@schemastud/big-calendar` foundation (storied separately under `BigCalendar/*`, ticket 22)
 * into the composition world: it maps the `@splicewire/_resources` slice-05 projection DTO
 * into `FoundationCalendarEvent`, resolves the per-mount hue axis (single = Kind, aggregate =
 * provenance/owning-calendar), encodes the write-target `ref`, and injects the vocab renderX
 * chrome (event badge, provenance/status facets, lane headers — storied standalone under
 * `Calendar/Chrome`, ticket 23). It NEVER imports react-big-calendar.
 *
 * The two mounts differ ONLY in the injected `client` adapter + the aggregate-only provenance
 * facets — so this single component, given `mount="aggregate"` vs `mount="single"`, IS the
 * catalog's central axis. Rendered here over the workbench's in-memory injection
 * (`story-harness`): a mock `CalendarTransport` serving a fixed July-2026 DTO corpus per
 * calendar, a fresh QueryClient, and big-calendar's `theme.css` + RBC base CSS (imported by
 * the harness) so the composed grid renders skinned.
 *
 * TREATMENT axes (treatment-axes.md). `CompositionCalendarProps` exposes a component-defined
 * **variant** = the two mounts (`aggregate`/`single`) — the satellite's keystone axis, so it
 * dominates. **states** covers `populated` (Aggregate/Single) / `empty` / `loading` (the
 * never-resolving transport → the foundation's `data-loading`). The month/agenda view fork
 * lives on the foundation (RBC `views`) and is catalogued under `BigCalendar/Surface`; the
 * satellite adds the AgendaView story to show the composed events surviving the view switch.
 * A **lanes** story exercises the channels-as-lanes multi-lane branch + the satellite's
 * `renderLaneHeader` chrome. A **viewport** story renders the composed grid at mobile width.
 * Per the rule of sanction, `CompositionCalendarProps` exposes no `size`/`tone`/`density`, so
 * those are absent-not-a-gap.
 *
 * Ambient token + light⊗dark are wired globally by the beam workbench (ticket 23's `.storybook`
 * preview + `colorScheme` toolbar; the `--beam-*` → semantic → Tailwind ladder, dark seed
 * mirrored from the app). **HONEST HEX NOTE (mirrors ticket 22 + ticket 15's Frame hex):** the
 * composed surface CHROME (grid/toolbar/today/borders) reads big-calendar `theme.css` `--rbc-*`
 * vars that fall back to SEMANTIC tokens, so it re-skins correctly under `.dark`. TWO
 * self-contained-hex sources do NOT re-skin: (1) big-calendar's `--rbc-hue-*` EVENT-BAR palette
 * (the vendored RBC theme, recorded in ticket 22), and (2) beam-calendar's OWN `EventBadge`
 * status-dot tones in `chrome.tsx` (`bg-emerald-500`/`bg-sky-500`/… — fixed-lightness palette
 * utilities, not tokens). Both are pre-existing token-debt for ticket 32 — recorded here, not
 * fixed in this ticket. The rest of the satellite chrome (lane header, facet chips) is semantic
 * and re-skins correctly.
 */
// `component` is intentionally omitted from Meta: CompositionCalendar's required props
// (`transport`, and `compositionId` for single) would otherwise make Storybook demand an
// `args` object on every render-only story. Each story supplies the full component via
// `render` instead (the ticket-22 `BigCalendar/Calendar` precedent).
const meta = {
    title: 'Calendar/CompositionCalendar',
    parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// A fixed grid height so a VR baseline is deterministic (the runtime default is
// viewport-relative, which VR-shifts with window size).
const GRID_HEIGHT = 560;

/**
 * variant = aggregate + state = populated (the flagship catalog view). Every calendar-profile
 * Composition is fetched and MERGED into one grid; hue = provenance (owning calendar), so each
 * calendar's events read as one colour family. The aggregate-only provenance/status **facets**
 * render above the grid (the injected `renderFilters` chrome). `play`-awaits a settled event
 * title so a VR baseline captures the populated grid, never the loading flash.
 */
export const Aggregate: Story = {
    render: () => (
        <WithQuery>
            <CompositionCalendar
                mount="aggregate"
                transport={createMockTransport()}
                calendars={DEMO_CALENDARS}
                renderEditPanel={demoEditPanel}
                defaultDate={ANCHOR}
                height={GRID_HEIGHT}
            />
        </WithQuery>
    ),
    play: async ({ canvasElement }) => {
        await within(canvasElement).findByText('Launch: Summer Drop');
    },
};

/**
 * variant = single + state = populated (the Studio mount). One calendar, fixed by
 * `compositionId`; hue = Kind (status is secondary chrome via the badge dot). No provenance
 * facets in this mount (single-calendar → nothing to filter by owner).
 */
export const Single: Story = {
    render: () => (
        <WithQuery>
            <CompositionCalendar
                mount="single"
                compositionId="cal-marketing"
                transport={createMockTransport()}
                renderEditPanel={demoEditPanel}
                defaultDate={ANCHOR}
                height={GRID_HEIGHT}
            />
        </WithQuery>
    ),
    play: async ({ canvasElement }) => {
        await within(canvasElement).findByText('Launch: Summer Drop');
    },
};

/**
 * view fork = agenda — the composed events survive the foundation's month→agenda view switch
 * (RBC `views={[MONTH, AGENDA]}`, owned by the foundation; catalogued here on the SINGLE mount
 * to show the mapped DTOs render as agenda rows). Switched via the toolbar in `play`.
 */
export const AgendaView: Story = {
    render: () => (
        <WithQuery>
            <CompositionCalendar
                mount="single"
                compositionId="cal-marketing"
                transport={createMockTransport()}
                defaultDate={ANCHOR}
                height={GRID_HEIGHT}
            />
        </WithQuery>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await canvas.findByText('Launch: Summer Drop');
        await userEvent.click(await canvas.findByRole('button', { name: /agenda/i }));
        await canvas.findAllByText('Launch: Summer Drop');
    },
};

/**
 * lanes — the channels-as-lanes axis (`lanes.length > 1` groups events into RBC resource
 * columns) with the satellite's injected `renderLaneHeader` chrome painting each channel
 * label. Exercises the multi-lane branch of the composed surface (single mount for a stable
 * two-lane fixture).
 */
export const Lanes: Story = {
    render: () => (
        <WithQuery>
            <CompositionCalendar
                mount="single"
                compositionId="cal-marketing"
                transport={createMockTransport()}
                lanes={DEMO_LANES}
                defaultDate={ANCHOR}
                height={GRID_HEIGHT}
            />
        </WithQuery>
    ),
    play: async ({ canvasElement }) => {
        await within(canvasElement).findByText('#marketing');
    },
};

/**
 * state = empty — the bare composed month grid (the transport serves no events for any
 * calendar). Proves the satellite's empty rendering (grid + toolbar, no event bars).
 */
export const Empty: Story = {
    render: () => (
        <WithQuery>
            <CompositionCalendar
                mount="single"
                compositionId="cal-marketing"
                transport={createMockTransport({ eventsByCalendar: {} })}
                defaultDate={ANCHOR}
                height={GRID_HEIGHT}
            />
        </WithQuery>
    ),
    play: async ({ canvasElement }) => {
        await within(canvasElement).findByText(/July 2026/i);
        await expect(within(canvasElement).queryByText('Launch: Summer Drop')).toBeNull();
    },
};

/**
 * state = loading — the injected transport's `listEvents` never resolves, so the foundation's
 * query stays pending and the surface carries its `data-loading` attribute over an event-less
 * grid. (The composed satellite loads exactly as the foundation does — its client is the
 * transport wrapper.)
 */
export const Loading: Story = {
    render: () => (
        <WithQuery>
            <CompositionCalendar
                mount="single"
                compositionId="cal-marketing"
                transport={createMockTransport({ loading: true })}
                defaultDate={ANCHOR}
                height={GRID_HEIGHT}
            />
        </WithQuery>
    ),
    play: async ({ canvasElement }) => {
        const surface = canvasElement.querySelector('.rbc-surface');
        await expect(surface).toHaveAttribute('data-loading');
    },
};

/**
 * viewport = mobile — the composed month grid at a narrow width (the calendar is a
 * viewport-sensitive structure surface; the grid + toolbar reflow at mobile1).
 */
export const Mobile: Story = {
    parameters: { viewport: { defaultViewport: 'mobile1' } },
    render: () => (
        <WithQuery>
            <CompositionCalendar
                mount="single"
                compositionId="cal-marketing"
                transport={createMockTransport()}
                defaultDate={ANCHOR}
                height={GRID_HEIGHT}
            />
        </WithQuery>
    ),
    play: async ({ canvasElement }) => {
        await within(canvasElement).findByText('Launch: Summer Drop');
    },
};
