import { createMessages } from '@schemastud/messages';
import { useMessages } from '@schemastud/messages/react';
// The package's own English defaults through its exported `./messages.js` subpath (a self-reference to the GENERATED ES
// module of the catalog), which every build keeps EXTERNAL: the catalog is not inlined into dist (root's condition for
// ./action-form, localization 30 W3), and a JS module needs no import attribute, so Node/SSR loads it where a bare JSON
// import fails (REVIEW-30W3; scripts/node-smoke.mjs pins it). Tests alias it to the local file (vitest.config.ts).
import catalog from '@splicewire/beam-workflows/messages.js';

/** English defaults for module-level copy that is read outside a render (static helpers, manifests). */
export const englishBeamWorkflowsMessages = createMessages(catalog.messages);

/**
 * The messages object a non-hook helper takes; callers in a render pass the reader's. Spelled from the English object so
 * the published declarations carry the key union and never name the JSON catalog binding.
 */
export type BeamWorkflowsMessages = typeof englishBeamWorkflowsMessages;

/** One of beam-workflows's catalog keys. */
export type BeamWorkflowsMessageKey = Parameters<BeamWorkflowsMessages['t']>[0];

/** beam-workflows's package defaults on the host's one message provider (no second provider); English without one. */
export const useBeamWorkflowsMessages = (): BeamWorkflowsMessages => useMessages(catalog.messages);
