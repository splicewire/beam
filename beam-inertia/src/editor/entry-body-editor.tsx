import { EditableEntryBody as KitComponent } from "@splicewire/beam-ux/editor";
import type { ComponentProps } from "react";
import { InertiaEditorKit } from "./provider";
export function EditableEntryBody(props: ComponentProps<typeof KitComponent>) {
  return (
    <InertiaEditorKit>
      <KitComponent {...props} />
    </InertiaEditorKit>
  );
}
export default EditableEntryBody;
