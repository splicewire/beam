import { useBeamMessages } from '../messages';
import { useHttp } from '@inertiajs/react';
import { useCallback, useState } from 'react';
export type UseTwoFactorAuthReturn = {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    recoveryCodesList: string[];
    hasSetupData: boolean;
    errors: string[];
    clearErrors: () => void;
    clearSetupData: () => void;
    clearTwoFactorAuthData: () => void;
    fetchQrCode: () => Promise<void>;
    fetchSetupKey: () => Promise<void>;
    fetchSetupData: () => Promise<void>;
    fetchRecoveryCodes: () => Promise<void>;
};

export const OTP_MAX_LENGTH = 6;

export const useTwoFactorAuth = (): UseTwoFactorAuthReturn => {
    const messages = useBeamMessages();
    const { submit } = useHttp();

    const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
    const [manualSetupKey, setManualSetupKey] = useState<string | null>(null);
    const [recoveryCodesList, setRecoveryCodesList] = useState<string[]>([]);
    type ErrorKey = 'splicewire-beam-inertia::messages.auth_failed_to_fetch_qr_code' | 'splicewire-beam-inertia::messages.auth_failed_to_fetch_a_setup_key' | 'splicewire-beam-inertia::messages.auth_failed_to_fetch_recovery_codes';
    const [errorKeys, setErrors] = useState<ErrorKey[]>([]);

    const hasSetupData = qrCodeSvg !== null && manualSetupKey !== null;

    const clearErrors = useCallback((): void => {
        setErrors([]);
    }, []);

    const clearSetupData = useCallback((): void => {
        setManualSetupKey(null);
        setQrCodeSvg(null);
        setErrors([]);
    }, []);

    const clearTwoFactorAuthData = useCallback((): void => {
        setManualSetupKey(null);
        setQrCodeSvg(null);
        setErrors([]);
        setRecoveryCodesList([]);
    }, []);

    const fetchQrCode = useCallback(async (): Promise<void> => {
        try {
            const { svg } = (await submit({
                method: 'get',
                url: '/user/two-factor-qr-code',
            })) as {
                svg: string;
                url: string;
            };

            setQrCodeSvg(svg);
        } catch {
            setErrors((prev) => [...prev, 'splicewire-beam-inertia::messages.auth_failed_to_fetch_qr_code']);
            setQrCodeSvg(null);
        }
    }, [submit]);

    const fetchSetupKey = useCallback(async (): Promise<void> => {
        try {
            const { secretKey: key } = (await submit({
                method: 'get',
                url: '/user/two-factor-secret-key',
            })) as {
                secretKey: string;
            };

            setManualSetupKey(key);
        } catch {
            setErrors((prev) => [...prev, 'splicewire-beam-inertia::messages.auth_failed_to_fetch_a_setup_key']);
            setManualSetupKey(null);
        }
    }, [submit]);

    const fetchRecoveryCodes = useCallback(async (): Promise<void> => {
        try {
            setErrors([]);
            const codes = (await submit({
                method: 'get',
                url: '/user/two-factor-recovery-codes',
            })) as string[];
            setRecoveryCodesList(codes);
        } catch {
            setErrors((prev) => [...prev, 'splicewire-beam-inertia::messages.auth_failed_to_fetch_recovery_codes']);
            setRecoveryCodesList([]);
        }
    }, [submit]);

    const fetchSetupData = useCallback(async (): Promise<void> => {
        try {
            setErrors([]);
            await Promise.all([fetchQrCode(), fetchSetupKey()]);
        } catch {
            setQrCodeSvg(null);
            setManualSetupKey(null);
        }
    }, [fetchQrCode, fetchSetupKey]);

    return {
        qrCodeSvg,
        manualSetupKey,
        recoveryCodesList,
        hasSetupData,
        errors: errorKeys.map((key) => messages.t(key)),
        clearErrors,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchQrCode,
        fetchSetupKey,
        fetchSetupData,
        fetchRecoveryCodes,
    };
};
