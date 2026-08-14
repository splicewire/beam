import { createContext, useContext, type ReactNode } from 'react';
import type { CatalogFilters, ExtensionListingDetail, ExtensionsCatalog, InstalledExtension } from './types';

// ── The injected transport adapter — the ONE thing a host must implement (kind 1) ──
//
// It wraps whatever transport the host already has (axios, fetch, a server action) and points it
// at the correct `beam-market/extensions/*` endpoints; the surfaces are host- and URL-blind.
// Endpoints stay relative (ADR-0116 §2 kind 1).
//
// The package-side endpoints answer on the standard `{ data: … }` envelope — the adapter is the
// unwrap seam: each method resolves with the envelope's `data` payload (the DTO shapes below),
// never the envelope itself.
export interface ExtensionsClient {
    getCatalog(filters?: CatalogFilters): Promise<ExtensionsCatalog>;
    getListing(id: number): Promise<ExtensionListingDetail>;
    getInstalled(): Promise<InstalledExtension[]>;
    install(id: number): Promise<InstalledExtension>;
    update(installId: number): Promise<InstalledExtension>;
    remove(installId: number): Promise<void>;
}

export interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}

/**
 * Everything host-specific, injected through one Provider. Only `client` is required (kind 1);
 * the rest have dependency-free defaults. The Extensions area deliberately uses THREE of
 * ADR-0116's four injection kinds — no real-time subscription (kind 4) exists in this surface, so
 * it is not forced in; the vocabulary is used only where a genuine host-coupling need shows up.
 */
export interface ExtensionsServices {
    /** kind 1 — the transport adapter (required). */
    client: ExtensionsClient;
    /** kind 2 — feedback sink; a dependency-free console default applies when omitted. */
    notify?: (event: NotifyEvent) => void;
    /** kind 2 — mutation-error hook; the host may toast/log/observe. The rejection still propagates. */
    onError?: (err: unknown) => void;
    /**
     * kind 3 — the host-chrome render slot for the `requires_splicewire` "Connect Splicewire to
     * install" CTA — a rendered host affordance the package can't own (the actual connect flow is
     * host-specific: a beam site's own account settings page, an OAuth-device-flow command, etc.).
     * A dependency-free default renders a plain link to `connectUrl` when supplied, or a static
     * hint when the host injects neither a renderer nor a URL.
     */
    renderConnectCta?: (props: { connectUrl?: string }) => ReactNode;
    /** The URL the default `renderConnectCta` links to, when the host supplies no custom renderer. */
    connectUrl?: string;
}

const ExtensionsServicesContext = createContext<ExtensionsServices | null>(null);

function consoleNotify(event: NotifyEvent): void {
    if (event.type === 'error') console.error(`[beam-market] ${event.message}`);
    else console.info(`[beam-market] ${event.message}`);
}

export function ExtensionsProvider({
    services,
    children,
}: {
    services: ExtensionsServices;
    children: ReactNode;
}) {
    return (
        <ExtensionsServicesContext.Provider value={services}>
            {children}
        </ExtensionsServicesContext.Provider>
    );
}

export function useExtensionsServices(): ExtensionsServices {
    const services = useContext(ExtensionsServicesContext);
    if (!services) {
        throw new Error('beam-market surfaces must be rendered inside an <ExtensionsProvider>.');
    }
    return services;
}

/** The injected `notify`, or the console default when the host supplied none. */
export function useExtensionsNotify(): (event: NotifyEvent) => void {
    return useExtensionsServices().notify ?? consoleNotify;
}
