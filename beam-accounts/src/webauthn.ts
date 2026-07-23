// Dependency-free WebAuthn browser-ceremony helper. The WebAuthn API is native to the browser,
// so rather than pull in @simplewebauthn/browser we do the small amount of base64url ⇄
// ArrayBuffer marshalling ourselves: the server (web-auth/webauthn-lib) speaks base64url JSON,
// the browser API speaks ArrayBuffers. This module is the single place that touches
// `navigator.credentials`, so a test mocks IT and the hook/button stay pure.

function base64urlToBuffer(value: string): ArrayBuffer {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Whether this device/browser can run WebAuthn ceremonies at all. */
export function isWebAuthnSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        typeof window.PublicKeyCredential === 'function' &&
        typeof navigator !== 'undefined' &&
        !!navigator.credentials &&
        typeof navigator.credentials.get === 'function'
    );
}

// Marshal the server's JSON request/creation options (base64url) into the ArrayBuffer shapes
// the browser API wants, then marshal the resulting credential back to base64url JSON to POST.

function toRequestOptions(options: Record<string, unknown>): PublicKeyCredentialRequestOptions {
    const o = { ...options } as Record<string, unknown>;
    o.challenge = base64urlToBuffer(options.challenge as string);
    if (Array.isArray(options.allowCredentials)) {
        o.allowCredentials = (options.allowCredentials as Array<Record<string, unknown>>).map((c) => ({
            ...c,
            id: base64urlToBuffer(c.id as string),
        }));
    }
    return o as unknown as PublicKeyCredentialRequestOptions;
}

function toCreationOptions(options: Record<string, unknown>): PublicKeyCredentialCreationOptions {
    const o = { ...options } as Record<string, unknown>;
    o.challenge = base64urlToBuffer(options.challenge as string);
    const user = { ...(options.user as Record<string, unknown>) };
    user.id = base64urlToBuffer(user.id as string);
    o.user = user;
    if (Array.isArray(options.excludeCredentials)) {
        o.excludeCredentials = (options.excludeCredentials as Array<Record<string, unknown>>).map((c) => ({
            ...c,
            id: base64urlToBuffer(c.id as string),
        }));
    }
    return o as unknown as PublicKeyCredentialCreationOptions;
}

function assertionToJson(credential: PublicKeyCredential): Record<string, unknown> {
    const response = credential.response as AuthenticatorAssertionResponse;
    return {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
            clientDataJSON: bufferToBase64url(response.clientDataJSON),
            authenticatorData: bufferToBase64url(response.authenticatorData),
            signature: bufferToBase64url(response.signature),
            userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
        },
    };
}

function attestationToJson(credential: PublicKeyCredential): Record<string, unknown> {
    const response = credential.response as AuthenticatorAttestationResponse;
    return {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
            clientDataJSON: bufferToBase64url(response.clientDataJSON),
            attestationObject: bufferToBase64url(response.attestationObject),
        },
    };
}

/** Run an assertion (login) ceremony; returns the credential as base64url JSON to POST. */
export async function runAssertionCeremony(
    options: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const credential = (await navigator.credentials.get({
        publicKey: toRequestOptions(options),
    })) as PublicKeyCredential | null;

    if (!credential) throw new Error('Passkey verification was cancelled.');

    return assertionToJson(credential);
}

/** Run an attestation (registration) ceremony; returns the credential as base64url JSON to POST. */
export async function runAttestationCeremony(
    options: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const credential = (await navigator.credentials.create({
        publicKey: toCreationOptions(options),
    })) as PublicKeyCredential | null;

    if (!credential) throw new Error('Passkey registration was cancelled.');

    return attestationToJson(credential);
}
