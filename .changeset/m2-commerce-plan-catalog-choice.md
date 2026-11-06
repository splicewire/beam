---
"@splicewire/beam-resources": patch
---

The commerce projection carries the owner-review-20261102 commerce shapes. `PlanData` gains `catalog`, the plan's read-only mirror in the active rail's own catalog (`PlanCatalogData` and `PlanCatalogEntryData`, null on a rail with no catalog). `PlanChoiceData` is one plan a tenant may choose for itself. `SubscriptionData` gains `cardOnFile`, `firstBillOn`, `cardAction` and `lastChargeError`. Regenerated from the flagship with `typescript:transform` and `pipelines:run resources:beam` against splicewire/laravel-beam-commerce 15d29a9 and rushing/laravel-commerce f7abb83.
