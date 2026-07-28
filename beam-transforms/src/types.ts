import type { ReactNode } from 'react';

// The RunnerTransform wire shape (popcorn-runner-substrate ticket 09, ADR-0141). Own-the-wire
// casing: these keys ARE the emitted JSON. Once the app's typescript-transformer emits a
// `RunnerTransformData` projection into `@splicewire/_resources`, this can re-key off it (the
// beam-accounts pattern); until then the shape travels with the package and a host with a divergent
// shape binds `TransformsClient<MyShape>`.

export interface RunnerTransform {
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

export interface RunnerTransformInput {
    name?: string;
    description?: string | null;
    runtime?: string;
    code?: string;
    io?: string;
    requested_grant?: Record<string, unknown> | null;
    enabled?: boolean;
    visibility?: string | null;
}

/** The total Result of a test run — outcome-discriminated, never a throw (ticket 06). */
export interface RunnerTransformResult {
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
export interface TransformsClient<TTransform = RunnerTransform> {
    list(): Promise<TTransform[]>;
    create(input: RunnerTransformInput): Promise<TTransform>;
    update(id: string, input: RunnerTransformInput): Promise<TTransform>;
    remove(id: string): Promise<void>;
    /** Run the transform against sample input; returns the total Result (never throws for an outcome). */
    test(id: string, input: Record<string, unknown>): Promise<RunnerTransformResult>;
}

export interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}

/**
 * Everything host-specific, injected through one Provider (contract §1, §3). Only `client` is
 * required; feedback + host chrome are optional with dependency-free defaults.
 */
export interface TransformsServices<TTransform = RunnerTransform> {
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
}
