---
"@splicewire/beam-content": patch
---

EP-07c: register the content NodeViews under their PascalCase JSX-tag keys (ContentSection / ContentOutline, ADR-0228 d6), and also under their pre-07c snake aliases (content_section / content_outline) for read-compat until every host has run the slots migration.
