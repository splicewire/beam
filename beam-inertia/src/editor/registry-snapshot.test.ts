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
    // A kit component declares its own required props (the canvas hands it what its block stores); a host registers it
    // as it is, with no cast (the starter's SectionLanding failed the build's typecheck, receipt rerun 2026-10-25).
    const SectionLanding = ({ heading }: { heading: string }) => heading;
    configureBeamInertia({ components: { Callout, SectionLanding } });

    expect(registrySnapshot()).toEqual(expect.arrayContaining(['Callout', 'DemoHero', 'SectionLanding']));
    expect(defaultComponents().Callout).toBe(Callout);
});

it('lists IntakeForm only where the host turned on its public intake door (EP-07d)', () => {
    expect(registrySnapshot()).not.toContain('IntakeForm');
    configureBeamInertia({ intakeForms: true });
    expect(registrySnapshot()).toContain('IntakeForm');
});

// EP-42: where a host's MDX pages hold blocks, laravel-beam-ux's SiteNodeSource adds SiteNav and ManifestTable to their
// profile (the packages' shipped docs pages place them), and the canvas refused /docs, /docs/api and /docs/mcp without
// them (starter room, 10-27). They join only there: the doctor compares the snapshot both ways, and a TSX-only profile
// declares neither.
it('lists SiteNav and ManifestTable only where the host says its MDX pages hold blocks (EP-42)', () => {
    expect(registrySnapshot()).not.toEqual(expect.arrayContaining(['SiteNav']));
    expect(registrySnapshot()).not.toContain('ManifestTable');
    configureBeamInertia({ mdxHoldsBlocks: true });
    expect(registrySnapshot()).toEqual(expect.arrayContaining(['ManifestTable', 'SiteNav']));
    expect(typeof defaultComponents().SiteNav).toBe('function');
});
