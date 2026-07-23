import { createContext, useContext, type ReactNode } from 'react';
import type { AuthServices } from './types';

const AuthServicesContext = createContext<AuthServices | null>(null);

export function AuthProvider({
    services,
    children,
}: {
    services: AuthServices;
    children: ReactNode;
}) {
    return <AuthServicesContext.Provider value={services}>{children}</AuthServicesContext.Provider>;
}

export function useAuthServices(): AuthServices {
    const services = useContext(AuthServicesContext);
    if (!services) {
        throw new Error('Auth components must be rendered inside an <AuthProvider>.');
    }
    return services;
}
