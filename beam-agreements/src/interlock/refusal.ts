import { FrameActionError, type FrameTransport } from '@schemastud/frame';

/**
 * agreements 06: the browser side of a 428. The body is beam's RequirementRefusalData (agreements 04): one
 * OutstandingRequirementData per unmet Requirement, each naming exactly one remedy: `acceptOperation` (call it, then
 * replay) or `member` (replay with the agreement member added to that input member). Read structurally: a body that
 * isn't this shape isn't ours, and the original error is rethrown unchanged.
 */
export interface OutstandingRequirement {
    key: string;
    /** The 1-based ordinal of the version the server wants (the plane's int `version`, agreements 04). */
    version: number;
    digest: string;
    kind: string;
    title: string;
    scope: string;
    subject: string | number | null;
    /** Not followed: the Agreement is read by key through frame's transport (see {@see AgreementReader}). */
    readUrl: string;
    acceptOperation: string | null;
    member: string | null;
}

/** One Agreement as the person will read it: the text, already checked to be the version whose digest is submitted. */
export interface PresentedAgreement {
    key: string;
    title: string;
    /** The version label the agreements resource shows; sent back as `version` when accepting. */
    label: string;
    digest: string;
    /** The frozen text as presented: the exact content `digest` is the SHA-256 of (the seam's version.content). */
    content: string;
    /** How it is satisfied: the accept operation, or the input member a replay carries. */
    remedy: { accept: string } | { member: string; version: number };
}

/** The seam's `agreements` row as frame serves it: the version in force, with its content. */
export interface AgreementRow {
    key?: string;
    title?: string;
    kind?: string;
    version?: { label: string; digest: string; content: string } | null;
}

/** Reads one Agreement by key. */
export type AgreementReader = (key: string) => Promise<AgreementRow | null>;

/** The resource key the seam declares (`#[ParticleResource(key: 'agreements')]`). */
export const AGREEMENTS_RESOURCE = 'agreements';

/**
 * Read Agreements through frame's own transport: `get('agreements', key)`, which beam's frame handler resolves with
 * the seam's AgreementBacking. The refusal's `readUrl` is deliberately NOT followed (the REST show route can't serve
 * this backing today; coord 16:26Z files that separately).
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

function isOutstanding(value: unknown): value is OutstandingRequirement {
    if (!value || typeof value !== 'object') return false;
    const r = value as Record<string, unknown>;
    return (
        typeof r.key === 'string' &&
        typeof r.version === 'number' &&
        typeof r.digest === 'string' &&
        typeof r.title === 'string' &&
        (typeof r.acceptOperation === 'string' || r.acceptOperation === null) &&
        (typeof r.member === 'string' || r.member === null)
    );
}

/** The outstanding Requirements of a 428, or null when the error is anything else (then it isn't ours to handle). */
export function refusalOf(error: unknown): OutstandingRequirement[] | null {
    if (!(error instanceof FrameActionError) || error.status !== 428) return null;
    const body = error.body as { requirements?: unknown; data?: { requirements?: unknown } } | null;
    const list = body?.requirements ?? body?.data?.requirements;
    if (!Array.isArray(list) || list.length === 0 || !list.every(isOutstanding)) return null;
    return list;
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
        remedy:
            requirement.acceptOperation !== null
                ? { accept: requirement.acceptOperation }
                : { member: requirement.member as string, version: requirement.version },
    };
}
