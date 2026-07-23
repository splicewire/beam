import { createContext, useContext, type ReactNode } from 'react';
import type { NotifyEvent, TokensServices } from './types';

const TokensServicesContext = createContext<TokensServices | null>(null);

/**
 * The dependency-free default feedback sink (contract §3): a bare mount still surfaces feedback
 * without dragging a toaster into every host. Real hosts pass their own `notify`.
 */
function consoleNotify(event: NotifyEvent): void {
    if (event.type === 'error') console.error(`[tokens] ${event.message}`);
    else console.info(`[tokens] ${event.message}`);
}

export function TokensProvider({
    services,
    children,
}: {
    services: TokensServices;
    children: ReactNode;
}) {
    return (
        <TokensServicesContext.Provider value={services}>{children}</TokensServicesContext.Provider>
    );
}

export function useTokensServices(): TokensServices {
    const services = useContext(TokensServicesContext);
    if (!services) {
        throw new Error('Tokens components must be rendered inside a <TokensProvider>.');
    }
    return services;
}

/** The injected `notify`, or the console default when the host supplied none. */
export function useNotify(): (event: NotifyEvent) => void {
    return useTokensServices().notify ?? consoleNotify;
}
