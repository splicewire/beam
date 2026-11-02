import * as react from 'react';
import { ReactNode } from 'react';
import { WindowManager, OverlayWindow } from '@schemastud/mainframe/os';

/**
 * A launchable operator tool: a start-menu item that opens as a float rendering a real component.
 *
 * `render` is a THUNK, never a component reference or an element — see the chunking hazard in this
 * file's header. The host is expected to wrap a `lazy()` page in a `<Suspense>` inside it.
 */
type OperatorTool = {
    /** The window key. Also the taskbar identity, so it must be stable across renders. */
    key: string;
    /** Title bar + taskbar + start-menu label. */
    title: string;
    /** The dot/glyph colour that identifies this tool everywhere it appears. */
    accent: string;
    /** Renders the tool body. Called fresh on every render of the open window. */
    render: () => ReactNode;
    /** Initial float geometry. */
    size: {
        width: number;
        height: number;
    };
    /** Optional sort key for the start menu + taskbar. Ties and omissions keep declaration order. */
    order?: number;
};
/** The arm/disarm handle a host's router `before` hook consults. See {@link OperatorDeskProps.navGuard}. */
interface OperatorDeskNavGuardApi {
    /** True if a click inside a float window just armed suppression (auto-disarms ~60ms later). */
    shouldSuppress: () => boolean;
    /** Consume the armed suppression, so one click cancels at most one visit. */
    disarm: () => void;
}
/** A start-menu link. The host supplies the href because the package resolves no routes. */
interface OperatorDeskLink {
    href: string;
    label?: string;
}
interface OperatorDeskProps {
    /** The host's operator tool roster. An empty array is legal — the menu simply has no tool block. */
    tools: OperatorTool[];
    /**
     * The router seam, re-exposed rather than absorbed. The desk owns the arming (it hears the click
     * inside a window body, because that is chrome it renders); the host owns the CANCEL, because that
     * needs a router this package refuses to import. Called once with a stable handle; return a
     * cleanup.
     *
     * The whole of a host's implementation is its existing `router.on('before', …)` GET-cancel:
     *
     * ```tsx
     * navGuard={({ shouldSuppress, disarm }) =>
     *     router.on('before', (event) => {
     *         const method = (event.detail?.visit?.method ?? 'get').toLowerCase();
     *         if (shouldSuppress() && method === 'get') { disarm(); return false; }
     *     })
     * }
     * ```
     *
     * Only GET *navigations* are suppressed; POST/PUT/DELETE actions still go through, so a form
     * inside a float works and only a link that would yank the live backdrop away is cancelled.
     */
    navGuard?: (api: OperatorDeskNavGuardApi) => void | (() => void);
    /** Whether the page under the overlay is already a control-panel page — picks which link shows. */
    inControlPanel?: boolean;
    /** The start menu's footer links. Anything omitted is simply not rendered. */
    links?: {
        frontend?: OperatorDeskLink;
        control?: OperatorDeskLink;
        /** Sign-out is an ACTION, not an href — the host owns the POST (and its CSRF). */
        signOut?: () => void;
    };
    /** The start menu's brand row. Omit it entirely for a menu with no brand row (audiostud's shape). */
    brand?: {
        mark?: ReactNode;
        label?: string;
    };
    /** The launcher trigger label. */
    orbLabel?: string;
    /** The launcher trigger glyph. Falls through to `OperatorOverlay`'s plain `.mark` square. */
    orbIcon?: ReactNode;
    /**
     * Render the per-page properties float for `page:{slug}`. Omit it and "Edit this page" dispatches
     * `beam-ux:edit` directly instead of opening a properties window first.
     *
     * `close()` DISMISSES the window by minimizing it — it stays in the taskbar. That is exactly what
     * every host copy did before the lift (`wm.minimize(key)` then dispatch `beam-ux:edit`), and it is
     * the behaviour the handoff into the in-place editor depends on: you leave the editor and your
     * page's properties are still docked. A host wanting a real close has `wm` right there.
     */
    renderPageProperties?: (args: {
        slug: string;
        editable: boolean;
        editing: boolean;
        wm: WindowManager;
        close: () => void;
    }) => ReactNode;
    /** Chrome for the page-properties float. */
    pageWindow?: {
        accent?: string;
        size?: {
            width: number;
            height: number;
        };
    };
    /**
     * Host escape hatch for window kinds the desk does not know about. Consulted FIRST, so a host can
     * also override a tool or a `page:` window; return `null` to fall through to the built-ins.
     */
    resolveWindow?: (key: string, wm: WindowManager) => OverlayWindow | null;
    /** Where the taskbar anchors. `start` (default) pins it left; `center` centres it. */
    taskbarPlacement?: 'start' | 'center';
}
declare function OperatorDesk({ tools, navGuard, inControlPanel, links, brand, orbLabel, orbIcon, renderPageProperties, pageWindow, resolveWindow: hostResolveWindow, taskbarPlacement, }: OperatorDeskProps): react.JSX.Element;

