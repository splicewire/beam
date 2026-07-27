import type { ReactNode } from 'react';

/**
 * The record-agnostic projection of one immutable version — a frozen input-state snapshot with a
 * per-record monotonic number and a human-readable handle. Mirrors the PHP
 * `Splicewire\Beam\Versioning\Data\VersionData` DTO field-for-field.
 *
 * Deliberately defined here rather than sliced off `@splicewire/_resources`: the PHP DTO's own
 * docblock calls it record-agnostic (identity + provenance, no app-shaped fields), so there is no
 * app-shaped tier line to carry — every surface projects versions identically. Keeping it local
 * keeps the package free of the private app projection dependency.
 */
export interface VersionData {
    /** The version's UUID. */
    id: string;
    /** The per-record monotonic version number (1, 2, 3, …). */
    version: number;
    /** The human-readable handle for this version (default `v{n}`). */
    readable: string;
    /** An optional human annotation — the only mutable field on a version. */
    label: string | null;
    /** The id of the user who minted this version, if known. */
    createdBy: string | null;
    /** ISO-8601 mint timestamp. */
    createdAt: string | null;
    /** Whether this version is the record's current HEAD pin. */
    isHead: boolean;
}

/** The write payload for minting or restoring a version: just an optional human label. */
export interface SaveVersionInput {
    label?: string | null;
}

/**
 * The injected transport adapter — the ONE thing a host must implement (contract §1). It wraps
 * whatever transport the host already has (axios, fetch, a server action) and points it at the
 * correct record's versions endpoint; the component is record- and tenant-blind (contract §7).
 * Generic over the version DTO with a default bound to {@see VersionData}.
 */
export interface VersionsClient<TVersion = VersionData> {
    /** The record's version history, newest-first, with the current HEAD flagged. */
    list(): Promise<TVersion[]>;
    /** Mint an explicit snapshot with an optional label; resolves the new HEAD version. */
    save(input: SaveVersionInput): Promise<TVersion>;
    /** Roll forward to `ref` (a version uuid or a readable slug like `v2`); resolves the new HEAD. */
    restore(ref: string, input: SaveVersionInput): Promise<TVersion>;
}

export interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}

/**
 * Everything host-specific, injected through one Provider (contract §1, §3). Only `client` is
 * required; feedback and host chrome are optional with dependency-free defaults.
 */
export interface VersionsServices<TVersion = VersionData> {
    client: VersionsClient<TVersion>;
    /**
     * Optional cache scope folded into the react-query key so one host QueryClient can serve many
     * records without cross-talk (e.g. the composition id, or an embed id). Omit for a single-record
     * host. The `client` is already record-specific; this keeps the *cache* record-specific too.
     */
    scope?: string | number | ReadonlyArray<string | number>;
    /** Feedback sink; a dependency-free console default applies when omitted (no bundled toaster). */
    notify?: (event: NotifyEvent) => void;
    /** Mutation-error hook; the host may toast/log/observe. The rejection still propagates. */
    onError?: (err: unknown) => void;
    /** Called after a version is saved. The host may invalidate its own caches or observe. */
    onSaved?: (version: TVersion) => void;
    /**
     * Called after a restore rolls forward. A restore replaces the record's working copy, so a host
     * whose other surfaces read that record (an editor, a detail view) invalidates them here.
     */
    onRestored?: (version: TVersion) => void;
    /**
     * Optional per-row host chrome — e.g. a "who changed what" popover. The host owns the concept
     * and injects the affordance; the component only makes a slot for it. Rendered trailing the
     * row's metadata, leading the Restore action.
     */
    renderVersionMeta?: (version: TVersion) => ReactNode;
}
