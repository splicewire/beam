// src/CompositionCalendar.tsx
import { BigCalendarProvider, BigCalendarSurface } from "@schemastud/big-calendar";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";

// src/codec.ts
var PREFIX = "v1";
function encodeRef(parts) {
  return [PREFIX, parts.compositionId, parts.cellId ?? "", parts.seriesRef ?? "", parts.recurrenceId ?? ""].join("|");
}
function decodeRef(ref) {
  const [, compositionId = "", cellId = "", seriesRef = "", recurrenceId = ""] = ref.split("|");
  return {
    compositionId,
    cellId: cellId === "" ? null : cellId,
    seriesRef: seriesRef === "" ? null : seriesRef,
    recurrenceId: recurrenceId === "" ? null : recurrenceId
  };
}
function isResidentRef(ref) {
  return decodeRef(ref).cellId !== null;
}

// src/hue.ts
var PALETTE = ["sky", "violet", "amber", "emerald", "rose", "cyan", "indigo", "pink", "blue", "slate"];
function paletteFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = hash * 31 + id.charCodeAt(i) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
var KIND_HUE = {
  "composition-ref": "sky",
  series: "violet",
  "idea-ref": "amber",
  decommission: "rose",
  "disclosure-ref": "emerald"
};
var kindHue = (dto) => dto.kind ? KIND_HUE[dto.kind] ?? paletteFor(dto.kind) : "slate";
var provenanceHue = (_dto, owningCalendarId) => paletteFor(owningCalendarId);

// src/mapEvent.ts
function readMeta(event) {
  return event.meta;
}
function toFoundationEvent(dto, owningCalendarId, hue) {
  const start = dto.anchor ? /* @__PURE__ */ new Date(`${dto.anchor}T00:00:00`) : /* @__PURE__ */ new Date(NaN);
  const meta = {
    status: dto.status,
    kind: dto.kind,
    seriesRef: dto.seriesRef,
    recurrenceId: dto.recurrenceId,
    referencedCompositionId: dto.compositionId
  };
  return {
    id: dto.cellId ?? `${dto.seriesRef ?? ""}|${dto.recurrenceId ?? ""}|${dto.anchor ?? ""}`,
    title: dto.title,
    start,
    end: start,
    allDay: true,
    sourceId: owningCalendarId,
    laneId: dto.channel,
    colorToken: hue(dto, owningCalendarId),
    resident: !dto.virtual,
    ref: encodeRef({
      compositionId: owningCalendarId,
      cellId: dto.cellId,
      seriesRef: dto.seriesRef,
      recurrenceId: dto.recurrenceId
    }),
    meta
  };
}

// src/client.ts
function createSingleClient(transport, compositionId, hue = kindHue) {
  return {
    listEvents: async (range) => (await transport.listEvents(compositionId, range)).map((d) => toFoundationEvent(d, compositionId, hue)),
    reAnchor: (ref, newDate) => transport.reAnchor(decodeRef(ref).compositionId, decodeRef(ref), newDate),
    createEvent: async (input) => toFoundationEvent(await transport.createRelease(compositionId, input), compositionId, hue),
    editCell: (ref, patch) => transport.editCell(decodeRef(ref).compositionId, decodeRef(ref), patch),
    materialize: async (ref) => {
      const target = decodeRef(ref);
      return toFoundationEvent(await transport.materialize(target.compositionId, target), target.compositionId, hue);
    },
    override: async (ref, action) => {
      const target = decodeRef(ref);
      return toFoundationEvent(await transport.override(target.compositionId, target, action), target.compositionId, hue);
    }
  };
}
function createAggregateClient(transport, hue = provenanceHue) {
  return {
    listEvents: async (range) => {
      const calendars = await transport.listCalendars();
      const perCalendar = await Promise.all(
        calendars.map(
          async (calendar) => (await transport.listEvents(calendar.id, range)).map((d) => toFoundationEvent(d, calendar.id, hue))
        )
      );
      return perCalendar.flat();
    },
    reAnchor: (ref, newDate) => {
      const target = decodeRef(ref);
      return transport.reAnchor(target.compositionId, target, newDate);
    },
    // Aggregate create is ambiguous (which calendar?) — the host's edit panel picks the
    // calendar in create mode and calls transport.createRelease directly. The foundation's
    // empty-cell click opens that panel; it never calls this path.
    createEvent: () => Promise.reject(new Error("Aggregate create must target a calendar \u2014 use the edit panel (create mode).")),
    editCell: (ref, patch) => {
      const target = decodeRef(ref);
      return transport.editCell(target.compositionId, target, patch);
    },
    materialize: async (ref) => {
      const target = decodeRef(ref);
      return toFoundationEvent(await transport.materialize(target.compositionId, target), target.compositionId, hue);
    },
    override: async (ref, action) => {
      const target = decodeRef(ref);
      return toFoundationEvent(await transport.override(target.compositionId, target, action), target.compositionId, hue);
    }
  };
}

