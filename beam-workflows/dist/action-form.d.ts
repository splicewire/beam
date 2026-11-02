import * as react from 'react';
import { ReactNode } from 'react';
import { WorkflowProjectionData } from '@splicewire/_resources/types/workflows';
export { WorkflowProjectionData } from '@splicewire/_resources/types/workflows';

/** Local form output; the host combines this with its selected subject and declared action DTO. */
interface WorkflowActionSelection {
    transition: string;
    dueAt: string;
    timezone: string;
}
/** A workflow transition scheduled for an explicit instant. Transport and subject selection are injected. */
declare function WorkflowActionForm({ projection, subjectLabel, subjectPicker, initialTransition, initialLocalTime, initialTimezone, onSchedule, submitLabel, }: {
    projection: WorkflowProjectionData | null;
    subjectLabel?: string;
    subjectPicker?: ReactNode;
    initialTransition?: string;
    initialLocalTime?: string;
    initialTimezone?: string;
    onSchedule: (selection: WorkflowActionSelection) => Promise<void>;
    submitLabel?: string;
}): react.JSX.Element;

export { WorkflowActionForm, type WorkflowActionSelection };
