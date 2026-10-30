# @splicewire/beam-intake

## 0.2.0

### Minor Changes

- d185fd4: The packaged `IntakeForm` reaches rendered pages (EP-07d).
  - **beam-inertia:** a host that turns on laravel-beam's public intake door also sets `configureBeamInertia({ intakeForms: true })`. beam-inertia then registers `IntakeForm` in the canvas registry, as a non-submitting preview while an author edits. The packaged entry page provides each form's server-resolved schema (`props.intakeForms`) and the door's honeypot field (`props.intakeHoneypotField`).
  - **beam-intake:** `IntakeForm` draws its fields through the host's `renderForm`, the same seam as `IntakeSectionForm`, falling back to `SchemaForm`, which shows the door's 422 errors on their fields. It sends the CSRF header beam's other transports send. `IntakeFormRenderProps` gains optional `errors` and `submitLabel`.
- a65d3dd: `IntakeForm` is the packaged form Code Component (EP-07d). It renders the fields of the intake schema its `captureKey` names and sends each submission through laravel-beam's public intake door (`POST /beam/intake/{schema}`) to the submissions ledger.

  - The page supplies the server-resolved schemas through `PublicIntakeProvider`.
  - The form always carries the door's honeypot field, maps the door's 422 errors onto their fields, and shows a throttle message on a 429.
  - In the editor it is a sealed preview that never submits.

  `submitToIntakeDoor()` is the default sender.

- 039f20b: Expose a success callback for public intake submissions so host surfaces can report lead events without coupling the package to analytics.
