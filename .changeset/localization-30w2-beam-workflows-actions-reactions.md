---
"@splicewire/beam-workflows": minor
---

Localization 30 part W2: the scheduled-action form and detail, the follow-up (reaction) form and history, and the recipient picker render through beam-workflows' message catalog and switch locale live; their errors are kept as keys, so they re-render in the new locale. `WorkflowActionForm`'s `submitLabel` stays optional and a host's label still wins; without one the default reads the catalog. English output is unchanged, and workflow transitions, statuses, blockers, timezones and principal labels render as given.
