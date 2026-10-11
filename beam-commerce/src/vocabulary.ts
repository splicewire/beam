const BILL_STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    open: 'Open',
    paid: 'Paid',
    finalized: 'Finalized',
    invoiced: 'Invoiced',
    void: 'Void',
};

const RELOAD_OUTCOME_LABELS: Record<string, string> = {
    succeeded: 'Reloaded',
    declined: 'Declined',
    sca_required: 'Authentication required',
    transient_error: 'Retrying',
    blocked: 'Blocked',
};

// OD-B3-01 (ruling B): what the customer can DO about a failed auto-reload. Keyed on the provider
// error code, but the code itself is never the copy — it belongs in a diagnostic disclosure. Unknown
// codes fall back to the generic update-payment-method action.
const RELOAD_FAILURE_COPY: Record<string, string> = {
    card_declined: 'Your card was declined — update your payment method to resume automatic top-ups.',
    insufficient_funds:
        'The payment was declined for insufficient funds — update your payment method to resume automatic top-ups.',
    expired_card: 'Your card has expired — update your payment method to resume automatic top-ups.',
    authentication_required:
        'Your bank needs to confirm this payment — update your payment method or complete authentication to resume automatic top-ups.',
};

export const ENTITLEMENT_SOURCE_FACETS = [
    { key: 'all', label: 'All' },
    { key: 'default', label: 'Default' },
    { key: 'plan', label: 'Plan' },
    { key: 'tenant', label: 'Tenant override' },
] as const;

const ENTITLEMENT_SOURCE_LABELS = Object.fromEntries(
    ENTITLEMENT_SOURCE_FACETS.filter((facet) => facet.key !== 'all').map((facet) => [facet.key, facet.label]),
);

export function billStatusLabel(status: string): string {
    return BILL_STATUS_LABELS[status] ?? 'Unknown bill status';
}

export function reloadOutcomeLabel(outcome: string): string {
    return RELOAD_OUTCOME_LABELS[outcome] ?? 'Unknown reload outcome';
}

/**
 * Customer-actionable copy for a failed auto-reload (OD-B3-01, ruling B). The exact provider code
 * (`stripeErrorCode`) is deliberately NOT part of this string — it belongs in a diagnostic
 * disclosure, never inline. Unknown codes return the generic update-payment-method action.
 */
export function reloadFailureCopy(code: string | null | undefined): string {
    return (code && RELOAD_FAILURE_COPY[code]) ?? 'The automatic top-up didn’t go through — update your payment method to resume.';
}

export function entitlementSourceLabel(source: string): string {
    return ENTITLEMENT_SOURCE_LABELS[source] ?? 'Unknown entitlement source';
}
