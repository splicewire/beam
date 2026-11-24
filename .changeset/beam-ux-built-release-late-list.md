---
"@splicewire/beam-ux": patch
---

Creating a built Release in the page editor no longer loses it when the editor's first list of Releases arrives late. Before, a slow first load replaced the list. The new Release then vanished from "Release to assemble", along with its selection. Now a draft that this editor created since it opened is kept until the server lists it. The server list is still the truth for every other Release, and only draft Releases are offered.
