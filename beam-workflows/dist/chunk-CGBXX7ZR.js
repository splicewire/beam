// src/humanizeWorkflowKey.ts
function humanizeWorkflowKey(key) {
  const spaced = key.replace(/[_.-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// src/workflowActionTime.ts
function workflowActionInstants(local, timezone) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return [];
  const wall = Date.parse(`${local}:00Z`);
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 16) !== local) return [];
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  });
  const wallAt = (instant) => {
    const fields = Object.fromEntries(formatter.formatToParts(instant).map(({ type, value }) => [type, value]));
    return Date.parse(`${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}:${fields.second}Z`);
  };
  const offsets = /* @__PURE__ */ new Set();
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = wall + hours * 36e5;
    offsets.add(wallAt(sample) - sample);
  }
  return [...offsets].map((offset) => wall - offset).filter((instant) => wallAt(instant) === wall).sort((a, b) => a - b).map((instant) => new Date(instant).toISOString());
}

// src/WorkflowActionForm.tsx
import { useId, useMemo, useRef, useState } from "react";
import { Button, Input } from "@schemastud/ui";

// src/message-descriptor.ts
var notice = (key, parameters) => ({ key, parameters });
var say = (m, value) => typeof value === "string" ? value : m.t(value.key, value.parameters);

// src/rich-message.tsx
import { Fragment } from "react";
import { jsx } from "react/jsx-runtime";
function richMessage(messages, key, parts) {
  const values = Object.values(parts);
  const parameters = Object.fromEntries(Object.keys(parts).map((name, index) => [name, `\uFFFC${index}\uFFFC`]));
  const occurrences = /* @__PURE__ */ new Map();
  return messages.t(key, parameters).split(/(￼\d+￼)/u).map((part, index) => {
    const match = /^￼(\d+)￼$/u.exec(part);
    const occurrence = match ? occurrences.get(match[1]) ?? 0 : 0;
    if (match) occurrences.set(match[1], occurrence + 1);
    return /* @__PURE__ */ jsx(Fragment, { children: match ? values[Number(match[1])] : part }, match ? `slot-${match[1]}-${occurrence}` : `text-${index}`);
  });
}

// src/messages.ts
import { createMessages } from "@schemastud/messages";
import { useMessages } from "@schemastud/messages/react";
import catalog from "@splicewire/beam-workflows/messages.js";
var englishBeamWorkflowsMessages = createMessages(catalog.messages);
var useBeamWorkflowsMessages = () => useMessages(catalog.messages);

