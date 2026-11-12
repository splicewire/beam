---
'@splicewire/beam-docs': minor
---

`PhpApiReference`: the browsable PHP API reference laravel-beam-docs seeds at `/docs/php`, registered by `configureDocs()` beside `ApiReference`. It reads the generated reference through `/beam/docs/php-api-index` and `/beam/docs/php-api-symbol` (`phpApiEndpoint`; null turns it off), draws a package → namespace rail with a symbol filter and a symbol's declaration, docs, members, inherited members, implementers and links, keeps the open symbol in `?symbol=`, and renders docblocks as escaped Markdown with safe links only. The PHP-produced contracts gain the `PhpApi*` types.
