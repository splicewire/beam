import { PageEditor as KitComponent } from "@splicewire/beam-ux/editor";
import type { ComponentProps } from "react";
import { InertiaEditorKit } from "./provider";
export { asDoc } from "@splicewire/beam-ux/editor";
export function PageEditor(props: ComponentProps<typeof KitComponent>) {
  return (
    <InertiaEditorKit>
      <KitComponent {...props} />
    </InertiaEditorKit>
  );
}
export default PageEditor;
