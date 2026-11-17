import { Button } from "@schemastud/ui";
import {
  WorkflowActions,
  WorkflowStepperTrack,
  WorkflowsProvider,
  useWorkflowsServices,
  type WorkflowProjection,
  type WorkflowsServices,
} from "@splicewire/beam-workflows";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useBeamUxMessages } from "../messages.js";

/**
 * The Entries seat's declared workflow seam (editor-parity ticket 10, HC-05; EP-38): the host binds the workflow services
 * (their client reaches its entry workflow operations) and names the workflow kind; the seat renders one entry's current
 * marking and its transitions with `@splicewire/beam-workflows`' components.
 */
export interface EntryWorkflowBinding {
  services: WorkflowsServices;
  /** The workflow kind the entry's projection and transitions are addressed by. */
  kind: string;
  /** Host chrome above the view, e.g. a link to the host's queue of everything awaiting a transition. */
  queue?: ReactNode;
}

export function EntryWorkflow({ entryId, binding }: { entryId: string; binding: EntryWorkflowBinding }) {
  return (
    <WorkflowsProvider services={binding.services}>
      <EntryWorkflowState entryId={entryId} kind={binding.kind} queue={binding.queue} />
    </WorkflowsProvider>
  );
}

function EntryWorkflowState({ entryId, kind, queue }: { entryId: string; kind: string; queue?: ReactNode }) {
  const { client } = useWorkflowsServices();
  const [projection, setProjection] = useState<WorkflowProjection | null | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const m = useBeamUxMessages();
  const [error, setError] = useState<WorkflowFailure | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setProjection(undefined);
    client
      .projection(kind, entryId)
      .then((p) => !cancelled && setProjection(p))
      .catch((e: unknown) => !cancelled && setError(failure(e, "load")));

    return () => {
      cancelled = true;
    };
  }, [client, kind, entryId, retry]);

  const onTransition = useCallback(
    async (name: string) => {
      setPending(true);
      setError(null);
      try {
        setProjection(await client.transition(kind, entryId, name));
      } catch (e: unknown) {
        setError(failure(e, "transition"));
      } finally {
        setPending(false);
      }
    },
    [client, kind, entryId],
  );

  if (projection === undefined && !error) {
    return (
      <p role="status" aria-busy="true" className="text-sm text-muted-foreground">
        {m.t('splicewire-beam-ux::messages.entries_loading_workflow')}
      </p>
    );
  }

  if (projection === null) {
    return <p className="text-sm text-muted-foreground">{m.t('splicewire-beam-ux::messages.entries_no_workflow')}</p>;
  }

  return (
    <div className="space-y-4" aria-busy={pending}>
      {queue && <div className="flex items-center justify-end">{queue}</div>}

      {error && (
        <div role="alert" className="space-y-3 text-sm">
          <p className="text-destructive">
            {error.what === "load"
              ? m.t('splicewire-beam-ux::messages.entries_workflow_load_failed', { detail: error.detail })
              : m.t('splicewire-beam-ux::messages.entries_transition_failed', { detail: error.detail })}
          </p>
          {projection === undefined && (
            <Button type="button" variant="outline" size="sm" onClick={() => setRetry((value) => value + 1)}>
              {m.t('splicewire-beam-ux::messages.entries_try_again')}
            </Button>
          )}
        </div>
      )}

      {projection && (
        <>
          <WorkflowStepperTrack places={projection.places} current={projection.current} />
          <WorkflowActions
            projection={projection}
            channel={null}
            onTransition={(name) => void onTransition(name)}
            pending={pending}
          />
        </>
      )}
    </div>
  );
}

/** The failure's raw detail stays a diagnostic parameter; the sentence around it is formatted at render. */
type WorkflowFailure = { what: "load" | "transition"; detail: string };

function failure(e: unknown, what: WorkflowFailure["what"]): WorkflowFailure {
  return { what, detail: e instanceof Error ? e.message : String(e) };
}
