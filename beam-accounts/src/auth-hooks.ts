import { useMutation } from '@tanstack/react-query';
import { useAuthServices } from './auth-provider';
import type { ForgotPasswordInput, LoginInput, ResetPasswordInput } from './types';

// Auth mutations run on whatever QueryClient wraps the host tree (the host owns it, same as the
// tokens surface). They surface errors through the injected `onError` and still reject so the
// calling component can render an inline message.

export function useLogin() {
    const { client, onError } = useAuthServices();
    return useMutation({
        mutationFn: (input: LoginInput) => client.login(input),
        onError: (err) => onError?.(err),
    });
}

export function useRequestPasswordReset() {
    const { client, onError } = useAuthServices();
    return useMutation({
        mutationFn: (input: ForgotPasswordInput) => client.requestPasswordReset(input),
        onError: (err) => onError?.(err),
    });
}

export function useResetPassword() {
    const { client, onError } = useAuthServices();
    return useMutation({
        mutationFn: (input: ResetPasswordInput) => client.resetPassword(input),
        onError: (err) => onError?.(err),
    });
}

/**
 * Convenience bundle of the three auth mutations for a host that would rather grab them all at
 * once than reach for the individual hooks.
 */
export function useAuth() {
    return {
        login: useLogin(),
        requestPasswordReset: useRequestPasswordReset(),
        resetPassword: useResetPassword(),
    };
}
