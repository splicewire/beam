---
"@splicewire/beam-agreements": minor
"@splicewire/beam-inertia": minor
---

A locked action asks for agreement and then continues (agreements 06):
- `createAgreementInterlock({ transport, abilities })` returns a frame `transport` that turns a 428 into the step-up
  dialog, frame's `actionLock` that draws an action locked before any request when the ability map reports its
  Agreement unmet, and the `stepUp` controller that `<AgreementStepUp>` renders.
- The dialog shows each Agreement's title and full frozen text, and only the version whose digest is submitted.
  Accepting runs the accept operation (or adds the agreement member) and replays the original request once. A second
  428 is an error, and declining does nothing.
- beam-inertia's config gains `frameKit`, through which a host binds those into each realm's frame kit, and the frame
  provider records the page's ability map for it. Absent, nothing changes.
