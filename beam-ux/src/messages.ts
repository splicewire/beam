import { createMessages } from '@schemastud/messages';
import { useMessages } from '@schemastud/messages/react';
import catalog from '../messages.default.json';

/** English defaults for module-level copy that is read outside a render (static helpers, manifests). */
export const englishBeamUxMessages = createMessages(catalog.messages);

/**
 * The messages object a schema builder or other non-hook helper takes; callers in a render pass the reader's. Spelled
 * from the English object so the published declarations carry the key union and never name the JSON catalog binding.
 */
export type BeamUxMessages = typeof englishBeamUxMessages;

/** One of beam-ux's catalog keys. */
export type BeamUxMessageKey = Parameters<BeamUxMessages['t']>[0];

/** beam-ux's package defaults on the host's one message provider (no second provider); English without one. */
export const useBeamUxMessages = (): BeamUxMessages => useMessages(catalog.messages);
