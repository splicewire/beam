import type { ReactNode } from 'react';
import { canvasAcceptsFormat, canvasRefusalFor } from '../canvas/format';
type EntryRef = { format?: string | null };
export function CanvasOrRefusal({ entry, children }: { entry: EntryRef; children: ReactNode }) {
    if (canvasAcceptsFormat(entry.format)) {
        return <>{children}</>;
    }

    return (
        <div
            data-beam-ux-editor-refused={entry.format ?? 'unknown'}
            role="note"
            className="m-4 rounded-md border border-amber-300 bg-amber-50 p-6 text-sm text-amber-900"
        >
            <p className="font-medium">This page cannot be edited here.</p>
            <p className="mt-2">{canvasRefusalFor(entry.format)}</p>
        </div>
    );
}
