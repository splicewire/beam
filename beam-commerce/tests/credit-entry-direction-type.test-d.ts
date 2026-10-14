// Type-level guard for the credit-ledger direction model (ticket 00, 2026-10-10 21:42Z:
// "beam-commerce CreditEntryType is an OPEN union"). CreditEntryType must be the CLOSED
// union `'credit' | 'debit'` — the two directions the ledger badges switch on — with NO
// trailing `string` widening that lets an unknown third kind through.
//
// This file is compiled by `tsc --noEmit` (the package `typecheck` script); its name ends in
// `.test-d.ts`, so vitest does NOT execute it as a runtime test. It fails to COMPILE while the
// union is open and compiles once it is closed.
import type { CreditEntryType } from '../src/commerce-types';

type Expect<T extends true> = T;
type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// The union must be EXACTLY `'credit' | 'debit'`. While it is `'credit' | 'debit' | string`,
// Equal<…> is false and `Expect<false>` violates `T extends true` -> compile error (red).
export type _CreditEntryTypeIsClosed = Expect<Equal<CreditEntryType, 'credit' | 'debit'>>;

// The two real directions stay assignable.
export const _credit: CreditEntryType = 'credit';
export const _debit: CreditEntryType = 'debit';

// A third kind must NOT be assignable to the closed direction union. While the union is open the
// assignment is legal, so the directive is unused -> TS2578 (red); once closed it is TS2322,
// which the directive suppresses (green).
// @ts-expect-error 'refund' is not a credit-ledger direction; the direction union is closed.
export const _thirdKind: CreditEntryType = 'refund';
