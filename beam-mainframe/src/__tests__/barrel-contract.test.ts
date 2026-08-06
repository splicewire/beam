import { describe, expect, it } from 'vitest';
import * as barrel from '../index';
import { createSlotRegistry, resolveSlots, MainframeProvider } from '@schemastud/mainframe';

/**
 * Frame OS ADR-0011 ticket 02 (CONTRACT phase) guard.
 *
 * The generic Mainframe engine relocated to `@schemastud/mainframe`; this barrel must export ONLY
 * the CMS-authoring layer and NOT re-forward the generic primitives. If a future edit accidentally
 * re-adds the `export … from '@schemastud/mainframe'` block, these assertions fail — catching a
 * silent re-forward that would undo the relocation.
 */
describe('@splicewire/beam-mainframe barrel contract', () => {
    it('no longer re-exports the generic engine primitives', () => {
        expect((barrel as Record<string, unknown>).createSlotRegistry).toBeUndefined();
        expect((barrel as Record<string, unknown>).createMainframeRegistry).toBeUndefined();
        expect((barrel as Record<string, unknown>).resolveSlots).toBeUndefined();
        expect((barrel as Record<string, unknown>).MainframeProvider).toBeUndefined();
        expect((barrel as Record<string, unknown>).MainframeOutlet).toBeUndefined();
    });

    it('still exports the CMS-authoring layer', () => {
        expect(typeof barrel.createMainframeHost).toBe('function');
    });

    it('resolves the generic primitives from @schemastud/mainframe directly', () => {
        expect(typeof createSlotRegistry).toBe('function');
        expect(typeof resolveSlots).toBe('function');
        expect(typeof MainframeProvider).toBe('function');
    });
});
