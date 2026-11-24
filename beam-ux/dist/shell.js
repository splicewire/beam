import {
  richMessage
} from "./chunk-5APTQIDU.js";
import {
  englishBeamUxMessages,
  useBeamUxMessages
} from "./chunk-B33ESE55.js";

// src/shell/realm.ts
import {
  buildDesktopChrome,
  Dock,
  Launcher,
  Clock,
  UpsellPopover,
  WorkspacePersistence,
  OperatorOverlay,
  useWindowManager
} from "@schemastud/mainframe/os";
function buildAppsFromManifest(manifest, { surfaceMap, exclude, genericBinding, surfaceInjection }) {
  return manifest.filter((entry) => !exclude?.has(entry.key)).map((entry) => {
    const bound = surfaceMap[entry.key];
    const binding = bound ?? genericBinding(entry);
    const title = entry.title || binding.label;
    const realm = entry.key.toUpperCase();
    return {
      key: entry.key,
      title,
      realm,
      route: binding.route,
      subtitle: binding.subtitle,
      accent: binding.accent,
      locked: entry.locked,
      upsell: entry.upsell ?? null,
      mode: "surface",
      geometry: binding.geometry,
      injection: surfaceInjection(title, binding.route, binding.render)
    };
  });
}

// src/shell/default-desktop.tsx
import { createMainframeRegistry, createSlotRegistry } from "@schemastud/mainframe";
import "@schemastud/mainframe/os/shell.css";
import { Component } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function DefaultGenericSurface({ entry }) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        padding: 28,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: 12,
        lineHeight: 1.6,
        color: "#6b7280",
        background: "#f9fafb",
        height: "100%"
      },
      children: [
        /* @__PURE__ */ jsx("div", { style: { color: "#6366f1", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }, children: m.t("splicewire-beam-ux::messages.shell_realm_auto_surfaced") }),
        /* @__PURE__ */ jsx("p", { style: { maxWidth: "46ch", margin: 0 }, children: richMessage(m, "splicewire-beam-ux::messages.shell_unbound_realm", {
          title: /* @__PURE__ */ jsx("b", { children: entry.title }),
          key: /* @__PURE__ */ jsx("code", { children: entry.key }),
          binding: /* @__PURE__ */ jsx("code", { children: "surfaceMap" })
        }) })
      ]
    }
  );
}
function defaultGenericBinding(entry) {
  return {
    label: entry.title,
    route: entry.routeBase || "/",
    subtitle: englishBeamUxMessages.t("splicewire-beam-ux::messages.shell_unbound_subtitle"),
    accent: "#6b7280",
    geometry: { x: 240, y: 130, width: 640, height: 480 },
    render: () => /* @__PURE__ */ jsx(DefaultGenericSurface, { entry })
  };
}
var SurfaceBoundary = class extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error(`[beam-ux/shell] surface "${this.props.title}" threw`, error, info);
  }
  render() {
    if (this.state.error) {
      return /* @__PURE__ */ jsx(SurfaceCrashNotice, { title: this.props.title, route: this.props.route, error: this.state.error, linkComponent: this.props.linkComponent });
    }
    return this.props.children;
  }
};
function SurfaceCrashNotice({ title, route, error, linkComponent }) {
  const m = useBeamUxMessages();
  const Link = linkComponent ?? (({ href, ...rest }) => /* @__PURE__ */ jsx("a", { href, ...rest }));
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        padding: 28,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontSize: 12,
        lineHeight: 1.6,
        color: "#6b7280",
        background: "#f9fafb",
        height: "100%"
      },
      children: [
        /* @__PURE__ */ jsx("div", { style: { color: "#dc2626", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }, children: m.t("splicewire-beam-ux::messages.shell_surface_needs_props") }),
        /* @__PURE__ */ jsx("p", { style: { maxWidth: "46ch" }, children: richMessage(m, "splicewire-beam-ux::messages.shell_surface_crashed", { title: /* @__PURE__ */ jsx("b", { children: title }) }) }),
        /* @__PURE__ */ jsx(Link, { href: route, style: { color: "#6366f1" }, children: m.t("splicewire-beam-ux::messages.shell_open_route", { route }) }),
        /* @__PURE__ */ jsx("pre", { style: { marginTop: 14, whiteSpace: "pre-wrap", color: "#b91c1c" }, children: String(error.message) })
      ]
    }
  );
}
var surfaceMainframe = ({ slots }) => /* @__PURE__ */ jsx("div", { style: { height: "100%", minHeight: 0, display: "flex", flexDirection: "column" }, children: slots.main() });
function defaultSurfaceInjection(title, route, render, linkComponent) {
  const slots = createSlotRegistry();
  const mainframes = createMainframeRegistry();
  mainframes.register("surface", surfaceMainframe);
  slots.contribute({
    slot: "main",
    key: `surface:${title}`,
    render: () => /* @__PURE__ */ jsx(SurfaceBoundary, { title, route, linkComponent, children: render() })
  });
  return { slots, mainframes };
}
export {
  Clock,
  Dock,
  Launcher,
  OperatorOverlay,
  UpsellPopover,
  WorkspacePersistence,
  buildAppsFromManifest,
  buildDesktopChrome,
  defaultGenericBinding,
  defaultSurfaceInjection,
  useWindowManager
};
//# sourceMappingURL=shell.js.map