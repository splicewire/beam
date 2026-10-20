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
        /* @__PURE__ */ jsx("div", { style: { color: "#6366f1", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }, children: "Realm auto-surfaced" }),
        /* @__PURE__ */ jsxs("p", { style: { maxWidth: "46ch", margin: 0 }, children: [
          "The ",
          /* @__PURE__ */ jsx("b", { children: entry.title }),
          " realm (",
          /* @__PURE__ */ jsx("code", { children: entry.key }),
          ") is registered but no surface component is bound to it yet. Bind one via this desktop's ",
          /* @__PURE__ */ jsx("code", { children: "surfaceMap" }),
          " ",
          "prop \u2014 until then it opens this placeholder."
        ] })
      ]
    }
  );
}
function defaultGenericBinding(entry) {
  return {
    label: entry.title,
    route: entry.routeBase || "/",
    subtitle: "Realm \xB7 unbound surface",
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
      const Link = this.props.linkComponent ?? (({ href, ...rest }) => /* @__PURE__ */ jsx("a", { href, ...rest }));
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
            /* @__PURE__ */ jsx("div", { style: { color: "#dc2626", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }, children: "Surface needs its page props" }),
            /* @__PURE__ */ jsxs("p", { style: { maxWidth: "46ch" }, children: [
              "The real ",
              /* @__PURE__ */ jsx("b", { children: this.props.title }),
              " component crashed without its page-specific Inertia props (the desktop threads only shared props). Open the live route to see it in full:"
            ] }),
            /* @__PURE__ */ jsxs(Link, { href: this.props.route, style: { color: "#6366f1" }, children: [
              "open ",
              this.props.route,
              " \u2197"
            ] }),
            /* @__PURE__ */ jsx("pre", { style: { marginTop: 14, whiteSpace: "pre-wrap", color: "#b91c1c" }, children: String(this.state.error.message) })
          ]
        }
      );
    }
    return this.props.children;
  }
};
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