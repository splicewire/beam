import { useSyncExternalStore } from "react";

/**
 * The CURRENT authoring mode, remembered across mounts.
 *
 * `beam-ux:mode` is a one-shot broadcast: a listener that subscribes after it fired never learns the
 * mode. That was harmless while every consumer was mounted for the life of the page, and stopped being
 * harmless the moment a page FORKED on the mode — `site/home` renders the compiled artifact for a
 * reader and the editor for an author, so entering window mode is precisely what mounts the editor,
 * and the editor then subscribed one tick too late and reported read mode forever. Measured on
 * beam.test 2026-09-11: the dock's "Edit content" dispatched `{mode:'window'}`, the page swapped to the
 * editor, and the editor rendered the read tree.
 *
 * So the mode is state, not an event, and the event is how it CHANGES. A module-level store is the
 * right shape for it: there is exactly one authoring mode per document, the host owns it, and every
 * consumer must agree with every other one.
 */
const editModeStore = {
  current: false,
  listeners: new Set<() => void>(),
  listening: false,
};

function subscribeEditMode(onChange: () => void): () => void {
  editModeStore.listeners.add(onChange);

  if (!editModeStore.listening && typeof window !== "undefined") {
    editModeStore.listening = true;
    window.addEventListener("beam-ux:mode", (e: Event) => {
      const next =
        (e as CustomEvent<{ mode?: string }>).detail?.mode === "window";

      if (next === editModeStore.current) return;

      editModeStore.current = next;
      for (const listener of editModeStore.listeners) listener();
    });
  }

  return () => {
    editModeStore.listeners.delete(onChange);
  };
}

/**
 * Track window (edit) mode off the host MainframeHost's `beam-ux:mode` broadcast.
 *
 * Reads the CURRENT mode, not just subsequent changes — see {@link editModeStore}. `false` on the
 * server, where there is no host and no broadcast.
 */
export function useEditMode(): boolean {
  return useSyncExternalStore(
    subscribeEditMode,
    () => editModeStore.current,
    () => false,
  );
}

/** Test seam: forget the remembered mode. Nothing in a running app resets it; a suite must. */
export function __resetEditMode(): void {
  editModeStore.current = false;
  for (const listener of editModeStore.listeners) listener();
}
