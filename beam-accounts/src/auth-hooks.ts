import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthServices } from './auth-provider';
import { runAssertionCeremony, runAttestationCeremony } from './webauthn';
import type { ForgotPasswordInput, LoginInput, ResetPasswordInput } from './types';

const PASSKEYS_KEY = ['beam-accounts', 'passkeys'] as const;

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

/**
 * Passwordless passkey sign-in (ticket 10): fetch a server challenge → run the WebAuthn
 * assertion ceremony in the browser → post the result to mint a token. The result is the same
 * host payload as password login.
 */
export function usePasskey<TResult = unknown>() {
    const { client, onError } = useAuthServices();
    return useMutation({
        mutationFn: async (): Promise<TResult> => {
            if (!client.passkey) throw new Error('Passkey sign-in is not available.');
            const { handle, options } = await client.passkey.loginOptions();
            const credential = await runAssertionCeremony(options);
            return (await client.passkey.login({ handle, credential })) as TResult;
        },
        onError: (err) => onError?.(err),
    });
}

/**
 * Passkey management (ticket 11): list / register (attestation ceremony) / delete, wired the
 * same injected-transport way as the tokens surface.
 */
export function usePasskeys() {
    const { client } = useAuthServices();
    return useQuery({
        queryKey: PASSKEYS_KEY,
        queryFn: () => client.passkey?.list() ?? Promise.resolve([]),
    });
}

export function useRegisterPasskey() {
    const { client, onError } = useAuthServices();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (name: string) => {
            if (!client.passkey) throw new Error('Passkey registration is not available.');
            const { handle, options } = await client.passkey.registrationOptions();
            const credential = await runAttestationCeremony(options);
            return client.passkey.register({ handle, name, credential });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PASSKEYS_KEY }),
        onError: (err) => onError?.(err),
    });
}

export function useDeletePasskey() {
    const { client, onError } = useAuthServices();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => client.passkey?.remove(id) ?? Promise.resolve(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: PASSKEYS_KEY }),
        onError: (err) => onError?.(err),
    });
}
