import type { ReactNode } from 'react';

// A terminal/command chrome FRAME around already-highlighted content. The fenced code
// inside is highlighted upstream by the host's rehype-pretty-code pipeline — this only
// supplies the window chrome (three dots + optional `title`) and the framed body. No
// shiki, no highlighting here.
export function Terminal({
    title,
    children,
}: {
    title?: string;
    children?: ReactNode;
}) {
    return (
        <div className="bkit-terminal">
            <div className="bkit-terminal-bar">
                <span className="bkit-terminal-dots" aria-hidden="true">
                    <span className="bkit-terminal-dot" />
                    <span className="bkit-terminal-dot" />
                    <span className="bkit-terminal-dot" />
                </span>
                {title && <span className="bkit-terminal-title">{title}</span>}
            </div>
            <div className="bkit-terminal-body">{children}</div>
        </div>
    );
}
