# What these baselines were rendered against

The catalogue is not hermetic: it renders sibling checkouts (`../schemastud`, `../splicewire/_resources`) and a
privately selected canonical commerce package beside beam. A baseline means only what it was rendered against, so
every re-baseline records its inputs here. Two renders of the same beam commit can still differ when a sibling moves.

Last full re-baseline: launch ticket 40, 2026-11-09.

| input | value |
|---|---|
| beam | `9e929419776e1e84da79b0ee02da4c9a22ac742f` (the render's base; this commit adds only baselines and this file) |
| `../schemastud` (schemastud/js) | `d13e733b2c25b118556713ddf2696a59e311dc93`, `npm ci` + `npm run build`, plus `big-calendar` `npm ci` + `npm run build:big-calendar` |
| `../splicewire/_resources` | `2d6600ff5ab4918f8432e3868ec428ab10a34013` |
| canonical commerce | laravel-beam-commerce `dbe187f9057ed52630752a431a7df1799d120dba`, `js/beam-commerce` 0.2.1 |
| commerce selection | the accepted U21 selection (`canonical-selection.json`, sha256 `e0fdce90858163105531c339acfcbed33732a8af6781c151bb2745286f7b5896`); the six hashes below |
| install | `pnpm@9.15.3 install --frozen-lockfile`, then `pnpm run build`, `pnpm run build-storybook` |
| runner | `VR_SNAPSHOTS=1 test-storybook --index-json -u` (index mode, so the out-of-repo commerce stories are included) |
| Storybook / test-runner / jest-image-snapshot | 10.5.4 / 0.24.4 / 6.5.2 |
| Playwright / Chromium | 1.62.0 / 151.0.7922.34 (headless shell) |
| Node | 22.13.0 |
| host | macOS (Darwin 25.6.0), the primary Mac |

Commerce selection (`.storybook/commerce-source.local.json`, gitignored; see `.storybook/commerce-source.md`):

| file | sha256 |
|---|---|
| `src/auto-reload-config-card.stories.tsx` | `7c029e0b04d508c0e43623a6534c042e48bd09ed75877ee2d29f2399eb583bfa` |
| `src/credits-surface.stories.tsx` | `008a66bf0b78895bc8727ce137cd3736af10b67925949cbe437df63a90b38365` |
| `src/reload-activity-card.stories.tsx` | `e0168ca38d5efd4c77856591c28284b01370e7384ff880997608cfa354ef2da5` |
| `dist/index.js` | `410f429d88e286abfe55aeca6745081ae3a33b6d01ae54725d9e6ae573308364` |
| `dist/index.d.ts` | `c92b1450229ea8ca57ce2b9a3ff51f85dc504cfad2378eed9d72918e8329794a` |
| `dist/index.js.map` | `79bb27d9ede489e279fe163a76d98560103d72d127dcba65347d4264fbf043cb` |
