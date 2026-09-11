import { createContext, useContext, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { RetentionPostureData, RetentionPostureChatData, PrunePreviewData, PruneResultData, EraseResultData } from '@splicewire/beam-resources/types/embed-retention';
export type RetentionPostureChat = RetentionPostureChatData;
export type PruneResult = PruneResultData;
export type EraseResult = EraseResultData;
export type EraseSubjectKind = 'visitor_id' | 'session_id';
export interface RetentionClient {
    posture(): Promise<RetentionPostureData>;
    preview(): Promise<PrunePreviewData>;
    prune(): Promise<PruneResultData>;
    erase(input: { kind: EraseSubjectKind; subjectId: string }): Promise<EraseResultData>;
}
export interface RetentionServices { client: RetentionClient; policyDescription?: ReactNode; }
const Context = createContext<RetentionServices | null>(null);
export function RetentionProvider({ services, children }: { services: RetentionServices; children: ReactNode }) {
    return <Context.Provider value={services}>{children}</Context.Provider>;
}
export function useRetentionServices() {
    const services = useContext(Context);
    if (!services) throw new Error('PrivacyRetentionPage requires RetentionProvider.');
    return services;
}
export function useRetentionPosture() {
    const { client } = useRetentionServices();
    return useQuery({ queryKey: ['embed', 'posture'], queryFn: () => client.posture() });
}
export function usePrunePreview() {
    const { client } = useRetentionServices();
    return useQuery({ queryKey: ['embed', 'prune-preview'], queryFn: () => client.preview() });
}
export function usePruneSessions() {
    const { client } = useRetentionServices();
    return useMutation({ mutationFn: () => client.prune() });
}
export function useEraseSubject() {
    const { client } = useRetentionServices();
    return useMutation({ mutationFn: (input: { kind: EraseSubjectKind; subjectId: string }) => client.erase(input) });
}
export function apiErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object' && 'response' in error) {
        const response = error.response;
        if (response && typeof response === 'object' && 'data' in response) {
            const data = response.data;
            if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') return data.message;
        }
    }
    return error instanceof Error ? error.message : fallback;
}
