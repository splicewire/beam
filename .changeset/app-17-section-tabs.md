---
"@splicewire/beam-ux": minor
---

Add `SectionTabs` to `@splicewire/beam-ux/nav` — the second consumer of a realm's projected `nav`, beside `RealmNav` (app-walkthrough APP-17, M7′). It draws the active section's projected `children` as the top-bar primary strip, and a child group's own `children` (e.g. Knowledge → Graph) as a divider-separated second strip, from the SAME server-projected, entitlement-filtered tree the rail reads. Pathname-driven (the manifest is fetched per realm), framework-neutral (injected tab link) and theme-neutral (packaged strip classes, overridable). Hosts stop keeping a client `SECTION_META` roster for tabs.
