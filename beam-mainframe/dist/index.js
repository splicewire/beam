// src/host.tsx
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  createMainframeRegistry,
  createSlotRegistry,
  MainframeProvider,
  MainframeOutlet
} from "@schemastud/mainframe";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function isPuckBody(body) {
  return !!body && typeof body === "object" && Array.isArray(body.content);
}
function entryRefLabel(ref) {
  return ref?.slug ?? ref?.id ?? "\u2014";
}
var BeamUxEntryCtx = createContext(null);
function useBeamUxEntry() {
  return useContext(BeamUxEntryCtx);
}
var DEFAULT_BAR = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  display: "flex",
  alignItems: "center",
  gap: 8,
  height: 28,
  padding: "0 12px",
  fontFamily: "ui-monospace, monospace",
  fontSize: 11,
  color: "#fff",
  background: "#17120E",
  borderTop: "1px solid rgba(255,91,58,.4)"
};
var DEFAULT_BTN = {
  marginLeft: "auto",
  cursor: "pointer",
  background: "transparent",
  border: "1px solid rgba(255,91,58,.5)",
  color: "#FF5B3A",
  borderRadius: 4,
  padding: "1px 8px",
  fontSize: 11,
  fontFamily: "inherit"
};
var defaultRibbon = ({ mode, entryRef, entryBound, onEdit, onExit }) => /* @__PURE__ */ jsxs("div", { "data-beam-ux-frame": entryRefLabel(entryRef), "data-beam-ux-mode": mode, style: DEFAULT_BAR, children: [
  /* @__PURE__ */ jsx("span", { style: { color: "#FF5B3A" }, children: "beam-ux" }),
  /* @__PURE__ */ jsxs("span", { style: { opacity: 0.6 }, children: [
    mode === "window" ? "editing" : "page",
    " \xB7 ",
    entryRefLabel(entryRef)
  ] }),
  mode === "domain" ? /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("span", { style: { opacity: 0.8 }, children: [
      "entry ",
      entryBound ? "bound \u2713" : "\u2026"
    ] }),
    entryBound && /* @__PURE__ */ jsx("button", { type: "button", style: DEFAULT_BTN, onClick: onEdit, "data-beam-ux-edit": true, children: "Edit page" })
  ] }) : /* @__PURE__ */ jsx("button", { type: "button", style: DEFAULT_BTN, onClick: onExit, "data-beam-ux-exit": true, children: "Exit" })
] });
function DomainMainframe({ slots, ctx }) {
  const p = ctx.payload;
  if (!p.canAuthor) {
    return /* @__PURE__ */ jsx(Fragment, { children: slots.main(ctx.payload) });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    p.ribbon({
      mode: "domain",
      entryRef: p.entryRef,
      entryBound: p.entryBound,
      onEdit: p.onEdit,
      onExit: p.onExit
    }),
    slots.main(ctx.payload)
  ] });
}
function WindowMainframe({ slots, ctx }) {
  const p = ctx.payload;
  const reserve = p.config.ribbonReserve ?? 28;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    p.ribbon({
      mode: "window",
      entryRef: p.entryRef,
      entryBound: p.entryBound,
      onEdit: p.onEdit,
      onExit: p.onExit
    }),
    /* @__PURE__ */ jsx("div", { style: { paddingBottom: reserve }, children: slots.main(ctx.payload) })
  ] });
}
function nonEmpty(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed === "" ? null : trimmed;
}
function componentEntryRef(component, map, guess) {
  const mapped = nonEmpty(map[component]);
  if (mapped !== null) {
    return { id: null, slug: mapped, format: null };
  }
  return guess ? { id: null, slug: component.replace(/\//g, "-"), format: null } : null;
}
function overrideEntryRef() {
  if (typeof window === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const id = nonEmpty(params.get("beam_entry_id"));
  if (id !== null) {
    return { id, slug: null, format: null };
  }
  const slug = nonEmpty(params.get("beam_entry"));
  return slug === null ? null : { id: null, slug, format: null };
}
var subscribeHydrated = () => () => {
};
function useHydrated() {
  return useSyncExternalStore(subscribeHydrated, () => true, () => false);
}
function PuckReadOrPage({ payload }) {
  const hydrated = useHydrated();
  const body = payload.entryBodyRaw;
  if (payload.config.readMode === "page") {
    return /* @__PURE__ */ jsx(Fragment, { children: payload.page });
  }
  if (!hydrated || !isPuckBody(body)) {
    return /* @__PURE__ */ jsx(Fragment, { children: payload.page });
  }
  return /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(Fragment, { children: payload.page }), children: payload.entryRef === null ? payload.page : payload.config.renderRead({ body, ref: payload.entryRef }) });
}
function createMainframeHost(config) {
  const capability = config.capability ?? "author-ux";
  const componentToEntry = config.componentToEntry ?? {};
  const componentSlugFallback = config.componentSlugFallback ?? false;
  const loadEntryBodyForReaders = config.loadEntryBodyForReaders ?? false;
  const ribbon = config.ribbon ?? defaultRibbon;
  return function MainframeHost({ children }) {
    const { component, canAuthor, slug, entryId, entryFormat } = config.usePageContext();
    const propSlug = nonEmpty(slug);
    const propId = nonEmpty(entryId);
    const propFormat = nonEmpty(entryFormat);
    const entryRef = useMemo(
      () => overrideEntryRef() ?? (propId !== null || propSlug !== null ? { id: propId, slug: propSlug, format: propFormat } : null) ?? componentEntryRef(component, componentToEntry, componentSlugFallback),
      [component, propSlug, propId, propFormat]
    );
    const [entry, setEntry] = useState(null);
    const [mode, setMode] = useState("domain");
    const refKey = entryRef === null ? null : `${entryRef.id ?? ""}\0${entryRef.slug ?? ""}\0${entryRef.format ?? ""}`;
    const mayLoadBody = canAuthor || loadEntryBodyForReaders;
    useEffect(() => {
      if (entryRef === null || !mayLoadBody) {
        setEntry(null);
        return;
      }
      let live = true;
      void config.loadEntryBody(entryRef).then((e) => live && setEntry(e));
      return () => {
        live = false;
      };
    }, [refKey, mayLoadBody]);
    useEffect(() => {
      const enter = () => {
        if (canAuthor) {
          setMode("window");
        }
      };
      const exit = () => setMode("domain");
      window.addEventListener("beam-ux:edit", enter);
      window.addEventListener("beam-ux:exit", exit);
      return () => {
        window.removeEventListener("beam-ux:edit", enter);
        window.removeEventListener("beam-ux:exit", exit);
      };
    }, [canAuthor]);
    useEffect(() => {
      window.dispatchEvent(
        new CustomEvent("beam-ux:mode", {
          // `slug` is kept for the operator docks that already read it (they label their Edit
          // affordance and open page-properties with it); `entryId` is ADDITIVE beside it. A
          // CustomEvent detail is untyped, so a rename here would be invisible to every
          // consumer — the one place in this migration where additive is the safe move.
          detail: {
            mode,
            editable: canAuthor && entry !== null,
            slug: entryRef?.slug ?? null,
            entryId: entryRef?.id ?? entry?.id ?? null,
            // The entry's body language, so a dock can label (or disable) its Edit
            // affordance for a format its editor cannot open. Additive beside the two
            // above, for the same untyped-CustomEvent reason.
            format: entryRef?.format ?? null
          }
        })
      );
    }, [mode, canAuthor, entry, refKey]);
    const registries = useMemo(() => {
      const slots = createSlotRegistry();
      const mainframes = createMainframeRegistry();
      mainframes.register("domain", DomainMainframe);
      mainframes.register("window", WindowMainframe);
      slots.contribute({
        slot: "main",
        key: "domain.main",
        render: (payload2) => {
          const p = payload2;
          if (p.config.readMode === "page" && !p.authoring) {
            return /* @__PURE__ */ jsx(Fragment, { children: p.page });
          }
          if (p.authoring) {
            if (isPuckBody(p.entryBodyRaw)) {
              return /* @__PURE__ */ jsx(Fragment, { children: p.entryRef === null ? p.page : p.config.renderEditor({ ref: p.entryRef }) });
            }
            if (p.entryBound) {
              return /* @__PURE__ */ jsxs(Fragment, { children: [
                p.page,
                p.entryRef !== null && p.config.renderInspector({ ref: p.entryRef })
              ] });
            }
            return /* @__PURE__ */ jsx(Fragment, { children: p.page });
          }
          return /* @__PURE__ */ jsx(PuckReadOrPage, { payload: p });
        }
      });
      return { slots, mainframes };
    }, []);
    const can = useCallback((cap) => cap === capability ? canAuthor : true, [canAuthor]);
    const injection = useMemo(() => ({ ...registries, can }), [registries, can]);
    const entryContext = useMemo(
      () => entry === null ? null : {
        slug: entry.slug,
        id: entry.id,
        schema: entry.schema,
        body: entry.body ?? {}
      },
      [entry]
    );
    const authoring = mode === "window" && canAuthor;
    const payload = {
      page: children,
      entryRef,
      entryBound: entry !== null,
      canAuthor,
      authoring,
      entryBodyRaw: entry?.body ?? null,
      onEdit: () => setMode("window"),
      onExit: () => setMode("domain"),
      config,
      ribbon
    };
    return /* @__PURE__ */ jsx(BeamUxEntryCtx.Provider, { value: entryContext, children: /* @__PURE__ */ jsx(MainframeProvider, { injection, children: /* @__PURE__ */ jsx(MainframeOutlet, { mode, ctx: { payload } }) }) });
  };
}

// src/useBeamUxMode.ts
import { useEffect as useEffect2, useState as useState2 } from "react";
var INITIAL = {
  mode: null,
  editing: false,
  editable: false,
  slug: null,
  entryId: null
};
function useBeamUxMode() {
  const [state, setState] = useState2(INITIAL);
  useEffect2(() => {
    const onMode = (e) => {
      const d = e.detail ?? {};
      setState({
        mode: d.mode === "window" || d.mode === "domain" ? d.mode : null,
        editing: d.mode === "window",
        editable: !!d.editable,
        slug: d.slug ?? null,
        entryId: d.entryId ?? null
      });
    };
    window.addEventListener("beam-ux:mode", onMode);
    return () => window.removeEventListener("beam-ux:mode", onMode);
  }, []);
  return state;
}
function requestBeamUxEdit() {
  window.dispatchEvent(new CustomEvent("beam-ux:edit"));
}
function requestBeamUxExit() {
  window.dispatchEvent(new CustomEvent("beam-ux:exit"));
}
export {
  DomainMainframe,
  WindowMainframe,
  createMainframeHost,
  defaultRibbon,
  entryRefLabel,
  isPuckBody,
  requestBeamUxEdit,
  requestBeamUxExit,
  useBeamUxEntry,
  useBeamUxMode
};
//# sourceMappingURL=index.js.map