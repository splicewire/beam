import type { ReactNode } from 'react';
import type {
    EntityIntakeFormSectionData,
    EntityIntakeSectionSubmittedData,
} from '@splicewire/_resources/types/intake';

export type { EntityIntakeFormSectionData, EntityIntakeSectionSubmittedData };
export type IntakeFields = Record<string, unknown>;

export interface IntakeClient<
    T extends EntityIntakeSectionSubmittedData =
        EntityIntakeSectionSubmittedData,
> {
    submit(sectionKey: string, fields: IntakeFields): Promise<T>;
}

/** A form-rendering slot: no endpoint, auth, or entity identity enters the package. */
export interface IntakeFormRenderProps {
    schema: EntityIntakeFormSectionData['schema'];
    formData: IntakeFields;
    disabled: boolean;
    onChange(fields: IntakeFields): void;
    onSubmit(fields: IntakeFields): void;
    /** The server's errors for the last submission, keyed by JSON pointer (`/field`; `''` for the document). */
    errors?: Record<string, string[]>;
    /** The submit control's label, where the caller names one (a page IntakeForm does). */
    submitLabel?: string;
}

export interface IntakeServices<
    T extends EntityIntakeSectionSubmittedData =
        EntityIntakeSectionSubmittedData,
> {
    client: IntakeClient<T>;
    renderForm?: (props: IntakeFormRenderProps) => ReactNode;
    onError?: (error: unknown) => void;
}
