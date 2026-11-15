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
import { jsx, jsxs } from "react/jsx-runtime";
function WorkflowActionForm({
  projection,
  subjectLabel,
  subjectPicker,
  initialTransition = "",
  initialLocalTime = "",
  initialTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  onSchedule,
  submitLabel = "Schedule transition"
}) {
  const id = useId();
  const [transition, setTransition] = useState(initialTransition);
  const [localTime, setLocalTime] = useState(initialLocalTime);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [foldInstant, setFoldInstant] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState(null);
  const names = [...new Set(projection?.transitions.map((item) => item.name) ?? [])];
  const timing = useMemo(() => {
    try {
      return { instants: workflowActionInstants(localTime, timezone), error: null };
    } catch {
      return { instants: [], error: "Enter a valid IANA timezone, such as America/New_York." };
    }
  }, [localTime, timezone]);
  const dueAt = timing.instants.length === 1 ? timing.instants[0] : timing.instants.includes(foldInstant) ? foldInstant : "";
  const timingError = timing.error ?? (localTime && timing.instants.length === 0 ? "This local time does not exist in that timezone. Choose another time." : null);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current || !dueAt || !names.includes(transition)) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await onSchedule({ transition, dueAt, timezone });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The transition could not be scheduled. Try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsx("form", { onSubmit: submit, className: "space-y-4", "aria-label": "Schedule workflow transition", "aria-busy": pending, children: /* @__PURE__ */ jsxs("fieldset", { disabled: pending, className: "space-y-4", children: [
    subjectPicker,
    subjectLabel ? /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: subjectLabel }) : null,
    /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: `${id}-transition`, className: "text-sm font-medium", children: "Transition" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: `${id}-transition`,
          value: transition,
          required: true,
          className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          onChange: (event) => setTransition(event.target.value),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Choose a transition\u2026" }),
            names.map((name) => /* @__PURE__ */ jsx("option", { value: name, children: humanizeWorkflowKey(name) }, name))
          ]
        }
      ),
      !projection ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Choose a subject with a workflow to see its transitions." }) : null,
      projection && names.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "This workflow has no transitions to schedule." }) : null,
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "The subject must pass its workflow checks when this runs. Scheduling does not approve it." }),
      transition && names.includes(transition) && !projection?.available.includes(transition) ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "This transition is not available from the subject\u2019s current state. It can run later if the required state and checks are satisfied." }) : null
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: `${id}-time`, className: "text-sm font-medium", children: "Date and time" }),
        /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsx("label", { htmlFor: `${id}-zone`, className: "text-sm font-medium", children: "Timezone" }),
        /* @__PURE__ */ jsx(
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
    timingError ? /* @__PURE__ */ jsx("p", { id: `${id}-time-error`, role: "alert", className: "text-sm text-destructive", children: timingError }) : null,
    timing.instants.length > 1 ? /* @__PURE__ */ jsxs("fieldset", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("legend", { className: "text-sm font-medium", children: "This time occurs twice. Choose which occurrence." }),
      timing.instants.map((instant) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsx(
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
    dueAt ? /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
      "Scheduled instant: ",
      /* @__PURE__ */ jsx("time", { dateTime: dueAt, children: dueAt })
    ] }) : null,
    error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "text-sm text-destructive", children: error }) : null,
    /* @__PURE__ */ jsx(Button, { type: "submit", disabled: pending || !dueAt || !names.includes(transition), children: pending ? "Saving\u2026" : submitLabel })
  ] }) });
}

export {
  humanizeWorkflowKey,
  workflowActionInstants,
  WorkflowActionForm
};
//# sourceMappingURL=chunk-FPAP5OSH.js.map