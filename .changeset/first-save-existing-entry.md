---
"@splicewire/beam-ux": minor
"@splicewire/beam-inertia": minor
---

Existing entries with no history can open the editor without a read-side write. The first Save draft or Publish sends a null base; the server initializes the trusted baseline atomically before recording the draft. Existing histories still require a publication pin. Save-draft transport implementations now accept a nullable base version.
