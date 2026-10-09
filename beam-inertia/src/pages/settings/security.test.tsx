// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';

const observed = vi.hoisted(() => ({ resetOnError: [] as string[] }));

vi.mock('@inertiajs/react', () => ({
    Form: ({
        children,
        resetOnError,
    }: {
        children: (state: { errors: Record<string, string>; processing: boolean }) => ReactNode;
        resetOnError: string[];
    }) => {
        observed.resetOnError = resetOnError;

        return <form data-testid="password-form">{children({ errors: {}, processing: false })}</form>;
    },
    Head: () => null,
}));
vi.mock('../../config', () => ({ featureEnabled: () => false }));

import Security from './security';

it('submits the password update with only the strict camel wire keys', () => {
    render(
        <Security
            canManageTwoFactor={false}
            canManagePasskeys={false}
            passkeys={[]}
            passwordRules="min:12"
            twoFactorEnabled={false}
            requiresConfirmation={false}
        />,
    );

    const body = new FormData(screen.getByTestId<HTMLFormElement>('password-form'));
    expect([...body.keys()]).toEqual(['currentPassword', 'password', 'passwordConfirmation']);
    expect(body.has('current_password')).toBe(false);
    expect(body.has('password_confirmation')).toBe(false);
    expect(observed.resetOnError).toEqual(['password', 'passwordConfirmation', 'currentPassword']);
});
