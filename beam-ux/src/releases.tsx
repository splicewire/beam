import { useEffect, useState } from "react";
import { Button } from "@schemastud/ui";
import { WorkflowActionForm } from "@splicewire/beam-workflows/action-form";
import type { WorkflowProjectionData } from "@splicewire/beam-workflows/action-form";
import { ReleaseRecordingSummary } from "./recording";
import { useBeamUxMessages } from "./messages.js";
import { notice, noticeOf, say, type Notice } from "./message-descriptor.js";
import { TierPill, EffectTag, PlainValue } from "./config/parts.js";

export interface ReleaseRecording {
  releaseId: string;
  status: string;
  sha: string | null;
  noChange: boolean;
  canRetry: boolean;
  message: string | null;
}

/** Wire projection of the package-owned PHP ReleaseData / ReleaseCommandData. */
export interface ReleaseRecord {
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
export interface ReleaseRedirect {
  id: string | null;
  path: string;
  match: string;
  to: string | null;
  origin: string;
}
export interface ReleaseCommand {
  action:
    | "member"
    | "drop"
    | "rebase"
    | "use-latest"
    | "submit"
    | "approve"
    | "publish"
    | "schedule"
    | "rollback"
    | "links-on"
    | "links-off"
    | "rotate-links";
  entryId?: string;
  ref?: string | null;
  /** Ticket 08: a non-entry member's kind (e.g. `config-override`, with `ref` the config root); see `ReleaseCommandData`. */
  kind?: string | null;
  redirectTarget?: string | null;
  dueAt?: string;
  timezone?: string;
}
export interface ReleaseEntryChoice {
  id: string;
  title: string;
  versions: Array<{ id: string; label: string }>;
  canTakeDown?: boolean;
}

/**
 * The member kind beam-ux-release gives a config override (laravel-beam-ux `BeamUxReleaseMember::KIND_CONFIG`). Kept in
 * step with `RELEASE_KIND_CONFIG` in `./config/edit`; a drift test asserts the two are equal.
 */
const CONFIG_MEMBER_KIND = "config-override";

/**
 * Ticket 11 (rev 3): the entry-member groups, read from the member's `entryType`. Page and Theme get their own group;
 * every other entry type (layout, template, component) falls to "Other".
 */
const ENTRY_GROUPS = [
  {
    key: "page",
    labelKey: 'splicewire-beam-ux::messages.releases_group_page',
    match: (type: string | null) => type === "page",
  },
  {
    key: "theme",
    labelKey: 'splicewire-beam-ux::messages.releases_group_theme',
    match: (type: string | null) => type === "theme",
  },
  {
    key: "other",
    labelKey: 'splicewire-beam-ux::messages.releases_group_other',
    match: (type: string | null) => type !== "page" && type !== "theme",
  },
] as const;

/**
 * Ticket 11: one config section's changes inside a Release, mirroring laravel-beam-ux `ReleaseConfigKeyChangeData`
 * (the `changes` op's `config[]` rows). Columns: Key → Published → After publishing → Set by → Applies.
 */
export interface ReleaseConfigKeyChange {
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
export interface ReleaseConfigChange {
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
export interface ReleaseConfigChanges {
  config: ReleaseConfigChange[];
}

/** Transport is injected; workflow states, version choices and stale-pin facts come from the server. */
export function ReleasePanel({
  release,
  entries,
  changes,
  initialEntryId = "",
  onCommand,
  onRemoveRedirect,
  onPreviewOpen,
}: {
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
}) {
  const m = useBeamUxMessages();
  const configChanges = changes?.config ?? [];
  const configMembers = release.members.filter(
    (member) => member.kind === CONFIG_MEMBER_KIND,
  );
  // Every non-config member is an entry (Config is decided by kind alone), so an unknown future kind — even one with a
  // null entryId — still groups under Page / Theme / Other rather than vanishing. Entry controls that need an entryId
  // are hidden when it is null.
  const entryMembers = release.members.filter(
    (member) => member.kind !== CONFIG_MEMBER_KIND,
  );
  const tenantRealm = release.realm === "tenant";
  const [entryId, setEntryId] = useState(initialEntryId);
  const [ref, setRef] = useState("");
  const [redirect, setRedirect] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Notice | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const entry = entries.find((item) => item.id === entryId);
  const immutable = release.status === "published";
  const act = async (command: ReleaseCommand) => {
    setPending(true);
    setError(null);
    try {
      await onCommand(command);
    } catch (failure) {
      setError(noticeOf(failure, notice('splicewire-beam-ux::messages.releases_update_failed')));
    } finally {
      setPending(false);
    }
  };
  const publishProjection = release.workflow && {
    ...release.workflow,
    transitions: release.workflow.transitions.filter(
      (item) => item.name === "publish",
    ),
  };
  const renderEntryItem = (
    member: ReleaseRecord["members"][number],
    index: number,
  ) => {
    const entryId = member.entryId;
    const title = entries.find((item) => item.id === entryId)?.title ?? member.label ?? entryId;
    return (
      <li key={entryId ?? member.ref ?? index}>
        <span className="break-all">
          {title}
          :{" "}
          {member.versionId === null
            ? m.t('splicewire-beam-ux::messages.releases_take_down')
            : m.t('splicewire-beam-ux::messages.releases_saved_version_member', { version: member.versionId })}
        </span>
        {member.redirectTarget && (
          <span> {m.t('splicewire-beam-ux::messages.releases_redirect_target', { target: member.redirectTarget })}</span>
        )}
        {member.stale && (
          <p role="status">
            {m.t('splicewire-beam-ux::messages.releases_stale')}
          </p>
        )}
        {/* Rebase / use-latest / drop need an entryId; an entry whose row is gone (entryId null) shows no controls. */}
        {!immutable && entryId !== null && (
          <span className="ml-2 inline-flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => void act({ action: "rebase", entryId })}
            >
              {m.t('splicewire-beam-ux::messages.releases_rebase')}
            </Button>
            {member.versionId !== null && (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => void act({ action: "use-latest", entryId })}
              >
                {m.t('splicewire-beam-ux::messages.releases_use_latest')}
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => void act({ action: "drop", entryId })}
            >
              {m.t('splicewire-beam-ux::messages.releases_drop')}
            </Button>
          </span>
        )}
      </li>
    );
  };
  return (
    <section
      aria-label={m.t('splicewire-beam-ux::messages.releases_label')}
      aria-busy={pending}
      className="mt-4 space-y-3 rounded-lg border bg-card p-4 text-sm"
    >
      <h2 className="font-semibold">{release.title}</h2>
      <p>{m.t('splicewire-beam-ux::messages.releases_status', { status: release.status.replace("_", " ") })}</p>
      {!immutable && onPreviewOpen && (
        <button
          type="button"
          className="underline"
          onClick={() => {
            setPreviewError(false);
            const popup = window.open("about:blank", "_blank");
            if (popup) popup.opener = null;
            void onPreviewOpen().then((href) => {
              if (popup) popup.location.replace(href);
              else window.location.assign(href);
            }).catch(() => {
              popup?.close();
              setPreviewError(true);
            });
          }}
        >
          {m.t('splicewire-beam-ux::messages.releases_preview')}
        </button>
      )}
      {previewError && <p role="alert">{m.t('splicewire-beam-ux::messages.releases_preview_failed')}</p>}
      {!immutable && !onPreviewOpen && release.previewHref && (
        // ADR-0232 d15: the Release page's Preview, signed in; a new tab, so the panel stays open.
        <a href={release.previewHref} target="_blank" rel="noopener noreferrer" className="underline">
          {m.t('splicewire-beam-ux::messages.releases_preview')}
        </a>
      )}
      {!immutable && release.previewLinksEnabled && !release.canManagePreviewLinks && <p>{m.t('splicewire-beam-ux::messages.releases_preview_links_on')}</p>}
      {!immutable && release.previewLinksEnabled !== undefined && release.canManagePreviewLinks && (
        <div role="group" aria-label={m.t('splicewire-beam-ux::messages.releases_preview_links')} className="space-y-2 rounded border p-3">
          <p>
            {m.t('splicewire-beam-ux::messages.releases_preview_links_explainer')}
          </p>
          {release.previewLinksEnabled ? (
            <div className="flex flex-wrap items-center gap-2">
              {release.previewLink && (
                <>
                  <input
                    readOnly
                    aria-label={m.t('splicewire-beam-ux::messages.releases_preview_link')}
                    className="min-w-0 flex-1 rounded border bg-background px-2 py-1"
                    value={release.previewLink}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void navigator.clipboard?.writeText(release.previewLink!)}
                  >
                    {m.t('splicewire-beam-ux::messages.releases_copy_link')}
                  </Button>
                </>
              )}
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => void act({ action: "rotate-links" })}>
                {m.t('splicewire-beam-ux::messages.releases_rotate_links')}
              </Button>
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => void act({ action: "links-off" })}>
                {m.t('splicewire-beam-ux::messages.releases_links_off')}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => void act({ action: "links-on" })}>
              {m.t('splicewire-beam-ux::messages.releases_links_on')}
            </Button>
          )}
        </div>
      )}
      {release.recording && (
        <ReleaseRecordingSummary
          recording={release.recording}
          filesHref={release.filesHref}
        />
      )}
      {release.reviewRequired && (
        <p>
          {m.t('splicewire-beam-ux::messages.releases_review_required')}
        </p>
      )}
      {error && <p role="alert">{say(m, error)}</p>}
      {ENTRY_GROUPS.map((group) => {
        // Grouped by the member's entry type (rev 3): Page, Theme, then everything else (layout / template / component).
        const groupMembers = entryMembers.filter((member) => group.match(member.entryType));
        if (groupMembers.length === 0) return null;
        return (
          <section key={group.key} aria-label={m.t(group.labelKey)} className="space-y-2">
            <h3 className="font-semibold">{m.t(group.labelKey)}</h3>
            <ul className="space-y-2">{groupMembers.map(renderEntryItem)}</ul>
          </section>
        );
      })}
      {configMembers.length > 0 && (
        <ConfigMembers
          members={configMembers}
          changes={configChanges}
          immutable={immutable}
          pending={pending}
          onDrop={(ref) => act({ action: "drop", kind: CONFIG_MEMBER_KIND, ref })}
          onTakeDraft={(ref) =>
            act({ action: "member", kind: CONFIG_MEMBER_KIND, ref })
          }
        />
      )}
      {configMembers.length > 0 && (
        <ConfigPublishPlan
          members={configMembers}
          changes={configChanges}
          tenantRealm={tenantRealm}
        />
      )}
      {!immutable && (
        <fieldset disabled={pending} className="space-y-2 rounded border p-3">
          <legend>{m.t('splicewire-beam-ux::messages.releases_add_member_legend')}</legend>
          <label>
            {m.t('splicewire-beam-ux::messages.releases_entry')}{" "}
            <select
              className="mx-2 rounded border bg-background px-2 py-1"
              value={entryId}
              onChange={(event) => {
                setEntryId(event.target.value);
                setRef("");
              }}
            >
              <option value="">{m.t('splicewire-beam-ux::messages.releases_choose_entry')}</option>
              {entries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {m.t('splicewire-beam-ux::messages.releases_saved_version')}{" "}
            <select
              className="mx-2 rounded border bg-background px-2 py-1"
              value={ref}
              onChange={(event) => setRef(event.target.value)}
            >
              <option value="">{m.t('splicewire-beam-ux::messages.releases_choose_saved_version')}</option>
              {entry?.versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.label}
                </option>
              ))}
              {entry?.canTakeDown && (
                <option value="take-down">{m.t('splicewire-beam-ux::messages.releases_take_down')}</option>
              )}
            </select>
          </label>
          {ref === "take-down" && (
            <label>
              {m.t('splicewire-beam-ux::messages.releases_redirect_to')}{" "}
              <input
                value={redirect}
                onChange={(event) => setRedirect(event.target.value)}
              />
            </label>
          )}
          <Button
            size="sm"
            variant="secondary"
            disabled={!entry || !ref}
            onClick={() =>
              void act({
                action: "member",
                entryId,
                ref: ref === "take-down" ? null : ref,
                redirectTarget: ref === "take-down" ? redirect || null : null,
              })
            }
          >
            {m.t('splicewire-beam-ux::messages.releases_add_to_release')}
          </Button>
        </fieldset>
      )}
      <div className="flex flex-wrap gap-2">
        {(["submit", "approve", "publish"] as const)
          .filter(
            (action) =>
              release.workflow?.available.includes(action) &&
              (action !== "publish" ||
                !release.reviewRequired ||
                ["approved", "scheduled"].includes(release.status)),
          )
          .map((action) => (
            <Button
              size="sm"
              variant="secondary"
              key={action}
              disabled={
                pending ||
                (action === "publish" &&
                  release.members.some((member) => member.stale))
              }
              onClick={() => void act({ action })}
            >
              {action === "submit"
                ? m.t('splicewire-beam-ux::messages.releases_request_review')
                : action === "approve"
                  ? m.t('splicewire-beam-ux::messages.releases_approve')
                  : m.t('splicewire-beam-ux::messages.releases_publish_now')}
            </Button>
          ))}
      </div>
      {immutable && (
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => void act({ action: "rollback" })}
        >
          {m.t('splicewire-beam-ux::messages.releases_rollback')}
        </Button>
      )}
      {!immutable && release.canSchedule && release.status === "approved" && (
        <WorkflowActionForm
          projection={publishProjection}
          initialTransition="publish"
          subjectLabel={release.title}
          onSchedule={async (selection) => {
            await onCommand({
              action: "schedule",
              dueAt: selection.dueAt,
              timezone: selection.timezone,
            });
          }}
        />
      )}
      {!immutable && !release.canSchedule && (
        <p>
          {m.t('splicewire-beam-ux::messages.releases_scheduling_unavailable')}
        </p>
      )}
      {release.redirects && release.redirects.length > 0 && (
        <ReleaseRedirects redirects={release.redirects} onRemove={onRemoveRedirect} />
      )}
    </section>
  );
}

