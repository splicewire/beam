import { describe, expect, it } from 'vitest';
import type { BlueprintTransition, GuardCatalogEntry } from './blueprint';
import {
    attachEffect,
    detachEffect,
    effectHasParams,
    effectNeedsSetup,
    effectParamsOf,
    setEffectParams,
} from './effectParams';

// The pure state seam behind the EffectParams disclosure (ticket 16): attach/detach/write keyed to
// metadata.effect_params[<ref>] (plural per transition), and the "needs setup" computation. Pins the
// runtime-read shape + the detach-clears-the-bag invariant without a DOM.

function transition(overrides: Partial<BlueprintTransition> = {}): BlueprintTransition {
    return {
        name: 'submit',
        from: ['draft'],
        to: ['review'],
        guard: null,
        effects: [],
        metadata: null,
        ...overrides,
    } as BlueprintTransition;
}

const awaitEffect: GuardCatalogEntry = {
    name: 'workflow.await',
    label: 'Await',
    paramsSchema: {
        type: 'object',
        properties: { principals: { type: 'array', title: 'Await / notify' } },
        required: ['principals'],
    },
};

// A primitive-param effect (string + boolean) — the shape EffectParams actually renders in ticket 16
// (the array `principals` above is ticket 17's recipient picker, not a primitive field).
const webhookEffect: GuardCatalogEntry = {
    name: 'webhook.notify',
    label: 'Webhook',
    paramsSchema: {
        type: 'object',
        properties: {
            url: { type: 'string', title: 'Endpoint URL' },
            active: { type: 'boolean', title: 'Active', default: false },
        },
        required: ['url'],
    },
};

const toggleOnly: GuardCatalogEntry = {
    name: 'composition.notify_owner',
    label: 'Notify owner',
    paramsSchema: {},
};

describe('attach / detach', () => {
    it('attaches an effect by name, idempotently', () => {
        const once = attachEffect(transition(), 'workflow.await');
        expect(once.effects).toEqual(['workflow.await']);
        expect(attachEffect(once, 'workflow.await').effects).toEqual(['workflow.await']);
    });

    it('attach creates no param bag (written lazily)', () => {
        const t = attachEffect(transition(), 'workflow.await');
        expect(t.metadata).toBeNull();
        expect(effectParamsOf(t, 'workflow.await')).toEqual({});
    });

    it('detach removes the effect AND deletes its whole effect_params bag', () => {
        let t = attachEffect(transition(), 'workflow.await');
        t = setEffectParams(t, 'workflow.await', { principals: ['owner:'] });
        expect(t.metadata?.effect_params).toEqual({ 'workflow.await': { principals: ['owner:'] } });

        t = detachEffect(t, 'workflow.await');
        expect(t.effects).toEqual([]);
        expect(t.metadata).toBeNull();
    });

    it('detach preserves sibling effects and other metadata (e.g. guardParams)', () => {
        let t = transition({
            effects: ['workflow.await', 'composition.notify_owner'],
            metadata: {
                guardParams: { require_review: true },
                effect_params: { 'workflow.await': { principals: ['role:Admin'] } },
            },
        });

        t = detachEffect(t, 'workflow.await');
        expect(t.effects).toEqual(['composition.notify_owner']);
        expect(t.metadata).toEqual({ guardParams: { require_review: true } });
    });
});

describe('setEffectParams', () => {
    it('writes the runtime-read shape and round-trips per ref', () => {
        let t = attachEffect(transition(), 'workflow.await');
        t = setEffectParams(t, 'workflow.await', { principals: ['owner:', 'role:Admin'] });

        expect(effectParamsOf(t, 'workflow.await')).toEqual({
            principals: ['owner:', 'role:Admin'],
        });
        // A second effect's bag is independent.
        t = setEffectParams(t, 'webhook.notify', { url: 'https://x' });
        expect(effectParamsOf(t, 'workflow.await')).toEqual({
            principals: ['owner:', 'role:Admin'],
        });
        expect(effectParamsOf(t, 'webhook.notify')).toEqual({ url: 'https://x' });
    });
});

describe('needs-setup', () => {
    it('is true for an on effect whose required primitive param is empty, false once filled', () => {
        expect(effectHasParams(webhookEffect)).toBe(true);
        expect(effectNeedsSetup(webhookEffect, {})).toBe(true); // url unset
        expect(effectNeedsSetup(webhookEffect, { url: '' })).toBe(true); // blank
        expect(effectNeedsSetup(webhookEffect, { url: 'https://x' })).toBe(false);
    });

    it('treats a required array param (the recipient picker) as needing setup until non-empty', () => {
        expect(effectHasParams(awaitEffect)).toBe(true);
        expect(effectNeedsSetup(awaitEffect, {})).toBe(true); // principals unset
        expect(effectNeedsSetup(awaitEffect, { principals: [] })).toBe(true); // empty selection
        expect(effectNeedsSetup(awaitEffect, { principals: ['owner:'] })).toBe(false);
    });

    it('a toggle-only effect declares no params (no chevron, never needs setup)', () => {
        expect(effectHasParams(toggleOnly)).toBe(false);
        expect(effectNeedsSetup(toggleOnly, {})).toBe(false);
    });
});
