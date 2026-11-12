import type { ReactNode } from 'react';
import type { LinkComponent, RealmNavNode } from '@splicewire/beam-ux/nav';

/**
 * `DocsBreadcrumb` — the trail `DocsLayout` draws above a page by default: each ancestor of the current page in the
 * realm's navigation tree, then the page itself, unlinked (`aria-current="page"`).
 *
 * It walks the WHOLE tree the layout receives (`nav.items`), not the rail's items: the rail keeps only the current
 * section's children, so it no longer holds the section a trail starts from. Reading the same tree as the rail means
 * the two cannot disagree, and no data crosses the wire for it (owner-review-20261112 07; the flagship's own
 * breadcrumb went when its page was deleted on 2026-08-31).
 *
 * An href-less heading (ADR-0213 §8's nav group) is a crumb without a link. The site's home (`/`) is left out: the
 * header already links it. A page with no ancestor in the tree, such as the docs root itself, draws no trail.
 * Sibling switchers on each crumb (the old flagship component's `@schemastud/breadcrumb`) are a follow-up.
 */
export function DocsBreadcrumb({
    items,
    currentHref,
    linkComponent,
    className,
}: {
    items: RealmNavNode[];
    currentHref?: string;
    linkComponent?: LinkComponent;
    className?: string;
}) {
    const { trail, endsOnPage } = docsTrail(items, currentHref);
    // Only ancestors make a trail: the page alone (the docs root) draws none.
    if (trail.length < (endsOnPage ? 2 : 1)) return null;

    const Link = linkComponent ?? PlainLink;

    return (
        <nav aria-label="Breadcrumb" className={['beam-docs-breadcrumb', className].filter(Boolean).join(' ')}>
            <ol>
                {trail.map((node, index) => {
                    const last = endsOnPage && index === trail.length - 1;
                    return (
                        <li key={`${index}:${node.href ?? node.title}`}>
                            {last ? (
                                <span aria-current="page">{node.title}</span>
                            ) : node.href ? (
                                <Link href={node.href}>{node.title}</Link>
                            ) : (
                                <span>{node.title}</span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

/**
 * The path from the tree's top to the page at `currentHref`: the node whose href IS the URL (`endsOnPage`), or failing
 * that the deepest node whose href prefixes it, so a page the nav does not list still shows the section it sits in.
 * The home node is dropped.
 */
export function docsTrail(
    items: RealmNavNode[],
    currentHref: string | undefined,
): { trail: RealmNavNode[]; endsOnPage: boolean } {
    if (!currentHref) return { trail: [], endsOnPage: false };

    let exact: RealmNavNode[] | null = null;
    let prefix: RealmNavNode[] | null = null;

    const visit = (nodes: RealmNavNode[], path: RealmNavNode[]) => {
        for (const node of nodes) {
            const here = [...path, node];
            const href = node.href;
            if (href && href !== '/') {
                if (href === currentHref && exact === null) exact = here;
                else if (currentHref.startsWith(`${href}/`) && (prefix === null || href.length > (prefix.at(-1)?.href?.length ?? 0))) {
                    prefix = here;
                }
            }
            if (node.children?.length) visit(node.children, here);
        }
    };
    visit(items, []);

    const home = (node: RealmNavNode) => node.href !== '/';
    if (exact !== null) return { trail: (exact as RealmNavNode[]).filter(home), endsOnPage: true };
    return { trail: ((prefix ?? []) as RealmNavNode[]).filter(home), endsOnPage: false };
}

function PlainLink({ href, children, className }: { href: string; children?: ReactNode; className?: string }) {
    return (
        <a href={href} className={className}>
            {children}
        </a>
    );
}
