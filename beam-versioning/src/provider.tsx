import { createContext, useContext, type ReactNode } from 'react';
import type { NotifyEvent, VersionsServices } from './types';

const VersionsServicesContext = createContext<VersionsServices | null>(null);

/**
 * The dependency-free default feedback sink (contract §3): a bare mount still surfaces feedback
 * without dragging a toaster into every host. Real hosts pass their own `notify`.
 */
function consoleNotify(event: NotifyEvent): void {
    if (event.type === 'error') console.error(`[versions] ${event.message}`);
    else console.info(`[versions] ${event.message}`);
}

export function VersionsProvider({
    services,
    children,
}: {
    services: VersionsServices;
    children: ReactNode;
}) {
    return (
        <VersionsServicesContext.Provider value={services}>
            {children}
        </VersionsServicesContext.Provider>
    );
}

export function useVersionsServices(): VersionsServices {
    const services = useContext(VersionsServicesContext);
    if (!services) {
        throw new Error('Versioning components must be rendered inside a <VersionsProvider>.');
    }
    return services;
}

/** The injected `notify`, or the console default when the host supplied none. */
export function useNotify(): (event: NotifyEvent) => void {
    return useVersionsServices().notify ?? consoleNotify;
}
