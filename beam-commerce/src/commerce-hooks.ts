import { useMutation, useQuery } from '@tanstack/react-query';
import { useCommerceServices } from './commerce-provider';

// Query keys are package-namespaced (no host namespace leaks in). The host owns the QueryClient —
// these hooks run on whatever provider wraps the host tree.
const WALLET_KEY = ['beam-commerce', 'wallet'] as const;
const BUDGET_KEY = ['beam-commerce', 'budget'] as const;
const BILLS_KEY = ['beam-commerce', 'bills'] as const;
const BILL_PREVIEW_KEY = ['beam-commerce', 'bill-preview'] as const;
const SUBSCRIPTION_KEY = ['beam-commerce', 'subscription'] as const;
const ENTITLEMENTS_KEY = ['beam-commerce', 'entitlements'] as const;
const usageKey = (month?: string) => ['beam-commerce', 'usage-summary', month ?? 'current'] as const;

// ── Credits / wallet ────────────────────────────────────────────────────────
export function useWallet() {
    const { client } = useCommerceServices();
    return useQuery({ queryKey: WALLET_KEY, queryFn: () => client.getWallet() });
}

export function useCreditTopupCheckout() {
    const { client, onError } = useCommerceServices();
    return useMutation({
        mutationFn: (amountUsd: number) => client.startTopupCheckout(amountUsd),
        onError: (err) => onError?.(err),
    });
}

// ── Billing / spend control ───────────────────────────────────────────────────
export function useBudget() {
    const { client } = useCommerceServices();
    return useQuery({ queryKey: BUDGET_KEY, queryFn: () => client.getBudget() });
}

export function useUsageSummary(month?: string) {
    const { client } = useCommerceServices();
    return useQuery({ queryKey: usageKey(month), queryFn: () => client.getUsageSummary(month) });
}

export function useBills() {
    const { client } = useCommerceServices();
    return useQuery({ queryKey: BILLS_KEY, queryFn: () => client.getBills() });
}

export function useBillPreview() {
    const { client } = useCommerceServices();
    return useQuery({ queryKey: BILL_PREVIEW_KEY, queryFn: () => client.getBillPreview() });
}

// ── Subscription ──────────────────────────────────────────────────────────────
export function useSubscription() {
    const { client } = useCommerceServices();
    return useQuery({ queryKey: SUBSCRIPTION_KEY, queryFn: () => client.getSubscription() });
}

export function useEntitlements() {
    const { client } = useCommerceServices();
    return useQuery({ queryKey: ENTITLEMENTS_KEY, queryFn: () => client.getEntitlements() });
}

export function useSubscriptionCheckout() {
    const { client, onError } = useCommerceServices();
    return useMutation({
        mutationFn: (plan: string) => client.startSubscriptionCheckout(plan),
        onError: (err) => onError?.(err),
    });
}

export function useSubscriptionPortal() {
    const { client, onError } = useCommerceServices();
    return useMutation({
        mutationFn: () => client.getSubscriptionPortal(),
        onError: (err) => onError?.(err),
    });
}
