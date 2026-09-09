import { useRef, useState } from 'react';
import { SchemaForm } from '@schemastud/seam';
import { Card, CardContent, CardHeader, CardTitle } from '@schemastud/ui';
import { useIntakeSubmission } from './hooks';
import { useIntakeServices } from './provider';
import type {
    EntityIntakeFormSectionData,
    IntakeFields,
    IntakeFormRenderProps,
} from './types';

/** Mount with a new key when the selected entity or section changes. */
export function IntakeSectionForm({
    section,
    disabled = false,
}: {
    section: EntityIntakeFormSectionData;
    disabled?: boolean;
}) {
    const [fields, setFields] = useState<IntakeFields>(
        Array.isArray(section.fields) ? {} : section.fields,
    );
    const submit = useIntakeSubmission(section.key);
    const submitting = useRef(false);
    const { renderForm } = useIntakeServices();
    const form: IntakeFormRenderProps = {
        schema: section.schema,
        formData: fields,
        disabled: disabled || submit.isPending,
        onChange: (next) => {
            if (submitting.current || submit.isPending) return;
            setFields(next);
            submit.reset();
        },
        onSubmit: (next) => {
            if (disabled || submitting.current || submit.isPending) return;
            submitting.current = true;
            submit.mutate(next, {
                onSettled: () => {
                    submitting.current = false;
                },
            });
        },
    };
    return (
        <Card aria-busy={submit.isPending || undefined}>
            <CardHeader>
                <CardTitle>
                    {String(section.schema.title ?? section.key)}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {renderForm ? (
                    renderForm(form)
                ) : (
                    <SchemaForm
                        schema={form.schema}
                        formData={form.formData}
                        disabled={form.disabled}
                        onChange={({ formData }) =>
                            form.onChange(formData ?? {})
                        }
                        onSubmit={({ formData }) =>
                            form.onSubmit(formData ?? {})
                        }
                    />
                )}
                {submit.isPending && (
                    <p role="status" className="mt-3">
                        Submitting section…
                    </p>
                )}
                {submit.isError && (
                    <p role="alert" className="mt-3 text-destructive">
                        {submit.error instanceof Error && submit.error.message
                            ? submit.error.message
                            : 'Unable to submit this section.'}
                    </p>
                )}
                {submit.isSuccess && (
                    <p role="status" className="mt-3">
                        Section received. Reference: {submit.data.submission_id}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
