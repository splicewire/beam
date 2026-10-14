import { Fragment, type ReactNode } from 'react';
import type { MainframeProps } from '@schemastud/mainframe';

export function FocusMainframe({ slots, ctx }: MainframeProps) {
    return (
        <div className="relative h-screen w-screen overflow-hidden bg-background">

            <div className="h-full w-full overflow-y-auto">
                {slots.main(ctx.payload)}
            </div>

            {renderItems(slots.items('focusExit'))}
        </div>
    );
}

function renderItems(items: ReactNode[]): ReactNode {
    return items.map((node, i) => <Fragment key={i}>{node}</Fragment>);
}
