import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import { AppShell, type AppShellProps } from './AppShell.js';

export interface BeamAppOptions<Runtime> {
    /** Host-defined facts, kept separate from routing and feature transport. */
    runtime: Runtime;
    Providers?: ComponentType<{ children: ReactNode }>;
}

/**
 * Compose a shell with an isolated, typed runtime context. The host creates its router,
 * injects its outlet, and owns mounting/unmounting; importing this entry has no browser effects.
 */
export function createBeamApp<Runtime>({ runtime, Providers }: BeamAppOptions<Runtime>) {
    const RuntimeContext = createContext<{ value: Runtime } | null>(null);
    const value = { value: runtime };
    function useRuntime(): Runtime {
        const current = useContext(RuntimeContext);
        if (!current) throw new Error('App runtime must be read inside its own App.');
        return current.value;
    }
    function Provider({ children }: { children: ReactNode }) {
        return (
            <RuntimeContext.Provider value={value}>
                {Providers ? <Providers>{children}</Providers> : children}
            </RuntimeContext.Provider>
        );
    }
    function App(props: AppShellProps) {
        return <Provider><AppShell {...props} /></Provider>;
    }
    return { runtime, App, Provider, useRuntime };
}
