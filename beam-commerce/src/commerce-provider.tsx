import { createContext, useContext, type ReactNode } from 'react';
import type {
    Bill,
    BillPreview,
    BudgetVerdict,
    EntitlementRecord,
    SubscriptionView,
    UsageSummary,
    WalletBalance,
} from './commerce-types';

// ── The injected transport adapter — the ONE thing a host must implement (kind 1) ──
//
// It wraps whatever transport the host already has (axios, fetch, a server action) and points it at
// the correct tenant + the `beam/commerce/*` endpoints (resolved by route name); the surfaces are
// tenant- and URL-blind. Every method the three surfaces use is declared here; a host supplies them
// all through one adapter object.
export interface CommerceClient {
    // Credits / wallet
    getWallet(): Promise<WalletBalance>;
    /** Start an embedded Stripe Checkout top-up; returns the clientSecret the element mounts on. */
    startTopupCheckout(amountUsd: number): Promise<{ clientSecret: string }>;

    // Billing / spend control
    getBudget(): Promise<BudgetVerdict>;
    getUsageSummary(month?: string): Promise<UsageSummary>;
    getBills(): Promise<Bill[]>;
    getBillPreview(): Promise<BillPreview | null>;

    // Subscription
    getSubscription(): Promise<SubscriptionView>;
    /** The resolved entitlement rows (they ride `GET me` in splicewire — the host supplies them). */
    getEntitlements(): Promise<EntitlementRecord[]>;
    /**
     * Start hosted Stripe Checkout for a plan; the surface hard-navigates to the returned URL.
     * Takes the Plan ID — the backend moved onto the `plans/{id}/op/checkout` particle op, where
     * the plan rides the path segment (the old transport took a body slug).
     */
    startSubscriptionCheckout(planId: string): Promise<{ url: string }>;
    /** Get the Stripe Customer Portal URL for self-serve plan changes / cancellation. */
    getSubscriptionPortal(): Promise<{ url: string }>;
}

export interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}

/**
 * Everything host-specific, injected through one Provider. Only `client` is required (kind 1); the
 * rest have dependency-free defaults.
 */
export interface CommerceServices {
    /** kind 1 — the transport adapter (required). */
    client: CommerceClient;
    /** kind 2 — feedback sink; a dependency-free console default applies when omitted. */
    notify?: (event: NotifyEvent) => void;
    /** kind 2 — mutation-error hook; the host may toast/log/observe. The rejection still propagates. */
    onError?: (err: unknown) => void;
    /**
     * kind 3 — the host navigation slot. Stripe Checkout / Customer Portal return an off-site URL the
     * surface hands off to; navigation is host-owned (Inertia visit, `window.location`, a router). A
     * dependency-free default assigns `window.location.href` when the host injects none.
     */
    navigate?: (url: string) => void;
    /**
     * kind 3 — the tenant permission gate the billing surface reads to progressively disclose its
     * usage + bill sections (mirroring the server's in-controller abort(403)). A host wires it to its
     * own user store. Omitted → every section renders (the honest default for a host with no gate).
     */
    can?: (permission: string) => boolean;
}

const CommerceServicesContext = createContext<CommerceServices | null>(null);

function consoleNotify(event: NotifyEvent): void {
    if (event.type === 'error') console.error(`[beam-commerce] ${event.message}`);
    else console.info(`[beam-commerce] ${event.message}`);
}

function defaultNavigate(url: string): void {
    if (typeof window !== 'undefined') window.location.href = url;
}

export function CommerceProvider({
    services,
    children,
}: {
    services: CommerceServices;
    children: ReactNode;
}) {
    return (
        <CommerceServicesContext.Provider value={services}>
            {children}
        </CommerceServicesContext.Provider>
    );
}

export function useCommerceServices(): CommerceServices {
    const services = useContext(CommerceServicesContext);
    if (!services) {
        throw new Error('beam-commerce surfaces must be rendered inside a <CommerceProvider>.');
    }
    return services;
}

/** The injected `notify`, or the console default when the host supplied none. */
export function useCommerceNotify(): (event: NotifyEvent) => void {
    return useCommerceServices().notify ?? consoleNotify;
}

/** The injected navigation slot (kind 3), or a `window.location.href` default. */
export function useCommerceNavigate(): (url: string) => void {
    return useCommerceServices().navigate ?? defaultNavigate;
}

/** The injected permission gate, or an always-true default (every section renders). */
export function useCommerceCan(): (permission: string) => boolean {
    return useCommerceServices().can ?? (() => true);
}
