// src/interlock/AgreementStepUp.tsx
import { useEffect, useId, useRef, useSyncExternalStore } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
var BUTTON = {
  font: "inherit",
  fontSize: "0.875rem",
  fontWeight: 500,
  lineHeight: 1.25,
  padding: "0.5rem 1rem",
  borderRadius: 6,
  cursor: "pointer"
};
var PRIMARY = { ...BUTTON, border: "1px solid transparent", background: "var(--primary, #111)", color: "var(--primary-foreground, #fff)" };
var SECONDARY = { ...BUTTON, border: "1px solid var(--border, #d4d4d4)", background: "transparent", color: "inherit" };
function AgreementStepUp({ controller }) {
  const agreements = useSyncExternalStore(controller.subscribe, controller.current, controller.current);
  const titleId = useId();
  const textId = useId();
  const dialog = useRef(null);
  const returnTo = useRef(null);
  const open = agreements !== null;
  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement;
    dialog.current?.querySelector("[data-step-up-text]")?.focus();
    return () => {
      const back = returnTo.current;
      if (back instanceof HTMLElement) queueMicrotask(() => back.focus());
    };
  }, [open]);
  if (agreements === null) return null;
  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      controller.answer(false);
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = Array.from(dialog.current?.querySelectorAll('button, [tabindex="0"]') ?? []);
    if (buttons.length === 0) return;
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const heading = agreements.length === 1 ? agreements[0].title : "Before you continue";
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-beam-agreements": "step-up",
      style: { position: "fixed", inset: 0, zIndex: 1e3, display: "grid", placeItems: "center", background: "rgb(0 0 0 / 0.45)", padding: 16 },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          ref: dialog,
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": titleId,
          "aria-describedby": textId,
          onKeyDown,
          style: {
            background: "var(--background, #fff)",
            color: "var(--foreground, #111)",
            borderRadius: 8,
            width: "min(40rem, 100%)",
            maxHeight: "min(85vh, 48rem)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 20,
            boxShadow: "0 10px 30px rgb(0 0 0 / 0.25)"
          },
          children: [
            /* @__PURE__ */ jsx("h2", { id: titleId, style: { margin: 0, fontSize: "1.125rem" }, children: heading }),
            /* @__PURE__ */ jsx("p", { style: { margin: 0 }, children: agreements.length === 1 ? "To continue, please read and accept this agreement." : "To continue, please read and accept these agreements." }),
            /* @__PURE__ */ jsx(
              "div",
              {
                id: textId,
                "data-step-up-text": "",
                tabIndex: 0,
                "aria-label": "Agreement text",
                style: { overflow: "auto", border: "1px solid var(--border, #ddd)", borderRadius: 6, padding: 12, flex: 1 },
                children: agreements.map((agreement) => /* @__PURE__ */ jsxs("section", { "data-agreement": agreement.key, "data-digest": agreement.digest, children: [
                  agreements.length > 1 ? /* @__PURE__ */ jsx("h3", { style: { margin: "0 0 8px", fontSize: "1rem" }, children: agreement.title }) : null,
                  /* @__PURE__ */ jsxs("p", { style: { margin: "0 0 4px", fontSize: "0.8125rem", opacity: 0.75 }, children: [
                    "Version ",
                    agreement.label
                  ] }),
                  agreement.summary ? /* @__PURE__ */ jsxs("p", { "data-beam-agreements": "summary", style: { margin: "0 0 8px" }, children: [
                    /* @__PURE__ */ jsx("strong", { children: "What changed:" }),
                    " ",
                    agreement.summary
                  ] }) : null,
                  /* @__PURE__ */ jsx("div", { style: { whiteSpace: "pre-wrap" }, children: agreement.content })
                ] }, agreement.key))
              }
            ),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end" }, children: [
              /* @__PURE__ */ jsx("button", { type: "button", "data-answer": "decline", style: SECONDARY, onClick: () => controller.answer(false), children: "Not now" }),
              /* @__PURE__ */ jsx("button", { type: "button", "data-answer": "accept", style: PRIMARY, onClick: () => controller.answer(true), children: agreements.length === 1 ? "I agree" : "I agree to all" })
            ] })
          ]
        }
      )
    }
  );
}

export {
  PRIMARY,
  SECONDARY,
  AgreementStepUp
};
//# sourceMappingURL=chunk-6DWJYBPW.js.map