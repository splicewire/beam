import { useEffect, useMemo, useState, type ReactNode } from 'react';

import {
    buildNavTree,
    getNavSources,
    type NavNode,
    type NavTrack,
} from './nav-registry';

// =============================================================================
// <ExpandableNav> — the collapsible, accessible sidebar over the nav-source seam.
//
// Consumes every registered nav source (compose-many), lazy-loads each with a
// per-source loading fallback, composes the tree via the shared builder, and renders
// track → group → item. Groups are disclosures: a `<button aria-expanded>` header with
// a chevron; the group holding the active href defaults open; open/closed state persists
// to localStorage keyed by track+group. The expand/collapse transition rides `.bkit-*`
// classes and is suppressed under `prefers-reduced-motion`.
//
// Router-agnostic: the host injects `renderLink(node, { active })` so the kit never
// depends on Inertia/Next/etc. All styling reads the host's `--swc-*` tokens.
// =============================================================================

export type ExpandableNavProps = {
    /** Injected link renderer — the kit stays router-agnostic. Gets the leaf's active state. */
    renderLink: (node: NavNode, ctx: { active: boolean }) => ReactNode;
    /** The current path, used to mark the active leaf and default-open its group. */
    currentHref?: string;
    /** Explicit track render order (e.g. using → build → built); else first-seen. */
    trackOrder?: string[];
    /** Map a track key to its display label; defaults to the raw key. */
    trackLabel?: (track: string) => string;
    /** localStorage key prefix for persisted open/closed group state. */
    storagePrefix?: string;
};

const groupKey = (track: string, group: string) => `${track}::${group}`;

function readPersisted(prefix: string, key: string): boolean | undefined {
    if (typeof window === 'undefined') {
        return undefined;
    }
    try {
        const raw = window.localStorage.getItem(`${prefix}:${key}`);
        return raw === null ? undefined : raw === '1';
    } catch {
        return undefined;
    }
}

function writePersisted(prefix: string, key: string, open: boolean): void {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(`${prefix}:${key}`, open ? '1' : '0');
    } catch {
        // Storage disabled (private mode / quota) — collapse still works in-session.
    }
}

export function ExpandableNav({
    renderLink,
    currentHref,
    trackOrder,
    trackLabel = (t) => t,
    storagePrefix = 'beam-nav:open',
}: ExpandableNavProps) {
    // Per-source loaded nodes; null = still loading. Compose-many builds the tree from
    // whatever has resolved, so a slow source shows a fallback without blocking the rest.
    const sources = useMemo(() => getNavSources(), []);
    const [loaded, setLoaded] = useState<Record<string, NavNode[] | null>>(
        () => Object.fromEntries(sources.map((s) => [s.id, null])),
    );

    useEffect(() => {
        let alive = true;
        for (const source of sources) {
            source
                .load()
                .then((nodes) => {
                    if (alive) {
                        setLoaded((prev) => ({ ...prev, [source.id]: nodes }));
                    }
                })
                .catch(() => {
                    if (alive) {
                        setLoaded((prev) => ({ ...prev, [source.id]: [] }));
                    }
                });
        }
        return () => {
            alive = false;
        };
    }, [sources]);

    const pending = sources.filter((s) => loaded[s.id] === null);
    const tree: NavTrack[] = useMemo(() => {
        const nodes = sources.flatMap((s) => loaded[s.id] ?? []);
        return buildNavTree(nodes, trackOrder);
    }, [sources, loaded, trackOrder]);

    // Open/closed state per group. Undefined = not yet decided; resolved lazily against
    // the persisted value, falling back to "open if it holds the active href, else open"
    // (default-open preserves the pre-collapse sidebar; the active group is always open).
    const [openState, setOpenState] = useState<Record<string, boolean>>({});

    const isOpen = (track: string, group: string): boolean => {
        const key = groupKey(track, group);
        if (key in openState) {
            return openState[key];
        }
        const persisted = readPersisted(storagePrefix, key);
        if (persisted !== undefined) {
            return persisted;
        }
        // No stored preference: default open (matches the pre-collapse sidebar). The active
        // group is open under this default too, satisfying "current group expanded".
        return true;
    };

    const toggle = (track: string, group: string) => {
        const key = groupKey(track, group);
        setOpenState((prev) => {
            const current =
                key in prev ? prev[key] : readPersisted(storagePrefix, key) ?? true;
            const next = !current;
            writePersisted(storagePrefix, key, next);
            return { ...prev, [key]: next };
        });
    };

    return (
        <nav className="bkit-nav" aria-label="Docs sections">
            {tree.map((navTrack) => (
                <div key={navTrack.track} className="bkit-nav-track">
                    <p className="bkit-nav-track-label">
                        {trackLabel(navTrack.track)}
                    </p>
                    {navTrack.groups.map((group) => {
                        const open = isOpen(navTrack.track, group.group);
                        const panelId = `bkit-nav-${navTrack.track}-${group.group}`.replace(
                            /\s+/g,
                            '-',
                        );

                        return (
                            <div key={group.group} className="bkit-nav-group">
                                <button
                                    type="button"
                                    className="bkit-nav-group-header"
                                    aria-expanded={open}
                                    aria-controls={panelId}
                                    onClick={() =>
                                        toggle(navTrack.track, group.group)
                                    }
                                >
                                    <span
                                        className="bkit-nav-chevron"
                                        data-open={open}
                                        aria-hidden="true"
                                    >
                                        <svg
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.75"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m6 4 4 4-4 4" />
                                        </svg>
                                    </span>
                                    <span className="bkit-nav-group-title">
                                        {group.group}
                                    </span>
                                </button>
                                <div
                                    id={panelId}
                                    className="bkit-nav-collapse"
                                    data-open={open}
                                    aria-hidden={!open}
                                >
                                    <div className="bkit-nav-collapse-inner">
                                        {group.items.map((item) => (
                                            <div
                                                key={item.href ?? item.title}
                                                className="bkit-nav-item"
                                            >
                                                {renderLink(item, {
                                                    active:
                                                        item.href ===
                                                        currentHref,
                                                })}
                                                {item.children &&
                                                    item.children.length > 0 && (
                                                        <div className="bkit-nav-children">
                                                            {item.children.map(
                                                                (child) => (
                                                                    <div
                                                                        key={
                                                                            child.href ??
                                                                            child.title
                                                                        }
                                                                        className="bkit-nav-item"
                                                                    >
                                                                        {renderLink(
                                                                            child,
                                                                            {
                                                                                active:
                                                                                    child.href ===
                                                                                    currentHref,
                                                                            },
                                                                        )}
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
            {pending.length > 0 && (
                <div className="bkit-nav-loading" aria-live="polite">
                    {pending.map((s) => (
                        <span key={s.id} className="bkit-nav-loading-row">
                            Loading…
                        </span>
                    ))}
                </div>
            )}
        </nav>
    );
}
