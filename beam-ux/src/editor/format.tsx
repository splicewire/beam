import type { ReactNode } from 'react';
import { canvasAccepts, canvasRefusalFor } from '../canvas/format';
import { useBeamUxMessages } from '../messages.js';
type EntryRef = { format?: string | null; bodyKind?: string | null };
export function CanvasOrRefusal({ entry, children }: { entry: EntryRef; children: ReactNode }) {
    const m = useBeamUxMessages();
    if (canvasAccepts(entry)) {
        return <>{children}</>;
    }

    return (
        <div
            data-beam-ux-editor-refused={entry.format ?? 'unknown'}
            role="note"
            className="m-4 rounded-md border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900"
        >
            <p className="font-medium">{m.t('splicewire-beam-ux::messages.editor_cannot_edit_here')}</p>
            <p className="mt-2">{canvasRefusalFor(entry.format, m)}</p>
        </div>
    );
}
