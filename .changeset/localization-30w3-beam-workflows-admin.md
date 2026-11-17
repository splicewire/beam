---
"@splicewire/beam-workflows": minor
---

Localization 30 part W3: the workflows admin page (lineage list and filter, versions, coverage, migration disclosure, activate-on-save, governed-type bindings) renders through beam-workflows' message catalog and switches locale live; its coverage count reads the catalog's plural. English output is unchanged, and lineage names, keys, versions and type labels render as given. With W1–W3, beam-workflows' JS reads its copy entirely through the seam.

Bundling: `@schemastud/messages` is external in every entry (the host's one runtime), and the package's English catalog is no longer inlined into `dist`. The code imports it through the package's own `@splicewire/beam-workflows/messages.js` subpath, a GENERATED ES module of the catalog (`messages.default.js`, with `messages.default.d.ts`, written and checked against `messages.default.json` by `messages:catalog`), which every build keeps external. A JS module needs no import attribute, so Node and SSR load it; `./messages` still serves the JSON for tooling. The standalone `./action-form` build drops from 23,680 to 9,981 bytes. `build` now runs `test:node`, which imports `./action-form` in plain Node and server-renders the form.

Correction to W2's note: a failure the package itself raises renders the package's catalog line (stored as a key, so it follows a locale switch); a thrown error's own message renders as it was given.
