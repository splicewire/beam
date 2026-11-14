// src/desk/OperatorDesk.tsx
import { useEffect, useRef, useState } from "react";
import { OperatorOverlay } from "@schemastud/mainframe/os";

// src/desk/css.ts
var OPERATOR_DESK_CSS = `
.op-desk-overlay{position:fixed;inset:0;z-index:2000;pointer-events:none;font-family:var(--op-font, system-ui, sans-serif)}
.op-desk-overlay > *{pointer-events:auto}
.op-win-inner{display:flex;flex-direction:column;height:100%;background:var(--op-surface, #f8fafc);border:1px solid rgba(15,23,42,.14);border-radius:12px;box-shadow:0 30px 90px -24px rgba(0,0,0,.5);overflow:hidden}
.op-win-bar{display:flex;align-items:center;gap:9px;height:38px;flex:none;padding:0 12px;background:var(--op-surface-raised, var(--beam-paper-raised, #0e1b18));color:var(--op-fg, var(--beam-ink, #dcede8));cursor:move;user-select:none}
.op-win-dot{width:10px;height:10px;border-radius:30%;flex:none}
.op-win-title{font-family:var(--op-font-mono, ui-monospace, monospace);font-size:11px;letter-spacing:.12em;text-transform:uppercase}
.op-win-ctrls{margin-left:auto;display:flex;align-items:center;gap:1px}
.op-win-x{background:none;border:none;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)));font-size:16px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;min-width:28px}
.op-win-x:hover{color:var(--op-fg, var(--beam-ink, #dcede8));background:rgba(255,255,255,.1)}
.op-win-x.on{color:var(--op-surface-raised, var(--beam-paper-raised, #0e1b18))}
.op-win-body{flex:1;min-height:0;overflow:auto;background:var(--op-surface, #f8fafc);color:#0f172a}
.op-taskbar{position:absolute;left:16px;bottom:16px;display:flex;align-items:center;gap:4px;padding:6px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:color-mix(in srgb, var(--op-surface-raised, var(--beam-paper-raised, #0e1b18)) 94%, transparent);backdrop-filter:blur(14px);box-shadow:0 18px 55px -14px rgba(0,0,0,.6)}
.op-taskbar button{display:flex;align-items:center;gap:7px;border:none;background:none;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)));cursor:pointer;font-family:var(--op-font-mono, ui-monospace, monospace);font-size:11px;letter-spacing:.06em;padding:8px 12px;border-radius:9px}
.op-taskbar button:hover{color:var(--op-fg, var(--beam-ink, #dcede8));background:rgba(255,255,255,.08)}
.op-taskbar button.focused{color:var(--op-fg, var(--beam-ink, #dcede8));background:rgba(255,255,255,.12)}
.op-taskbar button.minned .glyph{opacity:.55}
.op-taskbar .glyph{width:9px;height:9px;border-radius:30%;flex:none}
.op-orb{position:absolute;right:16px;bottom:16px;display:flex;align-items:center;gap:9px;padding:9px 15px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:color-mix(in srgb, var(--op-surface-raised, var(--beam-paper-raised, #0e1b18)) 94%, transparent);backdrop-filter:blur(14px);color:var(--op-fg, var(--beam-ink, #dcede8));cursor:pointer;font-family:var(--op-font-mono, ui-monospace, monospace);font-size:11px;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 18px 55px -14px rgba(0,0,0,.6)}
.op-orb:hover{border-color:var(--op-edge, var(--beam-line, #1b2e2a))}
.op-orb.is-open{border-color:var(--op-accent, var(--beam-accent, #00b3c8));background:var(--op-edge, var(--beam-line, #1b2e2a))}
.op-orb .mark{width:16px;height:16px;flex:none;color:var(--op-fg, var(--beam-ink, #dcede8))}
body[data-scroll-locked] .op-orb{visibility:hidden}
.op-scrim{position:absolute;inset:0;background:transparent}
.op-menu{position:absolute;right:16px;bottom:66px;width:240px;padding:7px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:color-mix(in srgb, var(--op-surface-raised, var(--beam-paper-raised, #0e1b18)) 97%, transparent);backdrop-filter:blur(16px);box-shadow:0 26px 70px -18px rgba(0,0,0,.65);display:flex;flex-direction:column;gap:2px}
.op-menu-brand{display:flex;align-items:center;gap:8px;padding:9px 10px 11px;margin-bottom:3px;border-bottom:1px solid rgba(255,255,255,.08);color:var(--op-fg, var(--beam-ink, #dcede8));font-family:var(--op-font-mono, ui-monospace, monospace);font-size:13px;font-weight:600;letter-spacing:.02em}
.op-menu-brand-mark{width:18px;height:18px;flex:none;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)))}
.op-menu .head{padding:8px 10px 6px;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)));font-family:var(--op-font-mono, ui-monospace, monospace);font-size:9px;letter-spacing:.18em;text-transform:uppercase}
.op-menu button,.op-menu a{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 11px;border-radius:9px;border:none;background:none;color:var(--op-fg, var(--beam-ink, #dcede8));cursor:pointer;font:inherit;font-size:13px;text-decoration:none}
.op-menu button:hover,.op-menu a:hover{background:rgba(255,255,255,.07);color:var(--op-fg, var(--beam-ink, #dcede8))}
.op-menu button:disabled{opacity:.4;cursor:default}
.op-menu button:disabled:hover{background:none;color:var(--op-fg, var(--beam-ink, #dcede8))}
.op-menu button.active{color:var(--op-fg, var(--beam-ink, #dcede8));background:var(--op-edge, var(--beam-line, #1b2e2a))}
.op-menu .glyph{width:10px;height:10px;border-radius:30%;flex:none}
.op-menu .ico{width:16px;text-align:center;flex:none;opacity:.85}
.op-menu .op-div{height:1px;background:rgba(255,255,255,.1);margin:5px 4px}
.op-menu .muted{color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)))}
`;
var OPERATOR_DESK_TASKBAR_CENTER_CSS = `
.op-taskbar{left:50%;transform:translateX(-50%)}
`;

