/**
 * `@splicewire/beam-ux/shell` — the shared shapes for the OS-shell layer (beam-ux-uplift ticket 11).
 *
 * The shell is a generic desktop chrome: a menu bar, a dock, a launcher (start-menu), and a window
 * manager. It frames realm surfaces through HOST-INJECTED app renderers — the package owns the
 * frame, the host owns the content. Structural, framework-neutral, and theme-neutral by design,
 * mirroring the `/site` (ticket 10) and `/account` (ticket 13) subpaths: no palette, fonts, or
 * wordmark ship here; the Analog-Studio look stays host-local (passed via className/style/CSS-vars).
 */

import type { CSSProperties, ReactNode } from 'react';

/**
 * A launchable app — one entry in the launcher grid and (once open) one window. The HOST builds this
 * list (deriving from its RealmRegistry / nav) and passes it via the `apps` prop. `render` is the
 * host-injected app renderer: the shell owns the window frame, the host decides what the window shows
 * (a real component, an `<iframe>` of the realm route, whatever). The package never deep-routes into
 * realm pages.
 */
export type ShellApp = {
    /** Stable identity — the window key + dock/task id. Unique across `apps`. */
    key: string;
    /** Display name (launcher tile, dock task, window title). */
    title: string;
    /** Realm label (e.g. `SITE`, `ACCOUNT`, `STUDIO`, `OPERATOR`) — the window breadcrumb + tint key. */
    realm: string;
    /** Route/slug shown in the window title breadcrumb (e.g. `/`, `/account`). Optional. */
    route?: string;
    /** A one-line descriptor for the launcher tile (e.g. `Public · marketing`). Optional. */
    subtitle?: string;
    /** Accent color token for the app glyph (host theme — e.g. an ember-family hue per realm). */
    accent?: string;
    /** An icon node for the launcher tile + dock task. A colored square is drawn when omitted. */
    icon?: ReactNode;
    /**
     * The app content. Called when the window is first opened; the returned node is framed by the
     * shell window. The HOST owns this — a real component, an iframe, a Mainframe host, anything.
     */
    render: () => ReactNode;
};

/**
 * An auto-surfaced page — a realm-derived surface (e.g. the legal `/privacy` · `/terms` from ticket
 * 12) shown in the launcher as its OWN tier, below the realm apps. Same frame, distinct list: the
 * launcher inverts "why isn't it a realm?" into "it's automatically an app."
 */
export type ShellAutoPage = {
    key: string;
    title: string;
    /** The auto-surfaced route (shown with an `AUTO ✦ /path` tag). */
    route: string;
    realm?: string;
    accent?: string;
    icon?: ReactNode;
    render: () => ReactNode;
};

/** A menu-bar menu item (e.g. `File`, `Realm`, `Window`). `onSelect` is optional. */
export type ShellMenu = {
    label: string;
    onSelect?: () => void;
};

/**
 * Theme hooks — every structural wrapper takes a class + style so a host CSS layer / token set
 * drives the look. The package bakes in NO palette; the Analog-Studio ember theme is host-supplied.
 */
export type ShellThemeHooks = {
    className?: string;
    style?: CSSProperties;
    menuBarClassName?: string;
    menuBarStyle?: CSSProperties;
    desktopClassName?: string;
    desktopStyle?: CSSProperties;
    windowClassName?: string;
    windowStyle?: CSSProperties;
    dockClassName?: string;
    dockStyle?: CSSProperties;
    launcherClassName?: string;
    launcherStyle?: CSSProperties;
};
