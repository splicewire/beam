# @splicewire/beam-calendar

The **vocab-aware calendar satellite** — ONE `CompositionCalendar` component, **mounted twice**
(aggregate + single), sitting on the source-blind [`@schemastud/big-calendar`](../../schemastud/big-calendar)
foundation and the `@splicewire/_resources` calendar projection DTO. It knows
"calendar" / "composition" / "channel" / ADR-0070 exist and spreads the aggregate-vs-single
difference across the vendor seam — while the foundation stays source-blind. **It never imports
react-big-calendar** (foundation-only).

Part of the **big-calendar-surface** build (PRD §3/§4/§5/§7). The PHP mirror
`splicewire/laravel-beam-calendar` is deferred (§7.1) — not stood up.

## The two mounts differ ONLY in the client adapter

```ts
import { CompositionCalendar } from '@splicewire/beam-calendar';

// aggregate (main page): every calendar-profile Composition merged; hue = provenance.
<CompositionCalendar mount="aggregate" transport={hostTransport} renderEditPanel={hostPanel} />

// single (Studio): one composition fixed; hue = Kind.
<CompositionCalendar mount="single" compositionId={id} transport={hostTransport} renderEditPanel={hostPanel} />
```

- `createAggregateClient` / `createSingleClient` map the projection DTO → `FoundationCalendarEvent`
  and route every write to the correct composition by decoding the write-target `ref`.
- **The `ref` + `resident` codec** (`encodeRef`/`decodeRef`) carries `(owning calendar, cell |
  series+recurrence)` opaquely: a resident ref edits the cell, a non-resident ref
  materializes/overrides — interaction "falls out" from residence (ADR-0070).
- **Two hue axes** (`kindHue` single, `provenanceHue` aggregate); the foundation receives an
  already-resolved `colorToken`. Fill/dash (resident/virtual) is the foundation's, orthogonal.
- **Vocab renderX chrome** authored here: `EventBadge` (series Repeat + Kind + status dot),
  `Filters` (provenance + status facets, aggregate only, filtering via the foundation's opaque
  `filterEvent`), `LaneHeader`. `renderEditPanel` is **host-injected** (its Sheet +
  `CellFormPanel` cannot enter a package).

## The host injects a transport (no URLs in the package)

`CalendarTransport` is relative-endpoint IO scoped per composition; the host fills it with its
own HTTP client. `route()`/URLs/`sonner`/`@/` never enter this package.

## Verification bars

- **§8a runtime:** `npm test` — `CompositionCalendar` mounts both ways off pure `CalendarEventData`
  fixtures (no Laravel); both adapters route writes correctly and the four renderX slots get the
  right props.
- **§8b static:** `npm run lint:imports` (deny-list, incl. no direct RBC) + `npm run typecheck`.
