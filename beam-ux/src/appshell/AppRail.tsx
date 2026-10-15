import { Fragment, type ComponentType, type ComponentProps, type ReactNode } from 'react';
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
    className?: string;
    /** Adapter owns row markup; core owns roster and active-state evaluation. */
    renderItem?(item: AppRailItem, state: { active: boolean }): ReactNode;
    /** Preserve host group/list primitives without a second navigation loop. */
    renderGroup?(group: AppRailGroup, items: ReactNode): ReactNode;
}
const Anchor = (props: ComponentProps<'a'>) => <a {...props} />;

/** Render only the host's admitted navigation roster; no routes or authorization are inferred. */
export function AppRail({ groups, Link = Anchor, isActive, label = 'Navigation',
    className = 'min-w-0 space-y-4 px-3', renderItem, renderGroup }: AppRailProps) {
    return (
        <nav aria-label={label} className={className}>
            {groups.filter(group => group.items.length > 0).map(group => {
                const items = group.items.map(item => {
                    const active = isActive?.(item.href) ?? false;
                    return <Fragment key={item.id}>{renderItem ? renderItem(item, { active }) : (
                        <li>
                            <Link href={item.href} aria-current={active ? 'page' : undefined}
                                className={cn('flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-sm',
                                    active ? 'bg-sidebar-accent text-sidebar-active-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50')}>
                                {item.icon}<span className="min-w-0 break-words">{item.title}</span>
                            </Link>
                        </li>
                    )}</Fragment>;
                });
                return <Fragment key={group.id}>{renderGroup ? renderGroup(group, items) : (
                    <section aria-label={group.label}>
                        <h2 className="px-3 text-xs font-medium text-sidebar-foreground/60">{group.label}</h2>
                        <ul className="space-y-1">{items}</ul>
                    </section>
                )}</Fragment>;
            })}
        </nav>
    );
}
