import { useEffect, useState } from "react";
import { Button } from "@schemastud/ui";
import { WorkflowActionForm } from "@splicewire/beam-workflows/action-form";
import type { WorkflowProjectionData } from "@splicewire/beam-workflows/action-form";
import { ReleaseRecordingSummary } from "./recording";
import { useBeamUxMessages } from "./messages.js";

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
    entryId: string;
    versionId: string | null;
    observedPin: string | null;
    redirectTarget: string | null;
    stale: boolean;
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

/** Transport is injected; workflow states, version choices and stale-pin facts come from the server. */
export function ReleasePanel({
  release,
  entries,
  initialEntryId = "",
  onCommand,
  onRemoveRedirect,
  onPreviewOpen,
}: {
  release: ReleaseRecord;
  entries: ReleaseEntryChoice[];
  initialEntryId?: string;
  onCommand: (command: ReleaseCommand) => Promise<unknown>;
  /** Tenant SPA handoff: exchanges its bearer session for a short-lived signed Site Host opener. */
  onPreviewOpen?: () => Promise<string>;
  /** Removes a Redirect the Release left, through the Redirect resource; absent, none is offered. */
  onRemoveRedirect?: (id: string) => Promise<unknown>;
}) {
  const m = useBeamUxMessages();
  const [entryId, setEntryId] = useState(initialEntryId);
  const [ref, setRef] = useState("");
  const [redirect, setRedirect] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const entry = entries.find((item) => item.id === entryId);
  const immutable = release.status === "published";
  const act = async (command: ReleaseCommand) => {
    setPending(true);
    setError(null);
    try {
      await onCommand(command);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : m.t('splicewire-beam-ux::messages.releases_update_failed'),
      );
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
      {error && <p role="alert">{error}</p>}
      <ul className="space-y-2">
        {release.members.map((member) => (
          <li key={member.entryId}>
            <span className="break-all">
              {entries.find((item) => item.id === member.entryId)?.title ??
                member.entryId}
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
            {!immutable && (
              <span className="ml-2 inline-flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    void act({ action: "rebase", entryId: member.entryId })
                  }
                >
                  {m.t('splicewire-beam-ux::messages.releases_rebase')}
                </Button>
                {member.versionId !== null && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() =>
                      void act({
                        action: "use-latest",
                        entryId: member.entryId,
                      })
                    }
                  >
                    {m.t('splicewire-beam-ux::messages.releases_use_latest')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    void act({ action: "drop", entryId: member.entryId })
                  }
                >
                  {m.t('splicewire-beam-ux::messages.releases_drop')}
                </Button>
              </span>
            )}
          </li>
        ))}
      </ul>
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
  const [error, setError] = useState<string | null>(null);
  const remove = async (id: string) => {
    setError(null);
    try {
      await onRemove!(id);
      setRemoved((current) => [...current, id]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : m.t('splicewire-beam-ux::messages.releases_redirect_remove_failed'));
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
      {error && <p role="alert">{error}</p>}
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
  const [error, setError] = useState<string | null>(null);
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
          setError(
            reason instanceof Error
              ? reason.message
              : m.t('splicewire-beam-ux::messages.releases_load_failed'),
          );
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
      setError(
        reason instanceof Error
          ? reason.message
          : m.t('splicewire-beam-ux::messages.releases_create_failed'),
      );
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
      {error && <p role="alert">{error}</p>}
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
