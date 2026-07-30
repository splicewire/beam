/**
 * The Settings meta-area LAYOUT — a `max-w-5xl` container + left sub-nav column + `flex-1` content,
 * reproducing a real tenant Settings shell so a no-backend prototype reads left-aligned (content
 * fills `flex-1`, never centered in a narrow column).
 *
 * Decoupled from any host nav: it takes its `tabs` as a PROP (the splicewire `nav.ts` data stays
 * host-owned) so the layout is brand-free and portable. Lifted from splicewire-app's
 * `_chrome/SettingsFrame`, whose `./nav` import is now a host-injected prop.
 */
import { type ReactNode } from 'react';
import { cn as defaultCn, type Cn } from './cn';
import type { NavTab } from './types';

export interface SettingsFrameProps {
    active: string;
    /** Sub-nav tabs (host-owned data). The active one is highlighted; these are display-only. */
    tabs: NavTab[];
    children: ReactNode;
    /** Heading above the sub-nav. Defaults to "Settings". */
    title?: string;
    /** Override the bundled `cn` (e.g. the host's tailwind-merge `cn`). */
    cn?: Cn;
}

export function SettingsFrame({
    active,
    tabs,
    children,
    title = 'Settings',
    cn = defaultCn,
}: SettingsFrameProps) {
    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>

            <div className="flex flex-col gap-6 md:flex-row">
                <nav className="flex shrink-0 gap-1 overflow-x-auto md:w-44 md:flex-col">
                    {tabs.map(({ key, label, icon: Icon }) => {
                        const isActive = key === active;
                        return (
                            <div
                                key={key}
                                className={cn(
                                    'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                                )}
                            >
                                <Icon className="size-4" />
                                {label}
                            </div>
                        );
                    })}
                </nav>

                <div className="min-w-0 flex-1 space-y-6">{children}</div>
            </div>
        </div>
    );
}
