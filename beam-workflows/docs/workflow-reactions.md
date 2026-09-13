# Workflow follow-up surfaces

`WorkflowReactionForm` configures a required follow-up after a successful named workflow
transition. It consumes the generated `WorkflowProjectionData`, selected
`WorkflowReactionSubjectData`, and an async `onConfigure(WorkflowReactionData)` callback.
The default publication policy schedules `unpublish` 30 calendar days after `publish`.
All registered transition names are selectable; current availability does not promise future
execution. Timing starts from the committed transition fact, including delayed publication.

The host injects a subject picker or label, an opaque calendar association, Circuit choices,
and `circuitAction(id)` returning the destination fields of `WorkflowReactionData`. The
component never imports a Composition, Circuit request, tenant resolver, or HTTP client.
Remount it when changing subjects; load a projection before mounting for named defaults.
The server prepares the destination and authorizes both endpoints. Browser input never
supplies principal identity, tenant context, definition pins, or a prepared payload.

`WorkflowReactionHistory` consumes generated `WorkflowReactionRecordData[]`. It separates
configuration state from delivery status, displays the actual transition anchor and blockers,
and takes action/fact links and destination labels as rendering callbacks. A scheduled
delivery is not a claim that its downstream action ran. Circuit runs are reached through the
action outcome; the reaction wire does not invent an external run receipt.

Disable passes the displayed configuration revision; explicit delivery retry passes the
displayed attempt count. Both controls await the host callback and retain refused operations
visibly. Disabling prevents future captures while existing deliveries remain obligations.
Superseded deliveries retain their history, and manually edited pending actions are detached
from later replacement. Local calendar-day scheduling shifts a missing hour forward and
uses the earlier instant of a repeated hour; the backend owns this policy.

The app adapter lives in `splicewire/splicewire-app` at
`ui/src/features/calendar/WorkflowReactionsPanel.tsx` and `reaction-services.ts`.
It mounts these portable surfaces with Composition selection and the host's typed Circuit
request. The named `beam.workflow-reactions.{list,configure,disable,retry}` particle
operations all use POST and generated request/response DTOs. A host decides the mount prefix.

Verification: `npm test --workspace @splicewire/beam-workflows`, plus that workspace's
`typecheck`, `build`, and `lint:imports` scripts. The reaction tests exercise relative input,
injected Circuit requests, incomplete and duplicate submission, refused saves, and explicit
history controls. The two `WorkflowReaction*` Storybook entries are synthetic examples;
the host's actual HTTP browser gate covers the integrated mount.
