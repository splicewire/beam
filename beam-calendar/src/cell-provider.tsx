import { createContext, useContext, type ReactNode } from 'react';
import type { CalendarCellFormServices, CellNotifyMessage } from './cell-types';

// The single injection seam for the rehomed CalendarCellForm surface (rehome-ui §profile
// `provider.tsx`). A React context carrying the four-kind service bundle; the form + its hooks read
// it here instead of importing any host transport. The calendar-GRID surface (CompositionCalendar)
// keeps its own prop-injection — this provider is the FORM's seam only.

const CellFormContext = createContext<CalendarCellFormServices | null>(null);

export function CalendarCellFormProvider({
    services,
    children,
}: {
    services: CalendarCellFormServices;
    children: ReactNode;
}) {
    return <CellFormContext.Provider value={services}>{children}</CellFormContext.Provider>;
}

/** Read the injected services. Throws if used outside the provider (a wiring error, not a runtime path). */
export function useCellFormServices(): CalendarCellFormServices {
    const services = useContext(CellFormContext);
    if (!services) {
        throw new Error('CalendarCellForm must be rendered inside <CalendarCellFormProvider services={…}>.');
    }
    return services;
}

/** Fire the injected `notify` (dependency-free default: no-op if the host wired none). */
export function useCellNotify(): (msg: CellNotifyMessage) => void {
    const { notify } = useCellFormServices();
    return notify ?? (() => {});
}
