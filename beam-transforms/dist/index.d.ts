import * as react from 'react';
import { ReactNode } from 'react';
import * as _tanstack_react_query from '@tanstack/react-query';

interface RunnerTransform {
    id: string;
    name: string;
    slug: string | null;
    description: string | null;
    runtime: string;
    code: string;
    io: string;
    build: string | null;
    link: string | null;
    engineVersion: string | null;
    inputSchema: Record<string, unknown> | null;
    outputSchema: Record<string, unknown> | null;
    /** The author's requested grant — an honest upper bound. */
    requestedGrant: Record<string, unknown>;
    /** The host-resolved effective grant (= requested ∩ policy, deny-by-default). */
    effectiveGrant: Record<string, unknown>;
    /** Requested axes narrowed away by policy — the legible deny-by-default readout. */
    deniedAxes: string[];
    enabled: boolean;
    visibility: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}
interface RunnerTransformInput {
    name?: string;
    description?: string | null;
    runtime?: string;
    code?: string;
    io?: string;
    requestedGrant?: Record<string, unknown> | null;
    enabled?: boolean;
    visibility?: string | null;
}
/** The total Result of a test run — outcome-discriminated, never a throw (ticket 06). */
interface RunnerTransformResult {
    outcome: string;
    error: string | null;
    output: Record<string, unknown>;
    stderr: string;
    stderrTruncated: boolean;
    telemetry: {
        wallMs: number | null;
        cpuMs: number | null;
        memPeakBytes: number | null;
        exitCode: number | null;
        signal: number | null;
        limitHit: boolean;
        sandboxed: boolean;
    };
    deniedAxis: string | null;
    deniedTarget: string | null;
}
/**
 * The injected transport adapter — the ONE thing a host implements (contract §1). It wraps the
 * host's own transport (axios/fetch) and points it at the correct tenant + route; the component is
 * tenant-blind. Generic over the row DTO, default-bound to {@link RunnerTransform}.
 */
interface TransformsClient<TTransform = RunnerTransform> {
    list(): Promise<TTransform[]>;
    create(input: RunnerTransformInput): Promise<TTransform>;
    update(id: string, input: RunnerTransformInput): Promise<TTransform>;
    remove(id: string): Promise<void>;
    /** Run the transform against sample input; returns the total Result (never throws for an outcome). */
    test(id: string, input: Record<string, unknown>): Promise<RunnerTransformResult>;
}
/** What the acting user may change, as the host's server policy answers it. */
interface TransformsCapabilities {
    create: boolean;
    update: boolean;
    delete: boolean;
}
interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}
/**
 * Everything host-specific, injected through one Provider (contract §1, §3). Only `client` is
 * required; feedback + host chrome are optional with dependency-free defaults.
 */
interface TransformsServices<TTransform = RunnerTransform> {
    client: TransformsClient<TTransform>;
    /** Feedback sink; a dependency-free console default applies when omitted (no bundled toaster). */
    notify?: (event: NotifyEvent) => void;
    /** Mutation-error hook; the rejection still propagates. */
    onError?: (err: unknown) => void;
    /**
     * Optional host-chrome slot rendered in the editor header — e.g. a "learn more" link or a
     * per-transform activity affordance. The host owns the concept; the component only makes a slot.
     */
    renderHeaderExtra?: (transform: TTransform | null) => ReactNode;
    /**
     * What the actor may change. Each omitted key is allowed, so a host that passes nothing keeps full
     * controls. The editor only follows the answer; the server still decides every write. Testing a
     * transform needs read access only and is never hidden.
     */
    can?: Partial<TransformsCapabilities>;
}

declare function TransformsProvider({ services, children, }: {
    services: TransformsServices;
    children: ReactNode;
}): react.JSX.Element;
declare function useTransformsServices(): TransformsServices;
/** The injected `notify`, or the console default when the host supplied none. */
declare function useNotify(): (event: NotifyEvent) => void;
/** The injected `can`, each omitted key allowed. */
declare function useTransformsCan(): TransformsCapabilities;

declare function RunnerTransformEditor(): react.JSX.Element;

declare function useTransforms(): _tanstack_react_query.UseQueryResult<RunnerTransform[], Error>;
declare function useCreateTransform(): _tanstack_react_query.UseMutationResult<RunnerTransform, Error, RunnerTransformInput, unknown>;
declare function useUpdateTransform(id: string): _tanstack_react_query.UseMutationResult<RunnerTransform, Error, RunnerTransformInput, unknown>;
declare function useDeleteTransform(): _tanstack_react_query.UseMutationResult<void, Error, string, unknown>;
declare function useTestTransform(id: string): _tanstack_react_query.UseMutationResult<RunnerTransformResult, Error, Record<string, unknown>, unknown>;

export { type NotifyEvent, type RunnerTransform, RunnerTransformEditor, type RunnerTransformInput, type RunnerTransformResult, type TransformsCapabilities, type TransformsClient, TransformsProvider, type TransformsServices, useCreateTransform, useDeleteTransform, useNotify, useTestTransform, useTransforms, useTransformsCan, useTransformsServices, useUpdateTransform };