// src/chrome.tsx
import { Repeat } from "lucide-react";

// src/messages.ts
import { createMessages } from "@schemastud/messages";
import { useMessages } from "@schemastud/messages/react";

// messages.default.json
var messages_default_default = {
  version: 1,
  package: "@splicewire/beam-calendar",
  sourceLocale: "en",
  namespace: "splicewire-beam-calendar",
  sharesWith: null,
  messages: {
    "splicewire-beam-calendar::messages.chrome_calendar_filters": "Calendar filters",
    "splicewire-beam-calendar::messages.chrome_calendars": "Calendars",
    "splicewire-beam-calendar::messages.chrome_series_occurrence": "series occurrence",
    "splicewire-beam-calendar::messages.chrome_status": "Status",
    "splicewire-beam-calendar::messages.form_after": "After",
    "splicewire-beam-calendar::messages.form_badge_release": "One-off release",
    "splicewire-beam-calendar::messages.form_badge_series": "Recurring series",
    "splicewire-beam-calendar::messages.form_channel": "Channel",
    "splicewire-beam-calendar::messages.form_channel_hint": "Which delivery lane this goes out on.",
    "splicewire-beam-calendar::messages.form_content": "Content",
    "splicewire-beam-calendar::messages.form_content_hint_release": "The published composition this release points to.",
    "splicewire-beam-calendar::messages.form_content_hint_series": "The fixed composition each occurrence re-surfaces.",
    "splicewire-beam-calendar::messages.form_date": "Date",
    "splicewire-beam-calendar::messages.form_each_occurrence": "Each occurrence",
    "splicewire-beam-calendar::messages.form_end_date": "End date",
    "splicewire-beam-calendar::messages.form_ends": "Ends",
    "splicewire-beam-calendar::messages.form_ends_after": "After\u2026",
    "splicewire-beam-calendar::messages.form_ends_never": "Never",
    "splicewire-beam-calendar::messages.form_ends_on_date": "On date",
    "splicewire-beam-calendar::messages.form_error_content": "Choose the content to publish.",
    "splicewire-beam-calendar::messages.form_error_date": "Pick a date.",
    "splicewire-beam-calendar::messages.form_error_produces": "Choose the content to re-surface.",
    "splicewire-beam-calendar::messages.form_error_until": "Pick an end date.",
    "splicewire-beam-calendar::messages.form_every": "Every",
    "splicewire-beam-calendar::messages.form_freq_daily": "Daily",
    "splicewire-beam-calendar::messages.form_freq_monthly": "Monthly",
    "splicewire-beam-calendar::messages.form_freq_weekly": "Weekly",
    "splicewire-beam-calendar::messages.form_freq_yearly": "Yearly",
    "splicewire-beam-calendar::messages.form_instructions": "Instructions",
    "splicewire-beam-calendar::messages.form_instructions_hint": "Optional \u2014 what each generated occurrence should produce.",
    "splicewire-beam-calendar::messages.form_instructions_placeholder": "e.g. Draft the weekly product digest",
    "splicewire-beam-calendar::messages.form_interval": "Interval",
    "splicewire-beam-calendar::messages.form_kind_one_off": "One-off",
    "splicewire-beam-calendar::messages.form_kind_recurring": "Recurring",
    "splicewire-beam-calendar::messages.form_no_content_picker": "No content picker wired \u2014 inject `:prop`.",
    "splicewire-beam-calendar::messages.form_occurrence_count": "Occurrence count",
    "splicewire-beam-calendar::messages.form_occurrences": "occurrences",
    "splicewire-beam-calendar::messages.form_release_scheduled": "Release scheduled.",
    "splicewire-beam-calendar::messages.form_repeats": "Repeats",
    "splicewire-beam-calendar::messages.form_save": "Save",
    "splicewire-beam-calendar::messages.form_save_failed": "Could not save this item.",
    "splicewire-beam-calendar::messages.form_saved": "Saved.",
    "splicewire-beam-calendar::messages.form_schedule_release": "Schedule release",
    "splicewire-beam-calendar::messages.form_schedule_series": "Schedule series",
    "splicewire-beam-calendar::messages.form_series_scheduled": "Series scheduled.",
    "splicewire-beam-calendar::messages.form_spawn_generate": "Generate new",
    "splicewire-beam-calendar::messages.form_spawn_reference": "Re-surface existing",
    "splicewire-beam-calendar::messages.form_starts_on": "Starts on",
    "splicewire-beam-calendar::messages.form_unit_days": "days",
    "splicewire-beam-calendar::messages.form_unit_months": "months",
    "splicewire-beam-calendar::messages.form_unit_weeks": "weeks",
    "splicewire-beam-calendar::messages.form_unit_years": "years",
    "splicewire-beam-calendar::messages.status_approved": "Approved",
    "splicewire-beam-calendar::messages.status_generated": "Generated",
    "splicewire-beam-calendar::messages.status_needs_review": "Needs review",
    "splicewire-beam-calendar::messages.status_stale": "Stale",
    "splicewire-beam-calendar::messages.status_upcoming": "Upcoming"
  }
};

