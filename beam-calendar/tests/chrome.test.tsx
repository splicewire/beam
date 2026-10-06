import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventBadge, LaneHeader } from '../src/index';
import { Filters } from '../src/chrome';
import { STATUS_TONE } from '../src/chrome';

/**
 * beam VR pass 2: the `upcoming` dot (`bg-slate-300`) was invisible on light; a month chip at 320px
 * truncated to one letter because the badge's glyphs and single-line title had no theme hooks; the
 * lane legend was loose muted caption text.
 */
function badge(status: string, seriesRef?: string) {
    const event = {
        id: 'e1',
        title: 'Recurring: Weekly Digest',
        start: new Date(2026, 6, 15),
        end: new Date(2026, 6, 15),
        colorToken: 'violet',
        resident: false,
        ref: 'r',
        meta: { status, seriesRef, kind: 'series' },
    };
    return render(<EventBadge event={event as never} />).container;
}

describe('EventBadge', () => {
    it('draws upcoming as a hollow ring in the label ink, not a pale fill', () => {
        expect(STATUS_TONE.upcoming).toContain('border-current');
        expect(STATUS_TONE.upcoming).not.toMatch(/bg-slate-/);
        const dot = badge('upcoming').querySelector('[data-status="upcoming"]')!;
        expect(dot.className).toContain('border-current');
    });

    it('marks its glyphs and title with the big-calendar narrow-width hooks', () => {
        const root = badge('upcoming', 'series-1');
        expect(root.querySelectorAll('.rbc-event-glyph')).toHaveLength(2);
        expect(root.querySelector('.rbc-event-title')?.textContent).toBe('Recurring: Weekly Digest');
    });
});

describe('LaneHeader', () => {
    it('renders the lane as a legend chip in the foreground ink', () => {
        const { container } = render(<LaneHeader lane={{ id: 'l1', label: '#marketing' }} />);
        const chip = container.firstElementChild!;
        expect(chip.textContent).toBe('#marketing');
        expect(chip.className).toContain('rounded-full');
        expect(chip.className).toContain('text-foreground');
        expect(chip.className).not.toContain('text-muted-foreground');
    });
});

/** app-walkthrough APP-09b (APP-21, owner-07): the status facets and the event dot name a status in words, never its backing value. */
describe('status labels', () => {
    it('the status facet chips read as labels, not backing values', () => {
        const { container } = render(
            <Filters
                calendars={[]}
                statuses={['approved', 'generated', 'needs_review', 'stale', 'upcoming']}
                active={{ statuses: new Set(), calendars: new Set() }}
                onToggleCalendar={() => {}}
                onToggleStatus={() => {}}
            />,
        );
        const chips = [...container.querySelectorAll('[aria-label="Status"] button')].map((b) => b.textContent);
        expect(chips).toEqual(['Approved', 'Generated', 'Needs review', 'Stale', 'Upcoming']);
    });

    it('the event dot carries its status label for a pointer and a screen reader', () => {
        const dot = badge('needs_review').querySelector('[data-status]')!;
        expect(dot.getAttribute('title')).toBe('Needs review');
    });
});
