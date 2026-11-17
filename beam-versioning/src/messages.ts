import { createMessages } from '@schemastud/messages';
import { useMessages } from '@schemastud/messages/react';
import catalog from '../messages.default.json';

/** English defaults for module-level copy that is read outside a render (static helpers, manifests). */
export const englishBeamVersioningMessages = createMessages(catalog.messages);

/**
 * The messages object a non-hook helper takes; callers in a render pass the reader's. Spelled from the English object so
 * the published declarations carry the key union and never name the JSON catalog binding.
 */
export type BeamVersioningMessages = typeof englishBeamVersioningMessages;

/** One of beam-versioning's catalog keys. */
export type BeamVersioningMessageKey = Parameters<BeamVersioningMessages['t']>[0];

/** beam-versioning's package defaults on the host's one message provider (no second provider); English without one. */
export const useBeamVersioningMessages = (): BeamVersioningMessages => useMessages(catalog.messages);