// src/messages.ts
var englishBeamCalendarMessages = createMessages(messages_default_default.messages);
var useBeamCalendarMessages = () => useMessages(messages_default_default.messages);

// src/chrome.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var STATUS_TONE = {
  approved: "bg-emerald-500",
  generated: "bg-sky-500",
  needs_review: "bg-amber-500",
  stale: "bg-slate-400",
  upcoming: "border border-current bg-transparent"
};
var STATUS_LABEL = {
  approved: "splicewire-beam-calendar::messages.status_approved",
  generated: "splicewire-beam-calendar::messages.status_generated",
  needs_review: "splicewire-beam-calendar::messages.status_needs_review",
  stale: "splicewire-beam-calendar::messages.status_stale",
  upcoming: "splicewire-beam-calendar::messages.status_upcoming"
};
function statusLabel(status, m = englishBeamCalendarMessages) {
  if (Object.hasOwn(STATUS_LABEL, status)) return m.t(STATUS_LABEL[status]);
  const words = status.split(/[\s_\-.]+/).filter(Boolean).map((w) => w.toLowerCase());
  if (words.length > 1 && words[words.length - 1] === "id") words.pop();
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
function EventBadge({ event }) {
  const m = useBeamCalendarMessages();
  const meta = readMeta(event);
  const isSeries = Boolean(meta.seriesRef);
  return /* @__PURE__ */ jsxs("span", { className: "flex w-full min-w-0 items-center gap-1", title: meta.kind ?? void 0, children: [
    /* @__PURE__ */ jsx(
      "span",
      {
        className: `rbc-event-glyph inline-block size-1.5 shrink-0 rounded-full ${STATUS_TONE[meta.status] ?? "bg-slate-400"}`,
        "data-status": meta.status,
        role: "img",
        "aria-label": statusLabel(meta.status, m),
        title: statusLabel(meta.status, m)
      }
    ),
    isSeries ? /* @__PURE__ */ jsx(Repeat, { className: "rbc-event-glyph size-3 shrink-0 opacity-70", "aria-label": m.t("splicewire-beam-calendar::messages.chrome_series_occurrence") }) : null,
    /* @__PURE__ */ jsx("span", { className: "rbc-event-title min-w-0 truncate", children: event.title })
  ] });
}
function LaneHeader({ lane }) {
  return /* @__PURE__ */ jsx("span", { className: "inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground", children: lane.label });
}
function chipClass(pressed) {
  return [
    "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
    pressed ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:bg-muted"
  ].join(" ");
}
function Filters({
  calendars,
  statuses,
  active,
  onToggleCalendar,
  onToggleStatus
}) {
  const m = useBeamCalendarMessages();
  return /* @__PURE__ */ jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-3", role: "group", "aria-label": m.t("splicewire-beam-calendar::messages.chrome_calendar_filters"), children: [
    calendars.length > 1 ? /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", "aria-label": m.t("splicewire-beam-calendar::messages.chrome_calendars"), children: calendars.map((calendar) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: chipClass(active.calendars.size === 0 || active.calendars.has(calendar.id)),
        "aria-pressed": active.calendars.size === 0 || active.calendars.has(calendar.id),
        onClick: () => onToggleCalendar(calendar.id),
        children: calendar.label
      },
      calendar.id
    )) }) : null,
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", "aria-label": m.t("splicewire-beam-calendar::messages.chrome_status"), children: statuses.map((status) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: chipClass(active.statuses.size === 0 || active.statuses.has(status)),
        "aria-pressed": active.statuses.size === 0 || active.statuses.has(status),
        onClick: () => onToggleStatus(status),
        children: statusLabel(status, m)
      },
      status
    )) })
  ] });
}

