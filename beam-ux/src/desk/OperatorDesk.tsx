/**
 * `<OperatorDesk>` — the operator floating dock, lifted out of five host copies.
 *
 * You browse the LIVE site normally (every real page renders underneath, scrolls, and stays fully
 * interactive) and, as an entitled principal, you get a floating window layer ON TOP: a start-menu
 * launcher whose items are the host's operator tools, a taskbar of open windows, and an "Edit this
 * page" affordance that flips the current page's Mainframe into its in-place editor.
 *
 * ## What is in the package and what stayed at the host
 *
 * The five copies of this file across audiostud, splicewire and the three starters were ~75% the same
 * BYTES, and the divergence was data rather than policy: the `Tool` type declaration was
 * byte-identical in all five, and between the two newest copies the entire functional delta was one
 * array literal and one `TOOLS.length > 0` guard. So the array literal became the `tools` prop, the
 * palette became `--op-*` tokens (see ./css.ts), the taskbar anchor became `taskbarPlacement`, the
 * start-menu brand row became `brand`, and the orb glyph became `orbIcon`.
 *
 * Three things stayed at the host on purpose:
 *
 * 1. **`OperatorTool.render` is a host-supplied thunk and this package imports no host page.** Both
 *    the starter and splicewire copies carried an in-file warning: a page component that is ALSO
 *    statically imported from somewhere else gets merged into that importer's chunk by Rollup instead
 *    of earning its own Vite-manifest entry, and a direct visit to that page's real route then 500s
 *    with "Unable to locate file in Vite manifest". The host keeps its `lazy(() => import(…))`.
 * 2. **The router.** Nav suppression needs a router `before` hook, and this package imports none — see
 *    `navGuard`, which hands the host the arm/disarm state and lets it own the subscription.
 * 3. **The page-properties body.** audiostud's is a live 168-line form against `/beam/ux/meta`; the
 *    others are a 63-line presentational stub with different props. Genuinely divergent, so it stays
 *    behind `renderPageProperties` rather than being averaged into something neither host wants.
 *
 * ## The entitlement gate is NOT here
 *
 * No copy gated a tool by entitlement. The single gate is one file up, at the host's OS layout, which
 * reads `can['os.enter']` and decides whether to mount this at all. Mounting an OperatorDesk is
 * itself the authorization decision; nothing inside re-checks it.
 */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { OperatorOverlay } from '@schemastud/mainframe/os';
import type { OverlayWindow, WindowManager } from '@schemastud/mainframe/os';
import { OPERATOR_DESK_CSS, OPERATOR_DESK_TASKBAR_CENTER_CSS } from './css';

/**
 * A launchable operator tool: a start-menu item that opens as a float rendering a real component.
 *
 * `render` is a THUNK, never a component reference or an element — see the chunking hazard in this
 * file's header. The host is expected to wrap a `lazy()` page in a `<Suspense>` inside it.
 */
export type OperatorTool = {
    /** The window key. Also the taskbar identity, so it must be stable across renders. */
    key: string;
    /** Title bar + taskbar + start-menu label. */
    title: string;
    /** The dot/glyph colour that identifies this tool everywhere it appears. */
    accent: string;
    /** Renders the tool body. Called fresh on every render of the open window. */
    render: () => ReactNode;
    /** Initial float geometry. */
    size: { width: number; height: number };
    /** Optional sort key for the start menu + taskbar. Ties and omissions keep declaration order. */
    order?: number;
};

/** The arm/disarm handle a host's router `before` hook consults. See {@link OperatorDeskProps.navGuard}. */
export interface OperatorDeskNavGuardApi {
    /** True if a click inside a float window just armed suppression (auto-disarms ~60ms later). */
    shouldSuppress: () => boolean;
    /** Consume the armed suppression, so one click cancels at most one visit. */
    disarm: () => void;
}

/** A start-menu link. The host supplies the href because the package resolves no routes. */
export interface OperatorDeskLink {
    href: string;
    label?: string;
}

export interface OperatorDeskProps {
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
    brand?: { mark?: ReactNode; label?: string };
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
    pageWindow?: { accent?: string; size?: { width: number; height: number } };
    /**
     * Host escape hatch for window kinds the desk does not know about. Consulted FIRST, so a host can
     * also override a tool or a `page:` window; return `null` to fall through to the built-ins.
     */
    resolveWindow?: (key: string, wm: WindowManager) => OverlayWindow | null;
    /** Where the taskbar anchors. `start` (default) pins it left; `center` centres it. */
    taskbarPlacement?: 'start' | 'center';
}

