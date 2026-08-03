import { createContext, useContext, type ReactNode } from 'react';
import type { NotifyEvent, UxBuilderServices } from './types';

const UxBuilderServicesContext = createContext<UxBuilderServices | null>(null);

/**
 * The dependency-free default feedback sink: a bare mount still surfaces feedback without dragging a
 * toaster into every host. Real hosts pass their own `notify`.
 */
function consoleNotify(event: NotifyEvent): void {
    if (event.type === 'error') console.error(`[beam-ux] ${event.message}`);
    else console.info(`[beam-ux] ${event.message}`);
}

export function UxBuilderProvider({
    services,
    children,
}: {
    services: UxBuilderServices;
    children: ReactNode;
}) {
    return (
        <UxBuilderServicesContext.Provider value={services}>
            {children}
        </UxBuilderServicesContext.Provider>
    );
}

export function useUxBuilderServices(): UxBuilderServices {
    const services = useContext(UxBuilderServicesContext);
    if (!services) {
        throw new Error('BeamUx components must be rendered inside a <UxBuilderProvider>.');
    }
    return services;
}

/** The injected `notify`, or the console default when the host supplied none. */
export function useNotify(): (event: NotifyEvent) => void {
    return useUxBuilderServices().notify ?? consoleNotify;
}
