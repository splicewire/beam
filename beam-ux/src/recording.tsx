import type { ReleaseRecording } from "./releases";
import {Button} from "@schemastud/ui";
import { useBeamUxMessages } from "./messages.js";

/** Release summary and history project the same server-owned receipt. Files owns recovery. */
export function ReleaseRecordingSummary({
  recording,
  filesHref,
}: {
  recording: ReleaseRecording;
  filesHref?: string | null;
}) {
  const m = useBeamUxMessages();
  return (
    <section aria-label={m.t('splicewire-beam-ux::messages.recording_local_git_record')} className="my-3 space-y-1 rounded border p-3 text-sm">
      <h3 className="font-medium">{m.t('splicewire-beam-ux::messages.recording_local_git_record')}</h3>
      <p role="status">{recording.message ?? recording.status}</p>
      {recording.sha && <p title={recording.sha}>{m.t('splicewire-beam-ux::messages.recording_git_sha', { sha: recording.sha.slice(0, 7) })}</p>}
      <div className="flex items-center gap-3">
      {recording.sha && (
        <Button type="button" size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(recording.sha!)}>
          {m.t('splicewire-beam-ux::messages.recording_copy_sha')}
        </Button>
      )}
      {filesHref && <a href={filesHref} className="underline">{m.t('splicewire-beam-ux::messages.recording_open_files')}</a>}
      </div>
    </section>
  );
}

export function VersionRecordingReferences({ recordings = [] }: { recordings?: ReleaseRecording[] }) {
  const m = useBeamUxMessages();
  return (
    <>
      {recordings.map((recording) => (
        <span key={recording.releaseId} className="ml-2 text-sm" title={recording.sha ?? recording.message ?? undefined}>
          {recording.sha ? m.t('splicewire-beam-ux::messages.recording_git_sha', { sha: recording.sha.slice(0, 7) }) : m.t('splicewire-beam-ux::messages.recording_not_committed')}
          {recording.noChange ? ` ${m.t('splicewire-beam-ux::messages.recording_no_new_commit')}` : ""}
          {` ${m.t('splicewire-beam-ux::messages.recording_release', { id: recording.releaseId })}`}
        </span>
      ))}
    </>
  );
}
