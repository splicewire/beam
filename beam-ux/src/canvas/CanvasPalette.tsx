// A drag-capable replacement for @schemastud/frame's own click-only PalettePane, passed via
// FiveRegionEditShell's `palette` prop. Click still goes through the shell's own channel
// (mount.insert(candidate)); drag ALSO works by stashing the candidate's nodeType on the native
// DataTransfer under TEMPLATE_DATA_KEY — a cross-tree drag (this pane is a REACT SIBLING of the
// canvas widget under FiveRegionEditShell, not an ancestor/descendant) has no shared React state to
// use instead, so CanvasWidget's onDrop reads it straight off the browser event.
import { useEditShellMount } from '@schemastud/frame';
import { TEMPLATE_DATA_KEY } from './CanvasWidget.js';

interface Candidate {
    nodeType: string;
    label: string;
}

export function CanvasPalette() {
    const mount = useEditShellMount();
    const candidates = mount.candidates as Candidate[];

    if (candidates.length === 0) {
        return <div className="ve-pal-note">Nothing insertable here</div>;
    }

    return (
        <>
            <div className="ve-insp-h">Insert block</div>
            {candidates.map((c) => (
                <button
                    key={c.nodeType}
                    type="button"
                    className="ve-pal-item"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData(TEMPLATE_DATA_KEY, c.nodeType)}
                    onClick={() => mount.insert(c)}
                >
                    + {c.label}
                </button>
            ))}
            <div className="ve-pal-note">
                click inserts into / after the selection · drag to drop at a specific position
            </div>
        </>
    );
}
