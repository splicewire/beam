import { createMessages } from '@schemastud/messages';
import { useMessages } from '@schemastud/messages/react';
import catalog from '../messages.default.json';

/** English defaults for module-level copy that is read outside a render (static helpers, manifests). */
export const englishBeamIntakeMessages = createMessages(catalog.messages);

/**
 * The messages object a non-hook helper takes; callers in a render pass the reader's. Spelled from the English object so
 * the published declarations carry the key union and never name the JSON catalog binding.
 */
export type BeamIntakeMessages = typeof englishBeamIntakeMessages;

/** One of beam-intake's catalog keys. */
export type BeamIntakeMessageKey = Parameters<BeamIntakeMessages['t']>[0];

/** beam-intake's package defaults on the host's one message provider (no second provider); English without one. */
export const useBeamIntakeMessages = (): BeamIntakeMessages => useMessages(catalog.messages);
