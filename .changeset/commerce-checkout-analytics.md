---
'@splicewire/beam-commerce': minor
---

The credits and subscription surfaces report GA4 `begin_checkout` when a checkout starts (a hosted redirect waits for the report) and `purchase` for a captured direct reload, with its provider reference as the transaction id (EP-29). `@splicewire/beam-ux` becomes an optional peer dependency: without it, nothing is reported and nothing fails.
