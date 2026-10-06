import type { HostRealm, LinkComponent } from './types.js';

const PlainLink: LinkComponent = ({ href, className, children, ...rest }) => (
    <a href={href} className={className} {...rest}>
        {children}
    </a>
);

/**
 * You are here (ux-walkthrough IA-4, M7): at the top of the rail in any realm other than the default workspace, the
 * realm's label and "← Back to {workspace}". Feed it {@link useCurrentRealm}'s result. In the default workspace
 * (`back` null) it renders nothing.
 */
export function RealmHeader({
    realm,
    back,
    linkComponent,
    className,
}: {
    realm: HostRealm | null;
    back: { label: string; href: string } | null;
    linkComponent?: LinkComponent;
    className?: string;
}) {
    if (!realm || !back) {
        return null;
    }
    const Link = linkComponent ?? PlainLink;

    return (
        <div className={className ?? 'space-y-1 px-2 py-2'}>
            <div className="text-sm font-semibold" data-realm-label="">
                {realm.label}
            </div>
            <Link href={back.href} className="text-xs text-muted-foreground hover:underline" {...{ 'data-realm-back': '' }}>
                ← Back to {back.label}
            </Link>
        </div>
    );
}
