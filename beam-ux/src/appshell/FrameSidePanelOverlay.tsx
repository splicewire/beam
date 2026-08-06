// @splicewire/beam-ux/appshell — the FrameSidePanelOverlay single-host-portal (Frame OS ticket 19).
//
// Promoted WHOLE from splicewire-app. The single host-owned overlay surface, contributed ONCE into
// the mainframe `overlay` slot: it renders every live `FrameSidePanel` publication through the
// foundation `Sheet`, so the mainframe owns the one portal for all frame sheet-detail panels — no
// nested portal, no second mainframe (the nested-portal problem, solved once).
//
// The deep-tree publisher/consumer store (`useFrameSidePanelStore`) was promoted to `@schemastud/frame`
// in ticket 18; this overlay imports it from there. `Sheet` comes from the `@schemastud/ui` foundation
// (a peer). No app-local imports — portable by contract.
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@schemastud/ui';
import { useFrameSidePanelStore } from '@schemastud/frame';

/**
 * FrameSidePanelOverlay — the single host-owned overlay surface. A host contributes it ONCE into its
 * mainframe `overlay` slot; it renders each live {@link useFrameSidePanelStore} publication through
 * the foundation `Sheet`. Renders nothing until a panel publishes — a no-cost resident of the slot.
 */
export function FrameSidePanelOverlay() {
    const panels = useFrameSidePanelStore((s) => s.panels);
    return (
        <>
            {panels.map((panel) => (
                <Sheet key={panel.id} open={panel.open} onOpenChange={panel.onOpenChange}>
                    <SheetContent side="right" className="sm:max-w-md">
                        {panel.title ? (
                            <SheetHeader>
                                <SheetTitle>{panel.title}</SheetTitle>
                            </SheetHeader>
                        ) : null}
                        {panel.children}
                    </SheetContent>
                </Sheet>
            ))}
        </>
    );
}
