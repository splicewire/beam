// src/edit-mode-store.ts
import { useSyncExternalStore } from "react";
var editModeStore = {
  current: false,
  listeners: /* @__PURE__ */ new Set(),
  listening: false
};
function subscribeEditMode(onChange) {
  editModeStore.listeners.add(onChange);
  if (!editModeStore.listening && typeof window !== "undefined") {
    editModeStore.listening = true;
    window.addEventListener("beam-ux:mode", (e) => {
      const next = e.detail?.mode === "window";
      if (next === editModeStore.current) return;
      editModeStore.current = next;
      for (const listener of editModeStore.listeners) listener();
    });
  }
  return () => {
    editModeStore.listeners.delete(onChange);
  };
}
function useEditMode() {
  return useSyncExternalStore(
    subscribeEditMode,
    () => editModeStore.current,
    () => false
  );
}
function __resetEditMode() {
  editModeStore.current = false;
  for (const listener of editModeStore.listeners) listener();
}

export {
  useEditMode,
  __resetEditMode
};
//# sourceMappingURL=chunk-X5GHTMHH.js.map