const BILL_STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    open: 'Open',
    paid: 'Paid',
    finalized: 'Finalized',
    void: 'Void',
};

const RELOAD_OUTCOME_LABELS: Record<string, string> = {
    succeeded: 'Reloaded',
    declined: 'Declined',
    sca_required: 'Authentication required',
    transient_error: 'Retrying',
    blocked: 'Blocked',
};

const ENTITLEMENT_SOURCE_LABELS: Record<string, string> = {
    default: 'Default',
    plan: 'Plan',
    tenant: 'Tenant override',
};

export function billStatusLabel(status: string): string {
    return BILL_STATUS_LABELS[status] ?? 'Unknown bill status';
}

export function reloadOutcomeLabel(outcome: string): string {
    return RELOAD_OUTCOME_LABELS[outcome] ?? 'Unknown reload outcome';
}

export function entitlementSourceLabel(source: string): string {
    return ENTITLEMENT_SOURCE_LABELS[source] ?? 'Unknown entitlement source';
}
