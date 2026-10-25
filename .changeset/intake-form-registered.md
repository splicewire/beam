---
'@splicewire/beam-inertia': minor
'@splicewire/beam-intake': minor
---

The packaged `IntakeForm` reaches rendered pages (EP-07d).
- **beam-inertia:** a host that turns on laravel-beam's public intake door also sets `configureBeamInertia({ intakeForms: true })`. beam-inertia then registers `IntakeForm` in the canvas registry, as a non-submitting preview while an author edits. The packaged entry page provides each form's server-resolved schema (`props.intakeForms`) and the door's honeypot field (`props.intakeHoneypotField`).
- **beam-intake:** `IntakeForm` draws its fields through the host's `renderForm`, the same seam as `IntakeSectionForm`, falling back to `SchemaForm`, which shows the door's 422 errors on their fields. It sends the CSRF header beam's other transports send. `IntakeFormRenderProps` gains optional `errors` and `submitLabel`.