type ConfigMember = ReleaseRecord["members"][number];

// Degrade, never crash, on a wire value outside the known union (an older/buggy server): render the raw string instead
// of indexing TierPill / EffectTag on an unknown key.
const KNOWN_TIERS = new Set(["package", "host", "provider", "operator", "tenant"]);
const KNOWN_EFFECTS = new Set(["live", "reload", "deploy"]);

function SetByCell({ setBy }: { setBy: ReleaseConfigKeyChange["setBy"] }) {
  return KNOWN_TIERS.has(setBy) ? (
    <TierPill tier={setBy} />
  ) : (
    <span className="font-mono text-[10.5px] text-muted-foreground">{setBy}</span>
  );
}

function AppliesCell({ applies }: { applies: ReleaseConfigKeyChange["applies"] }) {
  return KNOWN_EFFECTS.has(applies) ? (
    <EffectTag effect={applies} />
  ) : (
    <span className="font-mono text-[10.5px] text-muted-foreground">{applies}</span>
  );
}

/** The word for a secret's change, or a neutral dash when the wire sent none (an inconsistent row never defaults to "replaced"). */
function secretChangeText(m: ReturnType<typeof useBeamUxMessages>, secretChange: ReleaseConfigKeyChange["secretChange"]) {
  if (secretChange === "replaced") return m.t('splicewire-beam-ux::messages.releases_config_secret_replaced');
  if (secretChange === "removed") return m.t('splicewire-beam-ux::messages.releases_config_secret_removed');
  if (secretChange === "unchanged") return m.t('splicewire-beam-ux::messages.releases_config_secret_unchanged');
  return "—";
}

