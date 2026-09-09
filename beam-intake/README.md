# @splicewire/beam-intake

Portable entity-intake section submission, typed from the generated intake DTO projection.
Wrap `IntakeSectionForm` in the host's `QueryClientProvider` and `IntakeProvider`.
The injected `client.submit(sectionKey, fields)` resolves the declared submission receipt.
The host owns entity identity, authentication, endpoint construction, section selection, and route reads.
Use a component key that changes with entity and section identity.

The package owns field state, mutation, pending feedback, failure, receipt, and feedback reset on edits.
Generic `SchemaForm` is the default. Hosts needing an extended form vocabulary provide `renderForm`;
the package never imports the paid composition package. Optional `onError` is a feedback sink.

`npm run lint:imports`, `npm test`, `npm run typecheck`, and `npm run build` are promotion gates.
Colocated stories cover empty/populated/disabled/loading/failure/success and mobile/desktop widths.
The beam workbench supplies ambient light/dark tokens; no app CSS is imported.
