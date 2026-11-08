import type { BlockdocManifest } from '@schemastud/blockdoc';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import profileFixture from '../editor/default-profile.fixture.json';
import type { JsonDoc } from '../blockdoc/json.js';
import { CanvasWidget } from './CanvasWidget.js';
import { CanvasProvider } from './context.js';
import homeBody from './t15-home-body.fixture.json';

/**
 * Ticket 15 shape C, mounted, on the real failing case: the starter's operator Site opening the block-doc Home.
 *
 * The profile is the packaged default editor profile (`default-profile.fixture.json`, node-for-node equal to
 * laravel-beam-ux's `resources/manifests/default-editor-profile.json`) plus the six host Auth* nodes laravel-beam-ux's
 * `AuthIslandNodeSource` contributes to the `content` profile (category `html`, no children). The body is the real Home
 * tree (`t15-home-body.fixture.json`, verbatim from laravel-beam-ux's `resources/editor/default-trees.json` `home`): it
 * USES only div, DemoHero, p and DemoFeatureRow. The client registry is a customer SPA's: the Demo* components, and no
 * Auth*, which only beam-inertia registers. Before shape C, mounting threw "Manifest Profile components missing from the
 * JS registry: AuthLogin, …".
 */
const AUTH = ['AuthLogin', 'AuthForgotPassword', 'AuthResetPassword', 'AuthConfirmPassword', 'AuthTwoFactorChallenge', 'AuthVerifyEmail'];
/** The palette publishes each candidate under its template label: a profile component's is its spaced name. */
const label = (name: string) => name.replace(/(?<=[a-z0-9])(?=[A-Z])/g, ' ');
const profile = {
    ...profileFixture,
    nodes: [...profileFixture.nodes, ...AUTH.map(name => ({
        name, category: 'html', admitsChildCategories: [], attrsSchema: { type: 'object', additionalProperties: false },
    }))],
} as unknown as BlockdocManifest;
const DemoHero = () => <div data-testid="demo-hero">HERO</div>;
const DemoFeatureRow = () => <div data-testid="demo-feature-row">FEATURES</div>;
const spaRegistry = { DemoHero, DemoFeatureRow };

function shellMount() {
    return {
        selectedNodeId: null, selectNode: vi.fn(), markDirty: vi.fn(),
        registerNodeAccess: vi.fn(() => () => {}), registerInsertHandler: vi.fn(() => () => {}),
        publishCandidates: vi.fn(), publishConformance: vi.fn(), registerFlush: vi.fn(() => () => {}),
    };
}
const offered = (mount: ReturnType<typeof shellMount>) =>
    (mount.publishCandidates.mock.calls.at(-1)![0] as { nodeType: string }[]).map(candidate => candidate.nodeType);

afterEach(cleanup);

describe('ticket 15 shape C: the Home profile in a client that cannot render the host Auth* nodes', () => {
    it('mounts the Home body, and leaves the declared but unused Auth* nodes out of the palette', () => {
        const mount = shellMount();
        render(<CanvasProvider config={{ registry: spaRegistry, profile }}>
            <CanvasWidget value={homeBody as JsonDoc} onChange={vi.fn()} editShellMount={mount as never} />
        </CanvasProvider>);

        expect(screen.getByTestId('demo-hero')).toBeTruthy();
        expect(screen.getByTestId('demo-feature-row')).toBeTruthy();
        expect(offered(mount)).toContain(label('DemoHero'));
        for (const name of AUTH) expect(offered(mount)).not.toContain(label(name));
    });

    it('still fails loudly, naming it, when the body USES an Auth* node this client cannot render', () => {
        const withLogin = [...(homeBody as JsonDoc), { kind: 'block', name: 'AuthLogin', isComponent: true, dynamic: false, props: [], children: [] }];
        const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
        try {
            expect(() => render(<CanvasProvider config={{ registry: spaRegistry, profile }}>
                <CanvasWidget value={withLogin as JsonDoc} onChange={vi.fn()} editShellMount={shellMount() as never} />
            </CanvasProvider>)).toThrow('Components used in this document are missing from the JS registry: AuthLogin');
        } finally {
            quiet.mockRestore();
        }
    });

    it('is unchanged for a client that registers every node, as the App does: it mounts and offers the Auth* nodes', () => {
        const mount = shellMount();
        const full = { ...spaRegistry, ...Object.fromEntries(AUTH.map(name => [name, () => <div>{name}</div>])) };
        render(<CanvasProvider config={{ registry: full, profile }}>
            <CanvasWidget value={homeBody as JsonDoc} onChange={vi.fn()} editShellMount={mount as never} />
        </CanvasProvider>);

        expect(screen.getByTestId('demo-hero')).toBeTruthy();
        for (const name of AUTH) expect(offered(mount)).toContain(label(name));
    });
});
