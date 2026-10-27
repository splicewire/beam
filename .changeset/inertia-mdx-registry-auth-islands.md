---
'@splicewire/beam-inertia': minor
---

The canvas registry draws what an MDX page holding blocks places, and the auth islands fail closed off their own route (EP-42).
- A host whose MDX pages hold blocks (`beam.ux.mdx.holds_blocks`) also sets `configureBeamInertia({ mdxHoldsBlocks: true })`. beam-inertia then registers `SiteNav`, bound to the page's `nav` prop, and `ManifestTable`. laravel-beam-ux adds both to an MDX page's profile, because the packages' shipped docs pages place them. They join only there, so the doctor's registry audit still agrees with the switch off.
- Each packaged auth island renders its page only on the route that serves it (Fortify's default paths), and hands the page that route's Inertia props. Anywhere else it renders a stated refusal (`data-auth-island-refused`), never a form that cannot work, such as a reset form with no token.
