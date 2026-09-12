/**
 * The wire shapes of `splicewire/laravel-satellite`'s platform-connection surface.
 *
 * Hand-mirrored rather than imported, and that is a boundary decision: `@splicewire/beam-inertia` is
 * a JS package with no PHP dependency, and the generated DTO projection (`generated.d.ts`) lives in
 * each HOST's tree, not in a shared package. So the seam is stated here once, structurally, and the
 * host — whose generated types DO carry the server's declarations — is where a divergence surfaces
 * when it threads its page props into `<PlatformConnectionPanel>`.
 *
 * Every field here is a projection of a declared Data class:
 * `Splicewire\Satellite\Pairing\Data\PlatformConnectionData`,
 * `…\PlatformIdentityData`, `…\PlatformCapabilityData` and `…\PlatformCapabilityReadData`.
 */

/** Mirrors `Splicewire\Satellite\Pairing\PlatformConnectionState`. */
export type PlatformConnectionState =
    | 'unpaired'
    | 'pending'
    | 'paired'
    | 'denied'
    | 'expired'
    | 'revoked';

export type PlatformIdentity = {
    id: string;
    name: string | null;
    email: string | null;
};

export type PlatformCapability = {
    name: string;
    label: string | null;
    binding: string | null;
    surfaces: string[];
    requiredEntitlement: string | null;
};

export type PlatformCapabilityRead = {
    surface: string;
    ok: boolean;
    capabilities: PlatformCapability[];
    status: number | null;
    error: string | null;
    invokedAt: string | null;
};

export type PlatformConnection = {
    state: PlatformConnectionState;
    tokenPresent: boolean;
    platformUrl: string | null;
    centralUrl: string | null;
    label: string | null;
    /**
     * The human half of the RFC 8628 grant — the code the operator reads to the tower's approval
     * screen. The DEVICE code, which is the credential half, is deliberately never projected;
     * `PlatformConnectionData`'s docblock carries the reasoning.
     */
    userCode: string | null;
    verificationUri: string | null;
    verificationUriComplete: string | null;
    expiresAt: string | null;
    identity: PlatformIdentity | null;
    identityError: string | null;
};

/**
 * Where the four declared `#[ParticleOp]`s mounted at this host.
 *
 * Threaded from the server rather than composed in the browser, because the mount point is the
 * HOST's choice: `Route::splicewirePlatformConnectionRoutes()` takes a prefix, so this package
 * cannot know whether the ops live under `/operator/` or somewhere else, and a hardcoded path here
 * would be a second, silently-wrong authority on a URL the route table already owns.
 */
export type PlatformConnectionEndpoints = {
    connect: string;
    poll: string;
    invokeCapability: string;
    disconnect: string;
};
