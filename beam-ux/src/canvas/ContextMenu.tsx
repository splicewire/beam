// A minimal right-click menu for a canvas node — Duplicate / Move Up / Move Down / Insert (submenu) /
// Delete. Closes on outside click or Escape. Positioned at the triggering click's viewport coordinates
// (fixed). A leaf action with no `children` fires `onSelect` and closes the menu; an action WITH
// `children` (Insert's block-type flyout) opens a nested submenu on hover instead — it never fires
// `onSelect` itself (there's nothing to "select," it's just a grouping).
import { useEffect, useState } from 'react';

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

    useEffect(() => {
        const onDocClick = () => onClose();
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        // Capture phase: a click anywhere (including on a canvas node behind the menu) closes it before
        // that node's own click handler runs — right-click-then-click-elsewhere shouldn't leave it open.
        window.addEventListener('click', onDocClick, true);
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('click', onDocClick, true);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose]);

    return (
        <div
            className="ve-menu"
            style={{ position: 'fixed', left: state.x, top: state.y }}
            onClick={(e) => e.stopPropagation()}
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
