import {
  PRIMARY,
  SECONDARY
} from "./chunk-6DWJYBPW.js";
import {
  META_STYLE,
  PAGE_STYLE,
  TEXT_STYLE
} from "./chunk-NRVEU3PX.js";

// src/pages/Consent.tsx
import { createSessionRequest } from "@schemastud/frame/session";
import { useMemo, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var SAID = {
  requested: "Waiting for your answer.",
  granted: "You gave your consent. You can withdraw it at any time.",
  declined: "You declined. Nothing was given.",
  withdrawn: "You withdrew your consent."
};
function Consent({ title, label, content, summary, askedBy, about, status, actions, request: injected, reload }) {
  const request = useMemo(() => injected ?? createSessionRequest(), [injected]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const done = reload ?? (() => window.location.reload());
  const act = async (action) => {
    const url = actions[action];
    if (!url) return;
    setBusy(action);
    setError(null);
    try {
      await request("POST", url);
      done();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "That did not work. Nothing was recorded.");
    } finally {
      setBusy(null);
    }
  };
  return /* @__PURE__ */ jsxs("main", { "data-beam-agreements": "consent", style: PAGE_STYLE, children: [
    /* @__PURE__ */ jsxs("header", { style: { display: "grid", gap: 4 }, children: [
      /* @__PURE__ */ jsx("h1", { style: { fontSize: "1.5rem", margin: 0 }, children: title }),
      /* @__PURE__ */ jsxs("p", { style: META_STYLE, children: [
        askedBy,
        " asks for your consent",
        about ? /* @__PURE__ */ jsxs(Fragment, { children: [
          " about ",
          about
        ] }) : null,
        ".",
        label ? /* @__PURE__ */ jsxs(Fragment, { children: [
          " Version ",
          label,
          "."
        ] }) : null
      ] })
    ] }),
    summary ? /* @__PURE__ */ jsxs("p", { "data-beam-agreements": "summary", style: { margin: 0 }, children: [
      /* @__PURE__ */ jsx("strong", { children: "What changed:" }),
      " ",
      summary
    ] }) : null,
    content ? /* @__PURE__ */ jsx("article", { style: TEXT_STYLE, children: content }) : null,
    /* @__PURE__ */ jsx("p", { role: "status", "data-beam-agreements": "consent-status", style: { margin: 0 }, children: SAID[status] }),
    error !== null ? /* @__PURE__ */ jsx("p", { role: "alert", style: { margin: 0 }, children: error }) : null,
    /* @__PURE__ */ jsxs("p", { style: { margin: 0, display: "flex", gap: 12, flexWrap: "wrap" }, children: [
      actions.grant ? /* @__PURE__ */ jsx("button", { type: "button", style: PRIMARY, disabled: busy !== null, onClick: () => void act("grant"), children: busy === "grant" ? "Recording\u2026" : "I consent" }) : null,
      actions.decline ? /* @__PURE__ */ jsx("button", { type: "button", style: SECONDARY, disabled: busy !== null, onClick: () => void act("decline"), children: busy === "decline" ? "Recording\u2026" : "Decline" }) : null,
      actions.withdraw ? /* @__PURE__ */ jsx("button", { type: "button", style: SECONDARY, disabled: busy !== null, onClick: () => void act("withdraw"), children: busy === "withdraw" ? "Recording\u2026" : "Withdraw my consent" }) : null
    ] })
  ] });
}

export {
  Consent
};
//# sourceMappingURL=chunk-LIGECN7D.js.map