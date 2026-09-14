# @splicewire/beam-resources

Public Beam wire types, generated from declarations in the `splicewire/laravel-beam-*` PHP packages. Some of those packages are private; publishing a projection of their wire shapes is a deliberate choice. This bundle contains no app-private or host-tier DTOs. Its first consumer is `@splicewire/beam-ux`; `BeamUxEntryBodyData` is declared by `splicewire/laravel-beam-ux`.

`types/auto-reload.d.ts` and `types/commerce.d.ts` carry exactly the `splicewire/laravel-beam-commerce` shapes that `@splicewire/beam-commerce` imports, plus the types they reference (`PlanComponentData`, and `Cadence` from `rushing/laravel-commerce`).

Regenerate in the flagship after `typescript:transform`, using its existing projection pipeline:

```sh
BEAM_RESOURCES_DIR=/path/to/beam-resources php artisan pipelines:run resources:beam
```

The pipeline selects qualified declarations from the one generated TypeScript artifact. Do not edit `types/` by hand. Changes to the wire shape belong in PHP; this package travels as a type dependency, rather than being copied into a consumer. `npm run typecheck` checks the emitted declarations with library checking enabled.

`@splicewire/_resources` remains private. It is not a publication prerequisite for this bundle.
