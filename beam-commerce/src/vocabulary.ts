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

export function entitlementSourceLabel(source: string): string {
    return ENTITLEMENT_SOURCE_LABELS[source] ?? 'Unknown entitlement source';
}
