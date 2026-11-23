import { createMessages } from '@schemastud/messages';
import { useMessages } from '@schemastud/messages/react';
// The package's own English defaults through its exported `./messages.js` subpath, kept EXTERNAL by every build (as
// beam-workflows does; localization 30 W3). Tests alias it to the local file (vitest.config.ts).
import catalog from '@splicewire/beam-notifications/messages.js';

/** English defaults, for copy read outside a render. */
export const englishBeamNotificationsMessages = createMessages(catalog.messages);

export type BeamNotificationsMessages = typeof englishBeamNotificationsMessages;

/** beam-notifications's package defaults on the host's one message provider (no second provider); English without one. */
export const useBeamNotificationsMessages = (): BeamNotificationsMessages => useMessages(catalog.messages);
