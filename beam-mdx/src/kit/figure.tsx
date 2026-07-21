// A captioned, framed screenshot for guide docs: `src` + `alt` are required so every
// image says what it demonstrates (no raw unframed `![]()`), `caption` optional. Framed
// <figure> styled from the host token vars (hairline border, muted paper, dim caption),
// so it reads on-brand in any consuming site without Tailwind semantic classes.
export function Figure({
    src,
    alt,
    caption,
}: {
    src: string;
    alt: string;
    caption?: string;
}) {
    return (
        <figure className="bkit-figure">
            <img src={src} alt={alt} loading="lazy" />
            {caption && <figcaption className="bkit-figcaption">{caption}</figcaption>}
        </figure>
    );
}
