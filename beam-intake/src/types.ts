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
}

export interface IntakeServices<
    T extends EntityIntakeSectionSubmittedData =
        EntityIntakeSectionSubmittedData,
> {
    client: IntakeClient<T>;
    renderForm?: (props: IntakeFormRenderProps) => ReactNode;
    onError?: (error: unknown) => void;
}
