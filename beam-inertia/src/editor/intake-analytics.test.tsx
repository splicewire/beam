// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
    props: { intakeForms: { contact: { type: 'object' } }, intakeHoneypotField: 'website' } as Record<string, unknown>,
    intake: null as { value: { onSent?: (captureKey: string) => void }; children: ReactNode } | null,
    reportEvent: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({ usePage: () => ({ props: h.props }) }));
vi.mock('@splicewire/beam-intake', () => ({
    IntakeForm: () => null,
    PublicIntakeProvider: ({ value, children }: { value: Record<string, unknown>; children: ReactNode }) => {
        h.intake = { value: value as { onSent?: (captureKey: string) => void }, children };
        return <>{children}</>;
    },
}));
vi.mock('@splicewire/beam-ux/site', () => ({ reportEvent: h.reportEvent }));
vi.mock('@splicewire/beam-ux/canvas', () => ({ useEditMode: () => false }));

import { IntakeFormsFromPage } from './intake';

afterEach(() => {
    cleanup();
    h.intake = null;
    h.reportEvent.mockClear();
});

it('binds successful public lead submissions to the packaged generate_lead event', () => {
    render(<IntakeFormsFromPage><p>page</p></IntakeFormsFromPage>);

    expect(h.intake?.value).toMatchObject({ schemas: h.props.intakeForms, honeypotField: 'website' });
    h.intake?.value.onSent?.('contact');

    expect(h.reportEvent).toHaveBeenCalledExactlyOnceWith('generate_lead');
});
