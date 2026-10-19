import * as react from 'react';
import { ReactNode } from 'react';
import * as _tanstack_react_query from '@tanstack/react-query';

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
interface VersionData {
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
interface SaveVersionInput {
    label?: string | null;
}
/**
 * The injected transport adapter — the ONE thing a host must implement (contract §1). It wraps
 * whatever transport the host already has (axios, fetch, a server action) and points it at the
 * correct record's versions endpoint; the component is record- and tenant-blind (contract §7).
 * Generic over the version DTO with a default bound to {@see VersionData}.
 */
interface VersionsClient<TVersion = VersionData> {
    /** The record's version history, newest-first, with the current HEAD flagged. */
    list(): Promise<TVersion[]>;
    /** Mint an explicit snapshot with an optional label; resolves the new HEAD version. */
    save(input: SaveVersionInput): Promise<TVersion>;
    /** Roll forward to `ref` (a version uuid or a readable slug like `v2`); resolves the new HEAD. */
    restore(ref: string, input: SaveVersionInput): Promise<TVersion>;
}
interface NotifyEvent {
    type: 'success' | 'error';
    message: string;
}
/**
 * Everything host-specific, injected through one Provider (contract §1, §3). Only `client` is
 * required; feedback and host chrome are optional with dependency-free defaults.
 */
interface VersionsServices<TVersion = VersionData> {
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

declare function VersionsProvider({ services, children, }: {
    services: VersionsServices;
    children: ReactNode;
}): react.JSX.Element;
declare function useVersionsServices(): VersionsServices;
/** The injected `notify`, or the console default when the host supplied none. */
declare function useNotify(): (event: NotifyEvent) => void;

declare function useVersions(): _tanstack_react_query.UseQueryResult<VersionData[], Error>;
declare function useSaveVersion(): _tanstack_react_query.UseMutationResult<VersionData, Error, SaveVersionInput, unknown>;
declare function useRestoreVersion(): _tanstack_react_query.UseMutationResult<VersionData, Error, {
    ref: string;
    input?: SaveVersionInput;
}, unknown>;

/**
 * The batteries-included version-history panel: wires the package's own react-query hooks to the
 * {@see VersionsList} + {@see VersionRestoreDialog}, plus a "Save version" affordance. This is the
 * one-line mount a host reaches for — supply a {@see VersionsProvider} with a transport `client`
 * and drop `<VersionsPanel />` into a drawer, sheet, or admin panel. The composition drawer and the
 * embeds admin surface are both thin wrappers over this.
 *
 * Feedback rides the injected `notify` (a console default when the host omits it) — no toast is
 * ever bundled. `disabled` (a view-only user) hides Save and disables Restore.
 */
declare function VersionsPanel({ disabled, showSaveButton, }: {
    disabled?: boolean;
    showSaveButton?: boolean;
}): react.JSX.Element;

/**
 * The version-history list — the record-agnostic heart of the surface, extracted from the
 * composition VersionsDrawer. Renders each version as a row (readable handle, HEAD badge, label,
 * relative timestamp, optional injected host chrome) and degrades into sensible empty / loading /
 * error states. It owns no data logic and no feedback: the caller drives it with a resolved
 * `versions` array + the wiring hooks, and confirms restores through {@see VersionRestoreDialog}.
 */
declare function VersionsList<TVersion extends VersionData = VersionData>({ versions, isLoading, isError, disabled, onRestore, renderVersionMeta, emptyMessage, errorMessage, }: {
    versions: TVersion[] | undefined;
    isLoading?: boolean;
    isError?: boolean;
    /** Gate mutations (a view-only user gets a read-only list). */
    disabled?: boolean;
    onRestore: (version: TVersion) => void;
    renderVersionMeta?: (version: TVersion) => ReactNode;
    emptyMessage?: string;
    errorMessage?: string;
}): react.JSX.Element;

/**
 * Confirm-before-restore dialog, extracted from the composition VersionsDrawer. Carries NO
 * `sonner`/toast dependency — success/error feedback is the caller's concern via the injected
 * `notify`. `pending` disables the confirm and shows a spinner so a slow roll-forward reads as
 * in-flight, not stuck.
 */
declare function VersionRestoreDialog<TVersion extends VersionData = VersionData>({ version, pending, onConfirm, onCancel, }: {
    /** The version being restored, or null when the dialog is closed. */
    version: TVersion | null;
    pending: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}): react.JSX.Element;

/**
 * Compact relative time — "just now", "2m ago", "3h ago", "5d ago", then an absolute short date
 * past a week. Extracted verbatim from the composition VersionsDrawer so every version surface
 * reads timestamps identically.
 */
declare function relativeTime(iso: string | null | undefined): string;

export { type NotifyEvent, type SaveVersionInput, type VersionData, VersionRestoreDialog, type VersionsClient, VersionsList, VersionsPanel, VersionsProvider, type VersionsServices, relativeTime, useNotify, useRestoreVersion, useSaveVersion, useVersions, useVersionsServices };
