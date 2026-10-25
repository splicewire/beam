import { useEffect, useState } from "react";
import { Button } from "@schemastud/ui";
import { WorkflowActionForm } from "@splicewire/beam-workflows/action-form";
import type { WorkflowProjectionData } from "@splicewire/beam-workflows/action-form";
import { ReleaseRecordingSummary } from "./recording";

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
    | "rollback";
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
}: {
  release: ReleaseRecord;
  entries: ReleaseEntryChoice[];
  initialEntryId?: string;
  onCommand: (command: ReleaseCommand) => Promise<unknown>;
}) {
  const [entryId, setEntryId] = useState(initialEntryId);
  const [ref, setRef] = useState("");
  const [redirect, setRedirect] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
          : "The Release could not be updated.",
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
      aria-label="Release"
      aria-busy={pending}
      className="mt-4 space-y-3 rounded-lg border bg-card p-4 text-sm"
    >
      <h2 className="font-semibold">{release.title}</h2>
      <p>Status: {release.status.replace("_", " ")}</p>
      {release.recording && (
        <ReleaseRecordingSummary
          recording={release.recording}
          filesHref={release.filesHref}
        />
      )}
      {release.reviewRequired && (
        <p>
          Review is required before publication. The server checks every
          member’s permissions again at publish time.
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
                ? "Take-down"
                : `Saved version ${member.versionId}`}
            </span>
            {member.redirectTarget && (
              <span> — Redirect target: {member.redirectTarget}</span>
            )}
            {member.stale && (
              <p role="status">
                The published version changed. Rebase onto theirs or drop the entry.
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
                  Rebase onto theirs
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
                    Use latest saved version
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
                  Drop the entry
                </Button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {!immutable && (
        <fieldset disabled={pending} className="space-y-2 rounded border p-3">
          <legend>Add a saved version or Take-down</legend>
          <label>
            Entry{" "}
            <select
              className="mx-2 rounded border bg-background px-2 py-1"
              value={entryId}
              onChange={(event) => {
                setEntryId(event.target.value);
                setRef("");
              }}
            >
              <option value="">Choose an entry</option>
              {entries.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Saved version{" "}
            <select
              className="mx-2 rounded border bg-background px-2 py-1"
              value={ref}
              onChange={(event) => setRef(event.target.value)}
            >
              <option value="">Choose a saved version</option>
              {entry?.versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.label}
                </option>
              ))}
              {entry?.canTakeDown && (
                <option value="take-down">Take-down</option>
              )}
            </select>
          </label>
          {ref === "take-down" && (
            <label>
              Redirect to a published page (optional){" "}
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
            Add to Release
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
                ? "Request review"
                : action === "approve"
                  ? "Approve"
                  : "Publish now"}
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
          Create rollback Release
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
          Scheduling is unavailable on this host. Reviewed Releases can still
          publish now.
        </p>
      )}
    </section>
  );
}

/** Create and assemble a built Release from the saved version in each entry editor. */
export function BuiltReleaseAssembly({
  entryId,
  entryTitle,
  versions,
  canTakeDown = false,
  listReleases,
  createRelease,
  releaseCommand,
}: {
  entryId: string;
  entryTitle: string;
  versions: ReleaseEntryChoice["versions"];
  canTakeDown?: boolean;
  listReleases: () => Promise<ReleaseRecord[]>;
  createRelease: (entryId: string, title: string) => Promise<ReleaseRecord>;
  releaseCommand: (
    releaseId: string,
    command: ReleaseCommand,
  ) => Promise<ReleaseRecord>;
}) {
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
              : "Could not load Releases.",
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
          : "Could not create the Release.",
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
    <section aria-label="Build a Release" className="mt-4 space-y-3">
      <fieldset disabled={pending} className="space-y-2 rounded border p-3">
        <legend>Create a built Release</legend>
        <label>
          Release title{" "}
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
          Create built Release
        </Button>
      </fieldset>
      {releases.length > 0 && (
        <label>
          Release to assemble{" "}
          <select
            value={releaseId}
            onChange={(event) => setReleaseId(event.target.value)}
          >
            <option value="">Choose a Release</option>
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
          entries={[{ id: entryId, title: entryTitle, versions, canTakeDown }]}
          initialEntryId={entryId}
          onCommand={command}
        />
      )}
    </section>
  );
}
