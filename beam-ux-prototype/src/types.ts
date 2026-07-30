/**
 * Generic types for the prototyping runtime (rehome-ui / ADR-0116). Host-agnostic: the
 * splicewire nav *data* stays in the host's `nav.ts`; only the *shapes* live here so the
 * packaged chrome (PrototypeDesk, SettingsFrame, VariantBar) can type its props.
 */
import type { ComponentType } from 'react';

/** A lucide-react (or any) icon component. Typed structurally so the package needn't import lucide. */
export type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>;

/** One rail nav row. `proposed`/`ticket` are prototype-only affordances (a marked redesign delta). */
export interface NavItem {
    key: string;
    label: string;
    icon: IconComponent;
    /** true = a redesign proposal not in today's shipped rail; the desk marks it with a ring-dot. */
    proposed?: boolean;
    /** originating ticket, for the proposed-delta marker tooltip. */
    ticket?: string;
}

/** A labelled group of rail nav rows. */
export interface NavGroup {
    label?: string;
    items: NavItem[];
}

/** One tab in a `SettingsFrame` sub-nav. */
export interface NavTab {
    key: string;
    label: string;
    icon: IconComponent;
}

/** One entry in a `VariantBar` `?variant=` switcher. */
export interface VariantSpec {
    key: string;
    label: string;
}
