import { afterEach, expect, it } from 'vitest';
import { authFeaturesFrom, configureBeamInertia } from '../config';
import { defaultComponents } from './registry';
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

it("adds the host's own components to the registry the canvas and the snapshot read", () => {
    // A host whose MDX pages hold blocks offers its kit (Callout, Steps, ...) in their profile; without a way to register
    // them the canvas refused the page (starter receipt 2026-10-25: 'Manifest Profile components missing ...').
    const Callout = () => null;
    configureBeamInertia({ components: { Callout } });

    expect(registrySnapshot()).toEqual(expect.arrayContaining(['Callout', 'DemoHero']));
    expect(defaultComponents().Callout).toBe(Callout);
});

it('lists IntakeForm only where the host turned on its public intake door (EP-07d)', () => {
    expect(registrySnapshot()).not.toContain('IntakeForm');
    configureBeamInertia({ intakeForms: true });
    expect(registrySnapshot()).toContain('IntakeForm');
});
