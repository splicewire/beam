import { createMessages, type ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import catalog from '../../messages.default.json';
import { relativeWhen } from '../takes/TakesStrip.js';
import { layoutTimeline, type OtioTimeline } from './otio.js';
import { TimelineWidget } from './TimelineWidget.js';

// node-actions-and-takes 04/06/08a amend: copy the timeline's OTIO reader throws and the takes strip's time helper
// returns (the ratchet cannot see either) reads the reader's catalog; the thrown line's message stays English for logs.
afterEach(cleanup);
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: {
        'splicewire-beam-ux::messages.timeline_clip_no_rate': { text: 'El clip ":name" de ":track" no tiene tasa.', sourceLocale: 'es' },
        'splicewire-beam-ux::messages.takes_minutes_ago': { text: 'hace :minutes min', sourceLocale: 'es' },
    },
};
// One lead lane whose only clip has a duration without a rate.
const broken = {
    OTIO_SCHEMA: 'Timeline.1',
    name: 'Fixture',
    tracks: {
        children: [
            {
                OTIO_SCHEMA: 'Track.1',
                name: 'Lead',
                children: [{ OTIO_SCHEMA: 'Clip.2', name: 'clip-a', source_range: { start_time: { value: 0, rate: 1 }, duration: { value: 2 } } }],
            },
        ],
    },
} as unknown as OtioTimeline;

it('renders an unreadable OTIO time in the reader\'s locale, and in English without one', () => {
    render(<MessageProvider value={spanish}><TimelineWidget value={broken} /></MessageProvider>);
    expect(screen.getByRole('alert').textContent).toBe('El clip "clip-a" de "Lead" no tiene tasa.');
    cleanup();

    render(<TimelineWidget value={broken} />);
    expect(screen.getByRole('alert').textContent).toBe('Clip "clip-a" on "Lead" has no rate, so its time cannot be read.');
    expect(() => layoutTimeline(broken)).toThrow('Clip "clip-a" on "Lead" has no rate, so its time cannot be read.');
});

it('says how long ago a take was in the messages it is given, English by default', () => {
    const now = Date.parse('2026-11-15T12:00:00Z');
    expect(relativeWhen('2026-11-15T11:57:00Z', now, createMessages(catalog.messages, { catalog: spanish }))).toBe('hace 3 min');
    expect(relativeWhen('2026-11-15T11:57:00Z', now)).toBe('3m ago');
});
