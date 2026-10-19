The artifact reader and the PHP compiler are one runtime contract. When changing either, run:

```sh
BEAM_UX_PHP_ROOT=/absolute/path/to/laravel-beam-ux npm run test:artifact-contract
```

Run from `beam-ux/`, with the Beam workspace dependencies installed. The gate compiles fresh TSX
and MDX with that PHP checkout's compiler and renders them through the actual EntryBody runtime.
It checks the generation-3 styled output and compares all runtime properties accessed by both
compiler outputs with the reader's export list. Missing PHP input fails rather than skipping.
The ordinary unit suite also pins that export list. There is no stored generated artifact to drift.