/**
 * The operator desk's chrome CSS, as a **string**.
 *
 * ## Why a string and not a `.css` file
 *
 * Same reasoning `PROSE_CSS` and `DOCS_TEMPLATE_CSS` already settled for this package, and it bites
 * twice here rather than once. A host's Tailwind scans the HOST's sources, not
 * `node_modules/@splicewire/beam-ux/dist`, so a utility class shipped inside a package bundle is a
 * name with no rule behind it. And this package declares `"sideEffects": false`, which entitles a
 * bundler to DELETE a bare `import './desk.css'` as dead code. Either failure renders the dock
 * unstyled behind an HTTP 200 — correct markup, no visual, nothing red anywhere in CI.
 *
 * So the desk injects this string through a `<style>` element it renders itself. That is a value the
 * bundler can see being used, and it needs no host build configuration at all.
 *
 * ## Every colour and font is a token with a literal fallback
 *
 * The three host copies this was lifted from differed in exactly one axis besides their tool roster:
 * their palette. Two rode `var(--beam-*, …)`; one hardcoded a warm brand. Neither is the package's
 * business, so the package names an `--op-*` token for each role and supplies the beam reading as the
 * fallback:
 *
 * | token                  | role                                            |
 * |------------------------|-------------------------------------------------|
 * | `--op-surface`         | window paper (the tool body's own background)    |
 * | `--op-surface-raised`  | title bar / taskbar / menu — the chrome ground   |
 * | `--op-fg`              | chrome text                                     |
 * | `--op-fg-muted`        | chrome text, de-emphasised                      |
 * | `--op-accent`          | the one attention colour (orb open state)       |
 * | `--op-edge`            | the raised-on-raised divider ground             |
 * | `--op-font`            | the overlay's UI font                           |
 * | `--op-font-mono`       | the chrome's monospace face (titles, taskbar)   |
 *
 * The fallback chain is `var(--op-x, var(--beam-x, <literal>))` on purpose. A beam host that defines
 * only `--beam-*` renders BYTE-IDENTICALLY to what it rendered before the lift; a non-beam host that
 * defines neither gets the literal; and a host that wants to re-theme only the dock sets `--op-*` on
 * any ancestor and wins over both. Nothing here needs a host to define anything.
 *
 * The desk's OWN class names (`.op-*`) are shared with `@schemastud/mainframe/os`'s `OperatorOverlay`,
 * which emits the markup — this string is the skin for chrome that package draws.
 */
