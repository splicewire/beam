// @splicewire/beam-ux/shell — the OS-shell layer (beam-ux-uplift ticket 11). A generic desktop
// chrome: a menu bar (system/realm status), a dock, a launcher (start-menu), and a window manager
// (open / focus / minimize / close). Realm surfaces are framed via HOST-INJECTED app renderers
// (`apps[].render`) — the package owns the frame, the host owns the content and the theme.
//
// Theme-neutral by contract: NO palette, fonts, or wordmark ship here. The Analog-Studio ember look
// arrives via `className`/`style` + the per-slot theme hooks (or CSS-vars) — all host-local. React-
// only chrome; imports no router (the host injects `<Link>` into its own app renderers if needed).
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { ShellApp, ShellAutoPage, ShellMenu, ShellThemeHooks } from './types.js';
import { useWindowManager, visibleWindows, isTaskOpen } from './windowManager.js';

export type ShellProps = ShellThemeHooks & {
    /** The launchable realm apps (host-built from its RealmRegistry / nav). Drives the launcher grid. */
    apps: ShellApp[];
    /** Auto-surfaced realm pages (e.g. legal /privacy · /terms) — their own launcher tier. */
    autoSurfaced?: ShellAutoPage[];
    /** OS name shown at the menu-bar start (e.g. an `audiostud·os` wordmark node). Host-supplied. */
    brand?: ReactNode;
    /** Menu-bar menus (File / Realm / Window). Rendered after the brand. */
    menus?: ShellMenu[];
    /** Extra menu-bar status content pinned to the right (clock, render-bus meter …). Host-supplied. */
    status?: ReactNode;
    /** The label for the launcher trigger in the dock. Defaults to `Launch`. */
    launchLabel?: string;
    /** Content shown on the empty desktop (wallmark, hint). Host-supplied; optional. */
    desktopBackdrop?: ReactNode;
    /** Keys to open on mount (e.g. `['site']`). Defaults to the first app. Pass `[]` for none. */
    initialOpen?: string[];
    /**
     * Small-screen breakpoint (px). At or below it the shell drops to single-app compact mode: one
     * focused window at a time, the launcher full-width. Defaults to 760 (the prototype's query).
     */
    compactBreakpoint?: number;
    /** Class applied to each launcher app/page tile (host theme hooks its glyph + text here). */
    tileClassName?: string;
    /** Class applied to each dock task. */
    taskClassName?: string;
    /** Class applied to a task when its window is open. */
    taskOpenClassName?: string;
};

/** All launchables, apps first then auto-surfaced pages — the union the window manager frames. */
type Launchable = (ShellApp | ShellAutoPage) & { auto?: boolean };

