---
"@splicewire/beam-mdx": minor
---

`readMdx` gives `metaData`: the value of `export const meta = {…}` when every part of it is a literal (strings, numbers,
booleans, null, arrays and objects of them), so a host's MDX conversion can write it as frontmatter (ux-0233 d9). It is
null when there is no meta, or when only running code could give its value; `meta` keeps the statement's source either way.
