# @splicewire/beam-accounts

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
