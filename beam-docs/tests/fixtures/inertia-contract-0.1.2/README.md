# Historical Inertia 0.1.2 type contract

This fixture preserves the published contract used by the Docs consumer compile test.
Only `dist/index.d.ts` is read; it has no relative declaration imports. It is copied
byte-for-byte as `index.d.ts`, with no API edits. Package license: MIT.

- Package: `@splicewire/beam-inertia@0.1.2`
- Tarball: https://registry.npmjs.org/@splicewire/beam-inertia/-/beam-inertia-0.1.2.tgz
- npm integrity: `sha512-k3MWgp3uWEBUzcmE5oaVaocK+YVgGcs6+l4TpMGhhY8pHpwItuYZhZDb2B1/pXTVrh06sbscjJ+eSA1T3bq3LA==`
- Tarball SHA256: `e9d5b446606df4a89add78e90c8907c6379536b35fb43a85e45bbfdf0533325d`
- `index.d.ts` SHA256: `c3f54812cecd753bc6b336f2618ca2bcbfb1b842f20c0d00b87c1789cc7a38d5`

The test continues to compare emitted Docs declarations against this historical
contract; it does not follow the current Inertia workspace or registry version.
