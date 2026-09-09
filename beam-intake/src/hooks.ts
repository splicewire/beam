import { useMutation } from '@tanstack/react-query';
import { useIntakeServices } from './provider';
import type { IntakeFields } from './types';

/** Submissions have no package-owned read cache; the receipt belongs to this section. */
export function useIntakeSubmission(sectionKey: string) {
    const { client, onError } = useIntakeServices();
    return useMutation({
        mutationFn: (fields: IntakeFields) => client.submit(sectionKey, fields),
        onError,
    });
}
