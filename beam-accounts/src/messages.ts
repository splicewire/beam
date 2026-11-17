import { createMessages } from '@schemastud/messages';
import { useMessages } from '@schemastud/messages/react';
import catalog from '../messages.default.json';

/** English defaults for module-level copy that is read outside a render (static helpers, manifests). */
export const englishBeamAccountsMessages = createMessages(catalog.messages);

/**
 * The messages object a schema builder or other non-hook helper takes; callers in a render pass the reader's. Spelled
 * from the English object so the published declarations carry the key union and never name the JSON catalog binding.
 */
export type BeamAccountsMessages = typeof englishBeamAccountsMessages;

/** One of beam-accounts' catalog keys. */
export type BeamAccountsMessageKey = Parameters<BeamAccountsMessages['t']>[0];

/** beam-accounts' package defaults on the host's one message provider (no second provider); English without one. */
export const useBeamAccountsMessages = (): BeamAccountsMessages => useMessages(catalog.messages);
