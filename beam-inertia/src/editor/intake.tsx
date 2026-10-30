import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { IntakeForm, PublicIntakeProvider, type PublicIntakeSchema } from '@splicewire/beam-intake';
import { useEditMode } from '@splicewire/beam-ux/canvas';
import { reportEvent } from '@splicewire/beam-ux/site';

/**
 * EP-07d: a rendered entry's forms get the schemas the server resolved for them (`props.intakeForms`, public keys only)
 * and the honeypot field the door's middleware watches (`props.intakeHoneypotField`). Wraps the packaged entry page.
 */
export function IntakeFormsFromPage({ children }: { children: ReactNode }) {
    const { props } = usePage<{ intakeForms?: Record<string, PublicIntakeSchema>; intakeHoneypotField?: string }>();

    return <PublicIntakeProvider value={{ schemas: props.intakeForms ?? {}, honeypotField: props.intakeHoneypotField, onSent: () => reportEvent('generate_lead') }}>{children}</PublicIntakeProvider>;
}

/** The canvas registry's `IntakeForm`: the packaged form, a sealed non-submitting preview while an author edits. */
export function IntakeFormIsland(props: Record<string, unknown>) {
    const editing = useEditMode();

    return <IntakeForm
        captureKey={String(props.captureKey ?? '')}
        submitLabel={typeof props.submitLabel === 'string' ? props.submitLabel : undefined}
        successMessage={typeof props.successMessage === 'string' ? props.successMessage : undefined}
        preview={editing}
    />;
}
