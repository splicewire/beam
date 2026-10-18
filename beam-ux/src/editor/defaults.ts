// PHP owns this default-body contract. The paired contract gate checks this committed copy.
import type { JsonDoc } from '../blockdoc/json';
import trees from './default-trees.json';
export const DEFAULT_TREES = trees as Record<string, JsonDoc>;
export function defaultTreeFor(slug: string): JsonDoc | null {
    return DEFAULT_TREES[slug] ?? null;
}
