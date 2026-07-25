import type { FoundationCalendarEvent } from '@schemastud/big-calendar';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { EventBadge, Filters, LaneHeader, type FacetState } from './chrome';

/**
 * Calendar/Chrome (component-seams ticket 23's stand-up smoke, EXTENDED to the full
 * ticket-13 axes by ticket 27). The vocab-aware `renderX` chrome the calendar satellite
 * injects into the source-blind `@schemastud/big-calendar` foundation (PRD §4/§5/§7) — the
 * pieces `CompositionCalendar` (`Calendar/CompositionCalendar`, ticket 27) hands to the
 * foundation's chrome slots: `EventBadge` (renderEventBadge), `LaneHeader` (renderLaneHeader),
 * `Filters` (renderFilters, aggregate only). Catalogued standalone here (self-contained — a
 * `FoundationCalendarEvent` fixture is the only input, no provider needed) so the chrome is
 * visible in the catalog independent of the composed grid.
 *
 * TREATMENT axes (treatment-axes.md). `EventBadge` is a **states/tone** surface driven by the
 * editorial `status` — catalogued across every status via the `AllStatuses` matrix, plus the
 * series-occurrence branch (`SeriesBadge`, the Repeat glyph). `Filters` is a **states** surface
 * (a chip's pressed vs. unpressed state). `LaneHeader` is a single label (no capability axis).
 * Per the rule of sanction, none of the three exposes `variant`/`size`/`density`, so those are
 * absent-not-a-gap.
 *
 * Ambient token + light⊗dark are wired globally by the beam workbench (ticket 23's `.storybook`
 * preview + `colorScheme` toolbar). **HONEST HEX NOTE (mirrors ticket 22 + ticket 15's Frame
 * hex):** most of this chrome is semantic and re-skins under `.dark` — the badge title,
 * `LaneHeader` (`text-muted-foreground`), and the facet chips (`border-border`/`bg-foreground`/
 * `text-background`/`bg-muted`/`bg-background`). The ONE exception is `EventBadge`'s status DOT:
 * `chrome.tsx#STATUS_TONE` maps each status to a fixed-lightness Tailwind palette utility
 * (`bg-emerald-500`/`bg-sky-500`/`bg-amber-500`/`bg-slate-400`/`bg-slate-300`), NOT a semantic
 * token — so the status dots read identically in light and dark. That is a pre-existing property
 * (token-debt for ticket 32), recorded here, not fixed in this ticket.
 */

/** A minimal FoundationCalendarEvent fixture — only the fields the chrome reads matter. */
function makeEvent(overrides: Partial<FoundationCalendarEvent> & { meta?: Record<string, unknown> }): FoundationCalendarEvent {
    return {
        id: 'evt-1',
        title: 'Untitled event',
        start: new Date('2026-07-25T00:00:00Z'),
        end: new Date('2026-07-25T00:00:00Z'),
        allDay: true,
        compositionId: 'comp-1',
        laneId: 'lane-1',
        colorToken: 'green',
        resident: true,
        ref: 'ref-1',
        meta: { status: 'approved', kind: 'post', seriesRef: null },
        ...overrides,
    };
}

// `component` omitted so render-only matrix stories don't require an `args` object
// (the ticket-22 precedent). `Story` stays untyped-per-args; each story is self-contained.
const meta = {
    title: 'Calendar/Chrome',
    parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The status-dot + title badge, approved. */
export const Badge: Story = {
    render: () => <EventBadge event={makeEvent({ title: 'Launch announcement' })} />,
};

/** A series occurrence — the Repeat glyph appears alongside the status dot. */
export const SeriesBadge: Story = {
    render: () => (
        <EventBadge
            event={makeEvent({
                title: 'Weekly digest',
                meta: { status: 'generated', kind: 'newsletter', seriesRef: 'series-9' },
            })}
        />
    ),
};

/** states/tone matrix — every status dot side by side, so the (self-contained-hex) palette is visible across the axis. */
export const AllStatuses: Story = {
    render: () => (
        <div className="flex flex-col gap-2">
            {(['approved', 'generated', 'needs_review', 'stale', 'upcoming'] as const).map((status) => (
                <EventBadge
                    key={status}
                    event={makeEvent({ title: `Event — ${status}`, meta: { status, kind: 'post', seriesRef: null } })}
                />
            ))}
        </div>
    ),
};

/** The lane header label (semantic `text-muted-foreground` — re-skins under dark). */
export const Lane: Story = {
    render: () => <LaneHeader lane={{ id: 'lane-1', label: '#marketing' } as never} />,
};

/** The provenance/status facet chip group — pressed vs. unpressed both skinned by the seed (semantic, re-skins under dark). */
export const FacetFilters: Story = {
    render: function FacetFiltersStory() {
        const [active, setActive] = useState<FacetState>({
            statuses: new Set<string>(['approved']),
            calendars: new Set<string>(),
        });
        return (
            <Filters
                calendars={[
                    { id: 'c1', label: '#marketing' },
                    { id: 'c2', label: '#product' },
                ]}
                statuses={['approved', 'generated', 'needs_review']}
                active={active}
                onToggleCalendar={(id) =>
                    setActive((prev) => {
                        const calendars = new Set(prev.calendars);
                        calendars.has(id) ? calendars.delete(id) : calendars.add(id);
                        return { ...prev, calendars };
                    })
                }
                onToggleStatus={(status) =>
                    setActive((prev) => {
                        const statuses = new Set(prev.statuses);
                        statuses.has(status) ? statuses.delete(status) : statuses.add(status);
                        return { ...prev, statuses };
                    })
                }
            />
        );
    },
};
