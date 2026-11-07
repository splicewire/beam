import { Fragment, type ReactNode } from 'react';
import type { MainframeProps } from '@schemastud/mainframe';

export function WindowMainframe({ slots, ctx }: MainframeProps) {
    return (
        <div data-beam-shell="window" className="relative h-screen w-screen overflow-hidden bg-background">

            <div data-beam-scroller="page" className="h-full w-full overflow-y-auto">
                {slots.main(ctx.payload)}
            </div>

            {renderItems(slots.items('windowEdit'))}
        </div>
    );
}

function renderItems(items: ReactNode[]): ReactNode {
    return items.map((node, i) => <Fragment key={i}>{node}</Fragment>);
}
