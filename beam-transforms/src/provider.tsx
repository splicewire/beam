import { createContext, useContext, type ReactNode } from 'react';
import type { NotifyEvent, TransformsCapabilities, TransformsServices } from './types';

const TransformsServicesContext = createContext<TransformsServices | null>(null);

/** The dependency-free default feedback sink (contract §3) — no toaster dragged into every host. */
function consoleNotify(event: NotifyEvent): void {
    if (event.type === 'error') console.error(`[transforms] ${event.message}`);
    else console.info(`[transforms] ${event.message}`);
}

export function TransformsProvider({
    services,
    children,
}: {
    services: TransformsServices;
    children: ReactNode;
}) {
    return (
        <TransformsServicesContext.Provider value={services}>
            {children}
        </TransformsServicesContext.Provider>
    );
}

export function useTransformsServices(): TransformsServices {
    const services = useContext(TransformsServicesContext);
    if (!services) {
        throw new Error('Transforms components must be rendered inside a <TransformsProvider>.');
    }
    return services;
}

/** The injected `notify`, or the console default when the host supplied none. */
export function useNotify(): (event: NotifyEvent) => void {
    return useTransformsServices().notify ?? consoleNotify;
}

/** The injected `can`, each omitted key allowed. */
export function useTransformsCan(): TransformsCapabilities {
    const can = useTransformsServices().can;
    return { create: can?.create ?? true, update: can?.update ?? true, delete: can?.delete ?? true };
}
