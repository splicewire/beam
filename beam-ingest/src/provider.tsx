import { createContext, useContext, type ReactNode } from 'react';
import type { IngestServices } from './types';

const IngestContext = createContext<IngestServices | null>(null);

export function IngestProvider({
    services,
    children,
}: {
    services: IngestServices;
    children: ReactNode;
}) {
    return <IngestContext.Provider value={services}>{children}</IngestContext.Provider>;
}

export function useIngestServices(): IngestServices {
    const services = useContext(IngestContext);
    if (!services) throw new Error('IngestProgress requires an IngestProvider.');
    return services;
}
