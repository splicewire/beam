# @splicewire/beam-resources

Public Beam wire types, generated from the public PHP packages. This bundle contains no app-private DTOs. Its first consumer is `@splicewire/beam-ux`; `BeamUxEntryBodyData` is declared by `splicewire/laravel-beam-ux`.

Regenerate in the flagship after `typescript:transform`, using its existing projection pipeline:

```sh
BEAM_RESOURCES_DIR=/path/to/beam-resources php artisan pipelines:run resources:beam
```

The pipeline selects qualified declarations from the one generated TypeScript artifact. Do not edit `types/` by hand. Changes to the wire shape belong in PHP; this package travels as a type dependency, rather than being copied into a consumer. `npm run typecheck` checks the emitted declarations with library checking enabled.

`@splicewire/_resources` remains private. It is not a publication prerequisite for this bundle.
