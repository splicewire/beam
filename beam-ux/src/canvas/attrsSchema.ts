// Translates a JsonBlock's editable props into a JSON Schema + formData pair for
// @schemastud/seam's SchemaForm — the schema-driven replacement for the old hand-rolled
// Inspector (class chips / style rows / raw attrs / access section, all built by hand).
// className/style keep their rich chip/row UX via custom RJSF widgets (class-chips /
// style-rows, registered alongside this in registry.ts); the two entitlement-gate attrs
// become real `enum` dropdowns off the host's known-key pool; everything else falls
// through to `additionalProperties`, which RJSF renders as an open-ended "+ Add" key/value
// editor — the schema-driven equivalent of the old "+ attribute" section.
//
// Two tabs, via seam's GroupedObjectFieldTemplate `x-tab` convention: "Style" (Classes +
// Style — how the block looks) and "Advanced" (Access + Attributes — technical/gating
// settings a content editor rarely touches) — reads like a blockdoc embed's fields, not a
// flat dump of every attribute at once.
import type { JsonBlock } from '../blockdoc/json.js';
import { attrsView, EDIT_GATE_ATTR, RESERVED_ATTRS, VIEW_GATE_ATTR } from './props.js';
import { englishBeamUxMessages, type BeamUxMessages } from '../messages.js';

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
/** `messages` is the reader's catalog when called in a render; English otherwise. */
export function attrsSchemaFor(block: JsonBlock, entitlementKeys: string[] = [], messages: BeamUxMessages = englishBeamUxMessages): AttrsSchemaResult {
    const view = attrsView(block);
    const otherKeys = Object.keys(view).filter((k) => !RESERVED_ATTRS.has(k));

    const properties: Record<string, SchemaNode> = {
        className: {
            type: 'string',
            title: messages.t('splicewire-beam-ux::messages.canvas_classes'),
            'x-widget': 'class-chips',
            'x-group': messages.t('splicewire-beam-ux::messages.canvas_classes'),
            'x-tab': messages.t('splicewire-beam-ux::messages.canvas_tab_style'),
            // The "Classes" x-group fieldset legend already labels this — a single-property
            // group repeating its own title as the field label too was pure duplication.
            'x-widget-options': { label: false },
        },
        style: {
            type: 'string',
            title: messages.t('splicewire-beam-ux::messages.canvas_style_css_vars'),
            'x-widget': 'style-rows',
            'x-group': messages.t('splicewire-beam-ux::messages.canvas_group_style'),
            'x-tab': messages.t('splicewire-beam-ux::messages.canvas_tab_style'),
            'x-widget-options': { label: false },
        },
        [VIEW_GATE_ATTR]: {
            type: 'string',
            title: messages.t('splicewire-beam-ux::messages.canvas_view_gate'),
            'x-widget': 'select',
            'x-group': messages.t('splicewire-beam-ux::messages.canvas_group_access'),
            'x-tab': messages.t('splicewire-beam-ux::messages.canvas_tab_advanced'),
            enum: gateEnum(entitlementKeys, view[VIEW_GATE_ATTR]),
        },
        [EDIT_GATE_ATTR]: {
            type: 'string',
            title: messages.t('splicewire-beam-ux::messages.canvas_edit_gate'),
            'x-widget': 'select',
            'x-group': messages.t('splicewire-beam-ux::messages.canvas_group_access'),
            'x-tab': messages.t('splicewire-beam-ux::messages.canvas_tab_advanced'),
            enum: gateEnum(entitlementKeys, view[EDIT_GATE_ATTR]),
        },
    };

    // Existing arbitrary attrs get a named property (so they show with their real key as the
    // label); additionalProperties covers adding a BRAND NEW key not yet on the block.
    for (const k of otherKeys) {
        properties[k] = { type: 'string', title: k, 'x-group': messages.t('splicewire-beam-ux::messages.canvas_group_attributes'), 'x-tab': messages.t('splicewire-beam-ux::messages.canvas_tab_advanced') };
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
            additionalProperties: { type: 'string', 'x-group': messages.t('splicewire-beam-ux::messages.canvas_group_attributes'), 'x-tab': messages.t('splicewire-beam-ux::messages.canvas_tab_advanced') },
        },
        attrs,
    };
}
