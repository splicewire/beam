/**
 * `@splicewire/beam-ux/admin` — the `BeamUxEntry` admin lifecycle surface (theme-entries-and-authoring
 * ticket 06): a standalone, presentational `RowActions` slot implementation for Frame's `ListShell`
 * (edit/duplicate/delete/promote-to-central). Callback-driven, not transport-aware — a host wires
 * `onEdit`/`onDuplicate`/`onDelete`/`onPromoteToCentral` to its own REST calls and mounts
 * `<ListShell slots={{ RowActions: EntryRowActions }}>` for the `beam-ux-entry` resource; no host in
 * the theme-entries-and-authoring GOAL's 5-repo set does this yet, so this ships unmounted.
 */

export { EntryRowActions } from './EntryRowActions.js';
export type { EntryRowActionsRecord, EntryRowActionsProps } from './types.js';
