// @vitest-environment jsdom

import { createElement, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Register from './register';

const page = vi.hoisted(() => ({
    props: {} as Record<string, unknown>,
    submitted: undefined as Record<string, unknown> | undefined,
}));

vi.mock('@inertiajs/react', () => ({
    usePage: () => page,
    Form: ({ children, transform }: {
        children: (state: { processing: boolean; errors: Record<string, string> }) => ReactNode;
        transform: (data: Record<string, unknown>) => Record<string, unknown>;
    }) => createElement('form', null,
        children({ processing: false, errors: {} }),
        createElement('button', {
            type: 'button',
            'data-testid': 'capture-submit',
            onClick: () => { page.submitted = transform({ name: 'Ada' }); },
        }, 'capture submit'),
    ),
}));

vi.mock('@splicewire/beam-accounts', () => ({
    AgreementPrompt: ({ agreement, values, onChange }: {
        agreement: { key: string; title?: string };
        values: Record<string, { key: string; version: number; digest: string }>;
        onChange: (key: string, value?: { key: string; version: number; digest: string }) => void;
    }) => createElement('label', null,
        agreement.title ?? agreement.key,
        createElement('input', {
            type: 'checkbox',
            'aria-label': agreement.title ?? agreement.key,
            checked: Boolean(values[agreement.key]),
            onChange: (event: { currentTarget: { checked: boolean } }) => onChange(
                agreement.key,
                event.currentTarget.checked
                    ? { key: agreement.key, version: 1, digest: `${agreement.key}-digest` }
                    : undefined,
            ),
        }),
    ),
}));

vi.mock('../../messages', () => ({ useBeamMessages: () => ({ t: (key: string) => key }) }));
vi.mock('../../components/auth-message', () => ({ AuthMessage: () => null }));
vi.mock('../../components/input-error', () => ({ default: () => null }));
vi.mock('../../components/password-input', () => ({ default: (props: Record<string, unknown>) => createElement('input', props) }));
vi.mock('../../components/text-link', () => ({ default: (props: Record<string, unknown>) => createElement('a', props) }));
vi.mock('../../components/ui/button', () => ({ Button: (props: Record<string, unknown>) => createElement('button', props) }));
vi.mock('../../components/ui/input', () => ({ Input: (props: Record<string, unknown>) => createElement('input', props) }));
vi.mock('../../components/ui/label', () => ({ Label: (props: Record<string, unknown>) => createElement('label', props) }));
vi.mock('../../components/ui/spinner', () => ({ Spinner: () => null }));
vi.mock('@splicewire/beam-ux/site', () => ({ reportEvent: vi.fn() }));

afterEach(() => {
    page.props = {};
    page.submitted = undefined;
});

it('keeps each agreement member and submits both required members', () => {
    page.props = {
        agreements: [
            { key: 'terms', title: 'Terms', required: true },
            { key: 'privacy', title: 'Privacy', required: true },
        ],
        passwordRules: '',
    };

    render(createElement(Register));
    const submit = document.querySelector('[data-test="register-user-button"]') as HTMLButtonElement;
    expect(submit).not.toBeNull();
    expect(submit.disabled).toBe(true);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Terms' }));
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Privacy' }));
    expect(submit.disabled).toBe(false);

    fireEvent.click(screen.getByTestId('capture-submit'));
    expect(page.submitted?.agreementMembers).toEqual([
        { key: 'terms', version: 1, digest: 'terms-digest' },
        { key: 'privacy', version: 1, digest: 'privacy-digest' },
    ]);
});
