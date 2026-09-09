import { createContext, useContext, type ReactNode } from 'react';
import type { IntakeServices } from './types';

const IntakeContext = createContext<IntakeServices | null>(null);

export function IntakeProvider({
    services,
    children,
}: {
    services: IntakeServices;
    children: ReactNode;
}) {
    return (
        <IntakeContext.Provider value={services}>
            {children}
        </IntakeContext.Provider>
    );
}

export function useIntakeServices(): IntakeServices {
    const services = useContext(IntakeContext);
    if (!services)
        throw new Error('IntakeSectionForm requires an IntakeProvider.');
    return services;
}
