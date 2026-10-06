import { Link } from '@inertiajs/react';
import { RealmNav, type LinkComponent, type RealmNavNode } from '@splicewire/beam-ux/nav';
import { frameIcon } from '../frame/icons';
import { useFrameManifest, type FrameNavNode } from '../frame/manifest';
import { useCurrentUrl } from '../hooks/use-current-url';

/** The Inertia adapter for the packaged rail: forwards every prop so `data-*`/`aria-*` reach the anchor. */
export const InertiaRailLink: LinkComponent = ({ href, className, style, children, ...rest }) => (
    <Link href={href} className={className} style={style} {...rest}>
        {children}
    </Link>
);

/**
 * The realm rail (ux-walkthrough UX-12a, M7): the frame manifest's projected `nav`, drawn by the packaged `RealmNav`.
 * It replaces the starter's hand-rolled NavFrame, so both shells (this Inertia one and the flagship SPA) render one
 * component. Active state is stamped here from the current URL, because the manifest is fetched once and cached across
 * Inertia visits. `zone: meta` nodes leave the rail for the Developer zone, which RealmNav draws after it as seat
 * groups (the behaviour NavFrame gained in c4622dc).
 */
export function FrameRail({ omitHrefs = [] }: { omitHrefs?: string[] } = {}) {
    const { data: manifest } = useFrameManifest();
    const { isCurrentUrl } = useCurrentUrl();

    const stamp = (node: FrameNavNode): RealmNavNode => {
        const children = node.children.map(stamp);
        const active = node.href !== null && isCurrentUrl(node.href);
        return {
            ...node,
            locked: (node.locked as RealmNavNode['locked']) ?? null,
            children,
            active,
            activeTrail: active || children.some((child) => child.active || child.activeTrail),
        };
    };
    const items = (manifest?.nav.items ?? [])
        .filter((node) => !(node.children.length === 0 && node.href !== null && omitHrefs.includes(node.href)))
        .map(stamp);

    if (items.length === 0) {
        return null;
    }

    return (
        <RealmNav
            items={items}
            variant="section-groups"
            linkComponent={InertiaRailLink}
            icon={(node, { className }) => {
                const Icon = frameIcon(node.icon);
                return <Icon className={className} />;
            }}
        />
    );
}
