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
    function App(props: AppShellProps) {
        const shell = <AppShell {...props} />;
        return (
            <RuntimeContext.Provider value={value}>
                {Providers ? <Providers>{shell}</Providers> : shell}
            </RuntimeContext.Provider>
        );
    }
    return { runtime, App, useRuntime };
}
