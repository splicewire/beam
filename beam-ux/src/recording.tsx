import type { ReleaseRecording } from "./releases";
import {Button} from "@schemastud/ui";

/** Release summary and history project the same server-owned receipt. Files owns recovery. */
export function ReleaseRecordingSummary({
  recording,
  filesHref,
}: {
  recording: ReleaseRecording;
  filesHref?: string | null;
}) {
  return (
    <section aria-label="Local Git record" className="my-3 space-y-1 rounded border p-3 text-sm">
      <h3 className="font-medium">Local Git record</h3>
      <p role="status">{recording.message ?? recording.status}</p>
      {recording.sha && <p title={recording.sha}>Git {recording.sha.slice(0, 7)}</p>}
      <div className="flex items-center gap-3">
      {recording.sha && (
        <Button type="button" size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(recording.sha!)}>
          Copy SHA
        </Button>
      )}
      {filesHref && <a href={filesHref} className="underline">Open Files recording</a>}
      </div>
    </section>
  );
}

export function VersionRecordingReferences({ recordings = [] }: { recordings?: ReleaseRecording[] }) {
  return (
    <>
      {recordings.map((recording) => (
        <span key={recording.releaseId} className="ml-2 text-sm" title={recording.sha ?? recording.message ?? undefined}>
          {recording.sha ? `Git ${recording.sha.slice(0, 7)}` : "Not committed"}
          {recording.noChange ? " · No new commit" : ""}
          {" · Release "}{recording.releaseId}
        </span>
      ))}
    </>
  );
}
