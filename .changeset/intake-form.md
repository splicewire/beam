---
'@splicewire/beam-intake': minor
---

`IntakeForm` is the packaged form Code Component (EP-07d). It renders the fields of the intake schema its `captureKey` names and sends each submission through laravel-beam's public intake door (`POST /beam/intake/{schema}`) to the submissions ledger.
- The page supplies the server-resolved schemas through `PublicIntakeProvider`.
- The form always carries the door's honeypot field, maps the door's 422 errors onto their fields, and shows a throttle message on a 429.
- In the editor it is a sealed preview that never submits.

`submitToIntakeDoor()` is the default sender.