// src/WorkflowActionForm.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function WorkflowActionForm({
  projection,
  subjectLabel,
  subjectPicker,
  initialTransition = "",
  initialLocalTime = "",
  initialTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  onSchedule,
  submitLabel
}) {
  const id = useId();
  const [transition, setTransition] = useState(initialTransition);
  const [localTime, setLocalTime] = useState(initialLocalTime);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [foldInstant, setFoldInstant] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const m = useBeamWorkflowsMessages();
  const [error, setError] = useState(null);
  const names = [...new Set(projection?.transitions.map((item) => item.name) ?? [])];
  const timing = useMemo(() => {
    try {
      return { instants: workflowActionInstants(localTime, timezone), error: null };
    } catch {
      return { instants: [], error: "splicewire-beam-workflows::messages.action_invalid_timezone" };
    }
  }, [localTime, timezone]);
  const dueAt = timing.instants.length === 1 ? timing.instants[0] : timing.instants.includes(foldInstant) ? foldInstant : "";
  const timingError = timing.error ?? (localTime && timing.instants.length === 0 ? "splicewire-beam-workflows::messages.action_missing_local_time" : null);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current || !dueAt || !names.includes(transition)) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await onSchedule({ transition, dueAt, timezone });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : notice("splicewire-beam-workflows::messages.action_schedule_failed"));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsx2("form", { onSubmit: submit, className: "space-y-4", "aria-label": m.t("splicewire-beam-workflows::messages.action_form_label"), "aria-busy": pending, children: /* @__PURE__ */ jsxs("fieldset", { disabled: pending, className: "space-y-4", children: [
    subjectPicker,
    subjectLabel ? /* @__PURE__ */ jsx2("p", { className: "text-sm font-medium", children: subjectLabel }) : null,
    /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsx2("label", { htmlFor: `${id}-transition`, className: "text-sm font-medium", children: m.t("splicewire-beam-workflows::messages.action_transition") }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: `${id}-transition`,
          value: transition,
          required: true,
          className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          onChange: (event) => setTransition(event.target.value),
          children: [
            /* @__PURE__ */ jsx2("option", { value: "", children: m.t("splicewire-beam-workflows::messages.choose_transition") }),
            names.map((name) => /* @__PURE__ */ jsx2("option", { value: name, children: humanizeWorkflowKey(name) }, name))
          ]
        }
      ),
      !projection ? /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-workflows::messages.action_no_subject") }) : null,
      projection && names.length === 0 ? /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-workflows::messages.action_no_transitions") }) : null,
      /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-workflows::messages.action_checks_note") }),
      transition && names.includes(transition) && !projection?.available.includes(transition) ? /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: m.t("splicewire-beam-workflows::messages.action_unavailable_now") }) : null
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx2("label", { htmlFor: `${id}-time`, className: "text-sm font-medium", children: m.t("splicewire-beam-workflows::messages.action_date_time") }),
        /* @__PURE__ */ jsx2(
          Input,
          {
            id: `${id}-time`,
            type: "datetime-local",
            required: true,
            value: localTime,
            "aria-describedby": timingError ? `${id}-time-error` : void 0,
            "aria-invalid": Boolean(timingError),
            onChange: (event) => {
              setLocalTime(event.target.value);
              setFoldInstant("");
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx2("label", { htmlFor: `${id}-zone`, className: "text-sm font-medium", children: m.t("splicewire-beam-workflows::messages.timezone") }),
        /* @__PURE__ */ jsx2(
          Input,
          {
            id: `${id}-zone`,
            required: true,
            value: timezone,
            placeholder: "America/New_York",
            "aria-describedby": timing.error ? `${id}-time-error` : void 0,
            "aria-invalid": Boolean(timing.error),
            onChange: (event) => {
              setTimezone(event.target.value);
              setFoldInstant("");
            }
          }
        )
      ] })
    ] }),
    timingError ? /* @__PURE__ */ jsx2("p", { id: `${id}-time-error`, role: "alert", className: "text-sm text-destructive", children: m.t(timingError) }) : null,
    timing.instants.length > 1 ? /* @__PURE__ */ jsxs("fieldset", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx2("legend", { className: "text-sm font-medium", children: m.t("splicewire-beam-workflows::messages.action_ambiguous_time") }),
      timing.instants.map((instant) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx2(
          "input",
          {
            type: "radio",
            name: `${id}-fold`,
            value: instant,
            checked: foldInstant === instant,
            onChange: () => setFoldInstant(instant)
          }
        ),
        new Intl.DateTimeFormat(void 0, { timeZone: timezone, dateStyle: "medium", timeStyle: "long" }).format(new Date(instant))
      ] }, instant))
    ] }) : null,
    dueAt ? /* @__PURE__ */ jsx2("p", { className: "text-sm text-muted-foreground", children: richMessage(m, "splicewire-beam-workflows::messages.action_scheduled_instant", { instant: /* @__PURE__ */ jsx2("time", { dateTime: dueAt, children: dueAt }) }) }) : null,
    error ? /* @__PURE__ */ jsx2("p", { role: "alert", className: "text-sm text-destructive", children: say(m, error) }) : null,
    /* @__PURE__ */ jsx2(Button, { type: "submit", disabled: pending || !dueAt || !names.includes(transition), children: pending ? m.t("splicewire-beam-workflows::messages.saving") : submitLabel ?? m.t("splicewire-beam-workflows::messages.action_submit") })
  ] }) });
}

export {
  englishBeamWorkflowsMessages,
  useBeamWorkflowsMessages,
  humanizeWorkflowKey,
  richMessage,
  workflowActionInstants,
  notice,
  say,
  WorkflowActionForm
};
//# sourceMappingURL=chunk-CGBXX7ZR.js.map