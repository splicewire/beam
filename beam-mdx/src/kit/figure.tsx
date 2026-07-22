import type { ReactNode } from 'react';

// A captioned, framed exhibit for guide docs. Either an image (`src` + `alt` — required
// together so every screenshot says what it demonstrates, no raw unframed `![]()`) OR
// inline `children` (an ASCII diagram, an inline SVG, a mockup). `caption` optional. The
// framed <figure> is styled from host token vars (hairline border, muted paper, dim
// caption), so it reads on-brand in any consuming site without Tailwind semantic classes.
export function Figure({
    src,
    alt,
    caption,
    children,
}: {
    src?: string;
    alt?: string;
    caption?: string;
    children?: ReactNode;
}) {
    return (
        <figure className="bkit-figure">
            {children ? (
                <div className="bkit-figure-body">{children}</div>
            ) : src ? (
                <img src={src} alt={alt ?? ''} loading="lazy" />
            ) : null}
            {caption && (
                <figcaption className="bkit-figcaption">{caption}</figcaption>
            )}
        </figure>
    );
}
