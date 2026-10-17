import { usePage } from "@inertiajs/react";
import { EditorKitProvider } from "@splicewire/beam-ux/editor";
import type { CanvasTheme } from "@splicewire/beam-ux/canvas";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { bodyClient } from "./transport";
import { canvasConfig } from "./canvas-config";
import { defaultTreeFor } from "./defaults";
export function InertiaEditorKit({ children }: { children: ReactNode }) {
  const page = usePage<{
    theme?: { canvas?: Partial<CanvasTheme> };
    auth?: { canAuthorUx?: boolean; user?: { id: string | number } };
  }>();
  return (
    <EditorKitProvider
      transport={bodyClient}
      userId={page.props.auth?.user?.id == null ? undefined : String(page.props.auth.user.id)}
      theme={page.props.theme?.canvas ?? {}}
      canAuthor={page.props.auth?.canAuthorUx === true}
      canvasConfig={canvasConfig}
      defaultTreeFor={defaultTreeFor}
      notify={toast}
    >
      {children}
    </EditorKitProvider>
  );
}
