import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FrameActionError, type ContextManifest, type FrameTransport, type ResourceActionDefinition } from '@schemastud/frame';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    AgreementDeclinedError,
    AgreementStepUp,
    AgreementStillRequiredError,
    AgreementTextMismatchError,
    createAgreementInterlock,
    createAgreementLock,
    createStepUp,
    type AgreementRow,
    type OutstandingRequirement,
    type PresentedAgreement,
} from '../src/index';

afterEach(cleanup);

/**
 * agreements 06: a locked action asks for agreement and then continues. Fixtures only: the 428 body is beam's
 * RequirementRefusalData shape (agreements 04), and the Agreement is read through frame's transport (`get`), never
 * through the refusal's readUrl (coord 16:26Z).
 */

const PUBLISH: ResourceActionDefinition & { requires?: string[] } = {
    key: 'publish',
    label: 'Publish',
    scope: 'record',
    method: 'POST',
    url: '/api/vaults/{id}/publish',
    input: 'Vendor.PublishInput',
    result: 'toast',
    destructive: false,
    requires: ['terms'],
};

const ACCEPT_ACTION: ResourceActionDefinition = {
    key: 'accept',
    label: 'Accept',
    scope: 'resource',
    method: 'POST',
    url: '/beam/agreements/agreements/accept',
    input: 'Splicewire.Beam.Agreements.Data.AcceptAgreementInputData',
    result: 'toast',
    destructive: false,
};

const V2 = { label: 'v2', digest: 'd'.repeat(64), content: 'Version two words.' };
const V3 = { label: 'v3', digest: 'e'.repeat(64), content: 'Version three words.' };

function outstanding(overrides: Partial<OutstandingRequirement> = {}): OutstandingRequirement {
    return {
        key: 'terms',
        version: 2,
        digest: V2.digest,
        kind: 'contract',
        title: 'Terms of Service',
        scope: 'party',
        subject: null,
        readUrl: 'https://not-followed.invalid/beam/agreements/agreements/terms',
        acceptOperation: 'agreements.accept',
        member: null,
        ...overrides,
    };
}

const refused = (requirements: OutstandingRequirement[]) =>
    new FrameActionError(428, { message: 'Agreement required.', requirements });

const manifestFor = (resource: string): ContextManifest | undefined =>
    resource === 'agreements' ? ({ actions: [ACCEPT_ACTION] } as unknown as ContextManifest) : undefined;

/**
 * A transport whose `invoke` answers from a script, one entry per call. The accept action always succeeds, and `get`
 * serves the Agreement.
 */
function scripted(answers: Array<'ok' | FrameActionError>, row: AgreementRow | (() => AgreementRow) = { title: 'Terms of Service', version: V2 }) {
    const calls: Array<{ action: string; data: unknown }> = [];
    const queue = [...answers];
    const transport = {
        get: vi.fn(async (resource: string, id: string) => {
            expect(resource).toBe('agreements');
            expect(id).toBe('terms');
            return typeof row === 'function' ? row() : row;
        }),
        invoke: vi.fn(async (action: ResourceActionDefinition, target: { id?: string | null; data?: unknown }) => {
            calls.push({ action: action.key, data: target.data });
            if (action.key === 'accept') return { message: 'Accepted.', data: null };
            const next = queue.shift();
            if (next === undefined) throw new Error('unexpected call');
            if (next === 'ok') return { message: 'Published.', data: null };
            throw next;
        }),
    } as unknown as FrameTransport;
    return { transport, calls };
}

function interlock(transport: FrameTransport, answer: boolean | ((asked: PresentedAgreement[]) => boolean)) {
    const stepUp = createStepUp();
    const asked: PresentedAgreement[][] = [];
    stepUp.subscribe(() => {
        const current = stepUp.current();
        if (current === null) return;
        asked.push(current);
        queueMicrotask(() => stepUp.answer(typeof answer === 'function' ? answer(current) : answer));
    });
    const built = createAgreementInterlock({ transport, manifestFor, abilities: () => ({}), stepUp });
    return { ...built, asked };
}

