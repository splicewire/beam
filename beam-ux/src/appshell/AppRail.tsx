import type { ComponentType, ComponentProps, ReactNode } from 'react';
import { cn } from '@schemastud/ui';

export interface AppRailItem {
    id: string;
    title: string;
    href: string;
    icon?: ReactNode;
}
export interface AppRailGroup {
    id: string;
    label: string;
    items: readonly AppRailItem[];
}
export interface AppRailProps {
    groups: readonly AppRailGroup[];
    /** Adapter translates href to its router's link contract, preserving aria-current/className. */
    Link?: ComponentType<ComponentProps<'a'>>;
    isActive?(href: string): boolean;
    label?: string;
}
const Anchor = (props: ComponentProps<'a'>) => <a {...props} />;

/** Render only the host's admitted navigation roster; no routes or authorization are inferred. */
export function AppRail({ groups, Link = Anchor, isActive, label = 'Navigation' }: AppRailProps) {
    return (
        <nav aria-label={label} className="min-w-0 space-y-4 px-3">
            {groups.filter(group => group.items.length > 0).map(group => (
                <section key={group.id} aria-label={group.label}>
                    <h2 className="px-3 text-xs font-medium text-sidebar-foreground/60">{group.label}</h2>
                    <ul className="space-y-1">
                        {group.items.map(item => {
                            const active = isActive?.(item.href) ?? false;
                            return (
                                <li key={item.id}>
                                    <Link href={item.href} aria-current={active ? 'page' : undefined}
                                        className={cn('flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-sm',
                                            active ? 'bg-sidebar-accent text-sidebar-active-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50')}>
                                        {item.icon}<span className="min-w-0 break-words">{item.title}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </nav>
    );
}
