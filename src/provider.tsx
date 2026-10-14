import { createContext, useContext, type ReactNode } from 'react';
import type { AutoReloadServices, NotifyEvent } from './types';

const AutoReloadServicesContext = createContext<AutoReloadServices | null>(null);

/**
 * The dependency-free default feedback sink (kind 2): a bare mount still surfaces feedback
 * without dragging a toaster into every host. Real hosts pass their own `notify`.
 */
function consoleNotify(event: NotifyEvent): void {
    if (event.type === 'error') console.error(`[auto-reload] ${event.message}`);
    else console.info(`[auto-reload] ${event.message}`);
}

export function AutoReloadProvider({
    services,
    children,
}: {
    services: AutoReloadServices;
    children: ReactNode;
}) {
    return (
        <AutoReloadServicesContext.Provider value={services}>
            {children}
        </AutoReloadServicesContext.Provider>
    );
}

export function useAutoReloadServices(): AutoReloadServices {
    const services = useContext(AutoReloadServicesContext);
    if (!services) {
        throw new Error('Auto-reload components must be rendered inside an <AutoReloadProvider>.');
    }
    return services;
}

/** The injected `notify`, or the console default when the host supplied none. */
export function useNotify(): (event: NotifyEvent) => void {
    return useAutoReloadServices().notify ?? consoleNotify;
}

/**
 * The injected Stripe SetupIntent handler (kind 3), or a no-op when the host supplied none —
 * the honest home for the surface's original `TODO(stripe-setup-intent)` placeholder. The
 * package never owns the Stripe.js flow.
 */
export function useSavePaymentMethod(): () => void {
    return useAutoReloadServices().onSavePaymentMethod ?? (() => {});
}
