import { useEffect } from 'react';

export type EventParameter = string | number | boolean | null | undefined | EventParameter[] | { [key: string]: EventParameter };
export type EventParameters = Record<string, EventParameter>;
export type ClickEventData = { name: string; label?: string };

type AnalyticsWindow = Window & {
    dataLayer?: unknown[];
    gtag?: (command: 'event', name: string, parameters: EventParameters) => void;
};

/** Send one named event through the active Google provider; without a provider it is a no-op. */
export function reportEvent(name: string, parameters: EventParameters = {}): void {
    if (!name || typeof window === 'undefined') return;
    const target = window as AnalyticsWindow;
    const data = Object.fromEntries(Object.entries(parameters).filter(([, value]) => value !== undefined && value !== null));

    if (typeof target.gtag === 'function') {
        target.gtag('event', name, data);
    } else if (Array.isArray(target.dataLayer)) {
        target.dataLayer.push({ event: name, ...data });
    }
}

/** Install one delegated listener on a published site root and remove it on unmount. */
export function installClickEventListener(root: Document | HTMLElement = document): () => void {
    const handleClick = (event: Event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const block = target.closest<HTMLElement>('[data-bd-event]');
        if (!block) return;

        const value = parseClickEvent(block.dataset.bdEvent);
        if (value) reportEvent(value.name, value.label === undefined ? {} : { event_label: value.label });
    };

    root.addEventListener('click', handleClick);
    return () => root.removeEventListener('click', handleClick);
}

/** SiteEntry mounts this only for a published site; Preview passes false and canvas never mounts it. */
export function SiteClickEventListener({ enabled = true }: { enabled?: boolean }) {
    useEffect(() => enabled ? installClickEventListener() : undefined, [enabled]);
    return null;
}

function parseClickEvent(raw: string | undefined): ClickEventData | undefined {
    if (!raw) return undefined;
    try {
        const value: unknown = JSON.parse(raw);
        if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
        const record = value as Record<string, unknown>;
        if (typeof record.name !== 'string' || !record.name || Object.keys(record).some(key => key !== 'name' && key !== 'label')) return undefined;
        if (record.label !== undefined && typeof record.label !== 'string') return undefined;
        return { name: record.name, ...(record.label !== undefined ? { label: record.label } : {}) };
    } catch {
        return undefined;
    }
}