// src/CompositionCalendar.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var STATUSES = ["approved", "generated", "needs_review", "stale", "upcoming"];
function toggle(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}
function CompositionCalendar({
  mount,
  compositionId,
  transport,
  lanes,
  calendars: calendarsProp,
  renderEditPanel,
  notify,
  onError,
  subscribe,
  defaultDate,
  height
}) {
  if (mount === "single" && !compositionId) {
    throw new Error("CompositionCalendar single mount requires a `compositionId`.");
  }
  const isAggregate = mount === "aggregate";
  const client = useMemo(
    () => isAggregate ? createAggregateClient(transport) : createSingleClient(transport, compositionId),
    [isAggregate, transport, compositionId]
  );
  const calendarsQuery = useQuery({
    queryKey: ["beam-calendar", "calendars"],
    queryFn: () => transport.listCalendars(),
    enabled: isAggregate && !calendarsProp,
    retry: false
  });
  const [facets, setFacets] = useState({ statuses: /* @__PURE__ */ new Set(), calendars: /* @__PURE__ */ new Set() });
  const onToggleStatus = useCallback((s) => setFacets((f) => ({ ...f, statuses: toggle(f.statuses, s) })), []);
  const onToggleCalendar = useCallback((c) => setFacets((f) => ({ ...f, calendars: toggle(f.calendars, c) })), []);
  const filterEvent = useMemo(() => {
    if (!isAggregate || facets.statuses.size === 0 && facets.calendars.size === 0) return void 0;
    return (event) => {
      const meta = readMeta(event);
      const okStatus = facets.statuses.size === 0 || facets.statuses.has(meta.status);
      const okCalendar = facets.calendars.size === 0 || facets.calendars.has(event.sourceId);
      return okStatus && okCalendar;
    };
  }, [isAggregate, facets]);
  const multiLane = (lanes?.length ?? 0) > 1;
  const services = useMemo(() => {
    const calendars = (calendarsProp ?? calendarsQuery.data ?? []).map((c) => ({ id: c.id, label: c.title ?? c.id }));
    return {
      client,
      notify,
      onError,
      subscribe,
      // Host-filled slot (its Sheet + CellFormPanel); the satellite only declares the contract.
      renderEditPanel,
      // Satellite-authored vocab chrome.
      renderEventBadge: (event) => /* @__PURE__ */ jsx2(EventBadge, { event }),
      renderLaneHeader: multiLane ? (lane) => /* @__PURE__ */ jsx2(LaneHeader, { lane }) : void 0,
      renderFilters: isAggregate ? () => /* @__PURE__ */ jsx2(
        Filters,
        {
          calendars,
          statuses: STATUSES,
          active: facets,
          onToggleCalendar,
          onToggleStatus
        }
      ) : void 0
    };
  }, [client, notify, onError, subscribe, renderEditPanel, multiLane, isAggregate, calendarsProp, calendarsQuery.data, facets, onToggleCalendar, onToggleStatus]);
  return /* @__PURE__ */ jsx2(BigCalendarProvider, { services, children: /* @__PURE__ */ jsx2(BigCalendarSurface, { lanes, defaultDate, height, filterEvent }) });
}

// src/CalendarCellForm.tsx
import { Button, SimpleSelect, Textarea } from "@schemastud/ui";
import { CalendarClock, Loader2, Repeat as Repeat2, Sparkles } from "lucide-react";
import { useMemo as useMemo2, useState as useState2 } from "react";

// src/cell-provider.tsx
import { createContext, useContext } from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var CellFormContext = createContext(null);
function CalendarCellFormProvider({
  services,
  children
}) {
  return /* @__PURE__ */ jsx3(CellFormContext.Provider, { value: services, children });
}
function useCellFormServices() {
  const services = useContext(CellFormContext);
  if (!services) {
    throw new Error("CalendarCellForm must be rendered inside <CalendarCellFormProvider services={\u2026}>.");
  }
  return services;
}
function useCellNotify() {
  const { notify } = useCellFormServices();
  return notify ?? (() => {
  });
}

// src/cell-hooks.ts
import { useMutation, useQuery as useQuery2, useQueryClient } from "@tanstack/react-query";
function useCompositionCells(compositionId) {
  const { client } = useCellFormServices();
  return useQuery2({
    queryKey: ["compositions", "cells", compositionId],
    enabled: Boolean(compositionId),
    queryFn: () => client.listCells(compositionId)
  });
}
function useCompositionProfiles() {
  const { client } = useCellFormServices();
  return useQuery2({
    queryKey: ["composition-profiles"],
    staleTime: 5 * 6e4,
    queryFn: () => client.listProfiles()
  });
}
function useSaveCell(compositionId) {
  const { client } = useCellFormServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => client.saveCell(compositionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compositions", "cells", compositionId] });
    }
  });
}

