import { useMemo, useRef } from "react";
import type { CanvasConfig } from "../canvas/context";
import type { EntryComponentCapabilitiesOutputData } from "@splicewire/beam-resources/types/beam-ux";
import { useEditorKit } from "./context";
import { useComponentSession } from "./ComponentSessionHost";

/** Admission reads memoize within this addressed actor session; opening revalidates through the host. */
export function useComponentAuthoring(
  id: string | null,
  enabled: boolean,
  refresh: () => Promise<void>
): CanvasConfig["componentAuthoring"] {
  const kit = useEditorKit();
  const open = useComponentSession();
  const latest = useRef({ kit, refresh, open });
  latest.current = { kit, refresh, open };
  const available = enabled && !!id && kit.canAuthor;
  const check = !!kit.transport.componentCapabilities,
    create = !!kit.transport.createComponent,
    duplicate = !!kit.transport.duplicateComponent;
  return useMemo(() => {
    if (!available) return undefined;
    const cache = new Map<
      string,
      Promise<EntryComponentCapabilitiesOutputData>
    >();
    return {
      entryId: id!,
      refresh: async () => {
        cache.clear();
        await latest.current.refresh();
      },
      open: (
        ...args: Parameters<
          NonNullable<NonNullable<CanvasConfig["componentAuthoring"]>["open"]>
        >
      ) => latest.current.open?.(...args),
      client: {
        componentCapabilities: check
          ? (entry: string) => {
              let promise = cache.get(entry);
              if (!promise) {
                promise =
                  latest.current.kit.transport.componentCapabilities!(entry);
                cache.set(entry, promise);
              }
              return promise;
            }
          : undefined,
        createComponent: create
          ? (context, input) =>
              latest.current.kit.transport.createComponent!(context, input)
          : undefined,
        duplicateComponent: duplicate
          ? (entry) => latest.current.kit.transport.duplicateComponent!(entry)
          : undefined,
      },
    };
  }, [id, kit.userId, available, check, create, duplicate]);
}
