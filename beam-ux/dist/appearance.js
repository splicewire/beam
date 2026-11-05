// src/theme/appearance.ts
import { useSyncExternalStore } from "react";
var listeners = /* @__PURE__ */ new Set();
var currentAppearance = "system";
var prefersDark = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};
var setCookie = (name, value, days = 365) => {
  if (typeof document === "undefined") {
    return;
  }
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};
var getStoredAppearance = () => {
  if (typeof window === "undefined") {
    return "system";
  }
  return localStorage.getItem("appearance") || "system";
};
var isDarkMode = (appearance) => {
  return appearance === "dark" || appearance === "system" && prefersDark();
};
var applyTheme = (appearance) => {
  if (typeof document === "undefined") {
    return;
  }
  const isDark = isDarkMode(appearance);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
};
var subscribe = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};
var notify = () => listeners.forEach((listener) => listener());
var mediaQuery = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return window.matchMedia("(prefers-color-scheme: dark)");
};
var handleSystemThemeChange = () => {
  applyTheme(currentAppearance);
  notify();
};
function initializeTheme() {
  if (typeof window === "undefined") {
    return;
  }
  if (!localStorage.getItem("appearance")) {
    localStorage.setItem("appearance", "system");
    setCookie("appearance", "system");
  }
  currentAppearance = getStoredAppearance();
  applyTheme(currentAppearance);
  mediaQuery()?.addEventListener("change", handleSystemThemeChange);
}
function useAppearance() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => `${currentAppearance}|${isDarkMode(currentAppearance) ? "dark" : "light"}`,
    () => "system|light"
  );
  const [appearance, resolvedAppearance] = snapshot.split("|");
  const updateAppearance = (mode) => {
    currentAppearance = mode;
    localStorage.setItem("appearance", mode);
    setCookie("appearance", mode);
    applyTheme(mode);
    notify();
  };
  return { appearance, resolvedAppearance, updateAppearance };
}
export {
  initializeTheme,
  useAppearance
};
//# sourceMappingURL=appearance.js.map