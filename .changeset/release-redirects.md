---
"@splicewire/beam-ux": minor
"@splicewire/beam-inertia": minor
---

A Release's Redirects (ux-0236 d2, d12). The Preview bar lists "Redirects this Release leaves": each URL the Release
moves or takes down and where it goes once it publishes, or "not found" for a Take-down that names no page. The
Release panel lists them too: the ones it would leave while open, and the ones it left once published, each with
Remove. The editor transport gains `removeRedirect(id)`, which beam-inertia sends as `DELETE /beam-ux-redirects/{id}`.
