/**
 * Pure logic for the recipient-picker widget (beam-workflows-ux tickets 08/17): the declarative
 * `catalog.principals` vocabulary → a FLAT checklist of `kind:selector` tokens, and the classification
 * of a selected token as a known chip vs a flagged "raw" chip. Kept out of the component so the
 * flatten + classify rules are unit-testable without a DOM.
 *
 * The value the picker reads/writes is one array of opaque `kind:selector` strings at
 * `effect_params[<ref>].principals` — exactly what the runtime reads. The picker never sees a user.
 */

export type PrincipalOption = { value: string; label: string };
export type PrincipalKind = { kind: string; label: string; options?: PrincipalOption[] | null };

export type PrincipalRow = {
    /** The opaque `kind:selector` token this row toggles (e.g. `owner:`, `role:Admin`). */
    token: string;
    label: string;
    /** `flat` = a fixed kind (owner/watcher); `role` = one instance under the "By role" header. */
    group: 'flat' | 'role';
};

/**
 * Flatten the catalog kinds into a single checklist: a fixed kind (`owner`/`watcher`) → one row whose
 * token is `<kind>:`; a `role` kind → one row per option whose token is `role:<value>` — so a
 * parameterized role never reads as a second widget (ticket 08).
 */
export function principalRows(kinds: PrincipalKind[]): PrincipalRow[] {
    const rows: PrincipalRow[] = [];

    for (const k of kinds) {
        if (k.kind === 'role') {
            for (const option of k.options ?? []) {
                rows.push({ token: `role:${option.value}`, label: option.label, group: 'role' });
            }
        } else {
            rows.push({ token: `${k.kind}:`, label: k.label, group: 'flat' });
        }
    }

    return rows;
}

export type Chip = {
    token: string;
    label: string;
    /** The `kind` prefix, for the chip's small uppercase tag. */
    kind: string;
    /** A known token renders as a normal chip; an undeclared one as a flagged dashed "raw ⚠" chip. */
    known: boolean;
};

/** The `kind` prefix of a `kind:selector` token (`owner:` → `owner`, `role:Admin` → `role`). */
export function tokenKind(token: string): string {
    return token.split(':', 1)[0] ?? '';
}

/** Classify one selected token against the vocabulary — known (in a row) or raw (undeclared). */
export function classifyToken(token: string, rows: PrincipalRow[]): Chip {
    const match = rows.find((r) => r.token === token);

    return {
        token,
        label: match ? match.label : token,
        kind: tokenKind(token),
        known: Boolean(match),
    };
}

/** Classify a whole selection for chip rendering. */
export function toChips(tokens: string[], rows: PrincipalRow[]): Chip[] {
    return tokens.map((token) => classifyToken(token, rows));
}

/** Toggle a token in the selection (add if absent, remove if present) — the checklist semantics. */
export function toggleToken(tokens: string[], token: string): string[] {
    return tokens.includes(token) ? tokens.filter((t) => t !== token) : [...tokens, token];
}
