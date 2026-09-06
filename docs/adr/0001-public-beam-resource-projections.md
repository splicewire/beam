# Public Beam resource projections

Status: accepted
Date: 2026-09-05

`@splicewire/beam-ux` is public, but its shipped declarations imported `BeamUxEntryBodyData` from the private `@splicewire/_resources` package through an external `file:` dependency. A clean starter cannot resolve that edge. The PHP declaration has already moved to the public `splicewire/laravel-beam-ux` package; its old app-private distribution no longer describes its ownership.

Publish that public projection as `@splicewire/beam-resources`. The flagship's `resources:beam` pipeline selects the qualified public declaration from the single `typescript:transform` artifact. The generated type travels as a dependency of Beam UX. No fields are authored in TypeScript, no projection is inlined into the consumer, and the private bundle is not published. This preserves ADR-0116's travelling-projection contract while following the declaration's current ownership.

The first slice contains only `Splicewire.Beam.Ux.Data.BeamUxEntryBodyData`. Additional slices require public PHP ownership and a real public consumer; the package name is not permission to export private app or Tower shapes. The selection uses a qualified name so a same-named app declaration cannot replace it.

Packing runs TypeScript with library checking enabled and an import of the required public contract. A missing or empty projection fails before publication. The starter must consume released versions after this package and the remaining foundation packages are published; local workspace links are development evidence only.
