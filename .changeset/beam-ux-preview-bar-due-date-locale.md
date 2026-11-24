---
"@splicewire/beam-ux": patch
---

The Preview bar's Publish notes now show a Release's due date in the reader's locale from the host's message provider, and the date reformats when the locale changes live. It used to follow the browser's locale. The date is formatted with the messages' `date` formatter, using a medium date and a short time, instead of `toLocaleString()`. Hosts with no message provider still get English.
