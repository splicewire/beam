# Canonical commerce stories

Commerce implementation, package checks and builds belong to `splicewire/laravel-beam-commerce/js/beam-commerce`. The old tracked `beam-commerce/` tree is retained for migration history but is no longer scheduled as a Beam workspace or Storybook input.

Before running this workbench, copy `commerce-source.example.json` to the ignored `commerce-source.local.json`. Select an OWNED canonical source root, its exact Git commit and the SHA256s of its three story files plus the three built exports from the accepted artifact receipt. `packageRoot` resolves relative to this private manifest. Never ship a machine path or select arbitrary current main. Missing input, wrong owner/commit, source dirt or mismatched artifacts refuses rather than silently removing stories. No install, rebuild or relink is performed by selection.

The workspace globs preserve the other packages; the three explicit canonical files replace the retired mirror's three files. This is file-input coverage, not proof of a rendered catalogue. Verify the selected peer closure, one React and one `@schemastud/ui` context in the actual private workbench proof before adopting a build. Existing served Storybook output is untouched by these source settings.
