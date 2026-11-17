import { createMessages } from '@schemastud/messages';
import { useMessages } from '@schemastud/messages/react';
import catalog from '../messages.default.json';

/** beam-ux's package defaults on the host's one message provider (no second provider); English without one. */
export const useBeamUxMessages = (): ReturnType<typeof useMessages<typeof catalog.messages>> => useMessages(catalog.messages);

/** English defaults for module-level copy that is read outside a render (static helpers, manifests). */
export const englishBeamUxMessages = createMessages(catalog.messages);

/** The messages object a schema builder or other non-hook helper takes; callers in a render pass the reader's. */
export type BeamUxMessages = ReturnType<typeof useBeamUxMessages>;

/** One of beam-ux's catalog keys. */
export type BeamUxMessageKey = Parameters<BeamUxMessages['t']>[0];