describe('the 428 interceptor', () => {
    it('passes every other answer through untouched', async () => {
        const failure = new FrameActionError(422, { message: 'Invalid.', errors: { a: ['bad'] } });
        const { transport } = scripted([failure]);
        const { transport: wrapped, asked } = interlock(transport, true);

        await expect(wrapped.invoke!(PUBLISH, { id: '7', data: {} })).rejects.toBe(failure);
        expect(asked).toEqual([]);
    });

    it('accept remedy: shows the exact frozen text, accepts that version, and replays the original request ONCE', async () => {
        const { transport, calls } = scripted([refused([outstanding()]), 'ok']);
        const { transport: wrapped, asked } = interlock(transport, true);

        await expect(wrapped.invoke!(PUBLISH, { id: '7', data: { note: 'x' } })).resolves.toEqual({ message: 'Published.', data: null });
        expect(asked).toHaveLength(1);
        expect(asked[0]).toEqual([
            expect.objectContaining({ key: 'terms', title: 'Terms of Service', label: 'v2', digest: V2.digest, content: V2.content }),
        ]);
        expect(calls).toEqual([
            { action: 'publish', data: { note: 'x' } },
            { action: 'accept', data: { agreement: 'terms', version: 'v2', digest: V2.digest } },
            { action: 'publish', data: { note: 'x' } },
        ]);
    });

    it('submit remedy: replays once with the agreement member added where the refusal says, and accepts nothing', async () => {
        const { transport, calls } = scripted([refused([outstanding({ acceptOperation: null, member: 'consent.agreement' })]), 'ok']);
        const { transport: wrapped } = interlock(transport, true);

        await wrapped.invoke!(PUBLISH, { id: '7', data: { note: 'x', consent: { other: 1 } } });
        expect(calls).toEqual([
            { action: 'publish', data: { note: 'x', consent: { other: 1 } } },
            {
                action: 'publish',
                data: { note: 'x', consent: { other: 1, agreement: { key: 'terms', version: 2, digest: V2.digest } } },
            },
        ]);
    });

    it('shows a second 428 on the replay as an error and does not retry', async () => {
        const { transport, calls } = scripted([refused([outstanding()]), refused([outstanding()])]);
        const { transport: wrapped, asked } = interlock(transport, true);

        await expect(wrapped.invoke!(PUBLISH, { id: '7', data: {} })).rejects.toBeInstanceOf(AgreementStillRequiredError);
        expect(asked).toHaveLength(1);
        expect(calls.filter((c) => c.action === 'publish')).toHaveLength(2);
    });

    it('declining closes the dialog, performs nothing and records nothing', async () => {
        const { transport, calls } = scripted([refused([outstanding()])]);
        const { transport: wrapped, stepUp } = interlock(transport, false);

        await expect(wrapped.invoke!(PUBLISH, { id: '7', data: {} })).rejects.toBeInstanceOf(AgreementDeclinedError);
        expect(calls).toEqual([{ action: 'publish', data: {} }]);
        expect(stepUp.current()).toBeNull();
    });

    it('never shows a text whose digest is not the refusal’s: one replay for a fresh refusal, then that text', async () => {
        // The server moved to v3 between the refusal (v2) and the read; the fresh refusal names v3.
        const { transport, calls } = scripted([refused([outstanding()]), refused([outstanding({ version: 3, digest: V3.digest })]), 'ok'], {
            title: 'Terms of Service',
            version: V3,
        });
        const { transport: wrapped, asked } = interlock(transport, true);

        await wrapped.invoke!(PUBLISH, { id: '7', data: {} });
        expect(asked).toHaveLength(1);
        expect(asked[0][0]).toEqual(expect.objectContaining({ digest: V3.digest, content: V3.content, label: 'v3' }));
        expect(calls).toEqual([
            { action: 'publish', data: {} },
            { action: 'publish', data: {} },
            { action: 'accept', data: { agreement: 'terms', version: 'v3', digest: V3.digest } },
            { action: 'publish', data: {} },
        ]);
    });

    it('errors, showing nothing and accepting nothing, when the text still does not match after the one replay', async () => {
        const { transport, calls } = scripted([refused([outstanding()]), refused([outstanding()])], { title: 'Terms', version: V3 });
        const { transport: wrapped, asked } = interlock(transport, true);

        await expect(wrapped.invoke!(PUBLISH, { id: '7', data: {} })).rejects.toBeInstanceOf(AgreementTextMismatchError);
        expect(asked).toEqual([]);
        expect(calls.some((c) => c.action === 'accept')).toBe(false);
    });

    it('reads the Agreement through frame’s transport and never follows the refusal’s readUrl', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
            throw new Error('readUrl must not be fetched');
        });
        const { transport } = scripted([refused([outstanding()]), 'ok']);
        const { transport: wrapped } = interlock(transport, true);

        await wrapped.invoke!(PUBLISH, { id: '7', data: {} });
        expect(transport.get).toHaveBeenCalledWith('agreements', 'terms');
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });
});

