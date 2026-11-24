import * as react from 'react';
import { WorkflowProjectionData } from '@splicewire/beam-workflows/action-form';

interface ReleaseRecording {
    releaseId: string;
    status: string;
    sha: string | null;
    noChange: boolean;
    canRetry: boolean;
    message: string | null;
}
/** Wire projection of the package-owned PHP ReleaseData / ReleaseCommandData. */
interface ReleaseRecord {
    id: string;
    title: string;
    realm: string;
    status: string;
    reviewedBy: string | null;
    members: Array<{
        entryId: string | null;
        versionId: string | null;
        observedPin: string | null;
        redirectTarget: string | null;
        stale: boolean;
        /** Ticket 11: the member kind — `"entry"` or `"config-override"` (`RELEASE_KIND_CONFIG`). */
        kind: string;
        /** Ticket 11: the kind's address — the entry id, or the config section root (e.g. `beam.ux`). */
        ref: string;
        /** Ticket 11: what a reviewer reads — the entry title, or the config section title. */
        label: string;
        /** Ticket 11 (rev 3): the entry's `UxType` for `kind: "entry"` (drives the Page / Theme / Other grouping); `null` for a config member. */
        entryType: "layout" | "template" | "page" | "component" | "theme" | null;
    }>;
    workflow: WorkflowProjectionData | null;
    canSchedule: boolean;
    reviewRequired: boolean;
    recording?: ReleaseRecording | null;
    filesMemberId?: string | null;
    filesHref?: string | null;
    /** ADR-0232 d8: whether the Release's Preview Links are on, and a link minted for this read (managers only). */
    previewLinksEnabled?: boolean;
    previewLink?: string | null;
    /** ADR-0232 d15: where a signed-in author opens this Release's Preview; null with nothing saved to render. */
    previewHref?: string | null;
    /** Whether this reader may turn the links on or off and rotate them: edit on every member, as the actions check. */
    canManagePreviewLinks?: boolean;
    /**
     * ux-0236 d2: the Redirects the Release leaves: while open, the ones it would leave (no id yet); once published, the
     * ones it left, each with its id.
     */
    redirects?: ReleaseRedirect[];
}
/** A Redirect a Release leaves (ux-0236 d2); `to` is null where it leads nowhere a page answers now. */
interface ReleaseRedirect {
    id: string | null;
    path: string;
    match: string;
    to: string | null;
    origin: string;
}
interface ReleaseCommand {
    action: "member" | "drop" | "rebase" | "use-latest" | "submit" | "approve" | "publish" | "schedule" | "rollback" | "links-on" | "links-off" | "rotate-links";
    entryId?: string;
    ref?: string | null;
    /** Ticket 08: a non-entry member's kind (e.g. `config-override`, with `ref` the config root); see `ReleaseCommandData`. */
    kind?: string | null;
    redirectTarget?: string | null;
    dueAt?: string;
    timezone?: string;
}
interface ReleaseEntryChoice {
    id: string;
    title: string;
    versions: Array<{
        id: string;
        label: string;
    }>;
    canTakeDown?: boolean;
}
/**
 * Ticket 11: one config section's changes inside a Release, mirroring laravel-beam-ux `ReleaseConfigKeyChangeData`
 * (the `changes` op's `config[]` rows). Columns: Key → Published → After publishing → Set by → Applies.
 */
interface ReleaseConfigKeyChange {
    /** JSON pointer, e.g. `/heading`. */
    pointer: string;
    /** The op the publishing version holds; `null` drops the override (inherits from the tier below). */
    op: "set" | "null" | "unset" | null;
    /** The key's effective value now, through the whole ladder. Null for a secret (and a masked secret leaf). */
    published: unknown;
    /** Whether the replaced version overrode this key on the Release's tier (false ⇒ `published` came from a lower tier). */
    publishedSet: boolean;
    /** The effective value after publishing: the new value for `set`, null for `"null"`, the fallback for a dropped override. Null for a secret. */
    after: unknown;
    /** The tier that sets the key after publishing (`ConfigTier`): the Release's tier, or the fallback tier for a dropped override. */
    setBy: "package" | "host" | "provider" | "operator" | "tenant";
    /** When the change takes effect (`ConfigEffect`). */
    applies: "live" | "reload" | "deploy";
    secret: boolean;
    /** Secrets only (null otherwise): `replaced`, `removed` (dropped or set to explicit null), or `unchanged`. Never a value. */
    secretChange: "replaced" | "removed" | "unchanged" | null;
}
/**
 * Ticket 11: the config slice of a Release's `changes` op (laravel-beam-ux `ReleaseConfigChangeData`), one per config
 * member, joined to its member by `root === member.ref`.
 */
interface ReleaseConfigChange {
    /** Whether this reader may read the section's values. `false` ⇒ `keys` is `[]`, `reloadsWorkers` false, `mirror` null. */
    readable: boolean;
    /** The section root; equals the member's `ref`. */
    root: string;
    title: string;
    /** Owning package (composer name), or `host`. */
    package: string;
    /** Version published now (null: nothing published yet). */
    fromVersion: number | null;
    /** Version publishing pins (null: a rollback removes the override). */
    toVersion: number | null;
    /** Any changed key applies on reload ⇒ show "reloads workers". */
    reloadsWorkers: boolean;
    /** Changed keys only, by pointer. */
    keys: ReleaseConfigKeyChange[];
    /** `config/overrides/<root>.json` only when publishing really writes the file into the one commit; null for a tenant Release, or a host that records no files. */
    mirrorPath: string | null;
    /** The mirror file content after publishing (pretty JSON, secrets valueless), for the preview; null when `mirrorPath` is null, unreadable, or the override is removed. */
    mirror: string | null;
}
/**
 * Ticket 11: the config slice of a Release's `changes` op — the `config` member of laravel-beam-ux's `ReleaseChangesData`,
 * the only part this panel reads. It is NOT the whole `ReleaseChangesData` (which also carries `pages` and `reach` for
 * the page-reach map); the host passes this slice (or the field) as the panel's `changes` prop.
 */
interface ReleaseConfigChanges {
    config: ReleaseConfigChange[];
}
/** Transport is injected; workflow states, version choices and stale-pin facts come from the server. */
declare function ReleasePanel({ release, entries, changes, initialEntryId, onCommand, onRemoveRedirect, onPreviewOpen, }: {
    release: ReleaseRecord;
    entries: ReleaseEntryChoice[];
    /**
     * Ticket 11: the Release's `changes` op result. Its `config` slice drives the config cards (joined by `root ===
     * member.ref`). Absent, config members render by their member label only, with no key diff.
     */
    changes?: ReleaseConfigChanges;
    initialEntryId?: string;
    onCommand: (command: ReleaseCommand) => Promise<unknown>;
    /** Tenant SPA handoff: exchanges its bearer session for a short-lived signed Site Host opener. */
    onPreviewOpen?: () => Promise<string>;
    /** Removes a Redirect the Release left, through the Redirect resource; absent, none is offered. */
    onRemoveRedirect?: (id: string) => Promise<unknown>;
}): react.JSX.Element;

export { type ReleaseCommand as R, type ReleaseRecord as a, type ReleaseRecording as b, type ReleaseConfigChange as c, type ReleaseConfigChanges as d, type ReleaseConfigKeyChange as e, type ReleaseEntryChoice as f, ReleasePanel as g };
