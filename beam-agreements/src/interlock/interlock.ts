import type { ContextManifest, FrameTransport, ResourceActionDefinition } from '@schemastud/frame';
import {
    AGREEMENTS_RESOURCE,
    AgreementTextMismatchError,
    presentRefused,
    refusalOf,
    type AgreementReader,
    type OutstandingRequirement,
    type PresentedAgreement,
} from './refusal';

/** Asks the person. Resolves true on accept, false on decline (the dialog closes; nothing is performed or recorded). */
export type AskForAgreement = (agreements: PresentedAgreement[]) => Promise<boolean>;

/** Records the person's acceptance of one Agreement through its accept operation (`agreements.accept`). */
export type AcceptAgreement = (operation: string, input: { agreement: string; version: string; digest: string }) => Promise<void>;

/** Declined: nothing ran and nothing was recorded. Frame announces the message. */
export class AgreementDeclinedError extends Error {
    constructor(titles: string[]) {
        super(`Not done: ${titles.join(', ')} wasn't accepted.`);
        this.name = 'AgreementDeclinedError';
    }
}

/** The one replay was refused again: shown as an error and never retried (agreements 06). */
export class AgreementStillRequiredError extends Error {
    constructor(readonly requirements: OutstandingRequirement[]) {
        super(`Still waiting on ${requirements.map((r) => r.title).join(', ')}. Nothing more was tried.`);
        this.name = 'AgreementStillRequiredError';
    }
}

/**
 * Accept through frame's own transport: the accept operation is the `agreements` resource's declared action (its op
 * suffix, `accept`), invoked with the manifest's definition. Pass the UNWRAPPED transport, so accepting is never itself
 * intercepted.
 */
export function acceptThrough(
    transport: Pick<FrameTransport, 'invoke' | 'getManifest'>,
    manifestFor?: (resource: string) => ContextManifest | undefined,
): AcceptAgreement {
    return async (operation, input) => {
        const [resource, op] = operation.includes('.')
            ? [operation.slice(0, operation.lastIndexOf('.')), operation.slice(operation.lastIndexOf('.') + 1)]
            : [AGREEMENTS_RESOURCE, operation];
        // The kit's own lookup when the host has one; else the transport's manifest (a kit built at module scope has
        // no lookup yet when its transport is made).
        const context =
            manifestFor?.(resource) ??
            ((await transport.getManifest?.()) as { contexts?: Record<string, ContextManifest> } | undefined)?.contexts?.[resource];
        const action = context?.actions?.find((a) => a.key === op);
        if (!action || !transport.invoke) throw new Error(`This app can't record acceptance (${operation} isn't offered).`);
        await transport.invoke(action, { id: null, data: input });
    };
}

/** Set `path` (dot-separated) on a copy of `data`, creating plain objects on the way. */
function withMember(data: unknown, path: string, value: unknown): Record<string, unknown> {
    const root: Record<string, unknown> = data && typeof data === 'object' ? { ...(data as Record<string, unknown>) } : {};
    const parts = path.split('.');
    let node = root;
    for (const part of parts.slice(0, -1)) {
        const next = node[part];
        node[part] = next && typeof next === 'object' ? { ...(next as Record<string, unknown>) } : {};
        node = node[part] as Record<string, unknown>;
    }
    node[parts[parts.length - 1]] = value;
    return root;
}

export interface InterlockOptions {
    read: AgreementReader;
    ask: AskForAgreement;
    accept: AcceptAgreement;
    /** Told which Agreements were just accepted, so a lock drawn from a stale ability map can let go at once. */
    onAccepted?: (keys: string[]) => void;
}

type Invoke = NonNullable<FrameTransport['invoke']>;

/**
 * Wrap a frame transport so a declared action that answers 428 asks for agreement and then continues:
 * - each outstanding Agreement is shown with its title and full frozen text, and only when the text's digest is the
 *   refusal's. On a mismatch the original request is replayed ONCE for a fresh refusal; a second mismatch is an error;
 * - accept remedy: the accept operation runs, then the original request is replayed once;
 * - submit remedy: the original request is replayed once with the agreement member added where the refusal says;
 * - a 428 on the replay is an error and is not retried; declining performs nothing and records nothing.
 * Every other answer passes through untouched.
 */
export function withAgreementInterlock<T extends Pick<FrameTransport, 'invoke'>>(transport: T, options: InterlockOptions): T {
    const inner = transport.invoke?.bind(transport) as Invoke | undefined;
    if (!inner) return transport;

    async function presentAll(outstanding: OutstandingRequirement[]): Promise<PresentedAgreement[] | 'moved'> {
        const presented: PresentedAgreement[] = [];
        for (const requirement of outstanding) {
            const shown = await presentRefused(requirement, options.read);
            if (shown === 'moved') return 'moved';
            presented.push(shown);
        }
        return presented;
    }

    const invoke: Invoke = async (action: ResourceActionDefinition, target) => {
        let outstanding: OutstandingRequirement[] | null;
        try {
            return await inner(action, target);
        } catch (error) {
            outstanding = refusalOf(error);
            if (outstanding === null) throw error;
        }

        let presented = await presentAll(outstanding);
        if (presented === 'moved') {
            // The version moved between the refusal and the read: replay once for a fresh refusal, and stop there.
            try {
                return await inner(action, target);
            } catch (error) {
                const fresh = refusalOf(error);
                if (fresh === null) throw error;
                outstanding = fresh;
            }
            presented = await presentAll(outstanding);
            if (presented === 'moved') throw new AgreementTextMismatchError(outstanding[0].key);
        }

        if (!(await options.ask(presented))) {
            throw new AgreementDeclinedError(presented.map((p) => p.title));
        }

        let data = target.data;
        const accepted: string[] = [];
        for (const agreement of presented) {
            if ('accept' in agreement.remedy) {
                await options.accept(agreement.remedy.accept, {
                    agreement: agreement.key,
                    version: agreement.label,
                    digest: agreement.digest,
                });
                accepted.push(agreement.key);
            } else {
                data = withMember(data, agreement.remedy.member, {
                    key: agreement.key,
                    version: agreement.remedy.version,
                    digest: agreement.digest,
                });
            }
        }
        if (accepted.length > 0) options.onAccepted?.(accepted);

        try {
            return await inner(action, { ...target, data });
        } catch (error) {
            const again = refusalOf(error);
            if (again !== null) throw new AgreementStillRequiredError(again);
            throw error;
        }
    };

    return Object.assign(Object.create(Object.getPrototypeOf(transport) as object), transport, { invoke }) as T;
}
