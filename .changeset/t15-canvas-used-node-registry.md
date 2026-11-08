---
"@splicewire/beam-ux": patch
---

The canvas checks its JS registry against the components a document USES, not every component the profile declares (ticket 15, shape C). A host profile may declare components a client cannot render (the six host Auth* page nodes, which only beam-inertia registers); declared and unused, they no longer stop the canvas from mounting, and they are left out of that client's insert palette. A document that uses an unregistered component still fails loudly, naming it. A client whose registry holds every declared component behaves exactly as before.
