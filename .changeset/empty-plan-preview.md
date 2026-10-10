---
"@splicewire/beam-commerce": patch
---

Render an unsubscribed tenant's bill preview as a no-active-plan empty state instead of an error. The "Choose a plan" link appears only when the host passes `subscribeHref` (CommerceBillingPanel does when it renders its subscription section); `has_active_plan` is optional, so older preview shapes keep rendering.
