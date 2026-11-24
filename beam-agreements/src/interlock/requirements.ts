/**
 * agreements 06 / 15: the shape of beam's 428 body, read with no transport attached. The body is beam's
 * RequirementRefusalData (agreements 04): one OutstandingRequirementData per unmet Requirement, each naming exactly one
 * remedy: `acceptOperation` (call it, then replay) or `member` (replay with the agreement member added to that input
 * member). This module imports nothing, so a client that is not built on frame's transport (commerce's host adapter,
 * agreements 15) reads the same body with the same parser the interlock uses.
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
    /** For the REST-backed member widget; the 428 dialog reads by key through frame's transport. */
    readUrl: string;
    acceptOperation: string | null;
    member: string | null;
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

/**
 * The outstanding Requirements a 428 body names, or null when the body isn't beam's refusal. Takes the parsed body
 * (`{requirements}`, or the same wrapped in `data`); the caller has already established the status is 428.
 */
export function requirementsOf(body: unknown): OutstandingRequirement[] | null {
    if (!body || typeof body !== 'object') return null;
    const b = body as { requirements?: unknown; data?: { requirements?: unknown } | null };
    const list = b.requirements ?? b.data?.requirements;
    if (!Array.isArray(list) || list.length === 0 || !list.every(isOutstanding)) return null;
    return list;
}
