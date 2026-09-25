import type { FramePrimitives } from '@schemastud/frame';
import { Popover, PopoverContent, PopoverTrigger, SimpleSelect } from '@schemastud/ui';
import type { ReactNode } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { Skeleton } from '../components/ui/skeleton';

// This host's binding of frame's FramePrimitives seam to its own shadcn kit — the same seam
// rushing/audiostud and splicewire bind, against the same component set.
//
// Filter controls use the shared UI kit; each resource's advertised capability decides
// whether Frame renders them. Table rendering is supplied by the list slots.
const Passthrough = ({ children }: { children?: ReactNode }) => <>{children}</>;

function FrameSidePanel({
    open,
    onOpenChange,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children?: ReactNode;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
                {children}
            </SheetContent>
        </Sheet>
    );
}

export const framePrimitives: FramePrimitives = {
    Button,
    Input,
    Label,
    Badge,
    Skeleton,
    Popover,
    PopoverTrigger,
    PopoverContent,
    SimpleSelect,
    Table: Passthrough,
    Dialog: ({
        open,
        onOpenChange,
        title,
        children,
    }: {
        open?: boolean;
        onOpenChange?: (o: boolean) => void;
        /** A declared action's label (ADR-0005); the accessible name Radix requires of a dialog. */
        title?: string;
        children?: ReactNode;
    }) => (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                {title ? (
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>
                ) : null}
                {children}
            </DialogContent>
        </Dialog>
    ),
    SidePanel: FrameSidePanel,
};
