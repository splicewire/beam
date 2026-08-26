import { DocsLayout } from './DocsLayout.js';
import { ProseTemplate, SpreadTemplate } from './templates.js';
import type { ChromeComponent } from './types.js';

/**
 * The chrome this package ships, as a **value the resolver reads** rather than a registration it
 * performs at import time.
 *
 * That distinction is the whole file. The first cut registered these from `docs/index.ts` module
 * scope — and `@splicewire/beam-ux` declares `sideEffects: false`, which is a promise to the bundler
 * that importing a module and using one export cannot matter to any other. A host importing only
 * `configureEntryPage` therefore got the `registerChrome({ DocsLayout })` call tree-shaken away, and
 * `/docs/mcp` rendered on the beam starter with its layout silently resolving to nothing: no rail, no
 * on-this-page column, behind a 200. The row said `layout: DocsLayout`, the payload carried it, and
 * the registry was empty.
 *
 * Read from `resolveLayout`/`resolveTemplate` instead, the reference is live — the resolver is what
 * the page calls, so the map cannot be dropped without dropping the page.
 *
 * A host registration of the same name WINS over these (see the resolver), so overriding `DocsLayout`
 * stays one line and does not require unregistering anything.
 */
export const BUILTIN_LAYOUTS: Record<string, ChromeComponent> = { DocsLayout };

export const BUILTIN_TEMPLATES: Record<string, ChromeComponent> = { ProseTemplate, SpreadTemplate };
