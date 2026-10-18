---
"@splicewire/beam-ux": minor
---

Breaking: remove the `@splicewire/beam-ux/leaf` export and its unused inline-leaf adapter. Prose Runs now use the package-owned canvas integration with Blockdoc. This export retirement requires the next 0.x minor release, 0.8.0, rather than a patch. It does not remove MdxDocumentEditor or change beam-mdx; those remain EP-26 work.
