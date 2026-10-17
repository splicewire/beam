import { VisualEditorMount as KitComponent } from "@splicewire/beam-ux/editor";
import type { ComponentProps } from "react";
import { InertiaEditorKit } from "./provider";
export function VisualEditorMount(props: ComponentProps<typeof KitComponent>) {
  return (
    <InertiaEditorKit>
      <KitComponent {...props} />
    </InertiaEditorKit>
  );
}
export default VisualEditorMount;
