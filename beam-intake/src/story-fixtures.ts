import type {
    EntityIntakeFormSectionData,
    EntityIntakeSectionSubmittedData,
} from './types';

export const emptySection: EntityIntakeFormSectionData = {
    key: 'contact',
    schema: {
        type: 'object',
        title: 'Contact details',
        properties: { name: { type: 'string', title: 'Name' } },
    },
    fields: {},
};
export const populatedSection: EntityIntakeFormSectionData = {
    ...emptySection,
    fields: { name: 'Alex' },
};
export const receipt: EntityIntakeSectionSubmittedData = {
    submission_id: 'submission-fixture',
};
