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
});
