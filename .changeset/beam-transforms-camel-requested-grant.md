---
"@splicewire/beam-transforms": patch
---

The RunnerTransform editor now sends the requested grant as `requestedGrant`, the key Tower's strict `RunnerTransformInputData` accepts; `requested_grant` was refused with "Unknown input field [requested_grant]" and surfaced only as a failed-save toast. `RunnerTransformInput.requested_grant` is renamed `requestedGrant` to match the wire.