/**
 * Ticket 11: the Config group of a Release — the config members beside the page and theme members, each with the
 * key-level diff from its `changes` row (joined by `root === ref`). A member with no matching change (the host passed
 * none) shows its label only.
 */
function ConfigMembers({
  members,
  changes,
  immutable,
  pending,
  onDrop,
  onTakeDraft,
}: {
  members: ConfigMember[];
  changes: ReleaseConfigChange[];
  immutable: boolean;
  pending: boolean;
  onDrop: (ref: string) => void;
  onTakeDraft: (ref: string) => void;
}) {
  const m = useBeamUxMessages();
  return (
    <section
      aria-label={m.t('splicewire-beam-ux::messages.releases_config_heading')}
      className="space-y-2"
    >
      <h3 className="font-semibold">
        {m.t('splicewire-beam-ux::messages.releases_config_heading')}
      </h3>
      <ul className="space-y-2">
        {members.map((member) => (
          <li key={member.ref}>
            <ConfigMemberCard
              member={member}
              change={changes.find((change) => change.root === member.ref)}
              immutable={immutable}
              pending={pending}
              onDrop={onDrop}
              onTakeDraft={onTakeDraft}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ConfigMemberCard({
  member,
  change,
  immutable,
  pending,
  onDrop,
  onTakeDraft,
}: {
  member: ConfigMember;
  change: ReleaseConfigChange | undefined;
  immutable: boolean;
  pending: boolean;
  onDrop: (ref: string) => void;
  onTakeDraft: (ref: string) => void;
}) {
  const m = useBeamUxMessages();
  const ref = member.ref;
  // The key table masks a secret leaf nested in a published / after value. Its secret set is change.keys (erring towards
  // secret) UNION the mirror's marker-row pointers when the mirror parses valid — a key's `after` may name a key the
  // mirror marks secret but `change.keys` (changed keys only) does not. An absent or refused mirror falls back to change.keys.
  const keySecrets = changeKeySecrets(change?.keys ?? []);
  const mirrorMarkers =
    change?.readable && change.mirror != null ? (sanitizeMirror(change.mirror, keySecrets)?.markers ?? []) : [];
  const isSecret = secretMatcher([...keySecrets, ...mirrorMarkers]);
  return (
    <div data-config-member={ref} className="rounded border p-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-medium">{change?.title ?? member.label}</span>
        <code className="font-mono text-xs text-muted-foreground">{ref}</code>
        {change && (
          <span className="font-mono text-xs text-muted-foreground">
            {change.package}
          </span>
        )}
        {change && (
          <span className="font-mono text-xs text-muted-foreground">
            v{change.fromVersion ?? 0} →{" "}
            {change.toVersion === null
              ? m.t('splicewire-beam-ux::messages.releases_config_version_removed')
              : `v${change.toVersion}`}
          </span>
        )}
        {change?.reloadsWorkers && (
          <span className="font-mono text-xs text-info">
            {m.t('splicewire-beam-ux::messages.releases_config_reloads_workers')}
          </span>
        )}
      </div>
      {member.stale && (
        <p role="status">
          {m.t('splicewire-beam-ux::messages.releases_config_stale')}
        </p>
      )}
      {change && !change.readable && (
        <p className="mt-1 text-xs text-muted-foreground">
          {m.t('splicewire-beam-ux::messages.releases_config_unreadable')}
        </p>
      )}
      {change && change.readable && change.keys.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-muted-foreground">
              <tr>
                <th className="py-1 pr-3 font-medium">{m.t('splicewire-beam-ux::messages.releases_config_col_key')}</th>
                <th className="py-1 pr-3 font-medium">{m.t('splicewire-beam-ux::messages.releases_config_col_published')}</th>
                <th className="py-1 pr-3 font-medium">{m.t('splicewire-beam-ux::messages.releases_config_col_after')}</th>
                <th className="py-1 pr-3 font-medium">{m.t('splicewire-beam-ux::messages.releases_config_col_setby')}</th>
                <th className="py-1 pr-3 font-medium">{m.t('splicewire-beam-ux::messages.releases_config_col_applies')}</th>
              </tr>
            </thead>
            <tbody>
              {change.keys.map((key) => (
                <ConfigKeyRow key={key.pointer} row={key} isSecret={isSecret} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!immutable && (
        <div className="mt-2 inline-flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => onTakeDraft(ref)}
          >
            {m.t('splicewire-beam-ux::messages.releases_config_take_draft')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => onDrop(ref)}
          >
            {m.t('splicewire-beam-ux::messages.releases_config_drop')}
          </Button>
        </div>
      )}
    </div>
  );
}

/** One key row: Key → Published → After publishing → Set by → Applies. A secret shows its change word, never a value. */
function ConfigKeyRow({ row, isSecret }: { row: ReleaseConfigKeyChange; isSecret: (pointer: string) => boolean }) {
  const m = useBeamUxMessages();
  // Err towards secret, as the masking side does; a key whose pointer is not a string shows no value and never crashes.
  const secretKey = (row.secret as unknown) !== false && (row.secret as unknown) !== undefined;
  const base = typeof row.pointer === "string" ? normalizePointer(row.pointer) : null;
  const pointerText = typeof row.pointer === "string" ? row.pointer : String(row.pointer);
  // Defence in depth: a secret leaf nested inside a non-secret key's value is dropped even if the server forgot to null it.
  const safe = (value: unknown) => {
    if (base === null) return null;
    const result = sanitizeValue(value, base, isSecret);
    return result === OMIT ? null : result;
  };
  return (
    <tr data-config-key={pointerText} className="align-top">
      <td className="py-1 pr-3 font-mono">{pointerText}</td>
      <td className="py-1 pr-3">
        {secretKey || base === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <>
            {/* PlainValue formats and truncates (it carries a title); the secret branch above never reaches it. */}
            <PlainValue value={safe(row.published)} struck />
            {!row.publishedSet && (
              <span className="block text-[10px] text-muted-foreground">
                {m.t('splicewire-beam-ux::messages.releases_config_inherited')}
              </span>
            )}
          </>
        )}
      </td>
      <td className="py-1 pr-3">
        {secretKey ? (
          <span className="font-mono">{secretChangeText(m, row.secretChange)}</span>
        ) : base === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <>
            <PlainValue value={safe(row.after)} />
            {row.op === null && (
              <span className="block text-[10px] text-muted-foreground">
                {m.t('splicewire-beam-ux::messages.releases_config_override_dropped')}
              </span>
            )}
            {row.op === "null" && (
              <span className="block text-[10px] text-muted-foreground">
                {m.t('splicewire-beam-ux::messages.releases_config_explicit_null')}
              </span>
            )}
          </>
        )}
      </td>
      <td className="py-1 pr-3">
        <SetByCell setBy={row.setBy} />
      </td>
      <td className="py-1 pr-3">
        <AppliesCell applies={row.applies} />
      </td>
    </tr>
  );
}

/** RFC 6901: encode one reference token for building a JSON pointer (`~` → `~0`, `/` → `~1`). */
function escapeSegment(key: string): string {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}

/** A config pointer, leading slash normalised in; the empty string is the ROOT and is kept as a sentinel (never `/`). */
function normalizePointer(pointer: string): string {
  if (pointer === "") return ""; // RFC 6901: the whole document
  return pointer.startsWith("/") ? pointer : `/${pointer}`;
}

/** Omit sentinel: a value at (or below) a secret pointer is removed, never rendered. */
const OMIT = Symbol("omit");

/** A matcher for "this pointer IS a secret pointer, or is BELOW one", on a segment boundary; the empty pointer makes every pointer secret. */
function secretMatcher(secretPointers: Iterable<string>): (pointer: string) => boolean {
  const roots = [...secretPointers].map(normalizePointer);
  const rootSecret = roots.includes(""); // the document root: everything below it is secret
  return (pointer: string) =>
    rootSecret || roots.some((root) => root !== "" && (pointer === root || pointer.startsWith(`${root}/`)));
}

/** Walk a config VALUE, extending the pointer by segment/index; drop any value whose pointer is secret or below one. */
function sanitizeValue(value: unknown, pointer: string, isSecret: (p: string) => boolean): unknown | typeof OMIT {
  if (isSecret(pointer)) return OMIT;
  if (Array.isArray(value)) {
    // A secret element's value is gone (null keeps the index, and so the pointers of its siblings).
    return value.map((element, index) => {
      const safe = sanitizeValue(element, `${pointer}/${index}`, isSecret);
      return safe === OMIT ? null : safe;
    });
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      const safe = sanitizeValue(child, `${pointer}/${escapeSegment(key)}`, isSecret);
      if (safe !== OMIT) out[key] = safe;
    }
    return out;
  }
  return value;
}

const MIRROR_ROOT_KEYS = new Set(["$schema", "root", "version", "overrides"]);
const MIRROR_ROW_KEYS = new Set(["pointer", "op", "value", "secret", "inherit"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function keysWithin(obj: Record<string, unknown>, allowed: Set<string>): boolean {
  return Object.keys(obj).every((key) => allowed.has(key));
}

/** A valid RFC 6901 config pointer for the mirror: a string with a leading `/` and every `~` escaped as `~0` / `~1` (no normalising). */
function validPointer(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/") && !/~(?![01])/.test(value);
}

/** Detector: would the pointer-aware walk drop anything under `pointer` (a leaf the `dropped` predicate matches)? */
function anyDrop(value: unknown, pointer: string, dropped: (p: string) => boolean): boolean {
  if (dropped(pointer)) return true;
  if (Array.isArray(value)) {
    return value.some((element, index) => anyDrop(element, `${pointer}/${index}`, dropped));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).some(([key, child]) => anyDrop(child, `${pointer}/${escapeSegment(key)}`, dropped));
  }
  return false;
}

/**
 * CONTRACT-11 §2b, strict AND consistent: the mirror is the ONE document `{$schema, root, version, overrides:[…]}`,
 * and the preview renders ONLY for a document that is both valid and consistent; otherwise the file is named by path only
 * (fail closed). Nothing is normalised or stripped on the mirror side — a doubtful document is refused, not repaired.
 * Grammar: exactly the four root keys; each row's keys a subset of pointer/op/value/secret/inherit; `pointer` a string
 * with a leading `/` and valid `~0`/`~1` escapes; `op` `"set"`/`"null"`; `secret` (if present) exactly `true`; a marker or
 * `op:"null"` row carries no `value`/`inherit`; a non-secret `set` carries a `value`; `inherit` only on a non-secret `set`,
 * a string[] of valid non-root pointers with no duplicates; no two rows share a pointer. Consistency: the secret set is
 * every secret pointer in `change.keys` (the empty pointer being the whole document) UNION every marker row's pointer; a
 * non-marker row AT or BELOW a secret pointer, or a `set` whose `value` holds a leaf a secret pointer or its own `inherit`
 * names, is a refusal (a valid server has already taken those leaves out). The raw wire string never reaches the DOM.
 */
function sanitizeMirror(
  mirror: string,
  changeKeySecretPointers: Set<string>,
): { text: string; markers: string[] } | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(mirror);
  } catch {
    return null;
  }
  if (!isPlainObject(parsed)) return null;
  const rootKeys = Object.keys(parsed);
  if (rootKeys.length !== MIRROR_ROOT_KEYS.size || !rootKeys.every((key) => MIRROR_ROOT_KEYS.has(key))) return null;
  const { $schema, root, version, overrides } = parsed;
  if (
    typeof $schema !== "string" ||
    typeof root !== "string" ||
    !(version === null || typeof version === "number") ||
    !Array.isArray(overrides)
  ) {
    return null;
  }
  // First pass: validate each row's shape; collect pointers (for duplicate detection) and the marker-row pointers.
  const seen = new Set<string>();
  const markerPointers: string[] = [];
  for (const row of overrides) {
    if (!isPlainObject(row) || !keysWithin(row, MIRROR_ROW_KEYS)) return null;
    const { pointer, op } = row;
    if (!validPointer(pointer) || (op !== "set" && op !== "null")) return null;
    if ("secret" in row && row.secret !== true) return null; // `secret` is exactly `true`, or absent
    const marker = row.secret === true;
    if (marker || op === "null") {
      if ("value" in row || "inherit" in row) return null; // a marker or a removal carries no value / inherit
    } else if (!("value" in row)) {
      return null; // a non-secret `set` must carry a value
    }
    if ("inherit" in row) {
      if (marker || op !== "set" || !Array.isArray(row.inherit)) return null;
      const items = new Set<string>();
      for (const item of row.inherit) {
        if (typeof item !== "string" || item.length <= 1 || !validPointer(item) || items.has(item)) return null;
        items.add(item);
      }
    }
    if (seen.has(pointer)) return null; // no two rows share a pointer
    seen.add(pointer);
    if (marker) markerPointers.push(pointer);
  }
  // Build the secret set BEFORE rebuilding: change.keys (normalised; the empty pointer is the whole document) UNION the markers.
  const isSecret = secretMatcher([...changeKeySecretPointers, ...markerPointers]);
  const rebuilt: unknown[] = [];
  for (const row of overrides as Record<string, unknown>[]) {
    const pointer = row.pointer as string;
    const op = row.op as string;
    if (row.secret === true) {
      rebuilt.push({ pointer, op, secret: true });
      continue;
    }
    if (isSecret(pointer)) return null; // a non-marker row at or below a secret pointer
    if (op === "null") {
      rebuilt.push({ pointer, op });
      continue;
    }
    // A set row's value must already exclude every secret and inherited leaf; if the walk would drop one, the server erred.
    const inheritedAbs = ((row.inherit as string[] | undefined) ?? []).map((item) => `${pointer}${item}`);
    const dropped = (leaf: string) =>
      isSecret(leaf) || inheritedAbs.some((base) => leaf === base || leaf.startsWith(`${base}/`));
    if (anyDrop(row.value, pointer, dropped)) return null;
    const out: Record<string, unknown> = { pointer, op, value: row.value };
    if ("inherit" in row) out.inherit = row.inherit;
    rebuilt.push(out);
  }
  return { text: JSON.stringify({ $schema, root, version, overrides: rebuilt }, null, 2), markers: markerPointers };
}

/**
 * The secret pointers named by `change.keys`, erring TOWARDS secret on the masking side: a key counts as secret unless
 * its `secret` is exactly `false` or absent, and a key whose `pointer` is not a string is skipped (never crashes).
 */
function changeKeySecrets(keys: readonly ReleaseConfigKeyChange[]): Set<string> {
  const out = new Set<string>();
  for (const key of keys) {
    const secret = key.secret as unknown;
    if (secret !== false && secret !== undefined && typeof key.pointer === "string") {
      out.add(key.pointer);
    }
  }
  return out;
}

/** One mirror file: its path, and a `<details>` preview of the SANITIZED content. A malformed mirror is named only, never previewed. */
function ConfigMirrorFile({ change }: { change: ReleaseConfigChange }) {
  const parsed =
    change.readable && change.mirror !== null ? sanitizeMirror(change.mirror, changeKeySecrets(change.keys)) : null;
  if (parsed === null) {
    return <span className="font-mono text-xs">{change.mirrorPath}</span>;
  }
  return (
    <details className="rounded border bg-muted/30">
      <summary className="cursor-pointer px-2 py-1 font-mono text-xs">{change.mirrorPath}</summary>
      <pre className="overflow-x-auto px-2 pb-2 font-mono text-[11px] leading-relaxed">{parsed.text}</pre>
    </details>
  );
}

/**
 * Ticket 11: what publishing leaves. A tenant Release records database history only (no files, no commit). A central
 * (operator) Release lists the mirror file each config change writes into its one commit, with the file content in a
 * `<details>` preview — but only for changes that actually write a file (`mirrorPath` non-null).
 */
function ConfigPublishPlan({
  members,
  changes,
  tenantRealm,
}: {
  members: ConfigMember[];
  changes: ReleaseConfigChange[];
  tenantRealm: boolean;
}) {
  const m = useBeamUxMessages();
  const memberChanges = members
    .map((member) => changes.find((change) => change.root === member.ref))
    .filter((change): change is ReleaseConfigChange => !!change);
  if (tenantRealm) {
    return (
      <section
        aria-label={m.t('splicewire-beam-ux::messages.releases_config_db_history_heading')}
        className="space-y-1 rounded border p-3"
      >
        <h3 className="font-semibold">
          {m.t('splicewire-beam-ux::messages.releases_config_db_history_heading')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {m.t('splicewire-beam-ux::messages.releases_config_db_history_body')}
        </p>
        {memberChanges.length > 0 && (
          <ul className="space-y-0.5 font-mono text-[11px] text-muted-foreground">
            {memberChanges.map((change) => (
              <li key={change.root}>
                {change.root}{" "}
                {change.toVersion === null
                  ? m.t('splicewire-beam-ux::messages.releases_config_version_removed')
                  : `v${change.toVersion}`}{" "}
                ·{" "}
                {change.readable
                  ? m.choice('splicewire-beam-ux::messages.config_count_keys', change.keys.length, { count: change.keys.length })
                  : m.t('splicewire-beam-ux::messages.releases_config_keys_unreadable')}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }
  // Only a change that actually writes a file (and is readable) shows a mirror preview; secrets are never written.
  const files = memberChanges.filter((change) => change.mirrorPath !== null);
  const secretCount = memberChanges.flatMap((change) => change.keys).filter((key) => key.secret).length;
  if (files.length === 0 && secretCount === 0) return null;
  const secretsNote = secretCount > 0 && (
    <p className="text-xs text-muted-foreground">
      {m.choice('splicewire-beam-ux::messages.releases_config_secrets_note', secretCount, { count: secretCount })}
    </p>
  );
  // No files to commit (only secrets, which are never written): the secrets note stands alone, with no file-list heading over nothing.
  if (files.length === 0) {
    return <section className="space-y-1 rounded border p-3">{secretsNote}</section>;
  }
  return (
    <section
      aria-label={m.t('splicewire-beam-ux::messages.releases_config_commit_heading')}
      className="space-y-1 rounded border p-3"
    >
      <h3 className="font-semibold">
        {m.t('splicewire-beam-ux::messages.releases_config_commit_heading')}
      </h3>
      <ul className="space-y-1">
        {files.map((change) => (
          <li key={change.root}>
            <ConfigMirrorFile change={change} />
          </li>
        ))}
      </ul>
      {secretsNote}
    </section>
  );
}

/**
 * ux-0236 d2: the Redirects a Release leaves. There is no per-URL switch: an unwanted one is removed once it exists,
 * through the Redirect resource, which takes the rights publishing takes.
 */
function ReleaseRedirects({
  redirects,
  onRemove,
}: {
  redirects: ReleaseRedirect[];
  onRemove?: (id: string) => Promise<unknown>;
}) {
  const m = useBeamUxMessages();
  const [removed, setRemoved] = useState<string[]>([]);
  const [error, setError] = useState<Notice | null>(null);
  const remove = async (id: string) => {
    setError(null);
    try {
      await onRemove!(id);
      setRemoved((current) => [...current, id]);
    } catch (failure) {
      setError(noticeOf(failure, notice('splicewire-beam-ux::messages.releases_redirect_remove_failed')));
    }
  };
  return (
    <section aria-label={m.t('splicewire-beam-ux::messages.releases_redirects')}>
      <h3 className="font-semibold">{m.t('splicewire-beam-ux::messages.releases_redirects')}</h3>
      <ul>
        {redirects
          .filter((redirect) => redirect.id === null || !removed.includes(redirect.id))
          .map((redirect) => (
            <li key={`${redirect.path} ${redirect.match}`}>
              <span>
                {m.t(redirect.match === "prefix" ? 'splicewire-beam-ux::messages.releases_redirect_prefix' : 'splicewire-beam-ux::messages.releases_redirect_exact', {
                  path: redirect.path,
                  to: redirect.to ?? m.t('splicewire-beam-ux::messages.releases_redirect_not_found'),
                })}
                {redirect.origin === "takedown" ? ` ${m.t('splicewire-beam-ux::messages.releases_redirect_taken_down')}` : ""}
              </span>
              {redirect.id !== null && onRemove && (
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={m.t('splicewire-beam-ux::messages.releases_redirect_remove_label', { path: redirect.path })}
                  onClick={() => void remove(redirect.id!)}
                >
                  {m.t('splicewire-beam-ux::messages.releases_redirect_remove')}
                </Button>
              )}
            </li>
          ))}
      </ul>
      {error && <p role="alert">{say(m, error)}</p>}
    </section>
  );
}

/** Create and assemble a built Release from the saved version in each entry editor. */
export function BuiltReleaseAssembly({
  entryId,
  entryTitle,
  versions,
  canTakeDown = false,
  relatedEntries = [],
  listReleases,
  createRelease,
  releaseCommand,
  removeRedirect,
}: {
  entryId: string;
  entryTitle: string;
  versions: ReleaseEntryChoice["versions"];
  canTakeDown?: boolean;
  relatedEntries?: ReleaseEntryChoice[];
  listReleases: () => Promise<ReleaseRecord[]>;
  createRelease: (entryId: string, title: string) => Promise<ReleaseRecord>;
  releaseCommand: (
    releaseId: string,
    command: ReleaseCommand,
  ) => Promise<ReleaseRecord>;
  removeRedirect?: (id: string) => Promise<unknown>;
}) {
  const m = useBeamUxMessages();
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [releaseId, setReleaseId] = useState("");
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Notice | null>(null);
  const activeRelease = releases.find((release) => release.id === releaseId);

  useEffect(() => {
    let live = true;
    void listReleases()
      .then((records) => {
        if (!live) return;
        const editable = records.filter((record) => record.status === "draft");
        setReleases(editable);
        setReleaseId((current) =>
          editable.some((record) => record.id === current)
            ? current
            : editable[0]?.id ?? "",
        );
      })
      .catch((reason) => {
        if (live) {
          setError(noticeOf(reason, notice('splicewire-beam-ux::messages.releases_load_failed')));
        }
      });
    return () => {
      live = false;
    };
    // AddressedVisualEditor is keyed by entry; refreshes after mutations use the returned record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  const create = async () => {
    const name = title.trim();
    if (!name) return;
    setPending(true);
    setError(null);
    try {
      const release = await createRelease(entryId, name);
      setReleases((current) => [
        release,
        ...current.filter((item) => item.id !== release.id),
      ]);
      setReleaseId(release.id);
      setTitle("");
    } catch (reason) {
      setError(noticeOf(reason, notice('splicewire-beam-ux::messages.releases_create_failed')));
    } finally {
      setPending(false);
    }
  };

  const command = async (input: ReleaseCommand) => {
    if (!activeRelease) return;
    const updated = await releaseCommand(activeRelease.id, input);
    setReleases((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
  };

  return (
    <section aria-label={m.t('splicewire-beam-ux::messages.releases_build')} className="mt-4 space-y-3">
      <fieldset disabled={pending} className="space-y-2 rounded border p-3">
        <legend>{m.t('splicewire-beam-ux::messages.releases_create_built_legend')}</legend>
        <label>
          {m.t('splicewire-beam-ux::messages.releases_title')}{" "}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <Button
          size="sm"
          variant="secondary"
          disabled={!title.trim()}
          onClick={() => void create()}
        >
          {m.t('splicewire-beam-ux::messages.releases_create_built')}
        </Button>
      </fieldset>
      {releases.length > 0 && (
        <label>
          {m.t('splicewire-beam-ux::messages.releases_to_assemble')}{" "}
          <select
            value={releaseId}
            onChange={(event) => setReleaseId(event.target.value)}
          >
            <option value="">{m.t('splicewire-beam-ux::messages.releases_choose_release')}</option>
            {releases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && <p role="alert">{say(m, error)}</p>}
      {activeRelease && (
        <ReleasePanel
          release={activeRelease}
          entries={[{ id: entryId, title: entryTitle, versions, canTakeDown }, ...relatedEntries.filter(entry => entry.id !== entryId)]}
          initialEntryId={entryId}
          onCommand={command}
          onRemoveRedirect={removeRedirect}
        />
      )}
    </section>
  );
}
