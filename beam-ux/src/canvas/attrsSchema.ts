// Translates a JsonBlock's editable props into a JSON Schema + formData pair for
// @schemastud/seam's SchemaForm — the schema-driven replacement for the old hand-rolled
// Inspector (class chips / style rows / raw attrs / access section, all built by hand).
// className/style keep their rich chip/row UX via custom RJSF widgets (class-chips /
// style-rows, registered alongside this in registry.ts); the two entitlement-gate attrs
// become real `enum` dropdowns off the host's known-key pool; everything else falls
// through to `additionalProperties`, which RJSF renders as an open-ended "+ Add" key/value
// editor — the schema-driven equivalent of the old "+ attribute" section.
import type { JsonBlock } from '../blockdoc/json.js';
import { attrsView, EDIT_GATE_ATTR, RESERVED_ATTRS, VIEW_GATE_ATTR } from './props.js';

/** A minimal JSON Schema node — kept loose, mirroring @schemastud/seam's own `SchemaNode`. */
export type SchemaNode = Record<string, unknown>;

export interface AttrsSchemaResult {
    schema: SchemaNode;
    attrs: Record<string, string>;
}

/** The enum options for a gate field: the known pool, plus the block's OWN current value if it's not
 * already in that pool (so an existing bespoke/stale key stays representable — switching from
 * free-text to a strict enum must never silently orphan a value already set on the doc). */
function gateEnum(entitlementKeys: string[], current: string | undefined): string[] {
    const set = new Set(entitlementKeys);
    if (current) set.add(current);
    return ['', ...Array.from(set)];
}

/**
 * Build the attrsSchema + attrs formData for the currently-selected block. `entitlementKeys` is the
 * host's known-key pool (same source the old Inspector's `<datalist>` suggestions used) — passed
 * through so the gate fields render a real `<select>`, not a guess-a-string input.
 */
export function attrsSchemaFor(block: JsonBlock, entitlementKeys: string[] = []): AttrsSchemaResult {
    const view = attrsView(block);
    const otherKeys = Object.keys(view).filter((k) => !RESERVED_ATTRS.has(k));

    const properties: Record<string, SchemaNode> = {
        className: {
            type: 'string',
            title: 'Classes',
            'x-widget': 'class-chips',
            'x-group': 'Classes',
        },
        style: {
            type: 'string',
            title: 'Style · CSS + vars',
            'x-widget': 'style-rows',
            'x-group': 'Style',
        },
        [VIEW_GATE_ATTR]: {
            type: 'string',
            title: 'View gate',
            'x-widget': 'select',
            'x-group': 'Access',
            enum: gateEnum(entitlementKeys, view[VIEW_GATE_ATTR]),
        },
        [EDIT_GATE_ATTR]: {
            type: 'string',
            title: 'Edit gate',
            'x-widget': 'select',
            'x-group': 'Access',
            enum: gateEnum(entitlementKeys, view[EDIT_GATE_ATTR]),
        },
    };

    // Existing arbitrary attrs get a named property (so they show with their real key as the
    // label); additionalProperties covers adding a BRAND NEW key not yet on the block.
    for (const k of otherKeys) {
        properties[k] = { type: 'string', title: k, 'x-group': 'Attributes' };
    }

    const attrs: Record<string, string> = {
        className: view.className ?? '',
        style: view.style ?? '',
        [VIEW_GATE_ATTR]: view[VIEW_GATE_ATTR] ?? '',
        [EDIT_GATE_ATTR]: view[EDIT_GATE_ATTR] ?? '',
    };
    for (const k of otherKeys) attrs[k] = view[k];

    return {
        schema: {
            type: 'object',
            properties,
            additionalProperties: { type: 'string', 'x-group': 'Attributes' },
        },
        attrs,
    };
}
