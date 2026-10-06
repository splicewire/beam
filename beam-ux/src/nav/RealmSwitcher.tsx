import { useState, type ReactNode } from 'react';
import type { HostRealms, LinkComponent } from './types.js';

export type RealmSwitcherProps = {
    /** The host IA payload (`HostRealmsData`). */
    realms: HostRealms;
    /** The trigger's text: the signed-in principal's name. */
    label: ReactNode;
    /** Where "Sign out" goes: a GET page that confirms and POSTs (ux-walkthrough IA-5). */
    signOutHref: string;
    /** The host's router link (Inertia `Link`, react-router `NavLink`); defaults to a plain `<a>`. */
    linkComponent?: LinkComponent;
    /** Workspaces the principal belongs to, drawn above the realms (the host's own picker). */
    workspaces?: ReactNode;
    /** Open on first render (stories, tests). */
    defaultOpen?: boolean;
    /** The realm the shell is in (useCurrentRealm's), which wins over the payload's `current` (app-walkthrough APP-14). */
    current?: string | null;
    /** Where the menu opens: below the trigger (a header), or above it (a trigger at the bottom of a rail). */
    side?: 'bottom' | 'top';
    className?: string;
};

const PlainLink: LinkComponent = ({ href, className, children, ...rest }) => (
    <a href={href} className={className} {...rest}>
        {children}
    </a>
);

/**
 * The ONE crossing point between realms (ux-walkthrough IA-3, M7): the user menu. It lists the app realms the payload
 * offers (the server already drops the ones the principal may not see, and a `locked` one is left out), then
 * "View site" when a site realm exists, then "Sign out". Closed, it renders no realm link at all, so "Operator"
 * appears only once it is opened. Router-free: each shell injects its link component.
 */
export function RealmSwitcher({
    realms,
    label,
    signOutHref,
    linkComponent,
    workspaces,
    defaultOpen = false,
    side = 'bottom',
    current,
    className,
}: RealmSwitcherProps) {
    const here = current ?? realms.current;
    const [open, setOpen] = useState(defaultOpen);
    const Link = linkComponent ?? PlainLink;
    const appRealms = realms.realms.filter((r) => r.surface === 'app' && !r.locked);
    const site = realms.realms.find((r) => r.surface === 'site' && !r.locked);
    const item = 'block rounded px-2 py-1.5 text-sm hover:bg-accent';

    return (
        <div className={['relative', className].filter(Boolean).join(' ')} data-realm-switcher="">
            <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
                {label}
            </button>
            {open && (
                <div role="menu" className={`absolute right-0 z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${side === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                    {workspaces}
                    {appRealms.map((realm) => (
                        <Link
                            key={realm.key}
                            href={realm.href}
                            className={item}
                            aria-current={realm.key === here ? 'page' : undefined}
                            {...{ 'data-realm-switcher-item': 'realm', role: 'menuitem' }}
                        >
                            {realm.label}
                        </Link>
                    ))}
                    {site && (
                        <Link href={site.href} className={item} {...{ 'data-realm-switcher-item': 'site', role: 'menuitem' }}>
                            View site
                        </Link>
                    )}
                    <Link href={signOutHref} className={item} {...{ 'data-realm-switcher-item': 'sign-out', role: 'menuitem' }}>
                        Sign out
                    </Link>
                </div>
            )}
        </div>
    );
}
