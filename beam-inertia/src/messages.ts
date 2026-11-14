import { createMessages } from '@schemastud/messages';
import { useMessages } from '@schemastud/messages/react';
import catalog from '../messages.default.json';

/** Package-private defaults share the existing 16-d provider; no second provider. */
export const useBeamMessages = (): ReturnType<typeof useMessages<typeof catalog.messages>> => useMessages(catalog.messages);

/** English defaults for existing exported static helpers and layout metadata only. */
export const englishBeamMessages = createMessages(catalog.messages);
