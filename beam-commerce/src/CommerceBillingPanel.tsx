import { useEffect, useRef, type ReactNode } from 'react';
import { BillingSurface } from './BillingSurface';
import { CreditsSurface } from './CreditsSurface';
import { SubscriptionSurface, type CheckoutSignalProps } from './SubscriptionSurface';

export type CommerceCustody = 'none' | 'hosted' | 'direct';
export type CommerceBillingPanelSelection = 'subscription' | 'credits' | 'auto-reload';

export interface CommerceBillingPanelProps extends CheckoutSignalProps {
    custody: CommerceCustody;
    selectedPanel?: CommerceBillingPanelSelection | null;
    /** The host-wrapped auto-reload surface; omitted when that capability is not installed. */
    autoReload?: ReactNode;
}

/**
 * The canonical tenant Billing composition. Usage and budget remain honest under every custody
 * posture; surfaces that require a money-in relationship do not mount at all under `none`.
 */
export function CommerceBillingPanel({
    custody,
    selectedPanel = null,
    autoReload,
    checkoutSignal,
    onClearCheckoutSignal,
}: CommerceBillingPanelProps) {
    const hasMoneyCustody = custody !== 'none';
    const subscriptionRef = useRef<HTMLElement>(null);
    const creditsRef = useRef<HTMLElement>(null);
    const autoReloadRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!selectedPanel) return;

        const target = {
            subscription: subscriptionRef.current,
            credits: creditsRef.current,
            'auto-reload': autoReloadRef.current,
        }[selectedPanel];

        if (!target) return;

        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'start' });
    }, [selectedPanel]);

    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
                <p className="text-sm text-muted-foreground">
                    Usage, spending, subscription and prepaid credit for this workspace.
                </p>
            </header>

            <BillingSurface embedded />

            {hasMoneyCustody && (
                <>
                    <section ref={subscriptionRef} tabIndex={-1} data-commerce-panel="subscription">
                        <SubscriptionSurface
                            embedded
                            checkoutSignal={checkoutSignal}
                            onClearCheckoutSignal={onClearCheckoutSignal}
                        />
                    </section>
                    <section ref={creditsRef} tabIndex={-1} data-commerce-panel="credits">
                        <CreditsSurface embedded />
                    </section>
                    {autoReload && (
                        <section
                            ref={autoReloadRef}
                            tabIndex={-1}
                            data-commerce-panel="auto-reload"
                            className="space-y-4"
                            aria-labelledby="commerce-auto-reload"
                        >
                            <h2 id="commerce-auto-reload" className="text-xl font-semibold tracking-tight">
                                Auto-reload
                            </h2>
                            {autoReload}
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
