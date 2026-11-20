import type { ResourceActionDefinition, Row } from '@schemastud/frame';
import type { AcceptAgreement, AskForAgreement } from './interlock';
import { AgreementUnavailableError, type AgreementReader, type PresentedAgreement } from './refusal';

/**
 * frame's `ActionLock` (Q-06b (a); `@schemastud/frame` ≥ agreements 06), written structurally so this package also
 * builds against a frame that predates it.
 */
export interface FrameActionLock {
    label: string;
    unlock(): Promise<boolean>;
}

export interface AgreementLockOptions {
    /** beam's flat ability map (CanMapBuilder, agreements 05): `agreement:{key}` is false until the Agreement is accepted. */
    abilities: () => Record<string, boolean> | undefined;
    read: AgreementReader;
    ask: AskForAgreement;
    accept: AcceptAgreement;
    /** Agreements accepted in this page since the ability map was drawn (shared with the interceptor's `onAccepted`). */
    accepted?: ReadonlySet<string>;
    onAccepted?: (keys: string[]) => void;
    /** The locked button's description. Default names the Agreements' keys. */
    describe?: (keys: string[]) => string;
}

const ACCEPT = 'agreements.accept';

/**
 * frame's `actionLock` for Agreements: an action whose `requires` names an Agreement the ability map reports as unmet
 * (`agreement:{key}` === false) is drawn locked before any request. A key the map doesn't carry (subject scope, nothing
 * registered) isn't drawn locked; a 428 then reaches the interceptor, which is the safety net either way.
 *
 * Unlocking shows each Agreement's version IN FORCE, read through frame's transport, and accepts THAT version's
 * digest: the text shown is the version whose digest is submitted. Declining leaves the action locked and sends nothing.
 */
export function createAgreementLock(options: AgreementLockOptions) {
    const describe =
        options.describe ?? ((keys: string[]) => `Needs your agreement first (${keys.join(', ')}). You'll be shown it before anything happens.`);

    return (_resource: string, action: ResourceActionDefinition & { requires?: string[] }, _record?: Row): FrameActionLock | null => {
        const map = options.abilities() ?? {};
        const unmet = (action.requires ?? []).filter((key) => map[`agreement:${key}`] === false && !options.accepted?.has(key));
        if (unmet.length === 0) return null;

        return {
            label: describe(unmet),
            async unlock() {
                const presented: PresentedAgreement[] = [];
                for (const key of unmet) {
                    const row = await options.read(key);
                    const version = row?.version;
                    if (!version || typeof version.content !== 'string') throw new AgreementUnavailableError(key);
                    presented.push({
                        key,
                        title: row?.title ?? key,
                        label: version.label,
                        digest: version.digest,
                        content: version.content,
                        remedy: { accept: ACCEPT },
                    });
                }

                if (!(await options.ask(presented))) return false;

                for (const agreement of presented) {
                    await options.accept(ACCEPT, { agreement: agreement.key, version: agreement.label, digest: agreement.digest });
                }
                options.onAccepted?.(unmet);
                return true;
            },
        };
    };
}
