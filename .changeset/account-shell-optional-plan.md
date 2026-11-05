---
"@splicewire/beam-accounts": patch
"@splicewire/beam-inertia": patch
---

`AccountShellData.plan` may be `null`. That is what beam-accounts' identity-only default provider projects when nothing on the host owns plans. The packaged `<AccountShell>` already rendered no plan section for a missing plan; the type now says so, a test pins it, and `AppSidebarBeam`'s shell prop accepts it. Hosts that pass a plan see no change.