export function Shell({
    apps,
    autoSurfaced = [],
    brand,
    menus = [],
    status,
    launchLabel = 'Launch',
    desktopBackdrop,
    initialOpen,
    compactBreakpoint = 760,
    className,
    style,
    menuBarClassName,
    menuBarStyle,
    desktopClassName,
    desktopStyle,
    windowClassName,
    windowStyle,
    dockClassName,
    dockStyle,
    launcherClassName,
    launcherStyle,
    tileClassName,
    taskClassName,
    taskOpenClassName,
}: ShellProps) {
    const wm = useWindowManager();
    const [launcherOpen, setLauncherOpen] = useState(false);
    const [compact, setCompact] = useState(false);

    // The flat lookup: every launchable by key, with its content renderer.
    const byKey = useMemo(() => {
        const map = new Map<string, Launchable>();
        for (const a of apps) map.set(a.key, a);
        for (const p of autoSurfaced) map.set(p.key, { ...p, auto: true });
        return map;
    }, [apps, autoSurfaced]);

    // Cache rendered content per opened key so re-focus doesn't re-invoke `render`.
    const [rendered, setRendered] = useState<Record<string, ReactNode>>({});

    const openApp = (key: string) => {
        const app = byKey.get(key);
        if (!app) return;
        setRendered((prev) => (key in prev ? prev : { ...prev, [key]: app.render() }));
        wm.open(key);
        setLauncherOpen(false);
    };

    // Responsive: compact mode tracked off a media query (single-app focus on small screens).
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia(`(max-width: ${compactBreakpoint}px)`);
        const sync = () => setCompact(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, [compactBreakpoint]);

    // Open the initial app(s) once mounted.
    useEffect(() => {
        const keys = initialOpen ?? (apps[0] ? [apps[0].key] : []);
        keys.forEach(openApp);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Esc closes the launcher.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLauncherOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // In compact mode only the single focused window paints; on desktop, every visible window (z-sorted).
    const open = visibleWindows(wm.state);
    const painted = compact ? open.filter((w) => w.key === wm.state.focused) : open;

    return (
        <div className={className} style={style} data-beam-shell data-compact={compact ? '' : undefined}>
            {/* ── Menu bar ─────────────────────────────────────────────────── */}
            <div className={menuBarClassName} style={menuBarStyle} data-shell-menubar>
                {brand}
                {menus.map((m) => (
                    <button key={m.label} type="button" data-shell-menu onClick={m.onSelect}>
                        {m.label}
                    </button>
                ))}
                <div data-shell-menubar-spacer style={{ marginLeft: 'auto' }} />
                {status}
            </div>

            {/* ── Desktop + windows ────────────────────────────────────────── */}
            <div className={desktopClassName} style={desktopStyle} data-shell-desktop>
                {open.length === 0 && desktopBackdrop}
                {painted.map((w) => {
                    const app = byKey.get(w.key);
                    if (!app) return null;
                    const focused = wm.state.focused === w.key;
                    const route = 'route' in app ? app.route : undefined;
                    return (
                        <section
                            key={w.key}
                            className={windowClassName}
                            style={{ ...windowStyle, zIndex: w.z } as CSSProperties}
                            data-shell-window
                            data-realm={app.realm}
                            data-focused={focused ? '' : undefined}
                            onMouseDown={() => wm.focus(w.key)}
                        >
                            <div data-shell-titlebar>
                                <div data-shell-lights>
                                    <button
                                        type="button"
                                        data-shell-close
                                        aria-label={`Close ${app.title}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            wm.close(w.key);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        data-shell-min
                                        aria-label={`Minimize ${app.title}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            wm.minimize(w.key);
                                        }}
                                    />
                                    <button type="button" data-shell-zoom aria-label="Zoom" />
                                </div>
                                <div data-shell-wintitle>
                                    <span data-shell-realm-kicker>{app.realm}</span>
                                    <span data-shell-wintitle-name>{app.title}</span>
                                    {route && <span data-shell-wintitle-route>— {route}</span>}
                                </div>
                            </div>
                            <div data-shell-winbody>{rendered[w.key]}</div>
                        </section>
                    );
                })}
            </div>

            {/* ── Dock ─────────────────────────────────────────────────────── */}
            <div className={dockClassName} style={dockStyle} data-shell-dock>
                <button
                    type="button"
                    data-shell-launch
                    aria-expanded={launcherOpen}
                    aria-label="Open launcher"
                    onClick={() => setLauncherOpen((v) => !v)}
                >
                    {launchLabel}
                </button>
                <div data-shell-dock-div />
                {[...byKey.values()]
                    .filter((a) => isTaskOpen(wm.state, a.key))
                    .map((a) => {
                        const taskOpen = isTaskOpen(wm.state, a.key) && !wm.state.windows[a.key]?.minimized;
                        return (
                            <button
                                key={a.key}
                                type="button"
                                className={[taskClassName, taskOpen ? taskOpenClassName : undefined]
                                    .filter(Boolean)
                                    .join(' ')}
                                data-shell-task
                                data-realm={a.realm}
                                onClick={() => (wm.state.windows[a.key]?.minimized ? openApp(a.key) : wm.focus(a.key))}
                            >
                                <Glyph app={a} />
                                {a.title}
                            </button>
                        );
                    })}
            </div>

            {/* ── Launcher / start menu ───────────────────────────────────── */}
            <div
                data-shell-scrim
                data-on={launcherOpen ? '' : undefined}
                onClick={() => setLauncherOpen(false)}
                aria-hidden
            />
            <div
                className={launcherClassName}
                style={launcherStyle}
                data-shell-launcher
                data-on={launcherOpen ? '' : undefined}
                role="menu"
                aria-hidden={!launcherOpen}
            >
                <div data-shell-launcher-heading>Realms — launchable apps</div>
                <div data-shell-realm-grid>
                    {apps.map((a) => (
                        <button
                            key={a.key}
                            type="button"
                            className={tileClassName}
                            data-shell-app
                            data-realm={a.realm}
                            onClick={() => openApp(a.key)}
                        >
                            <Glyph app={a} large />
                            <span>
                                <span data-shell-app-name>{a.title}</span>
                                {a.subtitle && <span data-shell-app-realm>{a.subtitle}</span>}
                            </span>
                        </button>
                    ))}
                </div>
                {autoSurfaced.length > 0 && (
                    <>
                        <div data-shell-launcher-heading>Auto-surfaced pages</div>
                        <div data-shell-sub-apps>
                            {autoSurfaced.map((p) => (
                                <button
                                    key={p.key}
                                    type="button"
                                    data-shell-sub-app
                                    onClick={() => openApp(p.key)}
                                >
                                    <span data-shell-sub-app-bullet style={p.accent ? { background: p.accent } : undefined} />
                                    <span data-shell-sub-app-name>{p.title}</span>
                                    <span data-shell-sub-app-auto>auto ✦ {p.route}</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/** The app glyph — the injected `icon` if present, else a colored square keyed by `accent`. */
function Glyph({ app, large }: { app: { icon?: ReactNode; accent?: string }; large?: boolean }) {
    if (app.icon) return <span data-shell-glyph={large ? 'large' : ''}>{app.icon}</span>;
    return (
        <span
            data-shell-glyph={large ? 'large' : ''}
            aria-hidden
            style={app.accent ? { background: app.accent } : undefined}
        />
    );
}
