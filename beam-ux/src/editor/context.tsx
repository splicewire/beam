import { createContext, useContext, type ReactNode } from "react";
import type { UxBuilderClient } from "../types";
import type { CanvasConfig, CanvasTheme } from "../canvas";
import { canvasConfig as defaults } from "./canvas-config";
import { defaultTreeFor as defaultTree } from "./defaults";
import type { JsonDoc } from "../blockdoc/json";

export interface EditorKitInputs {
  transport: UxBuilderClient;
  theme?: Partial<CanvasTheme>;
  canAuthor: boolean;
  /** Authenticated user id, required before editing; isolates persisted Local Sessions. */
  userId?: string;
  canvasConfig?: CanvasConfig;
  defaultTreeFor?: (slug: string) => JsonDoc | null;
  notify?: { success(message: string): void; error(message: string): void };
}
const noop = () => {};
const KitContext = createContext<Required<EditorKitInputs> | null>(null);
export function EditorKitProvider({
  children,
  ...inputs
}: EditorKitInputs & { children: ReactNode }) {
  const {
    userId = "",
    theme = {},
    canvasConfig = defaults,
    defaultTreeFor = defaultTree,
    notify = { success: noop, error: noop },
  } = inputs;
  return (
    <KitContext.Provider
      value={{
        ...inputs,
        userId,
        theme,
        canvasConfig,
        defaultTreeFor,
        notify,
      }}
    >
      {children}
    </KitContext.Provider>
  );
}
export function useEditorKit() {
  const kit = useContext(KitContext);
  if (!kit)
    throw new Error(
      "Mount EditorKitProvider with the host transport, theme and author admission."
    );
  return kit;
}
