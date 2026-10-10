---
"@splicewire/beam-commerce": patch
---

BillingSurface asks for the next-bill estimate only while the subscription is active. A tenant without one used to see the preview endpoint's designed 422 as a raw "Request failed with status code 422"; the card now says there is no active subscription, so no next bill to estimate.
