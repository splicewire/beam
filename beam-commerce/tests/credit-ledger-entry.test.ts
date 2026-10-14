import { describe, expect, it } from 'vitest';
import { toCreditLedgerEntry } from '../src/commerce-types';

// The wire ledger `type` is bare `string`; `toCreditLedgerEntry` narrows it onto the closed
// direction union without changing the surface's existing binary read: `credit` iff exactly
// `'credit'`, `debit` for everything else (including any unexpected future wire value).
const base = { amountUsd: 5, reason: 'topup', purchaseRef: null, at: '2026-10-10T00:00:00Z' };

describe('toCreditLedgerEntry direction narrowing', () => {
    it.each([
        ['credit', 'credit'],
        ['debit', 'debit'],
        ['refund', 'debit'],
        ['', 'debit'],
    ])('narrows wire type %o to %o', (wire, expected) => {
        expect(toCreditLedgerEntry({ ...base, type: wire } as never).type).toBe(expected);
    });

    it('preserves the other ledger fields unchanged', () => {
        const entry = toCreditLedgerEntry({ ...base, type: 'credit' } as never);
        expect(entry).toMatchObject(base);
    });
});
