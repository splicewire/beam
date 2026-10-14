import { useMemo, type ReactNode } from 'react';
import {
    createMainframeRegistry,
    createSlotRegistry,
    MainframeOutlet,
    MainframeProvider,
    type MainframeCan,
    type MainframeContext,
    type SlotRegistry,
} from '@schemastud/mainframe';
import { DeskMainframe, type DeskNavigation } from './DeskMainframe.js';
import { WindowMainframe } from './WindowMainframe.js';
import { FocusMainframe } from './FocusMainframe.js';

export interface AppShellContext extends Omit<MainframeContext, 'mode' | 'payload'> {
    canvas?: 'flat' | 'dotted';
    navigation?: DeskNavigation;
}

export interface AppShellProps {
    mode: 'desk' | 'window' | 'focus';
    can: MainframeCan;
    context: AppShellContext;
    /** Stable host composition. Feature transport and authorization remain with their owner. */
    contribute?(slots: SlotRegistry): void;
    /** Router outlet or page content, supplied by the host. */
    outlet: ReactNode;
    routeKey?: string;
}

/** Router-neutral placement core. Hosts own navigation, authorization, runtime facts and routes. */
export function AppShell({
    mode,
    can,
    context,
    contribute,
    outlet,
    routeKey,
}: AppShellProps) {
    const registries = useMemo(() => {
        const slots = createSlotRegistry();
        const mainframes = createMainframeRegistry();
        mainframes.register('desk', DeskMainframe);
        mainframes.register('window', WindowMainframe, {
            slots: [{ name: 'windowEdit', fillType: 'ordered-multi-source' }],
        });
        mainframes.register('focus', FocusMainframe, {
            slots: [{ name: 'focusExit', fillType: 'ordered-multi-source' }],
        });
        slots.contribute({
            slot: 'main',
            key: 'beam.app.main',
            render: (payload) => {
                const p = payload as {
                    outlet?: ReactNode;
                    routeKey?: string;
                };
                return (
                    <div
                        key={p.routeKey}
                        className="route-enter min-w-0 max-w-full"
                    >
                        {p.outlet}
                    </div>
                );
            },
        });
        contribute?.(slots);
        return { slots, mainframes };
    }, [contribute]);
    const injection = useMemo(
        () => ({ ...registries, can }),
        [registries, can],
    );
    return (
        <MainframeProvider injection={injection}>
            <MainframeOutlet mode={mode} ctx={{ ...context, payload: { outlet, routeKey } }} />
        </MainframeProvider>
    );
}
