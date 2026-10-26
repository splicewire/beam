---
"@splicewire/beam-ux": patch
---

`jsonToTsx` keeps a space a reader sees between a text run and an inline element. A mixed block prints each child on
its own line, and JSX drops whitespace that touches a line break, so "Read this <em>first</em>" printed as "Read
thisfirst". A visible leading or trailing space now prints as `{" "}`, which the lens reads back as a text node " ";
whitespace that touches a line break stays layout. Mirrors laravel-beam-ux's `JsonDocPrinter`.
