import { createMessages } from '@schemastud/messages';
import { useMessages } from '@schemastud/messages/react';
import catalog from '../messages.default.json';

/** beam-accounts' package defaults on the host's one message provider (no second provider); English without one. */
export const useBeamAccountsMessages = (): ReturnType<typeof useMessages<typeof catalog.messages>> => useMessages(catalog.messages);

/** English defaults for module-level copy that is read outside a render (static helpers, manifests). */
export const englishBeamAccountsMessages = createMessages(catalog.messages);

/** The messages object a schema builder or other non-hook helper takes; callers in a render pass the reader's. */
export type BeamAccountsMessages = ReturnType<typeof useBeamAccountsMessages>;

/** One of beam-accounts' catalog keys. */
export type BeamAccountsMessageKey = Parameters<BeamAccountsMessages['t']>[0];
