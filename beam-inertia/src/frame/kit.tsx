import { Link } from '@inertiajs/react';
import { createFrameKit } from '@schemastud/frame';
import type { CardLinkRenderer, FrameKit } from '@schemastud/frame';
import type { SchemaNode } from '@schemastud/seam';
import { toast } from 'sonner';
import { frameIcon } from './icons';
import type { FrameNav } from './manifest';
import { framePrimitives } from './primitives';
import { createReleaseFilesFormResolver } from './release-files-form';

/**
 * Frame's `CardLinkRenderer` over Inertia's `Link` — the same seam `@schemastud/nav`'s rail takes
 * from `router.tsx`, so a card (a heading, "View all", a whole nav tile) navigates client-side
 * instead of full-page-reloading the console.
 */
const renderCardLink: CardLinkRenderer = ({ href, className, children, 'aria-label': ariaLabel }) => (
    <Link href={href} className={className} aria-label={ariaLabel}>
        {children}
    </Link>
);

/**
 * One frame kit per realm, keyed by the realm's manifest URL and held here at module scope
 * (ruling 02 §1, slice 9). A host mounts `FrameManifestController` once per realm, so the
 * manifest URL is what tells two realms apart; every reader of one realm — the provider, the
 * rail, the console, the router, the entry-properties form — gets the same kit and so shares one
 * manifest cache entry. Resources live under the one `/frame` socket in every realm.
 *
 * Only what differs from the kit's defaults is passed:
 *  - `primitives`: this host's seven components (its own shadcn copies);
 *  - `renderLink` and `iconFor`: Inertia's `Link` and this host's icon map, for the card set;
 *  - `schemaFetcher`: inert. Tenant-realm request schemas are self-contained (`forRequest()`),
 *    so there is no `$ref` to resolve;
 *  - `formResolver`: the release-files form;
 *  - `notify`: a declared action's result (ADR-0005) is this host's sonner toast, the same
 *    `<Toaster/>` the flash messages use.
 *
 * The kit's `can` is this host's old rule exactly: reads are true, a write is the manifest's
 * `contexts[resource].can[action]`, false while the manifest is unknown. The server
 * (`Schemastud\Frame\Authorization\ResourceAuthorizer`) is the gate; the manifest projects it.
 *
 * No `queryClient`: `index.tsx`'s `withApp` mounts one at the Inertia root, above every reader.
 */
const kits = new Map<string, FrameKit<FrameNav>>();

export function kitFor(manifestUrl: string): FrameKit<FrameNav> {
    let kit = kits.get(manifestUrl);
    if (!kit) {
        kit = createFrameKit<FrameNav>({
            manifestUrl,
            primitives: framePrimitives,
            renderLink: renderCardLink,
            iconFor: frameIcon,
            schemaFetcher: async (ref: string): Promise<SchemaNode> => ({ $id: ref }) as SchemaNode,
            formResolver: createReleaseFilesFormResolver(),
            notify: ({ tone, message }) => (tone === 'error' ? toast.error(message) : toast.success(message)),
        });
        kits.set(manifestUrl, kit);
    }
    return kit;
}
