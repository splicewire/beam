import { reportEvent } from '@splicewire/beam-ux/site';

const PENDING_LOGIN_METHOD = 'beam.analytics.pending-login-method';

function clearPendingLoginMethod(): void {
    try {
        window.sessionStorage.removeItem(PENDING_LOGIN_METHOD);
    } catch {
        // Analytics must never interfere with authentication when storage is unavailable.
    }
}

export function startPasswordLogin(): void {
    clearPendingLoginMethod();
}

export function reportAuthenticatedLogin(method: 'password' | 'passkey'): void {
    clearPendingLoginMethod();
    reportEvent('login', { method });
}

export function deferPasswordLoginForTwoFactor(): void {
    try {
        window.sessionStorage.setItem(PENDING_LOGIN_METHOD, 'password');
    } catch {
        // If session storage is disabled, omit the eventual event rather than report it prematurely.
    }
}

export function completePendingLogin(): void {
    let method: string | null = null;
    try {
        method = window.sessionStorage.getItem(PENDING_LOGIN_METHOD);
        window.sessionStorage.removeItem(PENDING_LOGIN_METHOD);
    } catch {
        return;
    }

    if (method === 'password' || method === 'passkey') {
        reportEvent('login', { method });
    }
}

export function isTwoFactorChallengeUrl(url: string): boolean {
    try {
        return new URL(url, window.location.origin).pathname === '/two-factor-challenge';
    } catch {
        return url.split(/[?#]/, 1)[0] === '/two-factor-challenge';
    }
}