declare const OPERATOR_DESK_CSS = "\n.op-desk-overlay{position:fixed;inset:0;z-index:2000;pointer-events:none;font-family:var(--op-font, system-ui, sans-serif)}\n.op-desk-overlay > *{pointer-events:auto}\n.op-win-inner{display:flex;flex-direction:column;height:100%;background:var(--op-surface, #f8fafc);border:1px solid rgba(15,23,42,.14);border-radius:12px;box-shadow:0 30px 90px -24px rgba(0,0,0,.5);overflow:hidden}\n.op-win-bar{display:flex;align-items:center;gap:9px;height:38px;flex:none;padding:0 12px;background:var(--op-surface-raised, var(--beam-paper-raised, #0e1b18));color:var(--op-fg, var(--beam-ink, #dcede8));cursor:move;user-select:none}\n.op-win-dot{width:10px;height:10px;border-radius:30%;flex:none}\n.op-win-title{font-family:var(--op-font-mono, ui-monospace, monospace);font-size:11px;letter-spacing:.12em;text-transform:uppercase}\n.op-win-ctrls{margin-left:auto;display:flex;align-items:center;gap:1px}\n.op-win-x{background:none;border:none;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)));font-size:16px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;min-width:28px}\n.op-win-x:hover{color:var(--op-fg, var(--beam-ink, #dcede8));background:rgba(255,255,255,.1)}\n.op-win-x.on{color:var(--op-surface-raised, var(--beam-paper-raised, #0e1b18))}\n.op-win-body{flex:1;min-height:0;overflow:auto;background:var(--op-surface, #f8fafc);color:#0f172a}\n.op-taskbar{position:absolute;left:16px;bottom:16px;display:flex;align-items:center;gap:4px;padding:6px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:color-mix(in srgb, var(--op-surface-raised, var(--beam-paper-raised, #0e1b18)) 94%, transparent);backdrop-filter:blur(14px);box-shadow:0 18px 55px -14px rgba(0,0,0,.6)}\n.op-taskbar button{display:flex;align-items:center;gap:7px;border:none;background:none;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)));cursor:pointer;font-family:var(--op-font-mono, ui-monospace, monospace);font-size:11px;letter-spacing:.06em;padding:8px 12px;border-radius:9px}\n.op-taskbar button:hover{color:var(--op-fg, var(--beam-ink, #dcede8));background:rgba(255,255,255,.08)}\n.op-taskbar button.focused{color:var(--op-fg, var(--beam-ink, #dcede8));background:rgba(255,255,255,.12)}\n.op-taskbar button.minned .glyph{opacity:.55}\n.op-taskbar .glyph{width:9px;height:9px;border-radius:30%;flex:none}\n.op-orb{position:absolute;right:16px;bottom:16px;display:flex;align-items:center;gap:9px;padding:9px 15px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:color-mix(in srgb, var(--op-surface-raised, var(--beam-paper-raised, #0e1b18)) 94%, transparent);backdrop-filter:blur(14px);color:var(--op-fg, var(--beam-ink, #dcede8));cursor:pointer;font-family:var(--op-font-mono, ui-monospace, monospace);font-size:11px;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 18px 55px -14px rgba(0,0,0,.6)}\n.op-orb:hover{border-color:var(--op-edge, var(--beam-line, #1b2e2a))}\n.op-orb.is-open{border-color:var(--op-accent, var(--beam-accent, #00b3c8));background:var(--op-edge, var(--beam-line, #1b2e2a))}\n.op-orb .mark{width:16px;height:16px;flex:none;color:var(--op-fg, var(--beam-ink, #dcede8))}\nbody[data-scroll-locked] .op-orb{visibility:hidden}\n.op-scrim{position:absolute;inset:0;background:transparent}\n.op-menu{position:absolute;right:16px;bottom:66px;width:240px;padding:7px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:color-mix(in srgb, var(--op-surface-raised, var(--beam-paper-raised, #0e1b18)) 97%, transparent);backdrop-filter:blur(16px);box-shadow:0 26px 70px -18px rgba(0,0,0,.65);display:flex;flex-direction:column;gap:2px}\n.op-menu-brand{display:flex;align-items:center;gap:8px;padding:9px 10px 11px;margin-bottom:3px;border-bottom:1px solid rgba(255,255,255,.08);color:var(--op-fg, var(--beam-ink, #dcede8));font-family:var(--op-font-mono, ui-monospace, monospace);font-size:13px;font-weight:600;letter-spacing:.02em}\n.op-menu-brand-mark{width:18px;height:18px;flex:none;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)))}\n.op-menu .head{padding:8px 10px 6px;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)));font-family:var(--op-font-mono, ui-monospace, monospace);font-size:9px;letter-spacing:.18em;text-transform:uppercase}\n.op-menu button,.op-menu a{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 11px;border-radius:9px;border:none;background:none;color:var(--op-fg, var(--beam-ink, #dcede8));cursor:pointer;font:inherit;font-size:13px;text-decoration:none}\n.op-menu button:hover,.op-menu a:hover{background:rgba(255,255,255,.07);color:var(--op-fg, var(--beam-ink, #dcede8))}\n.op-menu button:disabled{opacity:.4;cursor:default}\n.op-menu button:disabled:hover{background:none;color:var(--op-fg, var(--beam-ink, #dcede8))}\n.op-menu button.active{color:var(--op-fg, var(--beam-ink, #dcede8));background:var(--op-edge, var(--beam-line, #1b2e2a))}\n.op-menu .glyph{width:10px;height:10px;border-radius:30%;flex:none}\n.op-menu .ico{width:16px;text-align:center;flex:none;opacity:.85}\n.op-menu .op-div{height:1px;background:rgba(255,255,255,.1);margin:5px 4px}\n.op-menu .muted{color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)))}\n";
/**
 * The `taskbarPlacement: 'center'` variant, appended AFTER the base rule.
 *
 * The taskbar element is drawn by `OperatorOverlay` in `@schemastud/mainframe/os`, which exposes no
 * `className` or `style` seam on it — so the anchor cannot be set from the markup side. An override
 * rule of equal specificity, emitted later in the same `<style>`, is the whole mechanism: last one
 * wins, no `!important`, and a host that redefines `.op-taskbar` itself still beats both.
 *
 * `left` is reset explicitly rather than left to `auto`, because the base rule sets it.
 */
declare const OPERATOR_DESK_TASKBAR_CENTER_CSS = "\n.op-taskbar{left:50%;transform:translateX(-50%)}\n";

export { OPERATOR_DESK_CSS, OPERATOR_DESK_TASKBAR_CENTER_CSS, OperatorDesk, type OperatorDeskLink, type OperatorDeskNavGuardApi, type OperatorDeskProps, type OperatorTool };
