import { describe, expect, it, vi } from 'vitest';
import { configureBeamInertia } from '../config';
import { kitFor } from './kit';

vi.mock('@splicewire/beam-ux', () => ({ FilesComparisonPanel: () => null }));

describe('frame kit widgets', () => {
    it('adds configured named widgets to each realm registry', () => {
        const AgreementMemberWidget = () => null;
        configureBeamInertia({
            frameKit: () => ({
                widgets: (registry) => registry.registerWidget('agreement-member', AgreementMemberWidget),
            }),
        });

        const kit = kitFor('/agreements-widget-test/manifest');

        expect(kit.registry.resolveWidget({ type: 'object', 'x-widget': 'agreement-member' })).toBe(AgreementMemberWidget);
        expect(kit.registry.resolveWidget({ type: 'object', 'x-widget': 'unknown-widget' })).toBeUndefined();
    });

    // frame-foundation 92: needs @schemastud/frame with frame-foundation 91 (the kit's context registry).
    it('hands configured host contexts to each realm kit, with their fallback edges', () => {
        configureBeamInertia({
            frameKit: () => ({
                contexts: (contexts) => contexts.register('card', { fallback: ['list-item'], grain: 'record' }, 'acme/host'),
            }),
        });

        const kit = kitFor('/contexts-test/manifest');

        expect(kit.contexts.get('card')?.fallback).toEqual(['list-item']);
        expect(kit.contexts.get('card')?.grain).toBe('record');
        expect(kit.contexts.get('overview')?.fallback).toEqual(['summary']);
    });

    it('leaves a realm kit with frame\'s own contexts when the host binds none', () => {
        configureBeamInertia({ frameKit: () => ({}) });

        const kit = kitFor('/contexts-absent-test/manifest');

        expect(kit.contexts.get('card')).toBeUndefined();
        expect(kit.contexts.get('row-cell')?.fallback).toEqual(['edit']);
    });
});
