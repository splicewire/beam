import type { PresentedAgreement } from './refusal';

/**
 * The one question in flight. `ask()` is what the interceptor and the lock call (they live outside React, in a frame
 * kit built at module scope); `<AgreementStepUp>` renders whatever is being asked and answers it. A second ask while
 * one is open is refused rather than stacked: it resolves false (declined), so nothing runs twice behind one dialog.
 */
export interface StepUpController {
    ask(agreements: PresentedAgreement[]): Promise<boolean>;
    /** The question being asked now, or null. */
    current(): PresentedAgreement[] | null;
    answer(accepted: boolean): void;
    subscribe(listener: () => void): () => void;
}

export function createStepUp(): StepUpController {
    let pending: { agreements: PresentedAgreement[]; resolve: (accepted: boolean) => void } | null = null;
    const listeners = new Set<() => void>();
    const emit = () => listeners.forEach((listener) => listener());

    return {
        ask(agreements) {
            if (pending !== null) return Promise.resolve(false);
            return new Promise<boolean>((resolve) => {
                pending = { agreements, resolve };
                emit();
            });
        },
        current: () => pending?.agreements ?? null,
        answer(accepted) {
            const open = pending;
            if (open === null) return;
            pending = null;
            emit();
            open.resolve(accepted);
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}
