# Private workspace Git releases

Market and Commerce use the Tower UX distribution pattern: immutable Git commits containing built `dist`, reachable through release tags. A monorepo-root commit is not an installable workspace package, so each release exports one package at the repository root on a separate commit/tag in this same repository. Consumers pin the full exported commit SHA, not main or a moving branch. No registry publication is involved.

From a clean, committed Beam checkout, install its committed lock in the usual sibling Schemastud layout, build the Schemastud dependencies, then build and test the two workspaces. Do not borrow another checkout's dist. Record the exact sibling dependency commits with the build receipt.

```
npm ci
npm run build --workspace @splicewire/beam-market --workspace @splicewire/beam-commerce
npm run test --workspace @splicewire/beam-market --workspace @splicewire/beam-commerce
node scripts/export-private-release.mjs beam-market 0.1.2
node scripts/export-private-release.mjs beam-commerce 0.1.0
```

The exporter uses npm's package file list, adds private/export-only metadata and `RELEASE.json` (source commit/package tree, lock hash, tool versions, dist hashes). Its private index makes a package-root child commit of the source commit and a tag `release/<workspace>/<source-sha12>`; it does not move the source branch, edit the source manifests, publish, or push. It refuses a dirty source, missing dist or an existing local/remote tag. Build/test proof is a separate required gate; the exporter does not claim to have run those checks.

After review, push the exact new tag non-force. Install the emitted `git+https://github.com/splicewire/beam.git#<full-commit>` in the consumer and commit its regenerated frozen lock. Prove the consumer build from a fresh clone with no source links. Market's export is version 0.1.2 because its `plays` contract differs from public 0.1.1; the monorepo manifest remains unchanged.
