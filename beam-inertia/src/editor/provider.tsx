import { usePage } from "@inertiajs/react";
import { EditorKitProvider } from "@splicewire/beam-ux/editor";
import type { CanvasTheme } from "@splicewire/beam-ux/canvas";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { bodyClient } from "./transport";
import { canvasConfig } from "./canvas-config";
import { defaultTreeFor } from "./defaults";
import { useBrand } from "../hooks/use-brand";
export function InertiaEditorKit({ children }: { children: ReactNode }) {
  const page = usePage<{
    theme?: { canvas?: Partial<CanvasTheme> };
    auth?: { canAuthorUx?: boolean; user?: { id: string | number } };
  }>();
  // Launch ticket 05 slice 4: the editor bar names the host's app (its shared brand, from APP_NAME) with its monogram.
  const brand = useBrand();
  return (
    <EditorKitProvider
      transport={bodyClient}
      userId={page.props.auth?.user?.id == null ? undefined : String(page.props.auth.user.id)}
      theme={page.props.theme?.canvas ?? {}}
      canAuthor={page.props.auth?.canAuthorUx === true}
      canvasConfig={canvasConfig}
      defaultTreeFor={defaultTreeFor}
      notify={toast}
      brand={brand.name}
    >
      {children}
    </EditorKitProvider>
  );
}
