# @splicewire/beam-transforms

## 0.2.0

### Minor Changes

- a758ae2: The RunnerTransform editor now sends the requested grant as `requestedGrant`, the key Tower's strict `RunnerTransformInputData` accepts; `requested_grant` was refused with "Unknown input field [requested_grant]" and surfaced only as a failed-save toast. `RunnerTransformInput.requested_grant` is renamed `requestedGrant` to match the wire.
- 7e05943: Add an optional `can` service ({ create, update, delete }, each omitted key allowed) so the RunnerTransform editor follows the host's write policy: without create it offers no New and no blank form, without update an open transform is read-only with no Save, without delete it offers no Delete, and an actor with none of them sees "You can view and test transforms, but not change them." Test runs stay available. Hosts that pass nothing keep full controls.
