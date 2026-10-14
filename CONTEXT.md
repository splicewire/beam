# Beam

The Beam app substrate: the npm workspace whose packages give every host the same editor, chrome and capability UI.

## Language

### Authoring editor

**Block Style**:
The look an author gives one block in the editor, held as layers of CSS declarations. It is what the style panels edit,
as distinct from a developer's classes on the same block (docs/adr/0003).
_Avoid_: inline style, style object, sx

**Style Layer**:
One slice of a Block Style that applies under a condition: the base layer always, a breakpoint layer from a minimum
width, a state layer while the element is hovered, focused or active.
_Avoid_: variant, modifier, override
