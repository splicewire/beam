import { afterEach, expect, it } from 'vitest';
import { authFeaturesFrom, configureBeamInertia } from '../config';
import { registrySnapshot } from './registry-snapshot';

afterEach(() => configureBeamInertia({}));

it('lists the components the canvas registers, sorted, gated by the configured auth features (EP-07)', () => {
    configureBeamInertia({ features: authFeaturesFrom(['registration']) });

    const names = registrySnapshot();

    expect(names).toEqual([...names].sort());
    expect(names).toEqual(expect.arrayContaining(['AuthLogin', 'AuthRegister', 'AuthForgotPassword', 'AuthResetPassword', 'DemoHero']));
    expect(names).not.toContain('AuthTwoFactorChallenge');
    expect(names).not.toContain('AuthVerifyEmail');
    expect(registrySnapshot({ Banner: null, Callout: null })).toEqual(['Banner', 'Callout']);
});

it('lists IntakeForm only where the host turned on its public intake door (EP-07d)', () => {
    expect(registrySnapshot()).not.toContain('IntakeForm');
    configureBeamInertia({ intakeForms: true });
    expect(registrySnapshot()).toContain('IntakeForm');
});
