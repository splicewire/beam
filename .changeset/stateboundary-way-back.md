---
"@splicewire/beam-ux": minor
---

`StateBoundary` refusals are no longer dead ends. An optional `wayBack` (`{ label, target }`) renders a way back on every refusal/failure state — forbidden, not-found, and the error fallback beside "Try again" — and on the default upsell copy. It defaults to a plain `<a href={target}>`; pass an optional `render({ target, className, children })` to route it through the host's own router (e.g. react-router's `<Link>`) instead of a full page reload. Also exports `ForbiddenState`, the forbidden page-state node (it owns `data-page-state="forbidden"`), so a known refusal with no query behind it renders the shared refusal directly instead of faking a 403 query. Existing states and the retry policy are unchanged.
