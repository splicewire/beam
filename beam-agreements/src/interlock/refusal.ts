import { FrameActionError, type FrameTransport } from '@schemastud/frame';
import { requirementsOf, type OutstandingRequirement } from './requirements';

/**
 * agreements 06: the browser side of a 428 on frame's transport. The body is read by `requirementsOf` (one parser for
 * every transport, agreements 15): a body that isn't beam's refusal isn't ours, and the original error is rethrown
 * unchanged.
 */
export { requirementsOf };
export type { OutstandingRequirement };

/** One Agreement as the person will read it: the text, already checked to be the version whose digest is submitted. */
export interface PresentedAgreement {
    key: string;
    title: string;
    /** The version label the agreements resource shows; sent back as `version` when accepting. */
    label: string;
    digest: string;
    /** The frozen text as presented: the exact content `digest` is the SHA-256 of (the seam's version.content). */
    content: string;
    /** agreements 09: what changed, in the publisher's words; absent or null when none was written. */
    summary?: string | null;
    /** How it is satisfied: the accept operation, or the input member a replay carries. */
    remedy: { accept: string } | { member: string; version: number };
}

/** The seam's `agreements` row as frame serves it: the version in force, with its content. */
export interface AgreementRow {
    key?: string;
    title?: string;
    kind?: string;
    version?: { label: string; digest: string; content: string; summary?: string | null } | null;
}

/** Reads one Agreement by key. */
export type AgreementReader = (key: string) => Promise<AgreementRow | null>;

/** The resource key the seam declares (`#[ParticleResource(key: 'agreements')]`). */
export const AGREEMENTS_RESOURCE = 'agreements';

/**
 * Read Agreements through frame's own transport: `get('agreements', key)`, which beam's frame handler resolves with
 * the seam's AgreementBacking. The form widget uses the same backing through the REST show route; this reader stays
 * transport-specific because the 428 dialog is composed around FrameTransport.
 */
export function agreementsFrom(transport: Pick<FrameTransport, 'get'>): AgreementReader {
    return async (key) => {
        try {
            return (await transport.get(AGREEMENTS_RESOURCE, key)) as AgreementRow;
        } catch (error) {
            if (error instanceof FrameActionError && error.status === 404) return null;
            throw error;
        }
    };
}

/** The outstanding Requirements of a 428, or null when the error is anything else (then it isn't ours to handle). */
export function refusalOf(error: unknown): OutstandingRequirement[] | null {
    if (!(error instanceof FrameActionError) || error.status !== 428) return null;
    return requirementsOf(error.body);
}

/** The text of an Agreement changed between the refusal and the read, twice: nothing was done. */
export class AgreementTextMismatchError extends Error {
    constructor(readonly key: string) {
        super(`The agreement changed while it was being shown. Nothing was done; please try again.`);
        this.name = 'AgreementTextMismatchError';
    }
}

/** An Agreement with no version in force can't be accepted. */
export class AgreementUnavailableError extends Error {
    constructor(readonly key: string) {
        super(`This agreement isn't available to accept right now. Nothing was done.`);
        this.name = 'AgreementUnavailableError';
    }
}

/**
 * The refusal's Agreement as the person will read it, or `'moved'` when the version served now isn't the one the
 * refusal names: coord 11:29Z, the text shown is the version whose digest is submitted, so a mismatch is never shown.
 */
export async function presentRefused(
    requirement: OutstandingRequirement,
    read: AgreementReader,
): Promise<PresentedAgreement | 'moved'> {
    if (requirement.acceptOperation === null && requirement.member === null) {
        throw new AgreementUnavailableError(requirement.key);
    }
    const row = await read(requirement.key);
    const version = row?.version;
    if (!version || typeof version.content !== 'string') throw new AgreementUnavailableError(requirement.key);
    if (version.digest !== requirement.digest) return 'moved';
    return {
        key: requirement.key,
        title: requirement.title,
        label: version.label,
        digest: version.digest,
        content: version.content,
        summary: version.summary ?? null,
        remedy:
            requirement.acceptOperation !== null
                ? { accept: requirement.acceptOperation }
                : { member: requirement.member as string, version: requirement.version },
    };
}
