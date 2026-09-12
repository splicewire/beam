import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCommerceServices } from './commerce-provider';
import type { CreditReloadResult } from './commerce-types';

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

/**
 * The DIRECT-RAIL reload — the synchronous-custody sibling of {@link useCreditTopupCheckout}.
 *
 * On a captured reload the authoritative wallet rides the result, so the wallet query is SEEDED from
 * it rather than invalidated: an invalidate would round-trip to read a number the server has already
 * handed us, and the gap between the two is where a stale balance renders.
 *
 * A DECLINE is a successful mutation with `captured: false` — the rail answered. Only a transport
 * failure rejects. Callers branch on `captured`, never on `isError`, for that distinction.
 */
export function useReloadCredits() {
    const { client, onError } = useCommerceServices();
    const queryClient = useQueryClient();

    return useMutation<CreditReloadResult, unknown, number>({
        mutationFn: async (amountUsd: number) => {
            if (!client.reloadCredits) {
                throw new Error('This host does not collect credit reloads on a direct rail.');
            }
            return client.reloadCredits(amountUsd);
        },
        onSuccess: (result) => {
            // Seeded on BOTH arms: a decline's wallet is the proof that nothing moved, and writing it
            // back is what makes the displayed balance that proof rather than a cached guess.
            queryClient.setQueryData(WALLET_KEY, result.wallet);
        },
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
        mutationFn: (planId: string) => client.startSubscriptionCheckout(planId),
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
