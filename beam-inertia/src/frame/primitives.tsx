import type { FramePrimitives } from '@schemastud/frame';
import type { ReactNode } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { Skeleton } from '../components/ui/skeleton';

// This host's seven components, merged by the kit over frame's default `@schemastud/ui` bundle
// (ruling 02 §3). They are this package's own shadcn copies; the popover and select the filter
// controls draw come from the default bundle, and the list's table is the `Table` slot.

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

export const framePrimitives: Partial<FramePrimitives> = {
    Button,
    Input,
    Label,
    Badge,
    Skeleton,
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
