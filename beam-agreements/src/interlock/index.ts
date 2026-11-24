import type { ContextManifest, FrameTransport } from '@schemastud/frame';
import { acceptThrough, withAgreementInterlock } from './interlock';
import { createAgreementLock } from './lock';
import { agreementsFrom } from './refusal';
import { createStepUp, type StepUpController } from './stepUp';

export interface AgreementInterlockOptions<T extends FrameTransport> {
    /** The frame transport the kit would otherwise use. Agreements are read and accepted through it, unwrapped. */
    transport: T;
    /**
     * Another resource's context manifest (frame's `manifestFor`): where the accept action's definition is found.
     * Optional: absent, it's read from the transport's own manifest.
     */
    manifestFor?: (resource: string) => ContextManifest | undefined;
    /** beam's flat ability map as the page holds it now (`agreement:{key}`). */
    abilities: () => Record<string, boolean> | undefined;
    /** Reuse a controller (one `<AgreementStepUp>` per app). Default: a new one. */
    stepUp?: StepUpController;
}

/**
 * Everything a frame host binds for agreements 06, in one call:
 * - `transport`: the kit's transport, wrapped so a 428 asks and then continues;
 * - `actionLock`: frame's injection, so an action the ability map reports as unmet is drawn locked before any request;
 * - `stepUp`: the controller `<AgreementStepUp controller={…}/>` renders.
 * Agreements accepted here are remembered for this page, so a lock drawn from the page's ability map lets go at once;
 * after a reload the server's map says so itself.
 */
export function createAgreementInterlock<T extends FrameTransport>(options: AgreementInterlockOptions<T>) {
    const stepUp = options.stepUp ?? createStepUp();
    const read = agreementsFrom(options.transport);
    const accept = acceptThrough(options.transport, options.manifestFor);
    const accepted = new Set<string>();
    const onAccepted = (keys: string[]) => keys.forEach((key) => accepted.add(key));

    return {
        transport: withAgreementInterlock(options.transport, { read, ask: stepUp.ask, accept, onAccepted }),
        actionLock: createAgreementLock({ abilities: options.abilities, read, ask: stepUp.ask, accept, accepted, onAccepted }),
        stepUp,
    };
}

export { AgreementStepUp } from './AgreementStepUp';
export { createStepUp, type StepUpController } from './stepUp';
export {
    acceptThrough,
    withAgreementInterlock,
    AgreementDeclinedError,
    AgreementStillRequiredError,
    type AcceptAgreement,
    type AskForAgreement,
    type InterlockOptions,
} from './interlock';
export { createAgreementLock, type AgreementLockOptions, type FrameActionLock } from './lock';
export {
    agreementsFrom,
    refusalOf,
    requirementsOf,
    presentRefused,
    AgreementTextMismatchError,
    AgreementUnavailableError,
    AGREEMENTS_RESOURCE,
    type AgreementReader,
    type AgreementRow,
    type OutstandingRequirement,
    type PresentedAgreement,
} from './refusal';
