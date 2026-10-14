import { Fragment, type ReactNode } from 'react';
import type { MainframeProps } from '@schemastud/mainframe';
import {
    Button,
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@schemastud/ui';
import { PanelLeft } from 'lucide-react';
import { cn } from '@schemastud/ui';

export interface DeskNavigation {
    mobile: boolean;
    open: boolean;
    onOpenChange(open: boolean): void;
}

export function DeskMainframe({
    slots,
    ctx,
}: MainframeProps & { ctx: { navigation?: DeskNavigation } }) {
    const canvas = ctx.canvas === 'flat' ? 'bg-background' : 'dotted-bg';
    const navigation = ctx.navigation;
    const mobile = navigation?.mobile ?? false;
    const rail = (
        <>
            {slots.node('brand')}
            {slots.node('rail')}
            {slots.node('railFooter')}
        </>
    );

    return (
        <Sheet
            open={mobile && navigation?.open}
            onOpenChange={navigation?.onOpenChange}
        >
            <div className="flex h-dvh overflow-hidden">

                {!mobile && (
                    <aside className="flex w-[216px] flex-none flex-col bg-sidebar-deep py-[18px] text-sidebar-foreground">
                        {rail}
                    </aside>
                )}

                <div className="flex min-w-0 flex-1 flex-col">

                    <div className="flex flex-none flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2 md:flex-nowrap md:gap-3 md:px-6">
                        {mobile && (
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-11 flex-none"
                                    aria-label="Open navigation"
                                >
                                    <PanelLeft />
                                </Button>
                            </SheetTrigger>
                        )}
                        <div className="order-last min-w-0 basis-full md:order-none md:basis-auto md:flex-1">
                            {slots.node('topBar.lead')}
                        </div>
                        <div className="ml-auto flex flex-none items-center gap-2 md:gap-3">
                            {renderItems(slots.items('topBar.actions', 'end'))}
                        </div>
                    </div>

                    <main
                        className={cn(
                            'min-h-0 min-w-0 flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-6',
                            canvas,
                        )}
                    >
                        {slots.main(ctx.payload)}
                    </main>
                </div>

                {mobile && (
                    <SheetContent
                        side="left"
                        aria-describedby={undefined}
                        className="w-[min(20rem,calc(100vw-2rem))] gap-0 overflow-y-auto bg-sidebar-deep p-0 py-[18px] text-sidebar-foreground"
                    >
                        <SheetTitle className="sr-only">Navigation</SheetTitle>
                        {rail}
                    </SheetContent>
                )}

                {renderItems(slots.items('overlay'))}
            </div>
        </Sheet>
    );
}

function renderItems(items: ReactNode[]): ReactNode {
    return items.map((node, i) => <Fragment key={i}>{node}</Fragment>);
}