describe('the action lock', () => {
    const read = async (): Promise<AgreementRow> => ({ title: 'Terms of Service', version: V2 });

    it('locks only an action whose Agreement the ability map reports unmet, before any request', () => {
        const accept = vi.fn(async () => undefined);
        const ask = vi.fn(async () => true);
        const lockFor = (map: Record<string, boolean>) => createAgreementLock({ abilities: () => map, read, ask, accept });

        expect(lockFor({ 'agreement:terms': false })('vaults', PUBLISH)).not.toBeNull();
        expect(lockFor({ 'agreement:terms': true })('vaults', PUBLISH)).toBeNull();
        // Not in the map (subject scope, nothing registered): not drawn locked; a 428 reaches the interceptor instead.
        expect(lockFor({})('vaults', PUBLISH)).toBeNull();
        expect(lockFor({ 'agreement:terms': false })('vaults', { ...PUBLISH, requires: undefined })).toBeNull();
        expect(ask).not.toHaveBeenCalled();
        expect(accept).not.toHaveBeenCalled();
    });

    it('unlock shows the version in force and accepts THAT digest; declining accepts nothing', async () => {
        const accept = vi.fn(async () => undefined);
        let answer = false;
        const ask = vi.fn(async (_shown: PresentedAgreement[]) => answer);
        const accepted = new Set<string>();
        const lockFor = createAgreementLock({
            abilities: () => ({ 'agreement:terms': false }),
            read,
            ask,
            accept,
            accepted,
            onAccepted: (keys) => keys.forEach((k) => accepted.add(k)),
        });

        await expect(lockFor('vaults', PUBLISH)!.unlock()).resolves.toBe(false);
        expect(accept).not.toHaveBeenCalled();

        answer = true;
        await expect(lockFor('vaults', PUBLISH)!.unlock()).resolves.toBe(true);
        expect(ask.mock.calls[1][0][0]).toEqual(expect.objectContaining({ content: V2.content, digest: V2.digest }));
        expect(accept).toHaveBeenCalledWith('agreements.accept', { agreement: 'terms', version: 'v2', digest: V2.digest });
        // Accepted in this page: the lock lets go before the ability map is redrawn.
        expect(lockFor('vaults', PUBLISH)).toBeNull();
    });
});

describe('the step-up dialog', () => {
    const shown: PresentedAgreement[] = [
        { key: 'terms', title: 'Terms of Service', label: 'v2', digest: V2.digest, content: V2.content, remedy: { accept: 'agreements.accept' } },
    ];

    it('is a modal dialog named by the title, described by the full text, focused on the text, operable by keyboard', async () => {
        const stepUp = createStepUp();
        render(<AgreementStepUp controller={stepUp} />);
        expect(screen.queryByRole('dialog')).toBeNull();

        let answered: Promise<boolean> | undefined;
        act(() => {
            answered = stepUp.ask(shown);
        });

        const dialog = screen.getByRole('dialog', { name: 'Terms of Service' });
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        const text = document.getElementById(dialog.getAttribute('aria-describedby')!)!;
        expect(text.textContent).toContain(V2.content);
        expect(document.activeElement).toBe(text);

        // Escape declines.
        fireEvent.keyDown(dialog, { key: 'Escape' });
        await expect(answered).resolves.toBe(false);
        expect(screen.queryByRole('dialog')).toBeNull();

        act(() => {
            answered = stepUp.ask(shown);
        });
        const agree = screen.getByRole('button', { name: 'I agree' });
        agree.focus();
        // Tab from the last control wraps to the first, inside the dialog.
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
        expect(document.activeElement).toBe(document.querySelector('[data-step-up-text]'));
        fireEvent.click(agree);
        await expect(answered).resolves.toBe(true);
    });

    it('refuses a second question while one is open rather than stacking it', async () => {
        const stepUp = createStepUp();
        void stepUp.ask(shown);
        await expect(stepUp.ask(shown)).resolves.toBe(false);
        stepUp.answer(false);
    });
});
