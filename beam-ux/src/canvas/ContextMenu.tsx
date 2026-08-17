// A minimal right-click menu for a canvas node — Duplicate / Move Up / Move Down / Insert (submenu) /
// Delete. Closes on outside click or Escape. Positioned at the triggering click's viewport coordinates
// (fixed). A leaf action with no `children` fires `onSelect` and closes the menu; an action WITH
// `children` (Insert's block-type flyout) opens a nested submenu on hover instead — it never fires
// `onSelect` itself (there's nothing to "select," it's just a grouping).
//
// The outside-click listener is capture-phase on `window` — it fires BEFORE the event reaches an
// item button's own onClick (which runs in the bubble phase), so it must check `.contains()` against a
// ref rather than closing unconditionally (relying on the menu's own bubble-phase `stopPropagation()`
// to save it — that can never reach back in time to cancel a capture-phase listener that already ran).
// A real, physically-dispatched click (verified live: not a synthetic `.click()` call, which happens
// not to trigger this) closes the menu on the SAME tick as the item's own click, before that handler
// runs, if the ref check is missing — the action silently never fires, menu just closes. `.click()` in
// a test/JS-console context doesn't reproduce this, which is how it went unnoticed.
import { useEffect, useRef, useState } from 'react';

export interface ContextMenuAction {
    label: string;
    onSelect?: () => void;
    /** Renders in the "destructive" treatment (Delete). */
    danger?: boolean;
    /** Renders dimmed and non-interactive (e.g. Move Up on the first sibling). */
    disabled?: boolean;
    /** A nested flyout of actions (e.g. Insert's block-type picker), opened on hover. */
    children?: ContextMenuAction[];
}

export interface ContextMenuState {
    x: number;
    y: number;
    /** The path this menu was opened for — carried for the caller's convenience, unused internally. */
    path: string;
}

export interface ContextMenuProps {
    state: ContextMenuState;
    actions: ContextMenuAction[];
    onClose: () => void;
}

export function ContextMenu({ state, actions, onClose }: ContextMenuProps) {
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose();
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        // Capture phase: a click anywhere (including on a canvas node behind the menu) closes it before
        // that node's own click handler runs — right-click-then-click-elsewhere shouldn't leave it open.
        // The `.contains()` check (not `stopPropagation()` on the menu itself — bubble phase can't undo
        // a capture-phase listener that already ran) is what keeps a click ON a menu item from closing
        // the menu before the item's own onClick fires.
        window.addEventListener('click', onDocClick, true);
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('click', onDocClick, true);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose]);

    return (
        <div
            ref={rootRef}
            className="ve-menu"
            style={{ position: 'fixed', left: state.x, top: state.y }}
        >
            {actions.map((a) => (
                <div
                    key={a.label}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => a.children && setOpenSubmenu(a.label)}
                    onMouseLeave={() => a.children && setOpenSubmenu((cur) => (cur === a.label ? null : cur))}
                >
                    <button
                        className={`ve-menu-item${a.danger ? ' danger' : ''}`}
                        disabled={a.disabled}
                        onClick={() => {
                            if (a.children) return;
                            a.onSelect?.();
                            onClose();
                        }}
                    >
                        {a.label}
                        {a.children ? ' ▸' : ''}
                    </button>
                    {a.children && openSubmenu === a.label && (
                        <div className="ve-menu" style={{ position: 'absolute', left: '100%', top: 0 }}>
                            {a.children.map((c) => (
                                <button
                                    key={c.label}
                                    className={`ve-menu-item${c.danger ? ' danger' : ''}`}
                                    disabled={c.disabled}
                                    onClick={() => {
                                        c.onSelect?.();
                                        onClose();
                                    }}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
