/**
 * `@splicewire/beam-mdx/lens` — the MDX Lens (ux-0233 d2): an MDX page body read into a JsonDoc, and a JsonDoc
 * printed back as canonical MDX. It runs on the server, in Node, through `splicewire/laravel-beam-mdx`, on
 * ADR-0228 decision 9's three paths, as the TSX Lens (`@splicewire/beam-ux/tsx-lens`) does for `tsx` pages.
 */
export { readMdx, MdxLensError, type MdxRead } from './read.js';
export { printMdx } from './print.js';
