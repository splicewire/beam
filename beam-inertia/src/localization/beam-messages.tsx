import { usePage } from '@inertiajs/react';
import { MessageProvider } from '@schemastud/messages/react';
import { useRef, type ComponentType, type ReactNode } from 'react';
import type { ClientCatalogData, ClientLocalizationData } from '../types/localization';

/**
 * localization 16-d (root qitem-20261114165739-efd171f6, option A): the served client catalog reaches the React tree.
 *
 * laravel-beam-ux shares `localization: {address, initial}` on every Inertia response (`SharesBeamShell`); this mounts
 * `@schemastud/messages`' `MessageProvider` with `initial`, so every seam-backed component under a beam-inertia layout
 * reads the reader's language with no host code. It is the OUTERMOST element of every layout the resolver returns and
 * of the entry page wrap, and it is persistent: a navigation does not remount it.
 *
 * - A language or realm switch: the server serves a new catalog (a new `address.hash`, so a new once-prop key), and the
 *   provider takes the new `value`. `MessageProvider` re-memoizes on `value`, so no remount is needed.
 * - `initial` is a once-prop (Inertia v3): a later response may omit it. The last catalog is kept for the SAME
 *   `address.hash`, so the provider does not drop out, which would remount the whole page tree.
 * - No catalog served (a host without laravel-beam-ux's shell share, or a null `initial`): a passthrough.
 * - `pseudo` stays false: under `en-XA` the server already marks every line it serves (BeamTranslator), and a key with
 *   no catalog line stays unmarked, as on the server.
 */
export function BeamMessages({ children }: { children: ReactNode }) {
    const localization = (usePage().props as { localization?: ClientLocalizationData | null }).localization ?? null;
    const last = useRef<{ hash: string; catalog: ClientCatalogData } | null>(null);

    const served = localization?.initial ?? null;
    const hash = localization?.address?.hash ?? null;
    if (served !== null && hash !== null) {
        last.current = { hash, catalog: served };
    }
    const catalog = served ?? (last.current !== null && last.current.hash === hash ? last.current.catalog : null);

    if (catalog === null) {
        return <>{children}</>;
    }

    return (
        <MessageProvider value={catalog} pseudo={false}>
            {children}
        </MessageProvider>
    );
}

/** One page's chrome, outermost first: a layout, a list of them, or `null` for a self-chromed page. */
export type ChromeLayout = ComponentType<{ children: ReactNode }> | ComponentType<{ children: ReactNode }>[] | null;

/**
 * <BeamMessages> OUTERMOST in every layout the resolver returns. Inertia keeps a layout list's components mounted across
 * navigations that share them, so the provider (and the catalog it holds) is persistent.
 */
export function withBeamMessages(chrome: ChromeLayout): ComponentType<{ children: ReactNode }>[] {
    if (chrome === null) return [BeamMessages];

    return Array.isArray(chrome) ? [BeamMessages, ...chrome] : [BeamMessages, chrome];
}