// src/desk/OperatorDesk.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var PAGE_PREFIX = "page:";
var DEFAULT_PAGE_ACCENT = "#00b3c8";
var DEFAULT_PAGE_SIZE = { width: 380, height: 220 };
function useDeskMode() {
  const [state, setState] = useState({ editing: false, editable: false, slug: null });
  useEffect(() => {
    const onMode = (e) => {
      const d = e.detail ?? {};
      setState({ editing: d.mode === "window", editable: !!d.editable, slug: d.slug ?? null });
    };
    window.addEventListener("beam-ux:mode", onMode);
    return () => window.removeEventListener("beam-ux:mode", onMode);
  }, []);
  return state;
}
function orderTools(tools) {
  return tools.map((tool, index) => ({ tool, index })).sort((a, b) => (a.tool.order ?? a.index) - (b.tool.order ?? b.index) || a.index - b.index).map((entry) => entry.tool);
}
function StartMenu({
  tools,
  openKeys,
  inControlPanel,
  editing,
  pageEditable,
  brand,
  links,
  onEditToggle,
  onOpenTool,
  onClose
}) {
  const link = inControlPanel ? links?.frontend : links?.control;
  const hasFooter = !!link || !!links?.signOut;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "op-scrim", onClick: onClose }),
    /* @__PURE__ */ jsxs("div", { className: "op-menu", role: "menu", children: [
      brand ? /* @__PURE__ */ jsxs("div", { className: "op-menu-brand", children: [
        brand.mark,
        brand.label
      ] }) : null,
      /* @__PURE__ */ jsx("div", { className: "head", children: "Operator" }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: editing ? "active" : void 0,
          disabled: !editing && !pageEditable,
          onClick: () => {
            if (!editing && !pageEditable) {
              return;
            }
            onClose();
            onEditToggle();
          },
          children: [
            /* @__PURE__ */ jsx("span", { className: "ico", children: editing ? "\u2715" : "\u270E" }),
            editing ? "Exit editing" : "Edit this page",
            !editing && !pageEditable ? /* @__PURE__ */ jsx("span", { className: "muted", style: { marginLeft: "auto", fontSize: 11 }, children: "n/a" }) : null
          ]
        }
      ),
      tools.length > 0 && /* @__PURE__ */ jsx("div", { className: "op-div" }),
      tools.map((t) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: openKeys.includes(t.key) ? "active" : void 0,
          onClick: () => {
            onOpenTool(t);
            onClose();
          },
          children: [
            /* @__PURE__ */ jsx("span", { className: "glyph", style: { background: t.accent } }),
            t.title,
            openKeys.includes(t.key) ? /* @__PURE__ */ jsx("span", { className: "muted", style: { marginLeft: "auto", fontSize: 11 }, children: "open" }) : null
          ]
        },
        t.key
      )),
      hasFooter && /* @__PURE__ */ jsx("div", { className: "op-div" }),
      link ? /* @__PURE__ */ jsxs("a", { href: link.href, children: [
        /* @__PURE__ */ jsx("span", { className: "ico", children: inControlPanel ? "\u25F1" : "\u25A4" }),
        " ",
        link.label ?? (inControlPanel ? "Front-end" : "Control Panel")
      ] }) : null,
      links?.signOut ? /* @__PURE__ */ jsxs("button", { type: "button", onClick: links.signOut, children: [
        /* @__PURE__ */ jsx("span", { className: "ico", children: "\u23FB" }),
        " Sign out"
      ] }) : null
    ] })
  ] });
}
function OperatorDesk({
  tools,
  navGuard,
  inControlPanel = false,
  links,
  brand,
  orbLabel = "Operator",
  orbIcon,
  renderPageProperties,
  pageWindow,
  resolveWindow: hostResolveWindow,
  taskbarPlacement = "start"
}) {
  const { editing, editable: pageEditable, slug: currentSlug } = useDeskMode();
  const ordered = orderTools(tools);
  const suppressNextNav = useRef(false);
  const armSuppress = () => {
    suppressNextNav.current = true;
    window.setTimeout(() => {
      suppressNextNav.current = false;
    }, 60);
  };
  const guardApi = useRef({
    shouldSuppress: () => suppressNextNav.current,
    disarm: () => {
      suppressNextNav.current = false;
    }
  });
  const resolveWindow = (key, wm) => {
    const hosted = hostResolveWindow?.(key, wm) ?? null;
    if (hosted) {
      return hosted;
    }
    if (key.startsWith(PAGE_PREFIX) && renderPageProperties) {
      const slug = key.slice(PAGE_PREFIX.length);
      return {
        title: `Page \xB7 ${slug}`,
        accent: pageWindow?.accent ?? DEFAULT_PAGE_ACCENT,
        // `editable`/`editing` close over the CURRENT broadcast — resolveWindow is called
        // fresh on every render, so the body never reads a stale mode.
        render: () => renderPageProperties({
          slug,
          editable: pageEditable,
          editing,
          wm,
          close: () => wm.minimize(key)
        })
      };
    }
    const tool = ordered.find((t) => t.key === key);
    return tool ? { title: tool.title, accent: tool.accent, render: tool.render } : null;
  };
  const stableKeys = (wm) => [
    ...ordered.map((t) => t.key),
    ...Object.keys(wm.state.windows).filter((k) => k.startsWith(PAGE_PREFIX)).sort()
  ];
  const onEditToggle = (wm) => {
    if (editing) {
      window.dispatchEvent(new CustomEvent("beam-ux:exit"));
      return;
    }
    if (renderPageProperties && currentSlug) {
      wm.open(`${PAGE_PREFIX}${currentSlug}`, {
        geometry: pageWindow?.size ?? DEFAULT_PAGE_SIZE,
        presentation: "float"
      });
      return;
    }
    window.dispatchEvent(new CustomEvent("beam-ux:edit"));
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "style",
      {
        dangerouslySetInnerHTML: {
          __html: OPERATOR_DESK_CSS + (taskbarPlacement === "center" ? OPERATOR_DESK_TASKBAR_CENTER_CSS : "")
        }
      }
    ),
    /* @__PURE__ */ jsx(
      OperatorOverlay,
      {
        stableKeys,
        resolveWindow,
        orbLabel,
        orbIcon,
        onWindowBodyClickCapture: armSuppress,
        onWindowManager: () => navGuard?.(guardApi.current),
        renderLauncher: ({ wm, onClose }) => /* @__PURE__ */ jsx(
          StartMenu,
          {
            tools: ordered,
            openKeys: wm.state.zOrder,
            inControlPanel,
            editing,
            pageEditable,
            brand,
            links,
            onEditToggle: () => onEditToggle(wm),
            onOpenTool: (tool) => wm.open(tool.key, { geometry: tool.size, presentation: "float" }),
            onClose
          }
        )
      }
    )
  ] });
}
export {
  OPERATOR_DESK_CSS,
  OPERATOR_DESK_TASKBAR_CENTER_CSS,
  OperatorDesk
};
//# sourceMappingURL=desk.js.map