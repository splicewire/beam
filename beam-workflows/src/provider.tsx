import { createContext, useContext, type ReactNode } from 'react';
import type { NotifyEvent, WorkflowsServices } from './types';

const WorkflowsServicesContext = createContext<WorkflowsServices | null>(null);

/**
 * The dependency-free default feedback sink (contract §3): a bare mount still surfaces feedback
 * without dragging a toaster into every host. Real hosts pass their own `notify`.
 */
function consoleNotify(event: NotifyEvent): void {
    if (event.type === 'error') console.error(`[workflows] ${event.message}`);
    else console.info(`[workflows] ${event.message}`);
}

export function WorkflowsProvider({
    services,
    children,
}: {
    services: WorkflowsServices;
    children: ReactNode;
}) {
    return (
        <WorkflowsServicesContext.Provider value={services}>
            {children}
        </WorkflowsServicesContext.Provider>
    );
}

export function useWorkflowsServices(): WorkflowsServices {
    const services = useContext(WorkflowsServicesContext);
    if (!services) {
        throw new Error('Workflows components must be rendered inside a <WorkflowsProvider>.');
    }
    return services;
}

/** The injected `notify`, or the console default when the host supplied none. */
export function useNotify(): (event: NotifyEvent) => void {
    return useWorkflowsServices().notify ?? consoleNotify;
}
