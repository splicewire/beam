import { describe, expect, it, vi } from 'vitest';

// beam-ux is an OPTIONAL peer of beam-commerce (orch-lead 14:23Z ruling 1): a host that cannot resolve it gets no
// analytics, never a crash, and the checkout it was reporting goes on.
vi.mock('@splicewire/beam-ux/site', () => {
    throw new Error("Cannot find module '@splicewire/beam-ux/site'");
});

import { reportCommerceEvent } from './analytics';

describe('reportCommerceEvent without beam-ux', () => {
    it('resolves as a no-op instead of throwing', async () => {
        await expect(reportCommerceEvent('begin_checkout', { currency: 'USD', value: 10 })).resolves.toBeUndefined();
        await expect(reportCommerceEvent('purchase', { transaction_id: 't' })).resolves.toBeUndefined();
    });
});
