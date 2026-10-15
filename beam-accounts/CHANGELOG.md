# @splicewire/beam-accounts

## 0.3.0

### Minor Changes

- 169aa3a: Move AccountShell and its account data/nav exports from beam-ux/account to
  beam-accounts/account. The old beam-ux/account entry is removed without an alias.
  Update the Inertia adapter and story together; consumers must upgrade this release
  set together. AppRail retains its default renderer and exposes router-neutral row
  and group rendering seams for sidebar primitives. Account collapse, tooltips,
  mobile disclosure, slots, prefetch and sidebar state remain host-controlled.

  Versioning policy: remain on 0.x; a minor may remove a breaking entry. Land after
  the train-3 beam-ux 0.5.0 bump, then release this move as beam-ux 0.6.0 with
  coordinated Accounts/Inertia minors and matching peer ranges.

## 0.2.1

### Patch Changes

- 3fadb17: Render the API tokens roster title as the page's semantic `h1`.

## 0.2.0

### Minor Changes

- f950b7d: The team and token rosters stack on a phone through `@schemastud/ui`'s `DataTable` `stackOnMobile` mode; the package's
  own ResponsiveRoster (internal, never exported) is removed, with no alias. **Peer:** `@schemastud/ui` `^0.1.2` (the
  release that ships `stackOnMobile`), previously `*`.

### Patch Changes

- 2cab0d1: Present compound API token scopes with a human explanation while retaining the exact permission key for audit meaning.
