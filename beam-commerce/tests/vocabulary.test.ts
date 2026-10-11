import { describe, expect, it } from 'vitest';
import { billStatusLabel, entitlementSourceLabel, reloadOutcomeLabel } from '../src/vocabulary';

describe('commerce lifecycle vocabulary', () => {
    it.each([
        ['draft', 'Draft'],
        ['open', 'Open'],
        ['paid', 'Paid'],
        ['finalized', 'Finalized'],
        ['void', 'Void'],
        ['future_bill_state', 'Unknown bill status'],
    ])('labels bill status %s', (key, label) => expect(billStatusLabel(key)).toBe(label));

    it.each([
        ['succeeded', 'Reloaded'],
        ['declined', 'Declined'],
        ['sca_required', 'Authentication required'],
        ['transient_error', 'Retrying'],
        ['blocked', 'Blocked'],
        ['future_outcome', 'Unknown reload outcome'],
    ])('labels reload outcome %s', (key, label) => expect(reloadOutcomeLabel(key)).toBe(label));

    it.each([
        ['default', 'Default'],
        ['plan', 'Plan'],
        ['tenant', 'Tenant override'],
        ['future_source', 'Unknown entitlement source'],
    ])('labels entitlement source %s', (key, label) => expect(entitlementSourceLabel(key)).toBe(label));
});
