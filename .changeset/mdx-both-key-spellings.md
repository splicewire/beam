---
"@splicewire/beam-mdx": minor
---

The frontmatter readers accept both key spellings (ux-0233 d9): `contentNavNodes`, `createContent` and the
`beamMdxContent` draft gate read `nav_order`, `date_published` and the rest beside `navOrder` and `datePublished`, so a
converted file (whose unclaimed keys laravel-beam-ux prints in snake case) reads as an unconverted one does. A camelCase
key a file writes itself wins. `camelKeys` is exported for a host's own frontmatter readers.
