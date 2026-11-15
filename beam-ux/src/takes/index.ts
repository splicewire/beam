/**
 * `@splicewire/beam-ux/takes` — the takes strip (node-actions-and-takes 06): one component that shows the takes of a
 * node from a host-mapped view model, a replaced payload and a rendered artifact side by side. Studio mounts it in
 * place of its own list; the page canvas and the timeline mount it when they need it.
 */
export { TakesStrip, relativeWhen } from './TakesStrip.js';
export type { TakesStripProps } from './TakesStrip.js';
export type { StripLabels, StripTake } from './types.js';
