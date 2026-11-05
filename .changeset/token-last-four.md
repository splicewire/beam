---
"@splicewire/beam-accounts": patch
"@splicewire/beam-resources": patch
---

API tokens show what tells them apart (owner-review-20261102 K-28). `ApiTokenData` gains `lastFour`: the last four characters of the token's secret, captured at mint by `splicewire/laravel-beam-accounts` and `splicewire/tower`. `TokensRoster` and `TokensPage` show `…c41e` beside each token's name. A token minted before the column existed has `lastFour: null` and shows the tail of its id instead, labelled `id …6fa8`.
