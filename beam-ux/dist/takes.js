import {
  englishBeamUxMessages,
  useBeamUxMessages
} from "./chunk-B33ESE55.js";

// src/takes/TakesStrip.tsx
import { Button } from "@schemastud/ui";
import { jsx, jsxs } from "react/jsx-runtime";
function relativeWhen(iso, now = Date.now(), m = englishBeamUxMessages) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.round((now - then) / 6e4);
  if (minutes < 1) return m.t("splicewire-beam-ux::messages.takes_just_now");
  if (minutes < 60) return m.t("splicewire-beam-ux::messages.takes_minutes_ago", { minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return m.t("splicewire-beam-ux::messages.takes_hours_ago", { hours });
  return m.date(new Date(iso), { month: "short", day: "numeric" });
}
function TakesStrip({ takes, labels, pending = false, error = null, busy = false, actionError = null, onRevert, onKeep, className }) {
  const m = useBeamUxMessages();
  return /* @__PURE__ */ jsxs("section", { "aria-label": labels.region, "data-takes-strip": "", className, children: [
    /* @__PURE__ */ jsxs("div", { "data-takes-strip-header": "", style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.75rem" }, children: [
      /* @__PURE__ */ jsx("h4", { children: labels.heading ?? m.t("splicewire-beam-ux::messages.takes_heading") }),
      labels.note ? /* @__PURE__ */ jsx("span", { "data-takes-strip-note": "", children: labels.note }) : null
    ] }),
    pending ? /* @__PURE__ */ jsx("p", { role: "status", children: labels.loading ?? m.t("splicewire-beam-ux::messages.takes_loading") }) : null,
    error ? /* @__PURE__ */ jsx("p", { role: "alert", children: error }) : null,
    !pending && !error && takes?.length === 0 ? /* @__PURE__ */ jsx("p", { "data-takes-strip-empty": "", children: labels.empty }) : null,
    !error && takes && takes.length > 0 ? /* @__PURE__ */ jsx("ol", { "data-takes-strip-list": "", children: takes.map((take) => /* @__PURE__ */ jsxs("li", { "data-take-kind": take.kind, children: [
      /* @__PURE__ */ jsxs("div", { style: { minWidth: 0, flex: 1 }, children: [
        /* @__PURE__ */ jsxs("p", { "data-take-title": "", children: [
          take.title,
          take.at ? /* @__PURE__ */ jsxs("span", { "data-take-when": "", children: [
            " \xB7 ",
            relativeWhen(take.at, Date.now(), m)
          ] }) : null
        ] }),
        take.excerpt ? /* @__PURE__ */ jsx("p", { "data-take-excerpt": "", children: take.excerpt }) : null,
        take.audition ? /* @__PURE__ */ jsx(Audition, { ...take.audition, title: take.title }) : null,
        take.fingerprint && take.fingerprint.length > 0 ? /* @__PURE__ */ jsx("ul", { "aria-label": m.t("splicewire-beam-ux::messages.takes_fingerprint"), "data-take-fingerprint": "", children: take.fingerprint.map((entry) => /* @__PURE__ */ jsx("li", { children: m.t("splicewire-beam-ux::messages.takes_fingerprint_entry", { label: entry.label, value: entry.value }) }, entry.label)) }) : /* @__PURE__ */ jsx("p", { "data-take-no-fingerprint": "", children: labels.noFingerprint ?? m.t("splicewire-beam-ux::messages.takes_no_fingerprint") })
      ] }),
      take.canRevert && onRevert ? /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", disabled: busy, onClick: () => onRevert(take), children: labels.revert ?? m.t("splicewire-beam-ux::messages.takes_revert") }) : null,
      take.canKeep && onKeep ? /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", disabled: busy, onClick: () => onKeep(take), children: labels.keep ?? m.t("splicewire-beam-ux::messages.takes_keep") }) : null
    ] }, take.key)) }) : null,
    actionError ? /* @__PURE__ */ jsx("p", { role: "alert", children: actionError }) : null
  ] });
}
function Audition({ url, medium, title }) {
  const m = useBeamUxMessages();
  const play = m.t("splicewire-beam-ux::messages.takes_play", { title });
  if (medium === "audio") return /* @__PURE__ */ jsx("audio", { controls: true, preload: "none", src: url, "aria-label": play });
  if (medium === "video") return /* @__PURE__ */ jsx("video", { controls: true, preload: "none", src: url, "aria-label": play });
  return /* @__PURE__ */ jsx("img", { src: url, alt: title });
}
export {
  TakesStrip,
  relativeWhen
};
//# sourceMappingURL=takes.js.map