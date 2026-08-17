// A minimal right-click menu for a canvas node — Duplicate / Delete today, more actions later. Closes on
// outside click or Escape. Positioned at the triggering click's viewport coordinates (fixed).
import { useEffect } from 'react';

export interface ContextMenuAction {
    label: string;
    onSelect: () => void;
    /** Renders in the "destructive" treatment (Delete). */
    danger?: boolean;
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
                <button
                    key={a.label}
                    className={`ve-menu-item${a.danger ? ' danger' : ''}`}
                    onClick={() => {
                        a.onSelect();
                        onClose();
                    }}
                >
                    {a.label}
                </button>
            ))}
        </div>
    );
}
