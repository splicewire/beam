import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureBeamInertia, featureEnabled } from './config';
import { resolveBeamPage } from './pages';

vi.mock('./pages/operator/dashboard', () => ({ default: function OperatorDefault() { return null; } }));
afterEach(() => configureBeamInertia({}));

describe('package default page resolution', () => {
    it('loads an unpublished default and gives a host page priority at the same path', async () => {
        const packaged = await resolveBeamPage('operator/dashboard');
        function Override() { return null; }
        const local = vi.fn(async () => ({ default: Override }));
        configureBeamInertia({ pages: { './pages/operator/dashboard.tsx': local } });
        expect(await resolveBeamPage('operator/dashboard')).toBe(Override);
        expect(local).toHaveBeenCalledOnce();
        expect(packaged).not.toBe(Override);
    });
    it.each(['account/create-team', 'auth/accept-invitation'])(
        'ships the team-onboarding page %s that beam-accounts renders',
        async (page) => {
            expect(typeof (await resolveBeamPage(page))).toBe('function');
        },
    );
    it('reports an unknown page instead of producing a blank surface', async () => {
        await expect(resolveBeamPage('missing/page')).rejects.toThrow('Page not found: missing/page');
    });
    it.each([
        ['registration', 'auth/register'], ['email-verification', 'auth/verify-email'],
        ['2fa', 'auth/two-factor-challenge'], ['password-confirmation', 'auth/confirm-password'],
    ] as const)('refuses disabled %s before invoking any host override', async (feature, page) => {
        const local = vi.fn();
        configureBeamInertia({ features: { [feature]: false }, pages: { [page]: local } });
        await expect(resolveBeamPage(page)).rejects.toThrow(`Page disabled: ${page}`);
        expect(local).not.toHaveBeenCalled();
    });
    it('derives the combined security affordance from the two enabled capabilities', () => {
        configureBeamInertia({ features: { '2fa': false, passkeys: false } });
        expect(featureEnabled('2fa-or-passkeys')).toBe(false);
        configureBeamInertia({ features: { '2fa': false, passkeys: true } });
        expect(featureEnabled('2fa-or-passkeys')).toBe(true);
    });
});

it('re-evaluates the authored island registry after configuration, even when imported first', async () => {
    const { canvasConfig } = await import('./editor/canvas-config');
    configureBeamInertia({ features: { registration: false, '2fa': false } });
    expect(canvasConfig.registry).not.toHaveProperty('AuthRegister');
    expect(canvasConfig.registry).not.toHaveProperty('AuthTwoFactorChallenge');
    configureBeamInertia({ features: { registration: true, '2fa': true } });
    expect(canvasConfig.registry).toHaveProperty('AuthRegister');
    expect(canvasConfig.registry).toHaveProperty('AuthTwoFactorChallenge');
});
