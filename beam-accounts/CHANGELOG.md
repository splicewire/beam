# @splicewire/beam-accounts

## 1.0.0

### Patch Changes

- Updated dependencies [15c58c3]
- Updated dependencies [4c12998]
- Updated dependencies [ad864c9]
- Updated dependencies [3cd0a8c]
- Updated dependencies [3f000f0]
- Updated dependencies [5f6b1de]
- Updated dependencies [9af7d51]
- Updated dependencies [08f69bb]
- Updated dependencies [ecb80f0]
- Updated dependencies [e024aa9]
- Updated dependencies [22a1dbd]
- Updated dependencies [cbc1dd7]
- Updated dependencies [0a3c23b]
- Updated dependencies [aff425e]
- Updated dependencies [a8a03a0]
- Updated dependencies [144ad9a]
- Updated dependencies [8e03ab7]
- Updated dependencies [7d1826a]
- Updated dependencies [12fb9ac]
- Updated dependencies [f312863]
- Updated dependencies [1e54793]
- Updated dependencies [aef0699]
  - @splicewire/beam-ux@0.8.0

## 0.3.1

### Patch Changes

- Admit beam-ux 0.7 alongside 0.6 in the AccountShell peer contract.

## 0.3.0

### Minor Changes

- 7a93ed7: Move AccountShell and its account data/nav exports from beam-ux/account to
  beam-accounts/account. The old beam-ux/account entry is removed without an alias.
  Update the Inertia adapter and story together; consumers must upgrade this release
  set together. AppRail retains its default renderer and exposes router-neutral row
  and group rendering seams for sidebar primitives. Account collapse, tooltips,
  mobile disclosure, slots, prefetch and sidebar state remain host-controlled.

  Versioning policy: remain on 0.x; a minor may remove a breaking entry. Land after
  the train-3 beam-ux 0.5.0 bump, then release this move as beam-ux 0.6.0 with
  coordinated Accounts/Inertia minors and matching peer ranges.

### Patch Changes

- Updated dependencies [201a73e]
  - @splicewire/beam-resources@0.1.3

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
