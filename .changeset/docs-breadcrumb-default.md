---
"@splicewire/beam-docs": minor
---

`DocsLayout` draws a breadcrumb by default (owner-review-20261112 07): `DocsBreadcrumb`, the current page's ancestors in
the navigation tree the layout already receives, then the page unlinked (`aria-current="page"`). Group headings are
unlinked crumbs, the site's home is left out, the docs root draws none, and a page the nav does not list keeps its
section. `slots.breadcrumb` still overrides it; an explicit `null` suppresses it. `DocsBreadcrumb` and `docsTrail` are
exported. No new wire and no new dependency.
