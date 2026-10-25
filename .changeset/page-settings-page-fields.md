---
'@splicewire/beam-ux': minor
---

Page settings edit Page Fields (ux-0233 d4, editor-parity EP-26 E2b). A page picks which of the host's registered Page Fields its child pages carry (`childFields`). A child page edits the fields its parent declares, with inputs typed by the schema the server sends in the body envelope (`pageFields`). The server checks them on save. `EntryPageSettings` gains `childFields` and `fields`.
