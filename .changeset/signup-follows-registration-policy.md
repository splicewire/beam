---
'@splicewire/beam-inertia': minor
'@splicewire/beam-resources': patch
---

Make the login "Sign up" affordance follow the server registration policy. The packaged login page
now gates the `/register` link on the `canRegister` page prop — sourced from
`Features::enabled(Features::registration())`, the same Fortify feature registry the `/register`
route reads — instead of the build-time client `featureEnabled('registration')` flag. On a
closed-door host (`ACCOUNT_REGISTRATION=closed`, where `/register` 404s) the link no longer renders
as a dead affordance; it mirrors the existing `canResetPassword` prop convention.

`@splicewire/beam-resources` gains the `canRegister: undefined | boolean` field on `AuthEntryPageData`
(the projection of the beam-accounts DTO field).

Host contract: the Fortify auth-view closures must now share `canRegister` on the auth-entry props
for the link to render on an open-registration host (the beam starters' `loginView` follow in the
same lineage once this is released). A host that does not share it simply shows no Sign up link.
