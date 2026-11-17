import { router } from '@inertiajs/react';
import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { useEffect, useState, type ReactNode } from 'react';
import type { ClientLocalizationData } from '../types/localization';
import { useServedCatalog } from './beam-messages';

/**
 * No catalog served: an EMPTY English catalog. `createMessages` then answers exactly as with no provider at all (every line
 * its English default with source locale 'en', locale 'en-US', realm null, 'ltr'), so the chrome's text is byte-identical
 * to provider-free English, while the tree keeps ONE shape. Nothing above `withApp` provides messages, so it shadows none.
 */
const NONE: ClientCatalog = Object.freeze({ version: 1, locale: 'en-US', realm: null, direction: 'ltr', messages: Object.freeze({}) });

/**
 * localization 28b: the served catalog for APP-LEVEL chrome mounted beside the Inertia page, not inside it (the toaster in
 * `withApp`). Such chrome has no page context, so <BeamMessages> (which reads `usePage()`) cannot reach it, and a seam call
 * there would fall back to provider-free English on every page (the 28b+31 walk, 2026-11-17: "Notifications alt+T", 83
 * findings).
 *
 * It takes the page's `localization` from the INITIAL page (`withApp`'s `options.page`), then from the router's events,
 * and selects the catalog by the SAME rule as <BeamMessages> (`useServedCatalog`):
 * - `success`: EVERY completed visit, including the ones Inertia does NOT announce with `navigate`. It fires `navigate` only
 *   for a non-replace visit, and forces replace for a same-URL visit, so a language switch (the picker PATCHes and the server
 *   redirects back to the same page), `reload()`, a partial reload and any `replace` visit reach chrome only through
 *   `success` (review of c9e5967d, HIGH 1). Its page is the merged current page, so a partial reload keeps `localization`.
 * - `navigate`: history (back/forward) and the restored initial page, which complete no visit and so fire no `success`.
 *
 * The tree has ONE shape whatever is served (the provider is always there, with NONE when nothing is), so the chrome under
 * it (one toaster, toasts in flight) is never remounted: not by a navigation and not by catalog <-> none (review, MEDIUM 2).
 */
export function ChromeMessages({ initialPage, children }: { initialPage?: { props?: unknown } | null; children: ReactNode }) {
    const [localization, setLocalization] = useState<ClientLocalizationData | null>(() => localizationOf(initialPage));

    useEffect(() => {
        const take = (event: { detail: { page: { props?: unknown } } }) => setLocalization(localizationOf(event.detail.page));
        const offSuccess = router.on('success', take);
        const offNavigate = router.on('navigate', take);

        return () => {
            offSuccess();
            offNavigate();
        };
    }, []);

    const catalog = useServedCatalog(localization);

    return (
        <MessageProvider value={catalog ?? NONE} pseudo={false}>
            {children}
        </MessageProvider>
    );
}

function localizationOf(page: { props?: unknown } | null | undefined): ClientLocalizationData | null {
    return ((page?.props ?? {}) as { localization?: ClientLocalizationData | null }).localization ?? null;
}
