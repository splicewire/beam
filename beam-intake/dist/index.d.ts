import * as react from 'react';
import { ReactNode } from 'react';
import * as _splicewire__resources_types_intake from '@splicewire/_resources/types/intake';
import { EntityIntakeSectionSubmittedData, EntityIntakeFormSectionData } from '@splicewire/_resources/types/intake';
export { EntityIntakeFormSectionData, EntityIntakeSectionSubmittedData } from '@splicewire/_resources/types/intake';
import * as _tanstack_react_query from '@tanstack/react-query';

type IntakeFields = Record<string, unknown>;
interface IntakeClient<T extends EntityIntakeSectionSubmittedData = EntityIntakeSectionSubmittedData> {
    submit(sectionKey: string, fields: IntakeFields): Promise<T>;
}
/** A form-rendering slot: no endpoint, auth, or entity identity enters the package. */
interface IntakeFormRenderProps {
    schema: EntityIntakeFormSectionData['schema'];
    formData: IntakeFields;
    disabled: boolean;
    onChange(fields: IntakeFields): void;
    onSubmit(fields: IntakeFields): void;
}
interface IntakeServices<T extends EntityIntakeSectionSubmittedData = EntityIntakeSectionSubmittedData> {
    client: IntakeClient<T>;
    renderForm?: (props: IntakeFormRenderProps) => ReactNode;
    onError?: (error: unknown) => void;
}

/** Mount with a new key when the selected entity or section changes. */
declare function IntakeSectionForm({ section, disabled, }: {
    section: EntityIntakeFormSectionData;
    disabled?: boolean;
}): react.JSX.Element;

declare function IntakeProvider({ services, children, }: {
    services: IntakeServices;
    children: ReactNode;
}): react.JSX.Element;

/** Submissions have no package-owned read cache; the receipt belongs to this section. */
declare function useIntakeSubmission(sectionKey: string): _tanstack_react_query.UseMutationResult<_splicewire__resources_types_intake.EntityIntakeSectionSubmittedData, unknown, IntakeFields, unknown>;

export { type IntakeClient, type IntakeFields, type IntakeFormRenderProps, IntakeProvider, IntakeSectionForm, type IntakeServices, useIntakeSubmission };
