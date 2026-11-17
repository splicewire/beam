import { createMessages } from '@schemastud/messages';
import { useMessages } from '@schemastud/messages/react';
import catalog from '../messages.default.json';

/** English defaults for module-level copy that is read outside a render (static helpers, manifests). */
export const englishBeamCalendarMessages = createMessages(catalog.messages);

/**
 * The messages object a non-hook helper takes; callers in a render pass the reader's. Spelled from the English object so
 * the published declarations carry the key union and never name the JSON catalog binding.
 */
export type BeamCalendarMessages = typeof englishBeamCalendarMessages;

/** One of beam-calendar's catalog keys. */
export type BeamCalendarMessageKey = Parameters<BeamCalendarMessages['t']>[0];

/** beam-calendar's package defaults on the host's one message provider (no second provider); English without one. */
export const useBeamCalendarMessages = (): BeamCalendarMessages => useMessages(catalog.messages);
