/**
 * The desk shell skin — rail + white-hairline topbar + main + overlay — reproducing a real
 * beam-mainframe `desk` so a no-backend prototype reads in the exact app shell context. "Chrome is
 * fixed; only `main` changes": wrap a prototype's content in this and it gets the rail + topbar for
 * free, on-brand by construction.
 *
 * Two host couplings are injected (ADR-0116): the **brand** (a `BrandComponent` prop, not a hardcoded
 * lockup) and the **nav data** (a `nav: NavGroup[]` prop — the splicewire nav stays host-owned). The
 * shell references host CSS custom-property tokens by CLASSNAME (`bg-sidebar-deep`,
 * `text-sidebar-foreground`, `bg-sidebar-accent`, `border-sidebar-primary`,
 * `text-sidebar-active-foreground`, `bg-sidebar-avatar`, and the `dotted-bg` utility) — it ships NO
 * bespoke stylesheet; the host defines those tokens in its own `:root`. Lifted from splicewire-app's
 * `_chrome/PrototypeDesk`, whose `@/` brand + `./nav` + `@/lib/utils` imports are now injections.
 */
import { type ComponentType, type ReactNode } from 'react';
import { cn as defaultCn, type Cn } from './cn';
import type { NavGroup } from './types';

function Rail({
    groups,
    active,
    BrandComponent,
    cn,
}: {
    groups: NavGroup[];
    active?: string;
    BrandComponent?: ComponentType;
    cn: Cn;
}) {
    return (
        <aside className="flex w-[216px] flex-none flex-col bg-sidebar-deep py-[18px] text-sidebar-foreground">
            {/* brand — the host-injected lockup (SpliceMark + wordmark on splicewire). Absent on a host
                that provides none; the styled slot still holds the rail's top spacing. */}
            <div className="flex items-center gap-[9px] px-[18px] pb-[22px] text-[17px] font-semibold tracking-tight text-sidebar-active-foreground">
                {BrandComponent && <BrandComponent />}
            </div>

            {/* nav */}
            <nav className="flex-1 space-y-4 overflow-y-auto px-2.5">
                {groups.map((group, gi) => (
                    <div key={gi} className="space-y-0.5">
                        {group.label && (
                            <div className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-sidebar-foreground/55">
                                {group.label}
                            </div>
                        )}
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.key === active;
                            return (
                                <div
                                    key={item.key}
                                    className={cn(
                                        'flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-2.5 py-2 text-[13px] transition-colors',
                                        isActive
                                            ? 'border-sidebar-primary bg-sidebar-accent font-medium text-sidebar-active-foreground'
                                            : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/40',
                                    )}
                                >
                                    <Icon className="size-[17px] flex-none opacity-90" strokeWidth={1.75} />
                                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                    {/* proposed-delta marker: a row a redesign PROPOSES, not in today's rail. */}
                                    {item.proposed && (
                                        <span
                                            className="size-1.5 flex-none rounded-full ring-1 ring-sidebar-primary/70"
                                            title={`Proposed by the redesign${item.ticket ? ` (ticket ${item.ticket})` : ''} — not in today's rail`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* legend — explains the proposed-delta ring-dot (throwaway prototype affordance) */}
            <div className="mt-1 flex items-center gap-2 px-4 py-1 text-[10px] text-sidebar-foreground/45">
                <span className="size-1.5 flex-none rounded-full ring-1 ring-sidebar-primary/70" />
                proposed by the redesign
            </div>

            {/* railFooter — sample tenant chip + identity (stand-in prototype content) */}
            <div className="mt-2 space-y-1 px-3 pt-3">
                <div className="flex items-center gap-2 rounded-md bg-sidebar-accent/50 px-2.5 py-1.5 text-[12px] text-sidebar-active-foreground">
                    <span className="grid size-5 flex-none place-items-center rounded bg-sidebar-primary/25 text-[9px] font-bold text-sidebar-active-foreground">
                        BI
                    </span>
                    <span className="min-w-0 flex-1 truncate">tenant: billing-demo</span>
                    <span className="text-sidebar-foreground/50">⌄</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-sidebar-foreground/75">
                    <span className="grid size-5 flex-none place-items-center rounded-full bg-sidebar-avatar text-[9px] font-semibold text-sidebar-active-foreground">
                        S
                    </span>
                    <span className="min-w-0 flex-1 truncate">Stephen Rushing</span>
                </div>
            </div>
        </aside>
    );
}

export interface PrototypeDeskProps {
    /** The rail nav groups (host-owned data). */
    nav: NavGroup[];
    /** The brand lockup rendered at the rail top. Omit for a host with no brand mark. */
    BrandComponent?: ComponentType;
    /** active nav key */
    active?: string;
    /** topBar.lead — breadcrumb / section title */
    breadcrumb?: ReactNode;
    /** topBar.actions — right-aligned safe verbs + primary CTA */
    actions?: ReactNode;
    /** canvas policy: Settings/meta = flat, work = dotted (recipe ground-truth) */
    canvas?: 'flat' | 'dotted';
    /** the `main` slot fill — the only real variable */
    children: ReactNode;
    /** root-level floating affordances (overlay slot) */
    overlay?: ReactNode;
    /** Override the bundled `cn` (e.g. the host's tailwind-merge `cn`). */
    cn?: Cn;
}

/** The desk shell skin. Wrap a prototype's `main` content in this for shipped-shell fidelity. */
export function PrototypeDesk({
    nav,
    BrandComponent,
    active,
    breadcrumb,
    actions,
    canvas = 'dotted',
    children,
    overlay,
    cn = defaultCn,
}: PrototypeDeskProps) {
    return (
        <div className="flex h-screen overflow-hidden">
            <Rail groups={nav} active={active} BrandComponent={BrandComponent} cn={cn} />

            <div className="flex min-w-0 flex-1 flex-col">
                {/* white hairline top bar */}
                <div className="flex flex-none items-center gap-3 border-b border-border bg-card px-6 py-2">
                    <div className="min-w-0 flex-1 text-sm">{breadcrumb}</div>
                    <div className="flex items-center gap-2">{actions}</div>
                </div>

                <main
                    className={cn(
                        'flex-1 overflow-y-auto px-6 py-6',
                        canvas === 'flat' ? 'bg-background' : 'dotted-bg',
                    )}
                >
                    {children}
                </main>
            </div>

            {overlay}
        </div>
    );
}

/** A breadcrumb helper matching the real SectionBar look (`Settings › Account`). */
export function Crumb({ trail }: { trail: string[] }) {
    return (
        <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
            {trail.map((part, i) => (
                <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-muted-foreground/50">›</span>}
                    <span className={i === trail.length - 1 ? 'text-foreground' : undefined}>
                        {part}
                    </span>
                </span>
            ))}
        </div>
    );
}
