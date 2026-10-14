// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ColumnDef } from '@tanstack/react-table';
import { ledgerColumns } from './CreditsSurface';
import type { CreditLedgerEntry } from './commerce-types';

type LedgerEntryShape = { type: 'credit' | 'debit'; reason?: string | null; purchaseRef?: string | null };

// TC01 (owner ruling B): the credit-ledger event reads a fixed direction label — "Credit added" for a
// credit, "Usage charge" for a debit — and the raw ledger reason / purchaseRef (machine strings such
// as `topup:fake_cs_…`) appear ONLY as secondary audit detail, never as the primary event label.
// These render the ACTUAL ledger column cell, so a revert to the raw-reason primary fails here.

const eventCol = ledgerColumns.find((c) => c.header === 'Event') as ColumnDef<CreditLedgerEntry, unknown>;

function renderEvent(entry: LedgerEntryShape): HTMLElement {
    const cell = eventCol.cell as (ctx: { row: { original: LedgerEntryShape } }) => ReactElement;
    const host = document.createElement('div');
    host.innerHTML = renderToStaticMarkup(cell({ row: { original: entry } }));
    return host;
}
// The primary event label is the first line of the cell; the audit ref is the tagged muted line.
const primary = (host: HTMLElement) => host.firstElementChild?.firstElementChild?.textContent ?? '';
const auditRef = (host: HTMLElement) => host.querySelector('[data-ledger-audit-ref]')?.textContent ?? null;

describe('credit ledger event labels (TC01 / owner B)', () => {
    it('exposes an Event column (the raw Reason column was retired)', () => {
        expect(eventCol).toBeTruthy();
    });

    it('a credit reads "Credit added", with the machine reason only as secondary audit detail', () => {
        const host = renderEvent({ type: 'credit', reason: 'topup:fake_cs_abc123', purchaseRef: 'cs_test_999' });

        expect(primary(host)).toBe('Credit added');
        expect(primary(host)).not.toContain('topup'); // the machine reason is never the event label
        expect(auditRef(host)).toContain('topup:fake_cs_abc123'); // it survives only as audit detail
        expect(auditRef(host)).toContain('cs_test_999');
    });

    it('a debit reads "Usage charge" regardless of its reason', () => {
        const host = renderEvent({ type: 'debit', reason: 'generation:run_42', purchaseRef: null });

        expect(primary(host)).toBe('Usage charge');
        expect(primary(host)).not.toContain('generation');
        expect(auditRef(host)).toContain('generation:run_42');
    });

    it('omits the audit line when there is no reference', () => {
        const host = renderEvent({ type: 'credit', reason: null, purchaseRef: null });

        expect(primary(host)).toBe('Credit added');
        expect(auditRef(host)).toBeNull();
    });
});
