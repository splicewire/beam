import { Boxes, FileText, LayoutTemplate, Table2 } from 'lucide-react';
import type { RegionKind } from './types';

/** The kind → lucide icon map shared across the builder surfaces. */
export const KIND_ICON: Record<RegionKind, typeof FileText> = {
    richtext: FileText,
    form: LayoutTemplate,
    frame: Table2,
    list: Boxes,
};