const PAGE_PREFIX = 'page:';
const DEFAULT_PAGE_ACCENT = '#00b3c8';
const DEFAULT_PAGE_SIZE = { width: 380, height: 220 };

/**
 * The `beam-ux:mode` broadcast, read locally.
 *
 * `@splicewire/beam-mainframe` exports `useBeamUxMode()` beside the emitter, and that is the hook a
 * HOST should use. This package does not depend on beam-mainframe (it is not even an optional peer),
 * and taking a package edge for eleven lines would make every consumer of the dock install the CMS
 * authoring layer. The contract is a window event with one emitter, so a local reader of it is a
 * subscription, not a fork.
 */
function useDeskMode() {
    const [state, setState] = useState({ editing: false, editable: false, slug: null as string | null });

    useEffect(() => {
        const onMode = (e: Event) => {
            const d = (e as CustomEvent<{ mode?: string; editable?: boolean; slug?: string }>).detail ?? {};

            setState({ editing: d.mode === 'window', editable: !!d.editable, slug: d.slug ?? null });
        };

        window.addEventListener('beam-ux:mode', onMode);

        return () => window.removeEventListener('beam-ux:mode', onMode);
    }, []);

    return state;
}

/** Stable tool order: explicit `order` first, then declaration order. Never re-sorted by focus. */
function orderTools(tools: OperatorTool[]): OperatorTool[] {
    return tools
        .map((tool, index) => ({ tool, index }))
        .sort((a, b) => (a.tool.order ?? a.index) - (b.tool.order ?? b.index) || a.index - b.index)
        .map((entry) => entry.tool);
}

function StartMenu({
    tools,
    openKeys,
    inControlPanel,
    editing,
    pageEditable,
    brand,
    links,
    onEditToggle,
    onOpenTool,
    onClose,
}: {
    tools: OperatorTool[];
    openKeys: string[];
    inControlPanel: boolean;
    editing: boolean;
    pageEditable: boolean;
    brand?: OperatorDeskProps['brand'];
    links?: OperatorDeskProps['links'];
    onEditToggle: () => void;
    onOpenTool: (tool: OperatorTool) => void;
    onClose: () => void;
}) {
    const link = inControlPanel ? links?.frontend : links?.control;
    const hasFooter = !!link || !!links?.signOut;

    return (
        <>
            <div className="op-scrim" onClick={onClose} />
            <div className="op-menu" role="menu">
                {brand ? (
                    <div className="op-menu-brand">
                        {brand.mark}
                        {brand.label}
                    </div>
                ) : null}
                <div className="head">Operator</div>
                <button
                    type="button"
                    className={editing ? 'active' : undefined}
                    disabled={!editing && !pageEditable}
                    onClick={() => {
                        if (!editing && !pageEditable) {
                            return;
                        }

                        onClose();
                        onEditToggle();
                    }}
                >
                    <span className="ico">{editing ? '✕' : '✎'}</span>
                    {editing ? 'Exit editing' : 'Edit this page'}
                    {!editing && !pageEditable ? (
                        <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>
                            n/a
                        </span>
                    ) : null}
                </button>
                {tools.length > 0 && <div className="op-div" />}
                {tools.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        className={openKeys.includes(t.key) ? 'active' : undefined}
                        onClick={() => {
                            onOpenTool(t);
                            onClose();
                        }}
                    >
                        <span className="glyph" style={{ background: t.accent }} />
                        {t.title}
                        {openKeys.includes(t.key) ? (
                            <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>
                                open
                            </span>
                        ) : null}
                    </button>
                ))}
                {hasFooter && <div className="op-div" />}
                {link ? (
                    <a href={link.href}>
                        <span className="ico">{inControlPanel ? '◱' : '▤'}</span>{' '}
                        {link.label ?? (inControlPanel ? 'Front-end' : 'Control Panel')}
                    </a>
                ) : null}
                {links?.signOut ? (
                    <button type="button" onClick={links.signOut}>
                        <span className="ico">⏻</span> Sign out
                    </button>
                ) : null}
            </div>
        </>
    );
}

