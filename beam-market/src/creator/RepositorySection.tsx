import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@schemastud/ui";
import { useState } from "react";
import {
  useBeginAuthorization,
  useInspectArtifact,
  useRepoAuthorizations,
  useSimulateProviderCallback,
} from "./hooks";
import { useCreatorServices } from "./provider";
import type { ExtensionArtifactData } from "./types";

/**
 * Repository authorization and artifact inspection — the first half of the creator workspace.
 *
 * Two things are deliberately visible here that a tidier screen would hide:
 *
 *  * a SIMULATED authorization says so, on the row, permanently. The DTO carries `simulated`
 *    because the row does, and it is carried all the way to a badge because a simulated
 *    authorization is otherwise indistinguishable from a real one — same status, same repositories,
 *    same gate passed. That is the point of the simulation and exactly why it must be labelled.
 *  * an artifact that could not be READ is reported differently from one that is INVALID.
 *    `available: false` means this host has no artifact source for the repository — nothing was
 *    inspected — and telling a creator their package is broken because the host was not configured
 *    is the failure mode this whole three-state shape exists to prevent.
 */
export function RepositorySection() {
  const { client } = useCreatorServices();
  const authorizations = useRepoAuthorizations();
  const begin = useBeginAuthorization();
  const simulate = useSimulateProviderCallback();
  const inspect = useInspectArtifact();

  const [repoInput, setRepoInput] = useState("");
  const [artifact, setArtifact] = useState<ExtensionArtifactData | null>(null);

  const rows = authorizations.data ?? [];
  const pending = rows.find((row) => row.status === "pending");
  const active = rows.filter((row) => row.status === "active");
  const canSimulate = typeof client.simulateProviderCallback === "function";

  return (
    <Card data-testid="creator-repositories">
      <CardHeader>
        <CardTitle>Repositories</CardTitle>
        <CardDescription>
          A listing is submitted against a repository you have authorized. Until one is authorized,
          the server refuses the submission — not the button.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {authorizations.isPending ? (
          <p className="text-sm text-muted-foreground">Loading repositories…</p>
        ) : null}

        {active.length === 0 && !authorizations.isPending ? (
          <p className="text-sm text-muted-foreground" data-testid="creator-no-repositories">
            No repositories authorized yet.
          </p>
        ) : null}

        <ul className="flex flex-col gap-2">
          {active.flatMap((row) =>
            (row.repos ?? []).map((repo) => (
              <li
                key={`${row.id}:${repo.full_name}`}
                className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"
                data-testid="creator-repository-row"
              >
                <span className="font-medium">{repo.full_name}</span>
                <Badge variant="secondary">Authorized</Badge>
                {row.simulated ? (
                  <Badge variant="outline" data-testid="creator-simulated-badge">
                    Simulated
                  </Badge>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  data-testid="creator-inspect"
                  onClick={() =>
                    inspect.mutate(
                      { id: row.id, repoFullName: repo.full_name },
                      { onSuccess: setArtifact },
                    )
                  }
                >
                  Inspect artifact
                </Button>
              </li>
            )),
          )}
        </ul>

        {pending ? (
          <div className="rounded-md border border-dashed p-3 text-sm" data-testid="creator-pending-authorization">
            <p className="font-medium">Authorization started</p>
            {pending.installUrl ? (
              <p className="mt-1 break-all text-muted-foreground">
                Finish it by installing the GitHub App:{" "}
                <a className="underline" href={pending.installUrl} rel="noreferrer" target="_blank">
                  {pending.installUrl}
                </a>
              </p>
            ) : null}

            {canSimulate ? (
              <SimulateForm
                pendingId={pending.id}
                repoInput={repoInput}
                onRepoInput={setRepoInput}
                busy={simulate.isPending}
                onSimulate={(repo) =>
                  simulate.mutate({ id: pending.id, repos: [repo] }, { onSuccess: () => setRepoInput("") })
                }
              />
            ) : (
              <p className="mt-2 text-muted-foreground">
                This host cannot complete the handshake for you — the provider install has to happen
                on GitHub.
              </p>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            className="self-start"
            data-testid="creator-connect-repository"
            disabled={begin.isPending}
            onClick={() => begin.mutate()}
          >
            Connect a repository
          </Button>
        )}

        {artifact ? <ArtifactReport artifact={artifact} /> : null}
      </CardContent>
    </Card>
  );
}

function SimulateForm({
  pendingId,
  repoInput,
  onRepoInput,
  busy,
  onSimulate,
}: {
  pendingId: string;
  repoInput: string;
  onRepoInput: (value: string) => void;
  busy: boolean;
  onSimulate: (repo: string) => void;
}) {
  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (repoInput.trim()) onSimulate(repoInput.trim());
      }}
    >
      <div className="flex flex-col gap-1">
        <Label htmlFor={`simulate-${pendingId}`}>Repository (owner/repo)</Label>
        <Input
          id={`simulate-${pendingId}`}
          data-testid="creator-simulate-repo"
          value={repoInput}
          onChange={(event) => onRepoInput(event.target.value)}
          placeholder="acme/widgets"
        />
      </div>
      <Button type="submit" size="sm" disabled={busy} data-testid="creator-simulate-submit">
        Complete (simulated)
      </Button>
      <p className="w-full text-xs text-muted-foreground">
        Simulated: this stands in for the GitHub install callback. The authorization it writes is
        marked simulated and is not evidence of a live GitHub integration.
      </p>
    </form>
  );
}

function ArtifactReport({ artifact }: { artifact: ExtensionArtifactData }) {
  // Three states, rendered as three states — see this file's own header for why `available` is not
  // folded into `valid`.
  if (!artifact.available) {
    return (
      <div className="rounded-md border p-3 text-sm" data-testid="creator-artifact-unavailable">
        <p className="font-medium">Could not inspect {artifact.repoFullName}</p>
        <p className="mt-1 text-muted-foreground">{artifact.problems[0]}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border p-3 text-sm" data-testid="creator-artifact-report">
      <p className="flex flex-wrap items-center gap-2 font-medium">
        {artifact.packageName ?? artifact.repoFullName}
        {artifact.ref ? <Badge variant="secondary">{artifact.ref}</Badge> : null}
        <Badge variant={artifact.valid ? "secondary" : "destructive"} data-testid="creator-artifact-verdict">
          {artifact.valid ? "Valid Beam Extension" : "Not listable"}
        </Badge>
      </p>
      {artifact.description ? (
        <p className="mt-1 text-muted-foreground">{artifact.description}</p>
      ) : null}
      {artifact.valid ? (
        <p className="mt-1 text-muted-foreground">
          Release version {artifact.version}. Tags available:{" "}
          {artifact.refs.join(", ")}
        </p>
      ) : (
        <ul className="mt-2 list-disc pl-5 text-muted-foreground" data-testid="creator-artifact-problems">
          {artifact.problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
