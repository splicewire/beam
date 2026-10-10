# @splicewire/beam-ux

## 0.4.0

### Minor Changes

- Release the realm navigation, appearance and docs-chrome work accumulated since 0.3.0: `RealmSwitcher`,
  `RealmHeader` and `useCurrentRealm` with zone-aware `RealmNav`; one appearance contract at
  `@splicewire/beam-ux/appearance` (light, dark or system); the page-state module at `@splicewire/beam-ux/state`;
  `<AuthorNote>` for dev-only author chrome; the opt-in token layer with `tokens-docs.css` scoped to `.beam-docs`;
  and `./theme.css` shipped in `dist`.

### Patch Changes

- 54f3933: Raise the docs accent contrast so prose links and linked inline code meet WCAG AA in light and dark themes.
- b998399: Keep the RealmSwitcher sign-out door as a full-page navigation when hosts inject a client-side router link.