// src/message-descriptor.ts
var notice = (key, parameters) => ({ key, parameters });
var say = (m, value) => typeof value === "string" ? value : m.t(value.key, value.parameters);

// src/CalendarCellForm.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var kindSuffix = (id) => String(id ?? "").split(/[/.]/).pop() ?? "";
var FREQ_OPTIONS = [
  { value: "DAILY", labelKey: "splicewire-beam-calendar::messages.form_freq_daily" },
  { value: "WEEKLY", labelKey: "splicewire-beam-calendar::messages.form_freq_weekly" },
  { value: "MONTHLY", labelKey: "splicewire-beam-calendar::messages.form_freq_monthly" },
  { value: "YEARLY", labelKey: "splicewire-beam-calendar::messages.form_freq_yearly" }
];
var FREQ_UNIT = {
  DAILY: "splicewire-beam-calendar::messages.form_unit_days",
  WEEKLY: "splicewire-beam-calendar::messages.form_unit_weeks",
  MONTHLY: "splicewire-beam-calendar::messages.form_unit_months",
  YEARLY: "splicewire-beam-calendar::messages.form_unit_years"
};
function Field({ label, required, hint, error, children }) {
  return /* @__PURE__ */ jsxs2("div", { className: "grid gap-1.5", children: [
    /* @__PURE__ */ jsxs2("span", { className: "font-mono text-[11px] font-medium tracking-wide text-[var(--beam-ink-55)]", children: [
      label,
      required ? /* @__PURE__ */ jsx4("span", { className: "text-[var(--beam-warn-deep)]", children: " *" }) : null
    ] }),
    children,
    error ? /* @__PURE__ */ jsx4("span", { role: "alert", className: "text-xs text-[var(--beam-warn-deep)]", children: error }) : hint ? /* @__PURE__ */ jsx4("span", { className: "text-xs text-[var(--beam-ink-45)]", children: hint }) : null
  ] });
}
function Section({ icon, title, children }) {
  return /* @__PURE__ */ jsxs2("div", { className: "grid gap-3 rounded-lg border border-[var(--beam-ink-10)] bg-background p-4", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-[0.12em] text-[var(--beam-ink-45)] uppercase", children: [
      icon,
      title
    ] }),
    children
  ] });
}
function Segmented({ value, onChange, options }) {
  return /* @__PURE__ */ jsx4("div", { className: "inline-flex overflow-hidden rounded-md border border-[var(--beam-ink-15)] text-xs", children: options.map((o) => /* @__PURE__ */ jsxs2(
    "button",
    {
      type: "button",
      onClick: () => onChange(o.value),
      "aria-pressed": value === o.value,
      className: `flex items-center gap-1.5 px-3 py-1.5 transition-colors ${value === o.value ? "bg-foreground text-background" : "bg-background text-[var(--beam-ink-60)] hover:bg-[var(--beam-ink-05)]"}`,
      children: [
        o.icon,
        o.label
      ]
    },
    o.value
  )) });
}
var dateInputClass = "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function ContentSlot(props) {
  const { render, ...pickerProps } = props;
  const m = useBeamCalendarMessages();
  if (render) return /* @__PURE__ */ jsx4(Fragment, { children: render(pickerProps) });
  return /* @__PURE__ */ jsx4("div", { className: "rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground", children: m.t("splicewire-beam-calendar::messages.form_no_content_picker", { prop: "renderContentPicker" }) });
}
function CalendarCellForm({
  compositionId,
  initialCell,
  initialDate,
  onSaved
}) {
  const { renderContentPicker, onError } = useCellFormServices();
  const notify = useCellNotify();
  const m = useBeamCalendarMessages();
  const saveCell = useSaveCell(compositionId);
  const isEdit = Boolean(initialCell?.id);
  const slots = initialCell?.slots ?? {};
  const initialKind = kindSuffix(slots.kind) === "series" ? "series" : "release";
  const isoDate = (d) => d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "";
  const cells = useCompositionCells(compositionId);
  const channels = useMemo2(() => {
    const set = /* @__PURE__ */ new Set(["default"]);
    for (const cell of cells.data ?? []) {
      const ch = cell.slots?.channel;
      if (typeof ch === "string" && ch) set.add(ch);
    }
    return [...set];
  }, [cells.data]);
  const showChannel = channels.length > 1;
  const profiles = useCompositionProfiles();
  const calendarKinds = profiles.data?.find((p) => p.name === "calendar")?.cellKinds ?? [];
  const kindId = (suffix) => calendarKinds.find((k) => kindSuffix(k.kind) === suffix)?.kind ?? suffix;
  const [kind, setKind] = useState2(initialKind);
  const [channel, setChannel] = useState2(slots.channel ?? "default");
  const [date, setDate] = useState2(slots.anchor ?? isoDate(initialDate));
  const [contentId, setContentId] = useState2(slots.composition_id ?? "");
  const [contentTitle, setContentTitle] = useState2("");
  const rule = slots.rule ?? {};
  const spawn = slots.spawn ?? {};
  const [freq, setFreq] = useState2(rule.freq ?? "WEEKLY");
  const [interval, setInterval] = useState2(rule.interval ?? 1);
  const [endMode, setEndMode] = useState2(rule.count ? "count" : rule.until ? "until" : "never");
  const [count, setCount] = useState2(rule.count ?? 10);
  const [until, setUntil] = useState2(rule.until ?? "");
  const [spawnMode, setSpawnMode] = useState2(spawn.mode ?? "generate");
  const [instructions, setInstructions] = useState2(spawn.instructions ?? "");
  const [refId, setRefId] = useState2(spawn.composition_id ?? "");
  const [refTitle, setRefTitle] = useState2("");
  const [errors, setErrors] = useState2({});
  const [formError, setFormError] = useState2(null);
  const saving = saveCell.isPending;
  const fieldError = (field) => errors[field] ? say(m, errors[field]) : void 0;
  function validate() {
    const e = {};
    if (!date) e.date = notice("splicewire-beam-calendar::messages.form_error_date");
    if (kind === "release" && !contentId) e.content = notice("splicewire-beam-calendar::messages.form_error_content");
    if (kind === "series") {
      if (endMode === "until" && !until) e.until = notice("splicewire-beam-calendar::messages.form_error_until");
      if (spawnMode === "reference" && !refId) e.produces = notice("splicewire-beam-calendar::messages.form_error_produces");
    }
    return e;
  }
  function buildSlots() {
    if (kind === "release") {
      return { ...slots, kind: kindId("composition-ref"), composition_id: contentId, channel, anchor: date };
    }
    const ruleOut = { freq };
    if (interval > 1) ruleOut.interval = interval;
    if (endMode === "count") ruleOut.count = count;
    if (endMode === "until") ruleOut.until = until;
    const spawnOut = spawnMode === "generate" ? { mode: "generate", ...instructions.trim() ? { instructions: instructions.trim() } : {} } : { mode: "reference", composition_id: refId };
    return { ...slots, kind: kindId("series"), channel, anchor: date, rule: ruleOut, spawn: spawnOut };
  }
  async function submit() {
    setFormError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await saveCell.mutateAsync({
        cellId: isEdit ? initialCell.id : void 0,
        ...isEdit ? {} : { lane: channel },
        slots: buildSlots()
      });
      notify({
        kind: "success",
        text: m.t(
          isEdit ? "splicewire-beam-calendar::messages.form_saved" : kind === "series" ? "splicewire-beam-calendar::messages.form_series_scheduled" : "splicewire-beam-calendar::messages.form_release_scheduled"
        )
      });
      onSaved();
    } catch (err) {
      const clientErr = err;
      const fieldErrors = clientErr?.fieldErrors;
      if (fieldErrors && Object.keys(fieldErrors).length) {
        const mapped = {};
        for (const [key, msgs] of Object.entries(fieldErrors)) mapped[key.replace(/^slots\./, "")] = msgs[0];
        setErrors(mapped);
      } else {
        setFormError(
          clientErr?.message ?? (err instanceof Error ? err.message : notice("splicewire-beam-calendar::messages.form_save_failed"))
        );
      }
      onError?.(err);
    }
  }
  return /* @__PURE__ */ jsxs2("div", { className: "space-y-4", children: [
    formError ? /* @__PURE__ */ jsx4(
      "div",
      {
        role: "alert",
        className: "rounded-md border border-[var(--beam-danger)] bg-[var(--beam-danger-tint)] px-3 py-2 text-sm text-[var(--beam-danger)]",
        children: say(m, formError)
      }
    ) : null,
    !isEdit ? /* @__PURE__ */ jsx4(
      Segmented,
      {
        value: kind,
        onChange: setKind,
        options: [
          { value: "release", label: m.t("splicewire-beam-calendar::messages.form_kind_one_off"), icon: /* @__PURE__ */ jsx4(CalendarClock, { className: "size-3.5" }) },
          { value: "series", label: m.t("splicewire-beam-calendar::messages.form_kind_recurring"), icon: /* @__PURE__ */ jsx4(Repeat2, { className: "size-3.5" }) }
        ]
      }
    ) : /* @__PURE__ */ jsxs2("div", { className: "inline-flex items-center gap-1.5 rounded-full border border-[var(--beam-ink-15)] px-2.5 py-0.5 font-mono text-[10.5px] text-[var(--beam-ink-55)] uppercase", children: [
      kind === "series" ? /* @__PURE__ */ jsx4(Repeat2, { className: "size-3" }) : /* @__PURE__ */ jsx4(CalendarClock, { className: "size-3" }),
      m.t(kind === "series" ? "splicewire-beam-calendar::messages.form_badge_series" : "splicewire-beam-calendar::messages.form_badge_release")
    ] }),
    kind === "release" ? /* @__PURE__ */ jsxs2("div", { className: "grid gap-4", children: [
      /* @__PURE__ */ jsx4(
        Field,
        {
          label: m.t("splicewire-beam-calendar::messages.form_content"),
          required: true,
          hint: m.t("splicewire-beam-calendar::messages.form_content_hint_release"),
          error: fieldError("content"),
          children: /* @__PURE__ */ jsx4(
            ContentSlot,
            {
              render: renderContentPicker,
              value: contentId,
              label: contentTitle,
              excludeId: compositionId,
              onSelect: (o) => {
                setContentId(o.id);
                setContentTitle(o.title);
              }
            }
          )
        }
      ),
      showChannel ? /* @__PURE__ */ jsx4(Field, { label: m.t("splicewire-beam-calendar::messages.form_channel"), hint: m.t("splicewire-beam-calendar::messages.form_channel_hint"), children: /* @__PURE__ */ jsx4(
        SimpleSelect,
        {
          value: channel,
          onValueChange: setChannel,
          options: channels.map((c) => ({ value: c, label: c }))
        }
      ) }) : null,
      /* @__PURE__ */ jsx4(Field, { label: m.t("splicewire-beam-calendar::messages.form_date"), required: true, error: fieldError("date"), children: /* @__PURE__ */ jsx4("input", { type: "date", className: dateInputClass, value: date, onChange: (e) => setDate(e.target.value) }) })
    ] }) : /* @__PURE__ */ jsxs2("div", { className: "grid gap-4", children: [
      /* @__PURE__ */ jsxs2("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsx4(Field, { label: m.t("splicewire-beam-calendar::messages.form_starts_on"), required: true, error: fieldError("date"), children: /* @__PURE__ */ jsx4("input", { type: "date", className: dateInputClass, value: date, onChange: (e) => setDate(e.target.value) }) }),
        showChannel ? /* @__PURE__ */ jsx4(Field, { label: m.t("splicewire-beam-calendar::messages.form_channel"), children: /* @__PURE__ */ jsx4(SimpleSelect, { value: channel, onValueChange: setChannel, options: channels.map((c) => ({ value: c, label: c })) }) }) : null
      ] }),
      /* @__PURE__ */ jsxs2(Section, { icon: /* @__PURE__ */ jsx4(Repeat2, { className: "size-3" }), title: m.t("splicewire-beam-calendar::messages.form_repeats"), children: [
        /* @__PURE__ */ jsxs2("div", { className: "flex flex-wrap items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx4("span", { className: "text-[var(--beam-ink-55)]", children: m.t("splicewire-beam-calendar::messages.form_every") }),
          /* @__PURE__ */ jsx4(
            "input",
            {
              type: "number",
              min: 1,
              value: interval,
              onChange: (e) => setInterval(Math.max(1, Number(e.target.value) || 1)),
              className: `${dateInputClass} w-16`,
              "aria-label": m.t("splicewire-beam-calendar::messages.form_interval")
            }
          ),
          /* @__PURE__ */ jsx4("div", { className: "min-w-[120px]", children: /* @__PURE__ */ jsx4(
            SimpleSelect,
            {
              value: freq,
              onValueChange: (v) => setFreq(v),
              options: FREQ_OPTIONS.map((o) => ({ value: o.value, label: m.t(o.labelKey) }))
            }
          ) }),
          /* @__PURE__ */ jsxs2("span", { className: "text-[var(--beam-ink-45)]", children: [
            "(",
            Object.hasOwn(FREQ_UNIT, freq) ? m.t(FREQ_UNIT[freq]) : null,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxs2("div", { className: "grid gap-2", children: [
          /* @__PURE__ */ jsx4("span", { className: "font-mono text-[11px] text-[var(--beam-ink-55)]", children: m.t("splicewire-beam-calendar::messages.form_ends") }),
          /* @__PURE__ */ jsx4(
            Segmented,
            {
              value: endMode,
              onChange: setEndMode,
              options: [
                { value: "never", label: m.t("splicewire-beam-calendar::messages.form_ends_never") },
                { value: "count", label: m.t("splicewire-beam-calendar::messages.form_ends_after") },
                { value: "until", label: m.t("splicewire-beam-calendar::messages.form_ends_on_date") }
              ]
            }
          ),
          endMode === "count" ? /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx4("span", { className: "text-[var(--beam-ink-55)]", children: m.t("splicewire-beam-calendar::messages.form_after") }),
            /* @__PURE__ */ jsx4(
              "input",
              {
                type: "number",
                min: 1,
                value: count,
                onChange: (e) => setCount(Math.max(1, Number(e.target.value) || 1)),
                className: `${dateInputClass} w-20`,
                "aria-label": m.t("splicewire-beam-calendar::messages.form_occurrence_count")
              }
            ),
            /* @__PURE__ */ jsx4("span", { className: "text-[var(--beam-ink-45)]", children: m.t("splicewire-beam-calendar::messages.form_occurrences") })
          ] }) : null,
          endMode === "until" ? /* @__PURE__ */ jsxs2("div", { className: "grid gap-1", children: [
            /* @__PURE__ */ jsx4(
              "input",
              {
                type: "date",
                className: dateInputClass,
                value: until,
                onChange: (e) => setUntil(e.target.value),
                "aria-label": m.t("splicewire-beam-calendar::messages.form_end_date")
              }
            ),
            errors.until ? /* @__PURE__ */ jsx4("span", { role: "alert", className: "text-xs text-[var(--beam-warn-deep)]", children: fieldError("until") }) : null
          ] }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxs2(Section, { icon: /* @__PURE__ */ jsx4(Sparkles, { className: "size-3" }), title: m.t("splicewire-beam-calendar::messages.form_each_occurrence"), children: [
        /* @__PURE__ */ jsx4(
          Segmented,
          {
            value: spawnMode,
            onChange: setSpawnMode,
            options: [
              { value: "generate", label: m.t("splicewire-beam-calendar::messages.form_spawn_generate") },
              { value: "reference", label: m.t("splicewire-beam-calendar::messages.form_spawn_reference") }
            ]
          }
        ),
        spawnMode === "generate" ? /* @__PURE__ */ jsx4(
          Field,
          {
            label: m.t("splicewire-beam-calendar::messages.form_instructions"),
            hint: m.t("splicewire-beam-calendar::messages.form_instructions_hint"),
            children: /* @__PURE__ */ jsx4(
              Textarea,
              {
                rows: 3,
                value: instructions,
                onChange: (e) => setInstructions(e.target.value),
                placeholder: m.t("splicewire-beam-calendar::messages.form_instructions_placeholder")
              }
            )
          }
        ) : /* @__PURE__ */ jsx4(
          Field,
          {
            label: m.t("splicewire-beam-calendar::messages.form_content"),
            required: true,
            hint: m.t("splicewire-beam-calendar::messages.form_content_hint_series"),
            error: fieldError("produces"),
            children: /* @__PURE__ */ jsx4(
              ContentSlot,
              {
                render: renderContentPicker,
                value: refId,
                label: refTitle,
                excludeId: compositionId,
                onSelect: (o) => {
                  setRefId(o.id);
                  setRefTitle(o.title);
                }
              }
            )
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx4("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs2(Button, { onClick: submit, disabled: saving, children: [
      saving ? /* @__PURE__ */ jsx4(Loader2, { className: "animate-spin" }) : null,
      m.t(
        isEdit ? "splicewire-beam-calendar::messages.form_save" : kind === "series" ? "splicewire-beam-calendar::messages.form_schedule_series" : "splicewire-beam-calendar::messages.form_schedule_release"
      )
    ] }) })
  ] });
}
export {
  CalendarCellForm,
  CalendarCellFormProvider,
  CompositionCalendar,
  EventBadge,
  Filters,
  LaneHeader,
  createAggregateClient,
  createSingleClient,
  decodeRef,
  encodeRef,
  isResidentRef,
  kindHue,
  provenanceHue,
  readMeta,
  toFoundationEvent,
  useCellFormServices,
  useCellNotify,
  useCompositionCells,
  useCompositionProfiles,
  useSaveCell
};
//# sourceMappingURL=index.js.map