import type { ReactNode } from 'react';

export type CalloutType = 'note' | 'tip' | 'warning' | 'danger' | 'info';

// An admonition box: a left accent bar + tinted background keyed to `type` (styled via
// token vars in kit.css), an optional `title`, and its children. Defaults to 'note'.
export function Callout({
    type = 'note',
    title,
    children,
}: {
    type?: CalloutType;
    title?: string;
    children?: ReactNode;
}) {
    return (
        <div className={`bkit-callout bkit-callout--${type}`}>
            {title && <p className="bkit-callout-title">{title}</p>}
            <div className="bkit-callout-body">{children}</div>
        </div>
    );
}
