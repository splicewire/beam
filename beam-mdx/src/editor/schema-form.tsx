import { Form } from '@rjsf/shadcn';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { useMemo } from 'react';
import { KIT_MANIFEST } from './manifest';

/**
 * The schema-driven per-block inspector — the "frame form" for a JSX block. Plugged into mdxeditor's
 * `GenericJsxEditor` as its `PropertyEditor`, it renders an RJSF `SchemaForm` (the same engine Frame
 * `EditShell` / `@schemastud/seam` use) off the component's `attrsSchema` from the kit manifest. So
 * `Callout.type` is a select, required fields validate, and there's one form engine for every block.
 *
 * Contract from mdxeditor's `PropertyPopover`: `{ properties: {name: string}, title, onChange }`.
 * Expression/ReactNode props (`x-expression`: `icon`, `lede`, `tree`) are hidden from the form but
 * kept in `formData`, so editing a shown field never drops them (they stay source-editable).
 */
export interface PropertyEditorProps {
    properties: Record<string, string>;
    title: string;
    onChange: (values: Record<string, string>) => void;
}

/** Strip `x-*` extension keywords (ajv8 strict-mode safe) and hide expression props via uiSchema. */
function prepare(attrsSchema: RJSFSchema | undefined): { schema: RJSFSchema; uiSchema: UiSchema } {
    const source = (attrsSchema?.properties ?? {}) as Record<string, Record<string, unknown>>;
    const properties: Record<string, unknown> = {};
    const uiSchema: UiSchema = { 'ui:submitButtonOptions': { norender: true } };

    for (const [key, prop] of Object.entries(source)) {
        const { 'x-expression': isExpression, ...clean } = prop;
        properties[key] = clean;
        if (isExpression) {
            uiSchema[key] = { 'ui:widget': 'hidden' };
        }
    }

    return {
        schema: { type: 'object', required: attrsSchema?.required, properties } as RJSFSchema,
        uiSchema,
    };
}

export function SchemaFormPropertyEditor({ properties, title, onChange }: PropertyEditorProps) {
    const node = KIT_MANIFEST.nodes.find((n) => n.name === title);
    const { schema, uiSchema } = useMemo(() => prepare(node?.attrsSchema as RJSFSchema | undefined), [node]);

    return (
        <div className="mdx-schema-form">
            <Form
                schema={schema}
                uiSchema={uiSchema}
                formData={properties}
                validator={validator}
                liveValidate={false}
                showErrorList={false}
                // Preserve hidden (expression) fields: RJSF keeps them in formData.
                onChange={(e) => onChange((e.formData ?? {}) as Record<string, string>)}
            />
        </div>
    );
}
