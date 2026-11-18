---
"@splicewire/beam-ux": patch
---

The takes strip's short date for a take older than a day now follows the reader's locale from the host's message provider, and it reformats when the locale changes live. It used to follow the browser's locale. `relativeWhen` formats with the messages' `date` formatter instead of `toLocaleDateString(undefined, …)`. Hosts with no message provider still get English.
