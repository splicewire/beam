type ReportEvent = (name: string, parameters?: Record<string, unknown>) => void;

let loading: Promise<ReportEvent | null> | undefined;

/**
 * beam-ux's `reportEvent` (an-0237 d8, EP-29), resolved once and lazily. beam-ux is an OPTIONAL peer of this package: a host
 * that cannot resolve it reports nothing, and never fails the checkout it was reporting.
 */
function reporter(): Promise<ReportEvent | null> {
    loading ??= import('@splicewire/beam-ux/site').then(
        (module) => (typeof module.reportEvent === 'function' ? (module.reportEvent as ReportEvent) : null),
        () => null,
    );

    return loading;
}

/**
 * Report one Analytics Event from a commerce surface. It resolves once the event has been handed to the provider, so a
 * surface about to leave the page (a hosted checkout redirect) can wait for it; it never rejects.
 */
export async function reportCommerceEvent(name: string, parameters: Record<string, unknown> = {}): Promise<void> {
    const report = await reporter();
    try {
        report?.(name, parameters);
    } catch {
        // An analytics provider's failure must not turn a checkout into an error.
    }
}

/** GA4 ecommerce parameters for a credits top-up of `amountUsd` (the vocabulary's `currency`, `value`, `items`). */
export function creditsCheckout(amountUsd: number): Record<string, unknown> {
    return {
        currency: 'USD',
        value: amountUsd,
        items: [{ item_id: 'credits', item_name: 'Credits', price: amountUsd, quantity: 1 }],
    };
}
