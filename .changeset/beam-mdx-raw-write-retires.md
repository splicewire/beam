---
"@splicewire/beam-mdx": minor
---

**Breaking:** the raw-file save/load transport retires — `loadRawMdx`, `saveMdx`, `putMdx` and their `MdxLoader` /
`MdxSaver` types (laravel-beam-ux ADR-0233 decision 10). They read and wrote a content name's raw `.mdx` through a host's
`/beam/content` route, which `splicewire/laravel-beam-mdx` no longer ships; an MDX page is written through the entry
operations like any other page. `parseFrontmatter`, `serializeMdx` and `serializeFrontmatter` stay.