export function OperatorDesk({
    tools,
    navGuard,
    inControlPanel = false,
    links,
    brand,
    orbLabel = 'Operator',
    orbIcon,
    renderPageProperties,
    pageWindow,
    resolveWindow: hostResolveWindow,
    taskbarPlacement = 'start',
}: OperatorDeskProps) {
    const { editing, editable: pageEditable, slug: currentSlug } = useDeskMode();
    const ordered = orderTools(tools);

    // Nav suppression, arm side. A click inside a float window arms a one-shot flag; the host's router
    // hook consumes it to cancel the GET visit that would otherwise yank the live backdrop away. The
    // 60ms window is the same as every host copy carried — long enough for the click to reach the
    // router, short enough that a stale arm cannot cancel an unrelated later visit.
    const suppressNextNav = useRef(false);
    const armSuppress = () => {
        suppressNextNav.current = true;
        window.setTimeout(() => {
            suppressNextNav.current = false;
        }, 60);
    };

    // Hand the host a STABLE handle. `navGuard` is invoked from OperatorOverlay's `onWindowManager`,
    // which subscribes once; a fresh object identity per render would re-subscribe the host's router
    // hook on every render.
    const guardApi = useRef<OperatorDeskNavGuardApi>({
        shouldSuppress: () => suppressNextNav.current,
        disarm: () => {
            suppressNextNav.current = false;
        },
    });

    const resolveWindow = (key: string, wm: WindowManager): OverlayWindow | null => {
        const hosted = hostResolveWindow?.(key, wm) ?? null;

        if (hosted) {
            return hosted;
        }

        if (key.startsWith(PAGE_PREFIX) && renderPageProperties) {
            const slug = key.slice(PAGE_PREFIX.length);

            return {
                title: `Page · ${slug}`,
                accent: pageWindow?.accent ?? DEFAULT_PAGE_ACCENT,
                // `editable`/`editing` close over the CURRENT broadcast — resolveWindow is called
                // fresh on every render, so the body never reads a stale mode.
                render: () =>
                    renderPageProperties({
                        slug,
                        editable: pageEditable,
                        editing,
                        wm,
                        close: () => wm.minimize(key),
                    }),
            };
        }

        const tool = ordered.find((t) => t.key === key);

        return tool ? { title: tool.title, accent: tool.accent, render: tool.render } : null;
    };

    // ALL open windows (including minimized) in STABLE order — fixed tool order, then page windows
    // sorted by key — so focusing a window never reshuffles the taskbar.
    const stableKeys = (wm: WindowManager) => [
        ...ordered.map((t) => t.key),
        ...Object.keys(wm.state.windows)
            .filter((k) => k.startsWith(PAGE_PREFIX))
            .sort(),
    ];

    // "Edit this page" opens the page-properties float for the current slug (its own dock item, same
    // as any other window) when the host renders one; otherwise it enters the in-place editor
    // directly. Exiting an already-active edit always dispatches straight through.
    const onEditToggle = (wm: WindowManager) => {
        if (editing) {
            window.dispatchEvent(new CustomEvent('beam-ux:exit'));

            return;
        }

        if (renderPageProperties && currentSlug) {
            wm.open(`${PAGE_PREFIX}${currentSlug}`, {
                geometry: pageWindow?.size ?? DEFAULT_PAGE_SIZE,
                presentation: 'float',
            });

            return;
        }

        window.dispatchEvent(new CustomEvent('beam-ux:edit'));
    };

    return (
        <>
            <style
                dangerouslySetInnerHTML={{
                    __html:
                        OPERATOR_DESK_CSS +
                        (taskbarPlacement === 'center' ? OPERATOR_DESK_TASKBAR_CENTER_CSS : ''),
                }}
            />
            <OperatorOverlay
                stableKeys={stableKeys}
                resolveWindow={resolveWindow}
                orbLabel={orbLabel}
                orbIcon={orbIcon}
                onWindowBodyClickCapture={armSuppress}
                onWindowManager={() => navGuard?.(guardApi.current)}
                renderLauncher={({ wm, onClose }) => (
                    <StartMenu
                        tools={ordered}
                        openKeys={wm.state.zOrder}
                        inControlPanel={inControlPanel}
                        editing={editing}
                        pageEditable={pageEditable}
                        brand={brand}
                        links={links}
                        onEditToggle={() => onEditToggle(wm)}
                        onOpenTool={(tool) => wm.open(tool.key, { geometry: tool.size, presentation: 'float' })}
                        onClose={onClose}
                    />
                )}
            />
        </>
    );
}
