---
"@splicewire/beam-transforms": minor
---

Add an optional `can` service ({ create, update, delete }, each omitted key allowed) so the RunnerTransform editor follows the host's write policy: without create it offers no New and no blank form, without update an open transform is read-only with no Save, without delete it offers no Delete, and an actor with none of them sees "You can view and test transforms, but not change them." Test runs stay available. Hosts that pass nothing keep full controls.
