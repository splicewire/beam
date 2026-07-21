import type { ReactNode } from 'react';

// An ordered step list with a vertical rail. `<Steps>` is the container; each `<Step>` is
// a numbered item, auto-numbered via a CSS counter (so authors never hand-number). The
// rail + markers are drawn in kit.css from the host token vars.
export function Steps({ children }: { children?: ReactNode }) {
    return <div className="bkit-steps">{children}</div>;
}

// A single step. Optional `title` renders as the step heading; children are the body.
export function Step({
    title,
    children,
}: {
    title?: string;
    children?: ReactNode;
}) {
    return (
        <div className="bkit-step">
            <div className="bkit-step-marker" aria-hidden="true" />
            <div className="bkit-step-content">
                {title && <p className="bkit-step-title">{title}</p>}
                <div className="bkit-step-body">{children}</div>
            </div>
        </div>
    );
}
