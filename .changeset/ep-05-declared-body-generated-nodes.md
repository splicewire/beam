---
"@splicewire/beam-ux": patch
---

EP-05 (ADR-0228 d2): retire `blockdoc/json.ts`'s hand-written `JsonNode`/`JsonBlock`/`JsonText`/`JsonOpaque`/`JsonProp`/`JsonDoc` declarations and the hand-mirrored `EntryVersion`, consuming the generated discriminated union + version projection from `@splicewire/beam-resources/types/beam-ux` instead. The historical short names are kept as aliases of the generated arm types (`JsonBlockNode`/`JsonTextNode`/`JsonOpaqueNode`) so no canvas consumer changes its import site. The pure edit-ops and the browser-safe printer are unchanged.
