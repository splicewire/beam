import {
  AgreementStepUp,
  PRIMARY,
  SECONDARY
} from "./chunk-6DWJYBPW.js";

// src/pages/AgreementsRequired.tsx
import { createSessionRequest } from "@schemastud/frame/session";
import { useCallback, useEffect, useMemo, useState } from "react";

// src/interlock/stepUp.ts
function createStepUp() {
  let pending = null;
  const listeners = /* @__PURE__ */ new Set();
  const emit = () => listeners.forEach((listener) => listener());
  return {
    ask(agreements) {
      if (pending !== null) return Promise.resolve(false);
      return new Promise((resolve) => {
        pending = { agreements, resolve };
        emit();
      });
    },
    current: () => pending?.agreements ?? null,
    answer(accepted) {
      const open = pending;
      if (open === null) return;
      pending = null;
      emit();
      open.resolve(accepted);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

// src/pages/AgreementsRequired.tsx
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function sameOrigin(url, fallback, origin = window.location.origin) {
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) return url;
  try {
    const parsed = new URL(url, origin);
    if ((parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.origin === origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
  }
  return fallback;
}
function AgreementsRequired({ requirements, intended: rawIntended, back: rawBack, acceptUrl, logoutUrl = null, visit }) {
  const back = sameOrigin(rawBack, "/");
  const intended = sameOrigin(rawIntended, back);
  const stepUp = useMemo(() => createStepUp(), []);
  const request = useMemo(() => createSessionRequest(), []);
  const moved = requirements.some((r) => r.moved || r.content === null || r.label === null);
  const [state, setState] = useState(moved ? "moved" : "asking");
  const go = visit ?? ((url) => window.location.assign(url));
  const presented = useMemo(
    () => requirements.map((r) => ({
      key: r.key,
      title: r.title,
      label: r.label ?? "",
      digest: r.digest,
      content: r.content ?? "",
      summary: r.summary ?? null,
      remedy: { accept: r.acceptOperation ?? "agreements.accept" }
    })),
    [requirements]
  );
  const ask = useCallback(async () => {
    setState("asking");
    if (!await stepUp.ask(presented)) {
      setState("declined");
      return;
    }
    if (acceptUrl === null) {
      setState({ error: "This app can't record acceptance right now. Nothing was done." });
      return;
    }
    setState("saving");
    try {
      for (const agreement of presented) {
        await request("POST", acceptUrl, void 0, { agreement: agreement.key, version: agreement.label, digest: agreement.digest });
      }
    } catch (error) {
      setState({ error: error instanceof Error && error.message ? error.message : "Accepting failed. Nothing was done." });
      return;
    }
    go(intended);
  }, [stepUp, presented, acceptUrl, request, intended, go]);
  useEffect(() => {
    if (!moved) void ask();
  }, []);
  const signOut = useCallback(async () => {
    if (logoutUrl === null) return;
    try {
      await request("POST", logoutUrl);
    } catch {
    }
    go("/");
  }, [logoutUrl, request, go]);
  const titles = requirements.map((r) => r.title).join(", ");
  return /* @__PURE__ */ jsxs("main", { "data-beam-agreements": "required", style: { maxWidth: "40rem", margin: "3rem auto", padding: "0 1rem", display: "grid", gap: 12 }, children: [
    /* @__PURE__ */ jsx("h1", { style: { fontSize: "1.25rem", margin: 0 }, children: "Before you continue" }),
    state === "moved" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { style: { margin: 0 }, children: [
        titles,
        " changed while you were on your way. Nothing was done."
      ] }),
      /* @__PURE__ */ jsxs("p", { style: { margin: 0 }, children: [
        /* @__PURE__ */ jsx("a", { href: intended, children: "Try again" }),
        " \xB7 ",
        /* @__PURE__ */ jsx("a", { href: back, children: "Go back" })
      ] })
    ] }) : state === "declined" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { role: "status", style: { margin: 0 }, children: [
        "You didn't accept ",
        titles,
        ", so nothing was done."
      ] }),
      /* @__PURE__ */ jsxs("p", { style: { margin: 0, display: "flex", gap: 12, alignItems: "center" }, children: [
        /* @__PURE__ */ jsx("button", { type: "button", style: PRIMARY, onClick: () => void ask(), children: "Review again" }),
        /* @__PURE__ */ jsx("a", { href: back, children: "Go back" })
      ] })
    ] }) : typeof state === "object" ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("p", { role: "alert", style: { margin: 0 }, children: state.error }),
      /* @__PURE__ */ jsxs("p", { style: { margin: 0, display: "flex", gap: 12, alignItems: "center" }, children: [
        /* @__PURE__ */ jsx("button", { type: "button", style: SECONDARY, onClick: () => void ask(), children: "Try again" }),
        /* @__PURE__ */ jsx("a", { href: back, children: "Go back" })
      ] })
    ] }) : /* @__PURE__ */ jsx("p", { role: "status", style: { margin: 0 }, children: state === "saving" ? "Recording your agreement\u2026" : `To continue, please read and accept ${titles}.` }),
    logoutUrl !== null ? /* @__PURE__ */ jsx("p", { style: { margin: 0 }, children: /* @__PURE__ */ jsx("button", { type: "button", style: SECONDARY, onClick: () => void signOut(), children: "Sign out" }) }) : null,
    /* @__PURE__ */ jsx(AgreementStepUp, { controller: stepUp })
  ] });
}

export {
  createStepUp,
  sameOrigin,
  AgreementsRequired
};
//# sourceMappingURL=chunk-EZO5HDLM.js.map